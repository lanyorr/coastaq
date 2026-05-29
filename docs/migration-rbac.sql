-- ═══════════════════════════════════════════════════════════════════════════════
-- COASTAQ  ·  Multi-Role RBAC Migration
-- Run this once against your Supabase / PostgreSQL database.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. user_roles junction table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id          TEXT        PRIMARY KEY,
  user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL,   -- 'BUYER' | 'SELLER' | 'AFFILIATE' | 'ADMIN'
  granted_by  TEXT        REFERENCES users(id) ON DELETE SET NULL,
  granted_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT user_roles_user_role_unique UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role    ON user_roles(role);

-- ── 2. Backfill existing users (idempotent) ────────────────────────────────────
INSERT INTO user_roles (id, user_id, role, granted_at)
SELECT gen_random_uuid()::text, id, role, created_at
FROM users
ON CONFLICT (user_id, role) DO NOTHING;

-- Sellers also receive BUYER role automatically
INSERT INTO user_roles (id, user_id, role, granted_at)
SELECT gen_random_uuid()::text, id, 'BUYER', created_at
FROM users
WHERE role = 'SELLER'
ON CONFLICT (user_id, role) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPABASE ROW-LEVEL SECURITY POLICIES
--
-- These policies assume you are using Supabase's built-in auth
-- (auth.uid() maps to a Supabase Auth UUID).
--
-- If you are using a custom JWT (current Coastaq setup), apply these
-- policies via the service role and enforce access control at the
-- application layer (middleware) instead.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Enable RLS on all tables ──────────────────────────────────────────────────
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- ── Helper function: check if current user has a role ─────────────────────────
CREATE OR REPLACE FUNCTION auth_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()::text
      AND role    = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── users table ───────────────────────────────────────────────────────────────
CREATE POLICY "users: read own row"
  ON users FOR SELECT
  USING (id = auth.uid()::text OR auth_has_role('ADMIN'));

CREATE POLICY "users: update own row"
  ON users FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

CREATE POLICY "users: admin full access"
  ON users FOR ALL
  USING (auth_has_role('ADMIN'));

-- ── user_roles table ──────────────────────────────────────────────────────────
CREATE POLICY "user_roles: read own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid()::text OR auth_has_role('ADMIN'));

CREATE POLICY "user_roles: admin manage"
  ON user_roles FOR ALL
  USING (auth_has_role('ADMIN'));

-- ── shops table ───────────────────────────────────────────────────────────────
CREATE POLICY "shops: public read approved"
  ON shops FOR SELECT
  USING (is_approved = TRUE OR user_id = auth.uid()::text OR auth_has_role('ADMIN'));

CREATE POLICY "shops: seller manage own"
  ON shops FOR ALL
  USING (user_id = auth.uid()::text AND auth_has_role('SELLER'));

CREATE POLICY "shops: admin manage all"
  ON shops FOR ALL
  USING (auth_has_role('ADMIN'));

-- ── products table ────────────────────────────────────────────────────────────
CREATE POLICY "products: public read"
  ON products FOR SELECT
  USING (TRUE);

CREATE POLICY "products: seller manage own shop products"
  ON products FOR ALL
  USING (
    auth_has_role('SELLER') AND shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "products: admin manage all"
  ON products FOR ALL
  USING (auth_has_role('ADMIN'));

-- ── orders table ──────────────────────────────────────────────────────────────
CREATE POLICY "orders: buyer read own"
  ON orders FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "orders: seller read orders for their shops"
  ON orders FOR SELECT
  USING (
    auth_has_role('SELLER') AND id IN (
      SELECT DISTINCT o.id FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p      ON p.id = oi.product_id
      JOIN shops s         ON s.id = p.shop_id
      WHERE s.user_id = auth.uid()::text
    )
  );

CREATE POLICY "orders: admin read all"
  ON orders FOR ALL
  USING (auth_has_role('ADMIN'));

-- ── affiliate tables ──────────────────────────────────────────────────────────
CREATE POLICY "affiliates: read own profile"
  ON affiliates FOR SELECT
  USING (user_id = auth.uid()::text OR auth_has_role('ADMIN'));

CREATE POLICY "affiliates: admin manage"
  ON affiliates FOR ALL
  USING (auth_has_role('ADMIN'));

CREATE POLICY "affiliate_links: read own"
  ON affiliate_links FOR SELECT
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()::text)
    OR auth_has_role('ADMIN')
  );

CREATE POLICY "affiliate_links: affiliate manage own"
  ON affiliate_links FOR ALL
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()::text)
    AND auth_has_role('AFFILIATE')
  );

CREATE POLICY "affiliate_commissions: read own"
  ON affiliate_commissions FOR SELECT
  USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()::text)
    OR auth_has_role('ADMIN')
  );

-- ── shipments table ───────────────────────────────────────────────────────────
CREATE POLICY "shipments: buyer read own orders"
  ON shipments FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()::text)
    OR auth_has_role('SELLER')
    OR auth_has_role('ADMIN')
  );

CREATE POLICY "shipments: seller manage"
  ON shipments FOR ALL
  USING (auth_has_role('SELLER') OR auth_has_role('ADMIN'));

-- ── inventory_logs table ──────────────────────────────────────────────────────
CREATE POLICY "inventory_logs: seller read own"
  ON inventory_logs FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN shops s ON s.id = p.shop_id
      WHERE s.user_id = auth.uid()::text
    )
    OR auth_has_role('ADMIN')
  );

-- ── messages & conversations ──────────────────────────────────────────────────
CREATE POLICY "conversations: participants read"
  ON conversations FOR SELECT
  USING (buyer_id = auth.uid()::text OR seller_id = auth.uid()::text OR auth_has_role('ADMIN'));

CREATE POLICY "messages: participants read"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id = auth.uid()::text OR seller_id = auth.uid()::text
    )
    OR auth_has_role('ADMIN')
  );

CREATE POLICY "messages: authenticated write"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid()::text);
