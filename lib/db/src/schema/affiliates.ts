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
  isApproved: boolean("is_approved").notNull().default(false),
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

export const insertAffiliateSchema = createInsertSchema(affiliatesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinksTable).omit({ id: true, createdAt: true });
export const insertAffiliateCommissionSchema = createInsertSchema(affiliateCommissionsTable).omit({ id: true, createdAt: true });

export type Affiliate = typeof affiliatesTable.$inferSelect;
export type AffiliateLink = typeof affiliateLinksTable.$inferSelect;
export type AffiliateCommission = typeof affiliateCommissionsTable.$inferSelect;
