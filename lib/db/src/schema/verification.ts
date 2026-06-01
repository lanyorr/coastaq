import { pgTable, text, timestamp, pgEnum, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { shopsTable } from "./shops";
import { usersTable } from "./users";

/* ─── Enums ─────────────────────────────────────────────────────────────────── */
export const verificationStatusEnum = pgEnum("verification_status", [
  "not_submitted", "pending_review", "approved", "rejected", "requires_update",
]);

export const badgeLevelEnum = pgEnum("badge_level", [
  "basic", "verified", "premium", "enterprise",
]);

/* ─── Seller Verifications ───────────────────────────────────────────────────── */
export const sellerVerificationsTable = pgTable("seller_verifications", {
  id:               text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shopId:           text("shop_id").notNull().references(() => shopsTable.id, { onDelete: "cascade" }),
  identityStatus:   verificationStatusEnum("identity_status").notNull().default("not_submitted"),
  businessStatus:   verificationStatusEnum("business_status").notNull().default("not_submitted"),
  overallStatus:    verificationStatusEnum("overall_status").notNull().default("not_submitted"),
  badgeLevel:       badgeLevelEnum("badge_level").notNull().default("basic"),
  reviewedBy:       text("reviewed_by").references(() => usersTable.id, { onDelete: "set null" }),
  reviewNote:       text("review_note"),
  submittedAt:      timestamp("submitted_at"),
  reviewedAt:       timestamp("reviewed_at"),
  isFlagged:        boolean("is_flagged").notNull().default(false),
  flagReason:       text("flag_reason"),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
});

/* ─── Verification Documents ─────────────────────────────────────────────────── */
export const verificationDocumentsTable = pgTable("verification_documents", {
  id:               text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shopId:           text("shop_id").notNull().references(() => shopsTable.id, { onDelete: "cascade" }),
  verificationId:   text("verification_id").references(() => sellerVerificationsTable.id, { onDelete: "cascade" }),
  docType:          text("doc_type").notNull(),      // passport | national_id | drivers_license | business_reg | tax_cert | vat_reg | import_export
  docCategory:      text("doc_category").notNull().default("identity"),   // identity | business
  fileName:         text("file_name").notNull(),
  fileSize:         integer("file_size"),
  mimeType:         text("mime_type"),
  fileData:         text("file_data"),               // base64 dataURL (stored securely)
  status:           verificationStatusEnum("status").notNull().default("pending_review"),
  rejectionReason:  text("rejection_reason"),
  uploadedAt:       timestamp("uploaded_at").notNull().defaultNow(),
  reviewedAt:       timestamp("reviewed_at"),
});

/* ─── Seller Trust Scores ────────────────────────────────────────────────────── */
export const sellerTrustScoresTable = pgTable("seller_trust_scores", {
  id:               text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shopId:           text("shop_id").notNull().references(() => shopsTable.id, { onDelete: "cascade" }),
  totalScore:       numeric("total_score", { precision: 5, scale: 2 }).notNull().default("0"),
  deliveryScore:    numeric("delivery_score", { precision: 5, scale: 2 }).default("0"),
  completionScore:  numeric("completion_score", { precision: 5, scale: 2 }).default("0"),
  disputeScore:     numeric("dispute_score", { precision: 5, scale: 2 }).default("0"),
  refundScore:      numeric("refund_score", { precision: 5, scale: 2 }).default("0"),
  ageScore:         numeric("age_score", { precision: 5, scale: 2 }).default("0"),
  volumeScore:      numeric("volume_score", { precision: 5, scale: 2 }).default("0"),
  metrics:          text("metrics"),                 // JSON cache of raw metrics
  computedAt:       timestamp("computed_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
});

/* ─── Verification Audit Logs ────────────────────────────────────────────────── */
export const verificationAuditLogsTable = pgTable("verification_audit_logs", {
  id:         text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shopId:     text("shop_id").references(() => shopsTable.id, { onDelete: "cascade" }),
  actorId:    text("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
  action:     text("action").notNull(),              // doc_uploaded | doc_approved | doc_rejected | badge_changed | trust_score_updated | warning_issued | suspended | restored | flagged
  entityType: text("entity_type"),                   // document | badge | trust_score | shop
  entityId:   text("entity_id"),
  details:    text("details"),                       // JSON
  createdAt:  timestamp("created_at").notNull().defaultNow(),
});
