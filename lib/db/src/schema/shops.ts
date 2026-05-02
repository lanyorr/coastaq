import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "TRIAL",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
]);

export const shopsTable = pgTable("shops", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  logo: text("logo"),
  banner: text("banner"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  website: text("website"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  businessHours: text("business_hours"),
  accentColor: text("accent_color"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  twitterUrl: text("twitter_url"),
  youtubeUrl: text("youtube_url"),
  isApproved: boolean("is_approved").notNull().default(false),
  isSuspended: boolean("is_suspended").notNull().default(false),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),

  // Subscription fields
  subscriptionStatus: subscriptionStatusEnum("subscription_status").notNull().default("TRIAL"),
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  lastPaypalOrderId: text("last_paypal_order_id"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shopsTable.$inferSelect;
