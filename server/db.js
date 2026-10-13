import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';

mkdirSync('data', { recursive: true });
export const db = new DatabaseSync(process.env.DB_PATH || 'data/impactese.db');
db.exec(`
CREATE TABLE IF NOT EXISTS customers(
  pattern TEXT PRIMARY KEY,           -- 'mail@x.org' o '@x.org' (todo el dominio)
  note TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orgs(
  id TEXT PRIMARY KEY,                -- dominio, o el mail si es un dominio público (gmail, etc.)
  name TEXT DEFAULT '', website TEXT DEFAULT '', description TEXT DEFAULT '',
  logo TEXT DEFAULT '',               -- data URL validado
  color1 TEXT DEFAULT '', color2 TEXT DEFAULT '',
  confirmed INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tool_state(
  org_id TEXT, tool_id TEXT, json TEXT, done INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(org_id, tool_id)
);`);

export const PUBLIC_DOMAINS = new Set(['gmail.com', 'googlemail.com', 'hotmail.com', 'outlook.com', 'live.com', 'yahoo.com', 'yahoo.com.ar', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com']);

export const orgIdFor = email => {
  const d = email.split('@')[1];
  return PUBLIC_DOMAINS.has(d) ? email : d;
};

export const isPaid = email => {
  const d = '@' + email.split('@')[1];
  return !!db.prepare('SELECT 1 FROM customers WHERE pattern IN (?,?)').get(email, d);
};
