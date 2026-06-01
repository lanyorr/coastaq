-- Migration 0009: Full shipping & shipment system
-- Tables: shipments, couriers, shipment_events, shipping_rates, delivery_issues
-- ENUM:   shipment_status

CREATE TYPE "public"."shipment_status" AS ENUM(
  'label_created', 'picked_up', 'in_transit',
  'out_for_delivery', 'delivered', 'failed', 'returned'
);--> statement-breakpoint

-- Shipments: one per order, tracks carrier + tracking number + lifecycle
CREATE TABLE IF NOT EXISTS "shipments" (
  "id" text PRIMARY KEY NOT NULL,
  "order_id" text NOT NULL,
  "shop_id" text,
  "carrier" text NOT NULL,
  "tracking_number" text NOT NULL,
  "tracking_url" text,
  "status" "shipment_status" NOT NULL DEFAULT 'label_created',
  "estimated_delivery" timestamp,
  "delivered_at" timestamp,
  "dispatched_at" timestamp,
  "origin_address" text,
  "destination_address" text,
  "weight" text,
  "dimensions" text,
  "shipping_cost" text DEFAULT '0',
  "method" text DEFAULT 'standard',
  "label_url" text,
  "notes" text,
  "created_by" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Couriers: carrier registry (DHL, FedEx, UPS, local, etc.)
CREATE TABLE IF NOT EXISTS "couriers" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "code" text NOT NULL,
  "tracking_url_template" text,
  "logo_url" text,
  "type" text NOT NULL DEFAULT 'manual',
  "settings" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Shipment events: tracking timeline entries per shipment
CREATE TABLE IF NOT EXISTS "shipment_events" (
  "id" text PRIMARY KEY NOT NULL,
  "shipment_id" text NOT NULL,
  "status" text NOT NULL,
  "description" text NOT NULL,
  "location" text,
  "created_by" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Shipping rates: per-shop rate configuration
CREATE TABLE IF NOT EXISTS "shipping_rates" (
  "id" text PRIMARY KEY NOT NULL,
  "shop_id" text NOT NULL,
  "name" text NOT NULL,
  "courier_id" text,
  "rate_type" text NOT NULL DEFAULT 'flat',
  "base_rate" text NOT NULL DEFAULT '0',
  "per_kg_rate" text,
  "free_shipping_threshold" text,
  "countries" text,
  "estimated_days_min" integer DEFAULT 3,
  "estimated_days_max" integer DEFAULT 7,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Delivery issues: failed delivery, returns, damage, lost parcels
CREATE TABLE IF NOT EXISTS "delivery_issues" (
  "id" text PRIMARY KEY NOT NULL,
  "shipment_id" text NOT NULL,
  "issue_type" text NOT NULL,
  "description" text NOT NULL,
  "status" text NOT NULL DEFAULT 'open',
  "resolution" text,
  "reported_by" text,
  "resolved_by" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "resolved_at" timestamp
);--> statement-breakpoint

-- Foreign keys — shipments
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Foreign keys — shipment_events
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_shipments_id_fk"
  FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Foreign keys — shipping_rates
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_courier_id_couriers_id_fk"
  FOREIGN KEY ("courier_id") REFERENCES "public"."couriers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Foreign keys — delivery_issues
ALTER TABLE "delivery_issues" ADD CONSTRAINT "delivery_issues_shipment_id_shipments_id_fk"
  FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_issues" ADD CONSTRAINT "delivery_issues_reported_by_users_id_fk"
  FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_issues" ADD CONSTRAINT "delivery_issues_resolved_by_users_id_fk"
  FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_shipments_order_id" ON "shipments" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shipments_shop_id" ON "shipments" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shipments_status" ON "shipments" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shipments_tracking_number" ON "shipments" ("tracking_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shipments_created_at" ON "shipments" ("created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shipment_events_shipment_id" ON "shipment_events" ("shipment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shipping_rates_shop_id" ON "shipping_rates" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_delivery_issues_shipment_id" ON "delivery_issues" ("shipment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_delivery_issues_status" ON "delivery_issues" ("status");
