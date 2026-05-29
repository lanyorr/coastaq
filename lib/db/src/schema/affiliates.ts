import { pgTable, text, timestamp, numeric, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { shopsTable } from "./shops";
import { productsTable } from "./products";
import { ordersTable } from "./orders";

export const affiliateStatusEnum = pgEnum("affiliate_status", [
  "pending",
  "approved",
  "suspended",
]);

export const affiliateCommissionStatusEnum = pgEnum("affiliate_commission_status", [
  "pending",
  "approved",
  "paid",
  "cancelled",
]);

export const affiliatePayoutStatusEnum = pgEnum("affiliate_payout_status", [
  "pending",
  "approved",
  "paid",
  "rejected",
]);

export const affiliateCampaignStatusEnum = pgEnum("affiliate_campaign_status", [
  "active",
  "paused",
  "ended",
]);

export const affiliatesTable = pgTable("affiliates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  status: affiliateStatusEnum("status").notNull().default("pending"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  totalEarnings: numeric("total_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  pendingEarnings: numeric("pending_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  paidEarnings: numeric("paid_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  paypalEmail: text("paypal_email"),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  instagram: text("instagram"),
  twitter: text("twitter"),
  isApproved: boolean("is_approved").notNull().default(false),
  suspiciousClickCount: integer("suspicious_click_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const affiliateLinksTable = pgTable("affiliate_links", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  affiliateId: text("affiliate_id").notNull().references(() => affiliatesTable.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  productId: text("product_id").references(() => productsTable.id, { onDelete: "cascade" }),
  shopId: text("shop_id").references(() => shopsTable.id, { onDelete: "cascade" }),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const affiliateClicksTable = pgTable("affiliate_clicks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  linkId: text("link_id").notNull().references(() => affiliateLinksTable.id, { onDelete: "cascade" }),
  affiliateId: text("affiliate_id").notNull().references(() => affiliatesTable.id, { onDelete: "cascade" }),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  isDuplicate: boolean("is_duplicate").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const affiliateCommissionsTable = pgTable("affiliate_commissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  affiliateId: text("affiliate_id").notNull().references(() => affiliatesTable.id, { onDelete: "cascade" }),
  orderId: text("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  linkId: text("link_id").references(() => affiliateLinksTable.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  status: affiliateCommissionStatusEnum("status").notNull().default("pending"),
  paidAt: timestamp("paid_at"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const affiliatePayoutsTable = pgTable("affiliate_payouts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  affiliateId: text("affiliate_id").notNull().references(() => affiliatesTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method").notNull().$type<"paypal" | "bank" | "mobile_money" | "crypto">(),
  status: affiliatePayoutStatusEnum("status").notNull().default("pending"),
  note: text("note"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const affiliateCouponsTable = pgTable("affiliate_coupons", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  affiliateId: text("affiliate_id").notNull().references(() => affiliatesTable.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  discountPct: numeric("discount_pct", { precision: 5, scale: 2 }).notNull().default("10.00"),
  uses: integer("uses").notNull().default(0),
  maxUses: integer("max_uses"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const affiliateCampaignsTable = pgTable("affiliate_campaigns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shopId: text("shop_id").notNull().references(() => shopsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("10.00"),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  spent: numeric("spent", { precision: 12, scale: 2 }).notNull().default("0"),
  status: affiliateCampaignStatusEnum("status").notNull().default("active"),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const affiliateCampaignMembersTable = pgTable("affiliate_campaign_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text("campaign_id").notNull().references(() => affiliateCampaignsTable.id, { onDelete: "cascade" }),
  affiliateId: text("affiliate_id").notNull().references(() => affiliatesTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active").$type<"active" | "removed">(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const affiliateCampaignProductsTable = pgTable("affiliate_campaign_products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text("campaign_id").notNull().references(() => affiliateCampaignsTable.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const affiliateCampaignInvitationStatusEnum = pgEnum("affiliate_campaign_invitation_status", [
  "pending",
  "accepted",
  "declined",
]);

export const affiliateCampaignInvitationsTable = pgTable("affiliate_campaign_invitations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text("campaign_id").notNull().references(() => affiliateCampaignsTable.id, { onDelete: "cascade" }),
  affiliateId: text("affiliate_id").notNull().references(() => affiliatesTable.id, { onDelete: "cascade" }),
  status: affiliateCampaignInvitationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAffiliateSchema = createInsertSchema(affiliatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinksTable).omit({ id: true, createdAt: true });
export const insertAffiliateCommissionSchema = createInsertSchema(affiliateCommissionsTable).omit({ id: true, createdAt: true });
export const insertAffiliatePayoutSchema = createInsertSchema(affiliatePayoutsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAffiliateCouponSchema = createInsertSchema(affiliateCouponsTable).omit({ id: true, createdAt: true });
export const insertAffiliateCampaignSchema = createInsertSchema(affiliateCampaignsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAffiliateCampaignProductSchema = createInsertSchema(affiliateCampaignProductsTable).omit({ id: true, addedAt: true });

export type Affiliate = typeof affiliatesTable.$inferSelect;
export type AffiliateLink = typeof affiliateLinksTable.$inferSelect;
export type AffiliateClick = typeof affiliateClicksTable.$inferSelect;
export type AffiliateCommission = typeof affiliateCommissionsTable.$inferSelect;
export type AffiliatePayout = typeof affiliatePayoutsTable.$inferSelect;
export type AffiliateCoupon = typeof affiliateCouponsTable.$inferSelect;
export type AffiliateCampaign = typeof affiliateCampaignsTable.$inferSelect;
export type AffiliateCampaignMember = typeof affiliateCampaignMembersTable.$inferSelect;
export type AffiliateCampaignProduct = typeof affiliateCampaignProductsTable.$inferSelect;
export type AffiliateCampaignInvitation = typeof affiliateCampaignInvitationsTable.$inferSelect;
