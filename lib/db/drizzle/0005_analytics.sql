-- Migration 0005: Analytics — page_views event tracking table
-- ENUM: page_view_event

CREATE TYPE "public"."page_view_event" AS ENUM('product_view', 'shop_view', 'search');--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "page_views" (
  "id" text PRIMARY KEY NOT NULL,
  "event" "page_view_event" NOT NULL,
  "product_id" text,
  "shop_id" text,
  "visitor_id" text,
  "user_id" text,
  "referrer" text,
  "user_agent" text,
  "country" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

ALTER TABLE "page_views" ADD CONSTRAINT "page_views_product_id_products_id_fk"
  FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_page_views_product_id" ON "page_views" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_page_views_shop_id" ON "page_views" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_page_views_event" ON "page_views" ("event");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_page_views_created_at" ON "page_views" ("created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_page_views_visitor_id" ON "page_views" ("visitor_id");
