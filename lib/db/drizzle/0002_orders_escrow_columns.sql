-- Migration 0002: Extended columns added to orders table after initial migration
-- Adds: seller_id, escrow fields, payment_status, tracking fields

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "seller_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" text NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "escrow_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "seller_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "platform_fee" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "escrow_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "released_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "dispute_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_number" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "courier_name" text;--> statement-breakpoint

ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_users_id_fk"
  FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_orders_user_id" ON "orders" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_seller_id" ON "orders" ("seller_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_payment_status" ON "orders" ("payment_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "orders" ("created_at" DESC);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_products_shop_id" ON "products" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_status" ON "products" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_category_id" ON "products" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_products_created_at" ON "products" ("created_at" DESC);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages" ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_conversations_buyer_id" ON "conversations" ("buyer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_conversations_seller_id" ON "conversations" ("seller_id");
