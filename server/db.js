import pg from 'pg';

// Producción: DATABASE_URL de Supabase (Project Settings → Database → Connection string, modo "Transaction pooler").
// Desarrollo sin DATABASE_URL: Postgres en memoria (pg-mem), se borra al apagar.
let pool;
if (process.env.DATABASE_URL) {
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: process.env.VERCEL ? 1 : 5 });
} else if (process.env.NODE_ENV === 'production') {
  throw new Error('Falta DATABASE_URL');
} else {
  const { newDb } = await import('pg-mem');
  pool = new (newDb().adapters.createPg().Pool)();
  console.log('Sin DATABASE_URL: usando base en memoria (solo desarrollo).');
}

export const q = async (sql, params = []) => (await pool.query(sql, params)).rows;
export const one = async (sql, params = []) => (await q(sql, params))[0];

// Prefijo impactese_ para convivir con otras tablas del mismo proyecto (por ejemplo, las de horas).
await q(`CREATE TABLE IF NOT EXISTS impactese_customers(
  pattern TEXT PRIMARY KEY,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now())`);
await q(`CREATE TABLE IF NOT EXISTS impactese_orgs(
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '', website TEXT DEFAULT '', description TEXT DEFAULT '',
  logo TEXT DEFAULT '', color1 TEXT DEFAULT '', color2 TEXT DEFAULT '',
  confirmed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now())`);
await q(`CREATE TABLE IF NOT EXISTS impactese_tool_state(
  org_id TEXT, tool_id TEXT, json TEXT, done INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(org_id, tool_id))`);
// Supabase expone las tablas por su API pública. Con RLS activado y sin políticas, esa API no deja leer ni escribir nada;
// este servidor entra con la conexión directa de Postgres, que no pasa por RLS.
if (process.env.DATABASE_URL) {
  for (const t of ['customers', 'orgs', 'tool_state']) await q(`ALTER TABLE impactese_${t} ENABLE ROW LEVEL SECURITY`);
}

export const PUBLIC_DOMAINS = new Set(['gmail.com', 'googlemail.com', 'hotmail.com', 'outlook.com', 'live.com', 'yahoo.com', 'yahoo.com.ar', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com']);

export const orgIdFor = email => {
  const d = email.split('@')[1];
  return PUBLIC_DOMAINS.has(d) ? email : d;
};

export const isPaid = async email => !!(await one('SELECT 1 AS x FROM impactese_customers WHERE pattern IN ($1,$2)', [email, '@' + email.split('@')[1]]));
