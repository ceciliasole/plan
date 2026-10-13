import dns from 'node:dns/promises';
import net from 'node:net';

const MAX = 1_000_000;

function privateIp(ip) {
  if (net.isIPv6(ip)) return /^(::1|fc|fd|fe80|::ffff:(10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01]))\.)/i.test(ip) || ip === '::';
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
}

// Evita que el scraping apunte a la red interna (SSRF). Resuelve el host y rechaza IPs privadas.
async function safeFetch(url, { hops = 3, accept = '*/*' } = {}) {
  for (let i = 0; i <= hops; i++) {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) throw new Error('protocolo');
    const addrs = net.isIP(u.hostname) ? [{ address: u.hostname }] : await dns.lookup(u.hostname, { all: true });
    if (!addrs.length || addrs.some(a => privateIp(a.address))) throw new Error('host privado');
    const r = await fetch(u, { redirect: 'manual', signal: AbortSignal.timeout(6000), headers: { 'user-agent': 'impactese-bot/1.0', accept } });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { url = new URL(r.headers.get('location'), u).href; continue; }
    return { res: r, url: u.href };
  }
  throw new Error('demasiadas redirecciones');
}

async function readCapped(res) {
  const chunks = []; let n = 0;
  for await (const c of res.body) { n += c.length; if (n > MAX) break; chunks.push(c); }
  return Buffer.concat(chunks);
}

const attr = (tag, name) => new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag)?.slice(2, 4).find(Boolean);
const decode = s => (s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

function parseHead(html, base) {
  const metas = {};
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const k = (attr(m[0], 'property') || attr(m[0], 'name') || '').toLowerCase();
    const v = attr(m[0], 'content');
    if (k && v && !(k in metas)) metas[k] = decode(v);
  }
  const title = decode(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]).replace(/\s+/g, ' ');
  const icons = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = (attr(m[0], 'rel') || '').toLowerCase(), href = attr(m[0], 'href');
    if (!href || !/icon/.test(rel)) continue;
    try { icons.push({ url: new URL(decode(href), base).href, apple: rel.includes('apple'), svg: /\.svg|image\/svg/.test(href + (attr(m[0], 'type') || '')) }); } catch {}
  }
  const og = metas['og:image'] ? (() => { try { return new URL(metas['og:image'], base).href; } catch {} })() : null;
  const rank = i => (i.apple ? 0 : i.svg ? 1 : 2);
  const logos = [...icons.sort((a, b) => rank(a) - rank(b)).map(i => i.url)];
  logos.push(new URL('/favicon.ico', base).href);
  if (og) logos.push(og);
  const name = metas['og:site_name'] || metas['application-name'] || title.split(/\s[|\-–—·]\s/).sort((a, b) => a.length - b.length)[0] || '';
  return { name, description: metas['og:description'] || metas.description || '', logos: [...new Set(logos)] };
}

const MIME = /^image\/(png|jpeg|svg\+xml|webp|x-icon|vnd\.microsoft\.icon|gif)/;
async function fetchLogo(url) {
  try {
    const { res } = await safeFetch(url, { accept: 'image/*' });
    const mime = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!res.ok || !MIME.test(mime)) return null;
    const buf = await readCapped(res);
    if (buf.length < 100 || buf.length > 700_000) return null;
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

// A partir del dominio: nombre, descripción, sitio y hasta 3 logos candidatos (como data URL: el navegador no los pide al sitio ajeno).
export async function detectOrg(domain) {
  const out = { website: '', name: '', description: '', logos: [], found: false };
  for (const host of [domain, 'www.' + domain]) {
    try {
      const { res, url } = await safeFetch('https://' + host, { accept: 'text/html' });
      if (!res.ok) continue;
      const html = (await readCapped(res)).toString('utf8').slice(0, 400_000);
      const p = parseHead(html, url);
      out.website = new URL(url).origin; out.name = p.name; out.description = p.description; out.found = true;
      for (const l of p.logos) { if (out.logos.length >= 3) break; const d = await fetchLogo(l); if (d) out.logos.push(d); }
      return out;
    } catch {}
  }
  out.website = 'https://' + domain;
  out.name = domain.split('.')[0].replace(/[-_]/g, ' ').replace(/^./, c => c.toUpperCase());
  return out;
}

export const LOGO_RE = /^data:image\/(png|jpeg|svg\+xml|webp|x-icon|vnd\.microsoft\.icon|gif);base64,[A-Za-z0-9+/=]+$/;
