-- Opcional: el servidor crea estas tablas solo al arrancar. Pegalo en Supabase → SQL Editor si querés verlas antes.
CREATE TABLE IF NOT EXISTS impactese_customers(
  pattern TEXT PRIMARY KEY, note TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS impactese_orgs(
  id TEXT PRIMARY KEY, name TEXT DEFAULT '', website TEXT DEFAULT '', description TEXT DEFAULT '',
  logo TEXT DEFAULT '', color1 TEXT DEFAULT '', color2 TEXT DEFAULT '',
  confirmed INTEGER DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS impactese_tool_state(
  org_id TEXT, tool_id TEXT, json TEXT, done INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY(org_id, tool_id));
ALTER TABLE impactese_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE impactese_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE impactese_tool_state ENABLE ROW LEVEL SECURITY;
