-- Migration 0001: Extended columns added to shops table after initial migration
-- Adds: slug, email, website, address, city, country, business_hours,
--       accent_color, social media URLs

ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "slug" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "email" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "website" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "address" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "city" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "country" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "business_hours" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "accent_color" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "facebook_url" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "instagram_url" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "tiktok_url" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "twitter_url" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "youtube_url" text;--> statement-breakpoint

ALTER TABLE "shops" ADD CONSTRAINT "shops_slug_unique" UNIQUE ("slug");--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_shops_user_id" ON "shops" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shops_slug" ON "shops" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shops_is_approved" ON "shops" ("is_approved");
