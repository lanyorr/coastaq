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
  CREATE TYPE affiliate_payout_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE affiliate_campaign_status AS ENUM ('active', 'paused', 'ended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE page_view_event AS ENUM ('product_view', 'shop_view', 'search');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Core affiliate tables (already exist, safe no-ops)
CREATE TABLE IF NOT EXISTS affiliates (
  id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status                   affiliate_status NOT NULL DEFAULT 'pending',
  commission_rate          NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  total_earnings           NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_earnings         NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_earnings            NUMERIC(12,2) NOT NULL DEFAULT 0,
  paypal_email             TEXT,
  bio                      TEXT,
  website_url              TEXT,
  is_approved              BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS suspicious_click_count INTEGER NOT NULL DEFAULT 0;

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

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  link_id      TEXT NOT NULL REFERENCES affiliate_links(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_hash      TEXT,
  user_agent   TEXT,
  referrer     TEXT,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link_ip ON affiliate_clicks(link_id, ip_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id, created_at);

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

-- New tables
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount       NUMERIC(12,2) NOT NULL,
  method       TEXT NOT NULL DEFAULT 'paypal',
  status       affiliate_payout_status NOT NULL DEFAULT 'pending',
  note         TEXT,
  paid_at      TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_coupons (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  code         TEXT NOT NULL UNIQUE,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  uses         INTEGER NOT NULL DEFAULT 0,
  max_uses     INTEGER,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  expires_at   TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_coupons_code ON affiliate_coupons(code) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS affiliate_campaigns (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shop_id         TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  budget          NUMERIC(12,2),
  spent           NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          affiliate_campaign_status NOT NULL DEFAULT 'active',
  starts_at       TIMESTAMP,
  ends_at         TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_campaign_members (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id  TEXT NOT NULL REFERENCES affiliate_campaigns(id) ON DELETE CASCADE,
  affiliate_id TEXT NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'active',
  joined_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, affiliate_id)
);

CREATE TABLE IF NOT EXISTS affiliate_campaign_products (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  campaign_id TEXT NOT NULL REFERENCES affiliate_campaigns(id) ON DELETE CASCADE,
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_products_campaign ON affiliate_campaign_products(campaign_id);

-- Page views
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

-- Shop extended columns
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

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  granted_by TEXT REFERENCES users(id) ON DELETE SET NULL,
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
