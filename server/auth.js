import { createHmac, timingSafeEqual } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { isPaid } from './db.js';

const SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-secret');
if (!SECRET) throw new Error('Falta SESSION_SECRET');
export const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const ADMINS = [...new Set(['cecilia.sole@gmail.com', 'hernan@guaraniagency.com', ...(process.env.ADMIN_EMAILS || '').toLowerCase().split(',')].map(s => s.trim()).filter(Boolean))];
const TTL = 14 * 24 * 3600 * 1000;
const google = new OAuth2Client();

const sign = p => createHmac('sha256', SECRET).update(p).digest('base64url');
export function makeCookie(email) {
  const p = Buffer.from(JSON.stringify({ email, exp: Date.now() + TTL })).toString('base64url');
  return `${p}.${sign(p)}`;
}
function readCookie(req) {
  const raw = /(?:^|;\s*)sid=([^;]+)/.exec(req.headers.cookie || '')?.[1];
  if (!raw) return null;
  const [p, s] = raw.split('.');
  if (!p || !s) return null;
  const a = Buffer.from(s), b = Buffer.from(sign(p));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const d = JSON.parse(Buffer.from(p, 'base64url').toString());
    return d.exp > Date.now() ? d.email : null;
  } catch { return null; }
}
export const setSession = (res, email) =>
  res.setHeader('Set-Cookie', `sid=${makeCookie(email)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${TTL / 1000}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
export const clearSession = res => res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; Max-Age=0');

export async function verifyGoogle(credential) {
  const t = await google.verifyIdToken({ idToken: credential, audience: CLIENT_ID });
  const p = t.getPayload();
  if (!p?.email || !p.email_verified) throw new Error('mail no verificado');
  return p.email.toLowerCase();
}

// Cualquier cuenta de Google verificada entra. El pago decide si puede usar el programa (paid) o solo mirarlo.
// Se re-chequea en cada request: si lo revocás, vuelve a modo vista previa al instante.
export function requireUser(req, res, next) {
  const email = readCookie(req);
  if (!email) {
    if (req.accepts('html') && !req.path.startsWith('/api/')) return res.redirect('/');
    return res.status(401).json({ error: 'no_session' });
  }
  const admin = ADMINS.includes(email);
  req.user = { email, admin, paid: admin || isPaid(email) };
  next();
}
export const requirePaid = (req, res, next) =>
  req.user.paid ? next() : res.status(402).json({ error: 'payment_required' });
export const requireAdmin = (req, res, next) =>
  req.user.admin ? next() : res.status(403).json({ error: 'forbidden' });
