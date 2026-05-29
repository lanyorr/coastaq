import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { productsTable } from "./products";
import { shopsTable } from "./shops";
import { usersTable } from "./users";

export const pageViewEventEnum = pgEnum("page_view_event", [
  "product_view",
  "shop_view",
  "search",
]);

export const pageViewsTable = pgTable("page_views", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  event: pageViewEventEnum("event").notNull(),
  productId: text("product_id").references(() => productsTable.id, { onDelete: "cascade" }),
  shopId: text("shop_id").references(() => shopsTable.id, { onDelete: "cascade" }),
  visitorId: text("visitor_id"),
  userId: text("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  country: text("country"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PageView = typeof pageViewsTable.$inferSelect;
