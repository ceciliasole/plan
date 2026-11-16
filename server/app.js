import 'express-async-errors';
import express from 'express';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { q, one, orgIdFor, orgsFor, PUBLIC_DOMAINS } from './db.js';
import { CLIENT_ID, requireUser, requirePaid, requireAdmin, setSession, clearSession, setActiveOrg, verifyGoogle } from './auth.js';
import { detectOrg, LOGO_RE } from './org.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const META = JSON.parse(readFileSync(join(ROOT, 'fuente/meta.json'), 'utf8'));
const TOOLS = Object.keys(META); // el orden del JSON es el orden del programa
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin'); next(); });

const HEX = /^#[0-9a-fA-F]{6}$/;
const getOrg = async id => (await one('SELECT * FROM impactese_orgs WHERE id=$1', [id])) || { id, name: '', website: '', description: '', logo: '', color1: '', color2: '', confirmed: 0 };
const mapMail = e => (typeof e === 'string' ? e.trim().toLowerCase() : '');

// ---------- Login ----------
app.get('/api/config', (_q, res) => res.json({ googleClientId: CLIENT_ID, devLogin: process.env.DEV_LOGIN === '1', payUrl: process.env.PAY_URL || '', contact: process.env.CONTACT_EMAIL || 'hola@guaraniagency.com' }));

async function finishLogin(res, email) {
  setSession(res, email);
  res.json({ ok: true });
}
app.post('/api/login', async (req, res) => {
  try { await finishLogin(res, await verifyGoogle(String(req.body.credential || ''))); }
  catch { res.status(401).json({ error: 'google_invalid' }); }
});
// Solo para probar en local (DEV_LOGIN=1). Sigue exigiendo que el mail esté en la lista de pagos.
app.post('/api/dev-login', async (req, res) => {
  if (process.env.DEV_LOGIN !== '1') return res.status(404).end();
  const email = mapMail(req.body.email);
  if (!email.includes('@')) return res.status(400).json({ error: 'mail' });
  finishLogin(res, email);
});
app.post('/api/logout', (_q, res) => { clearSession(res); res.json({ ok: true }); });

// ---------- Sesión, organización ----------
app.get('/api/me', requireUser, async (req, res) => {
  const orgId = req.user.orgId;
  res.json({ email: req.user.email, admin: req.user.admin, paid: req.user.paid, org: await getOrg(orgId), orgId, domain: req.user.email.split('@')[1], publicMail: orgId === req.user.email });
});

// ---------- Varias organizaciones ----------
const DOMAIN = /^(?=.{3,253}$)[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const orgList = async email => Promise.all((await orgsFor(email)).map(async id => { const o = await getOrg(id); return { id, name: o.name || (id.includes('@') ? 'Mi espacio personal' : id), logo: o.logo, confirmed: !!o.confirmed }; }));

app.get('/api/orgs', requireUser, async (req, res) => res.json({ active: req.user.orgId, own: req.user.ownOrg, orgs: await orgList(req.user.email) }));

app.post('/api/orgs/active', requireUser, async (req, res) => {
  const id = String(req.body?.id || '');
  if (!(await orgsFor(req.user.email)).includes(id)) return res.status(403).json({ error: 'No tenés acceso a esa organización.' });
  setActiveOrg(res, id);
  res.json({ ok: true, active: id });
});

// Sumar una organización donde trabajás (por ejemplo, la de un cliente). Si ya existe y tiene datos, hay que pedir que te inviten.
app.post('/api/orgs', requireUser, requirePaid, async (req, res) => {
  const domain = mapMail(req.body?.domain).replace(/^@/, '');
  if (!DOMAIN.test(domain) || PUBLIC_DOMAINS.has(domain)) return res.status(400).json({ error: 'Usá el dominio de la organización, por ejemplo fundacion.org.' });
  const mine = await orgsFor(req.user.email);
  if (!mine.includes(domain)) {
    const used = await one('SELECT 1 AS x FROM impactese_orgs WHERE id=$1 AND confirmed=1 UNION SELECT 1 FROM impactese_tool_state WHERE org_id=$1 UNION SELECT 1 FROM impactese_members WHERE org_id=$1', [domain]);
    if (used) return res.status(409).json({ error: 'Esa organización ya existe. Pedile a alguien de ahí que te invite desde su cuenta.' });
    await q('INSERT INTO impactese_orgs(id) VALUES($1) ON CONFLICT(id) DO NOTHING', [domain]);
    await q('INSERT INTO impactese_members(email,org_id,added_by) VALUES($1,$2,$1) ON CONFLICT DO NOTHING', [req.user.email, domain]);
  }
  setActiveOrg(res, domain);
  res.json({ ok: true, active: domain, orgs: await orgList(req.user.email) });
});

// Quién trabaja en la organización activa además del equipo del dominio. Cualquier miembro puede invitar o quitar.
app.get('/api/org/members', requireUser, requirePaid, async (req, res) =>
  res.json(await q('SELECT email,added_by,created_at FROM impactese_members WHERE org_id=$1 ORDER BY created_at', [req.user.orgId])));
app.post('/api/org/members', requireUser, requirePaid, async (req, res) => {
  const email = mapMail(req.body?.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Escribí un mail válido.' });
  if (orgIdFor(email) === req.user.orgId) return res.status(400).json({ error: 'Esa persona ya es parte del equipo de esta organización.' });
  await q('INSERT INTO impactese_members(email,org_id,added_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [email, req.user.orgId, req.user.email]);
  res.json({ ok: true });
});
app.delete('/api/org/members', requireUser, requirePaid, async (req, res) => {
  await q('DELETE FROM impactese_members WHERE email=$1 AND org_id=$2', [mapMail(req.body?.email), req.user.orgId]);
  res.json({ ok: true });
});

app.post('/api/org/detect', requireUser, requirePaid, async (req, res) => {
  const orgId = req.user.orgId;
  if (orgId.includes('@')) return res.json({ found: false, publicMail: true, logos: [] });
  res.json(await detectOrg(orgId));
});

app.put('/api/org', requireUser, requirePaid, async (req, res) => {
  const b = req.body || {}, orgId = req.user.orgId;
  const name = String(b.name || '').trim().slice(0, 120);
  if (!name) return res.status(400).json({ error: 'Falta el nombre de la organización.' });
  const logo = String(b.logo || '');
  if (logo && (!LOGO_RE.test(logo) || logo.length > 950_000)) return res.status(400).json({ error: 'Logo inválido (PNG, JPG, SVG o WebP, hasta ~700 KB).' });
  const c = k => (HEX.test(b[k] || '') ? b[k] : '');
  const web = String(b.website || '').trim().slice(0, 200);
  if (web && !/^https?:\/\//i.test(web)) return res.status(400).json({ error: 'El sitio web debe empezar con http:// o https://' });
  await q(`INSERT INTO impactese_orgs(id,name,website,description,logo,color1,color2,confirmed,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,1,now())
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,website=excluded.website,description=excluded.description,logo=excluded.logo,color1=excluded.color1,color2=excluded.color2,confirmed=1,updated_at=now()`,
    [orgId, name, web, String(b.description || '').trim().slice(0, 600), logo, c('color1'), c('color2')]);
  res.json(await getOrg(orgId));
});

// ---------- Herramientas ----------
app.get('/api/progress', requireUser, async (req, res) => {
  const rows = req.user.paid ? await q('SELECT tool_id,done,updated_at FROM impactese_tool_state WHERE org_id=$1', [req.user.orgId]) : [];
  const by = Object.fromEntries(rows.map(r => [r.tool_id, r]));
  res.json(TOOLS.map((id, i) => ({ id, mes: i + 1, name: META[id].name, status: by[id]?.done ? 'done' : by[id] ? 'started' : 'todo', updated_at: by[id]?.updated_at || null })));
});

app.put('/api/tools/:id', requireUser, requirePaid, async (req, res) => {
  if (!TOOLS.includes(req.params.id)) return res.status(404).end();
  const json = JSON.stringify(req.body?.state ?? null);
  if (json.length > 900_000) return res.status(413).json({ error: 'Demasiado grande' });
  await q(`INSERT INTO impactese_tool_state(org_id,tool_id,json) VALUES($1,$2,$3) ON CONFLICT(org_id,tool_id) DO UPDATE SET json=excluded.json,updated_at=now()`,
    [req.user.orgId, req.params.id, json]);
  res.json({ ok: true, at: new Date().toISOString() });
});
app.put('/api/tools/:id/done', requireUser, requirePaid, async (req, res) => {
  if (!TOOLS.includes(req.params.id)) return res.status(404).end();
  await q(`INSERT INTO impactese_tool_state(org_id,tool_id,json,done) VALUES($1,$2,NULL,$3) ON CONFLICT(org_id,tool_id) DO UPDATE SET done=excluded.done`,
    [req.user.orgId, req.params.id, req.body?.done ? 1 : 0]);
  res.json({ ok: true });
});

const brandCss = o => {
  const v = [];
  if (o.color1) v.push(`--blue:${o.color1};--blue-soft:color-mix(in srgb,${o.color1} 16%,#fff)`);
  if (o.color2) v.push(`--red:${o.color2};--red-soft:color-mix(in srgb,${o.color2} 14%,#fff)`);
  // Solo en modo claro: el modo oscuro conserva sus tokens para no romper contraste.
  return v.length ? `<style>@media (prefers-color-scheme:light){:root{${v.join(';')}}}:root[data-theme=light]{${v.join(';')}}</style>` : '';
};

app.get('/tools/:id', requireUser, async (req, res) => {
  const { id } = req.params, file = join(ROOT, `toolkit/impactese-${id}.html`);
  if (!TOOLS.includes(id) || !existsSync(file)) return res.status(404).send('No existe');
  const orgId = req.user.orgId, org = await getOrg(orgId);
  let imp, css = '';
  if (!req.user.paid) {
    // Vista previa: datos de ejemplo, sin tocar lo guardado, todo deshabilitado.
    imp = { id, state: null, done: false, org: null, readonly: true, pay: { url: process.env.PAY_URL || '', contact: process.env.CONTACT_EMAIL || 'hola@guaraniagency.com' } };
  } else {
    if (!org.confirmed) return res.redirect('/onboarding');
    const row = await one('SELECT json,done FROM impactese_tool_state WHERE org_id=$1 AND tool_id=$2', [orgId, id]);
    imp = { id, state: row?.json ? JSON.parse(row.json) : null, done: !!row?.done, org: { name: org.name, logo: org.logo } };
    css = brandCss(org);
    if (id === 'plan') {
      // El plan junta lo trabajado en los otros pasos: manda el código y el estado de cada uno que ya tenga datos.
      const rows = await q("SELECT tool_id,json FROM impactese_tool_state WHERE org_id=$1 AND json IS NOT NULL AND tool_id<>'plan'", [orgId]);
      const files = readdirSync(join(ROOT, 'fuente/tools'));
      imp.others = {};
      for (const r of rows) {
        const f = files.find(n => n.replace(/^\d+-/, '').replace(/\.js$/, '') === r.tool_id);
        if (f) imp.others[r.tool_id] = { src: readFileSync(join(ROOT, 'fuente/tools', f), 'utf8'), state: JSON.parse(r.json) };
      }
    }
  }
  // </ evitado para que el JSON no pueda cerrar el <script>
  const boot = `<script>window.IMP=${JSON.stringify(imp).replace(/</g, '\\u003c')};window.INDEX_URL='/app';</script>`;
  let html = readFileSync(file, 'utf8').replace('<script>window.INDEX_URL=""', () => '<script>window.__x=""');
  html = html.replace('<div id="root">', () => css + boot + '<div id="root">');
  res.type('html').send(html);
});

// ---------- Admin: lista de clientes que pagaron ----------
app.get('/api/admin/customers', requireUser, requireAdmin, async (_q, res) => res.json(await q('SELECT pattern,note,created_at FROM impactese_customers ORDER BY created_at DESC')));
app.post('/api/admin/customers', requireUser, requireAdmin, async (req, res) => {
  const p = mapMail(req.body.pattern);
  if (!/^(@[^@\s]+\.[^@\s]+|[^@\s]+@[^@\s]+\.[^@\s]+)$/.test(p)) return res.status(400).json({ error: 'Usá un mail (ana@fundacion.org) o un dominio (@fundacion.org).' });
  await q('INSERT INTO impactese_customers(pattern,note) VALUES($1,$2) ON CONFLICT(pattern) DO UPDATE SET note=excluded.note', [p, String(req.body.note || '').slice(0, 200)]);
  res.json({ ok: true });
});
app.delete('/api/admin/customers', requireUser, requireAdmin, async (req, res) => { await q('DELETE FROM impactese_customers WHERE pattern=$1', [mapMail(req.body.pattern)]); res.json({ ok: true }); });

// ---------- Páginas ----------
const page = f => (_q, res) => res.sendFile(f, { root: join(ROOT, 'public') });
// Páginas legales: públicas (Google las pide para publicar la app) y con el mail de contacto configurable.
const legal = f => (_q, res) => res.type('html').send(readFileSync(join(ROOT, 'public', f), 'utf8').replaceAll('{{CONTACT}}', process.env.CONTACT_EMAIL || 'hola@guaraniagency.com'));
app.get('/privacidad', legal('privacidad.html'));
app.get('/terminos', legal('terminos.html'));
app.get('/', page('login.html'));
app.get('/onboarding', requireUser, async (req, res, next) => (req.user.paid ? next() : res.redirect('/app')), page('onboarding.html'));
app.get('/app', requireUser, async (req, res, next) => (!req.user.paid || (await getOrg(req.user.orgId)).confirmed ? page('app.html')(req, res) : res.redirect('/onboarding')));
app.get('/admin', requireUser, requireAdmin, page('admin.html'));
app.use('/static/marca', express.static(join(ROOT, 'fuente', 'marca'), { maxAge: '1d' }));
// Diagnóstico de situación: abierto a cualquier persona con sesión (paga o no). Las respuestas no salen del navegador.
app.get('/diagnostico', requireUser, page('diagnostico.html'));
app.get('/static/core.css', (_q, res) => res.sendFile('fuente/core.css', { root: ROOT }));

app.use((err, _q, res, _n) => { console.error(err); res.status(500).json({ error: 'Error del servidor' }); });

export default app;
