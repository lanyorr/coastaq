-- Migration 0004: Full affiliate system
-- Tables: affiliates, affiliate_links, affiliate_clicks, affiliate_commissions,
--         affiliate_payouts, affiliate_coupons, affiliate_campaigns,
--         affiliate_campaign_members, affiliate_campaign_products,
--         affiliate_campaign_invitations
-- ENUMs:  affiliate_status, affiliate_commission_status, affiliate_payout_status,
--         affiliate_campaign_status, affiliate_campaign_invitation_status

CREATE TYPE "public"."affiliate_status" AS ENUM('pending', 'approved', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."affiliate_commission_status" AS ENUM('pending', 'approved', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."affiliate_payout_status" AS ENUM('pending', 'approved', 'paid', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."affiliate_campaign_status" AS ENUM('active', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."affiliate_campaign_invitation_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliates" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "status" "affiliate_status" NOT NULL DEFAULT 'pending',
  "commission_rate" numeric(5, 2) NOT NULL DEFAULT '5.00',
  "total_earnings" numeric(12, 2) NOT NULL DEFAULT '0',
  "pending_earnings" numeric(12, 2) NOT NULL DEFAULT '0',
  "paid_earnings" numeric(12, 2) NOT NULL DEFAULT '0',
  "paypal_email" text,
  "bio" text,
  "website_url" text,
  "instagram" text,
  "twitter" text,
  "is_approved" boolean NOT NULL DEFAULT false,
  "suspicious_click_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_links" (
  "id" text PRIMARY KEY NOT NULL,
  "affiliate_id" text NOT NULL,
  "code" text NOT NULL,
  "product_id" text,
  "shop_id" text,
  "clicks" integer NOT NULL DEFAULT 0,
  "conversions" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "affiliate_links_code_unique" UNIQUE ("code")
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
  "id" text PRIMARY KEY NOT NULL,
  "link_id" text NOT NULL,
  "affiliate_id" text NOT NULL,
  "ip_hash" text,
  "user_agent" text,
  "referrer" text,
  "is_duplicate" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_commissions" (
  "id" text PRIMARY KEY NOT NULL,
  "affiliate_id" text NOT NULL,
  "order_id" text NOT NULL,
  "link_id" text,
  "amount" numeric(12, 2) NOT NULL,
  "rate" numeric(5, 2) NOT NULL,
  "status" "affiliate_commission_status" NOT NULL DEFAULT 'pending',
  "paid_at" timestamp,
  "note" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_payouts" (
  "id" text PRIMARY KEY NOT NULL,
  "affiliate_id" text NOT NULL,
  "amount" numeric(12, 2) NOT NULL,
  "method" text NOT NULL,
  "status" "affiliate_payout_status" NOT NULL DEFAULT 'pending',
  "note" text,
  "paid_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_coupons" (
  "id" text PRIMARY KEY NOT NULL,
  "affiliate_id" text NOT NULL,
  "code" text NOT NULL,
  "discount_pct" numeric(5, 2) NOT NULL DEFAULT '10.00',
  "uses" integer NOT NULL DEFAULT 0,
  "max_uses" integer,
  "is_active" boolean NOT NULL DEFAULT true,
  "expires_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "affiliate_coupons_code_unique" UNIQUE ("code")
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_campaigns" (
  "id" text PRIMARY KEY NOT NULL,
  "shop_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "commission_rate" numeric(5, 2) NOT NULL DEFAULT '10.00',
  "budget" numeric(12, 2),
  "spent" numeric(12, 2) NOT NULL DEFAULT '0',
  "status" "affiliate_campaign_status" NOT NULL DEFAULT 'active',
  "starts_at" timestamp,
  "ends_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_campaign_members" (
  "id" text PRIMARY KEY NOT NULL,
  "campaign_id" text NOT NULL,
  "affiliate_id" text NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "joined_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_campaign_products" (
  "id" text PRIMARY KEY NOT NULL,
  "campaign_id" text NOT NULL,
  "product_id" text NOT NULL,
  "added_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_campaign_invitations" (
  "id" text PRIMARY KEY NOT NULL,
  "campaign_id" text NOT NULL,
  "affiliate_id" text NOT NULL,
  "status" "affiliate_campaign_invitation_status" NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Foreign keys
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_affiliate_id_affiliates_id_fk"
  FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_product_id_products_id_fk"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_link_id_affiliate_links_id_fk"
  FOREIGN KEY ("link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_affiliate_id_affiliates_id_fk"
  FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliate_id_affiliates_id_fk"
  FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_link_id_affiliate_links_id_fk"
  FOREIGN KEY ("link_id") REFERENCES "public"."affiliate_links"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "affiliate_payouts" ADD CONSTRAINT "affiliate_payouts_affiliate_id_affiliates_id_fk"
  FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "affiliate_coupons" ADD CONSTRAINT "affiliate_coupons_affiliate_id_affiliates_id_fk"
  FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "affiliate_campaigns" ADD CONSTRAINT "affiliate_campaigns_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "affiliate_campaign_members" ADD CONSTRAINT "affiliate_campaign_members_campaign_id_affiliate_campaigns_id_fk"
  FOREIGN KEY ("campaign_id") REFERENCES "public"."affiliate_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_campaign_members" ADD CONSTRAINT "affiliate_campaign_members_affiliate_id_affiliates_id_fk"
  FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "affiliate_campaign_products" ADD CONSTRAINT "affiliate_campaign_products_campaign_id_affiliate_campaigns_id_fk"
  FOREIGN KEY ("campaign_id") REFERENCES "public"."affiliate_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_campaign_products" ADD CONSTRAINT "affiliate_campaign_products_product_id_products_id_fk"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "affiliate_campaign_invitations" ADD CONSTRAINT "affiliate_campaign_invitations_campaign_id_affiliate_campaigns_id_fk"
  FOREIGN KEY ("campaign_id") REFERENCES "public"."affiliate_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_campaign_invitations" ADD CONSTRAINT "affiliate_campaign_invitations_affiliate_id_affiliates_id_fk"
  FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_affiliates_user_id" ON "affiliates" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliates_status" ON "affiliates" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliate_links_affiliate_id" ON "affiliate_links" ("affiliate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliate_clicks_link_id" ON "affiliate_clicks" ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliate_clicks_affiliate_id" ON "affiliate_clicks" ("affiliate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliate_clicks_created_at" ON "affiliate_clicks" ("created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliate_commissions_affiliate_id" ON "affiliate_commissions" ("affiliate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliate_commissions_order_id" ON "affiliate_commissions" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliate_commissions_status" ON "affiliate_commissions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliate_campaigns_shop_id" ON "affiliate_campaigns" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliate_campaign_members_campaign_id" ON "affiliate_campaign_members" ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_affiliate_campaign_members_affiliate_id" ON "affiliate_campaign_members" ("affiliate_id");
