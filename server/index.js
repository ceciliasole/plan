import express from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { db, isPaid, orgIdFor } from './db.js';
import { CLIENT_ID, ADMINS, requireUser, requireAdmin, setSession, clearSession, verifyGoogle } from './auth.js';
import { detectOrg, LOGO_RE } from './org.js';

const META = JSON.parse(readFileSync('fuente/meta.json', 'utf8'));
const TOOLS = Object.keys(META); // el orden del JSON es el orden del programa
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin'); next(); });

const HEX = /^#[0-9a-fA-F]{6}$/;
const getOrg = id => db.prepare('SELECT * FROM orgs WHERE id=?').get(id) || { id, name: '', website: '', description: '', logo: '', color1: '', color2: '', confirmed: 0 };
const mapMail = e => (typeof e === 'string' ? e.trim().toLowerCase() : '');

// ---------- Login ----------
app.get('/api/config', (_q, res) => res.json({ googleClientId: CLIENT_ID, devLogin: process.env.DEV_LOGIN === '1' }));

async function finishLogin(res, email) {
  if (!isPaid(email) && !ADMINS.includes(email)) return res.status(403).json({ error: 'not_paid', email });
  setSession(res, email);
  res.json({ ok: true });
}
app.post('/api/login', async (req, res) => {
  try { await finishLogin(res, await verifyGoogle(String(req.body.credential || ''))); }
  catch { res.status(401).json({ error: 'google_invalid' }); }
});
// Solo para probar en local (DEV_LOGIN=1). Sigue exigiendo que el mail esté en la lista de pagos.
app.post('/api/dev-login', (req, res) => {
  if (process.env.DEV_LOGIN !== '1') return res.status(404).end();
  const email = mapMail(req.body.email);
  if (!email.includes('@')) return res.status(400).json({ error: 'mail' });
  finishLogin(res, email);
});
app.post('/api/logout', (_q, res) => { clearSession(res); res.json({ ok: true }); });

// ---------- Sesión, organización ----------
app.get('/api/me', requireUser, (req, res) => {
  const orgId = orgIdFor(req.user.email);
  res.json({ email: req.user.email, admin: req.user.admin, org: getOrg(orgId), domain: req.user.email.split('@')[1], publicMail: orgId === req.user.email });
});

app.post('/api/org/detect', requireUser, async (req, res) => {
  const orgId = orgIdFor(req.user.email);
  if (orgId === req.user.email) return res.json({ found: false, publicMail: true, logos: [] });
  res.json(await detectOrg(orgId));
});

app.put('/api/org', requireUser, (req, res) => {
  const b = req.body || {}, orgId = orgIdFor(req.user.email);
  const name = String(b.name || '').trim().slice(0, 120);
  if (!name) return res.status(400).json({ error: 'Falta el nombre de la organización.' });
  const logo = String(b.logo || '');
  if (logo && (!LOGO_RE.test(logo) || logo.length > 950_000)) return res.status(400).json({ error: 'Logo inválido (PNG, JPG, SVG o WebP, hasta ~700 KB).' });
  const c = k => (HEX.test(b[k] || '') ? b[k] : '');
  const web = String(b.website || '').trim().slice(0, 200);
  if (web && !/^https?:\/\//i.test(web)) return res.status(400).json({ error: 'El sitio web debe empezar con http:// o https://' });
  db.prepare(`INSERT INTO orgs(id,name,website,description,logo,color1,color2,confirmed,updated_at) VALUES(?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,website=excluded.website,description=excluded.description,logo=excluded.logo,color1=excluded.color1,color2=excluded.color2,confirmed=1,updated_at=CURRENT_TIMESTAMP`)
    .run(orgId, name, web, String(b.description || '').trim().slice(0, 600), logo, c('color1'), c('color2'));
  res.json(getOrg(orgId));
});

// ---------- Herramientas ----------
app.get('/api/progress', requireUser, (req, res) => {
  const rows = db.prepare('SELECT tool_id,done,updated_at FROM tool_state WHERE org_id=?').all(orgIdFor(req.user.email));
  const by = Object.fromEntries(rows.map(r => [r.tool_id, r]));
  res.json(TOOLS.map((id, i) => ({ id, mes: i + 1, name: META[id].name, status: by[id]?.done ? 'done' : by[id] ? 'started' : 'todo', updated_at: by[id]?.updated_at || null })));
});

app.put('/api/tools/:id', requireUser, (req, res) => {
  if (!TOOLS.includes(req.params.id)) return res.status(404).end();
  const json = JSON.stringify(req.body?.state ?? null);
  if (json.length > 900_000) return res.status(413).json({ error: 'Demasiado grande' });
  db.prepare(`INSERT INTO tool_state(org_id,tool_id,json) VALUES(?,?,?) ON CONFLICT(org_id,tool_id) DO UPDATE SET json=excluded.json,updated_at=CURRENT_TIMESTAMP`)
    .run(orgIdFor(req.user.email), req.params.id, json);
  res.json({ ok: true, at: new Date().toISOString() });
});
app.put('/api/tools/:id/done', requireUser, (req, res) => {
  if (!TOOLS.includes(req.params.id)) return res.status(404).end();
  db.prepare(`INSERT INTO tool_state(org_id,tool_id,json,done) VALUES(?,?,NULL,?) ON CONFLICT(org_id,tool_id) DO UPDATE SET done=excluded.done`)
    .run(orgIdFor(req.user.email), req.params.id, req.body?.done ? 1 : 0);
  res.json({ ok: true });
});

const brandCss = o => {
  const v = [];
  if (o.color1) v.push(`--blue:${o.color1};--blue-soft:color-mix(in srgb,${o.color1} 16%,#fff)`);
  if (o.color2) v.push(`--red:${o.color2};--red-soft:color-mix(in srgb,${o.color2} 14%,#fff)`);
  // Solo en modo claro: el modo oscuro conserva sus tokens para no romper contraste.
  return v.length ? `<style>@media (prefers-color-scheme:light){:root{${v.join(';')}}}:root[data-theme=light]{${v.join(';')}}</style>` : '';
};

app.get('/tools/:id', requireUser, (req, res) => {
  const { id } = req.params, file = `toolkit/impactese-${id}.html`;
  if (!TOOLS.includes(id) || !existsSync(file)) return res.status(404).send('No existe');
  const orgId = orgIdFor(req.user.email), org = getOrg(orgId);
  if (!org.confirmed) return res.redirect('/onboarding');
  const row = db.prepare('SELECT json,done FROM tool_state WHERE org_id=? AND tool_id=?').get(orgId, id);
  const imp = { id, state: row?.json ? JSON.parse(row.json) : null, done: !!row?.done, org: { name: org.name, logo: org.logo } };
  // </ evitado para que el JSON no pueda cerrar el <script>
  const boot = `<script>window.IMP=${JSON.stringify(imp).replace(/</g, '\\u003c')};window.INDEX_URL='/app';</script>`;
  let html = readFileSync(file, 'utf8').replace('<script>window.INDEX_URL=""', () => '<script>window.__x=""');
  html = html.replace('<div id="root">', () => brandCss(org) + boot + '<div id="root">');
  res.type('html').send(html);
});

// ---------- Admin: lista de clientes que pagaron ----------
app.get('/api/admin/customers', requireUser, requireAdmin, (_q, res) => res.json(db.prepare('SELECT pattern,note,created_at FROM customers ORDER BY created_at DESC').all()));
app.post('/api/admin/customers', requireUser, requireAdmin, (req, res) => {
  const p = mapMail(req.body.pattern);
  if (!/^(@[^@\s]+\.[^@\s]+|[^@\s]+@[^@\s]+\.[^@\s]+)$/.test(p)) return res.status(400).json({ error: 'Usá un mail (ana@fundacion.org) o un dominio (@fundacion.org).' });
  db.prepare('INSERT OR REPLACE INTO customers(pattern,note) VALUES(?,?)').run(p, String(req.body.note || '').slice(0, 200));
  res.json({ ok: true });
});
app.delete('/api/admin/customers', requireUser, requireAdmin, (req, res) => { db.prepare('DELETE FROM customers WHERE pattern=?').run(mapMail(req.body.pattern)); res.json({ ok: true }); });

// ---------- Páginas ----------
const page = f => (_q, res) => res.sendFile(f, { root: 'public' });
app.get('/', page('login.html'));
app.get('/onboarding', requireUser, page('onboarding.html'));
app.get('/app', requireUser, (req, res, next) => (getOrg(orgIdFor(req.user.email)).confirmed ? page('app.html')(req, res) : res.redirect('/onboarding')));
app.get('/admin', requireUser, requireAdmin, page('admin.html'));
app.get('/static/core.css', (_q, res) => res.sendFile('fuente/core.css', { root: process.cwd() }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`impactese en http://localhost:${port}`));
