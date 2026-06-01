-- Migration 0010: Seller verification, trust scoring, and audit logging
-- Tables: seller_verifications, verification_documents,
--         seller_trust_scores, verification_audit_logs
-- ENUMs:  verification_status, badge_level

CREATE TYPE "public"."verification_status" AS ENUM(
  'not_submitted', 'pending_review', 'approved', 'rejected', 'requires_update'
);--> statement-breakpoint

CREATE TYPE "public"."badge_level" AS ENUM(
  'basic', 'verified', 'premium', 'enterprise'
);--> statement-breakpoint

-- Seller verifications: one record per shop, tracks identity + business doc status
CREATE TABLE IF NOT EXISTS "seller_verifications" (
  "id" text PRIMARY KEY NOT NULL,
  "shop_id" text NOT NULL,
  "identity_status" "verification_status" NOT NULL DEFAULT 'not_submitted',
  "business_status" "verification_status" NOT NULL DEFAULT 'not_submitted',
  "overall_status" "verification_status" NOT NULL DEFAULT 'not_submitted',
  "badge_level" "badge_level" NOT NULL DEFAULT 'basic',
  "reviewed_by" text,
  "review_note" text,
  "submitted_at" timestamp,
  "reviewed_at" timestamp,
  "is_flagged" boolean NOT NULL DEFAULT false,
  "flag_reason" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Verification documents: individual uploaded files per verification
CREATE TABLE IF NOT EXISTS "verification_documents" (
  "id" text PRIMARY KEY NOT NULL,
  "shop_id" text NOT NULL,
  "verification_id" text,
  "doc_type" text NOT NULL,
  "doc_category" text NOT NULL DEFAULT 'identity',
  "file_name" text NOT NULL,
  "file_size" integer,
  "mime_type" text,
  "file_data" text,
  "status" "verification_status" NOT NULL DEFAULT 'pending_review',
  "rejection_reason" text,
  "uploaded_at" timestamp NOT NULL DEFAULT now(),
  "reviewed_at" timestamp
);--> statement-breakpoint

-- Seller trust scores: computed composite score per shop
CREATE TABLE IF NOT EXISTS "seller_trust_scores" (
  "id" text PRIMARY KEY NOT NULL,
  "shop_id" text NOT NULL,
  "total_score" numeric(5, 2) NOT NULL DEFAULT '0',
  "delivery_score" numeric(5, 2) DEFAULT '0',
  "completion_score" numeric(5, 2) DEFAULT '0',
  "dispute_score" numeric(5, 2) DEFAULT '0',
  "refund_score" numeric(5, 2) DEFAULT '0',
  "age_score" numeric(5, 2) DEFAULT '0',
  "volume_score" numeric(5, 2) DEFAULT '0',
  "metrics" text,
  "computed_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Verification audit logs: full history of admin/system actions on verifications
CREATE TABLE IF NOT EXISTS "verification_audit_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "shop_id" text,
  "actor_id" text,
  "action" text NOT NULL,
  "entity_type" text,
  "entity_id" text,
  "details" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);--> statement-breakpoint

-- Foreign keys — seller_verifications
ALTER TABLE "seller_verifications" ADD CONSTRAINT "seller_verifications_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_verifications" ADD CONSTRAINT "seller_verifications_reviewed_by_users_id_fk"
  FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Foreign keys — verification_documents
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_verification_id_seller_verifications_id_fk"
  FOREIGN KEY ("verification_id") REFERENCES "public"."seller_verifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Foreign keys — seller_trust_scores
ALTER TABLE "seller_trust_scores" ADD CONSTRAINT "seller_trust_scores_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Foreign keys — verification_audit_logs
ALTER TABLE "verification_audit_logs" ADD CONSTRAINT "verification_audit_logs_shop_id_shops_id_fk"
  FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_audit_logs" ADD CONSTRAINT "verification_audit_logs_actor_id_users_id_fk"
  FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "idx_seller_verifications_shop_id" ON "seller_verifications" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_seller_verifications_overall_status" ON "seller_verifications" ("overall_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_seller_verifications_badge_level" ON "seller_verifications" ("badge_level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_verification_documents_shop_id" ON "verification_documents" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_verification_documents_verification_id" ON "verification_documents" ("verification_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_verification_documents_status" ON "verification_documents" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_seller_trust_scores_shop_id" ON "seller_trust_scores" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_verification_audit_logs_shop_id" ON "verification_audit_logs" ("shop_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_verification_audit_logs_actor_id" ON "verification_audit_logs" ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_verification_audit_logs_created_at" ON "verification_audit_logs" ("created_at" DESC);
