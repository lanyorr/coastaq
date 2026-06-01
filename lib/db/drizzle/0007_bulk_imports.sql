-- Migration 0007: Bulk CSV product import system
-- Tables: seller_imports, seller_import_rows, field_mapping_profiles

CREATE TABLE IF NOT EXISTS "seller_imports" (
  "id" text PRIMARY KEY NOT NULL,
  "shop_id" text NOT NULL,
  "file_name" text NOT NULL,
  "status" text NOT NULL DEFAULT 'COMPLETED',
  "mode" text NOT NULL DEFAULT 'CREATE',
  "total_rows" integer NOT NULL DEFAULT 0,
  "imported_rows" integer NOT NULL DEFAULT 0,
  "failed_rows" integer NOT NULL DEFAULT 0,
  "error_summary" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "seller_import_rows" (
  "id" text PRIMARY KEY NOT NULL,
  "import_id" text NOT NULL,
  "row_index" integer NOT NULL,
  "status" text NOT NULL,
  "product_id" text,
  "error_message" text,
  "row_data" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "field_mapping_profiles" (
  "id" text PRIMARY KEY NOT NULL,
  "shop_id" text NOT NULL,
  "name" text NOT NULL,
  "mappings" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

ALTER TABLE "seller_imports" ADD CONSTRAINT "seller_imports_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "seller_import_rows" ADD CONSTRAINT "seller_import_rows_import_id_seller_imports_id_fk"
  FOREIGN KEY ("import_id") REFERENCES "public"."seller_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "field_mapping_profiles" ADD CONSTRAINT "field_mapping_profiles_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_seller_imports_shop_id" ON "seller_imports" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_seller_imports_created_at" ON "seller_imports" ("created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_seller_import_rows_import_id" ON "seller_import_rows" ("import_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_seller_import_rows_status" ON "seller_import_rows" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_field_mapping_profiles_shop_id" ON "field_mapping_profiles" ("shop_id");
