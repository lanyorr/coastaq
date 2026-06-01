-- Migration 0003: user_roles junction table for multi-role RBAC
-- Allows a single user to hold multiple roles (BUYER, SELLER, AFFILIATE, ADMIN)

CREATE TABLE IF NOT EXISTS "user_roles" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "role" text NOT NULL,
  "granted_by" text,
  "granted_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "user_roles_user_role_unique" UNIQUE ("user_id", "role")
);--> statement-breakpoint

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_users_id_fk"
  FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id" ON "user_roles" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_roles_role" ON "user_roles" ("role");--> statement-breakpoint

-- Backfill: every existing user gets their primary role in the junction table
INSERT INTO "user_roles" ("id", "user_id", "role", "granted_at")
  SELECT gen_random_uuid()::text, "id", "role", "created_at"
  FROM "users"
  ON CONFLICT ("user_id", "role") DO NOTHING;--> statement-breakpoint

-- Sellers automatically also receive the BUYER role
INSERT INTO "user_roles" ("id", "user_id", "role", "granted_at")
  SELECT gen_random_uuid()::text, "id", 'BUYER', "created_at"
  FROM "users"
  WHERE "role" = 'SELLER'
  ON CONFLICT ("user_id", "role") DO NOTHING;
