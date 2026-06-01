-- Migration 0008: Inventory movement log
-- Tracks every stock change: restocks, sales, adjustments, returns, reservations
-- ENUM: inventory_movement_type

CREATE TYPE "public"."inventory_movement_type" AS ENUM(
  'restock', 'sale', 'adjustment', 'return', 'reserved'
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "inventory_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL,
  "type" "inventory_movement_type" NOT NULL,
  "quantity" integer NOT NULL,
  "stock_before" integer NOT NULL,
  "stock_after" integer NOT NULL,
  "note" text,
  "order_id" text,
  "created_by" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_product_id_products_id_fk"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_order_id_orders_id_fk"
  FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_inventory_logs_product_id" ON "inventory_logs" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inventory_logs_order_id" ON "inventory_logs" ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inventory_logs_type" ON "inventory_logs" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inventory_logs_created_at" ON "inventory_logs" ("created_at" DESC);
