import pg from "pg";

const url =
  process.env.SUPABASE_POOLER_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!url) { console.error("No DB URL found in env"); process.exit(1); }

const { Pool } = pg;
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

const sql = `
DO $$ BEGIN
  CREATE TYPE affiliate_status AS ENUM ('pending', 'approved', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE affiliate_commission_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE page_view_event AS ENUM ('product_view', 'shop_view', 'search');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS affiliates (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            affiliate_status NOT NULL DEFAULT 'pending',
  commission_rate   NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  total_earnings    NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_earnings  NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_earnings     NUMERIC(12,2) NOT NULL DEFAULT 0,
  paypal_email      TEXT,
  bio               TEXT,
  website_url       TEXT,
  is_approved       BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_links (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  code         TEXT NOT NULL UNIQUE,
  product_id   TEXT REFERENCES products(id) ON DELETE CASCADE,
  shop_id      TEXT REFERENCES shops(id) ON DELETE CASCADE,
  clicks       INTEGER NOT NULL DEFAULT 0,
  conversions  INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  expires_at   TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  link_id      TEXT REFERENCES affiliate_links(id) ON DELETE SET NULL,
  amount       NUMERIC(12,2) NOT NULL,
  rate         NUMERIC(5,2) NOT NULL,
  status       affiliate_commission_status NOT NULL DEFAULT 'pending',
  paid_at      TIMESTAMP,
  note         TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_views (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event       page_view_event NOT NULL,
  product_id  TEXT REFERENCES products(id) ON DELETE CASCADE,
  shop_id     TEXT REFERENCES shops(id) ON DELETE CASCADE,
  visitor_id  TEXT,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  referrer    TEXT,
  user_agent  TEXT,
  country     TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE shops ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS facebook TEXT;

UPDATE shops
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTR(id, 1, 6)
WHERE slug IS NULL OR slug = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'shops_slug_unique'
  ) THEN
    ALTER TABLE shops ADD CONSTRAINT shops_slug_unique UNIQUE (slug);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_roles (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);
`;

const client = await pool.connect();
try {
  console.log("Running migration…");
  await client.query(sql);
  console.log("✅ Migration complete — all tables created/verified");
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
