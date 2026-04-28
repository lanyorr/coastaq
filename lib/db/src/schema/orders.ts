import { pgTable, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { productsTable } from "./products";

export const orderStatusEnum = pgEnum("order_status", ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]);

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id),
  // sellerId is populated when escrow is created (from product's shop owner)
  sellerId: text("seller_id").references(() => usersTable.id),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),

  // ── Escrow fields ───────────────────────────────────────────────────────────
  // pending = not yet paid; escrowed = funds held; released = paid to seller; refunded = returned to buyer; disputed = under review
  paymentStatus: text("payment_status").notNull().default("pending")
    .$type<"pending" | "escrowed" | "released" | "refunded" | "disputed">(),
  escrowAmount: numeric("escrow_amount", { precision: 12, scale: 2 }),
  sellerAmount: numeric("seller_amount", { precision: 12, scale: 2 }),
  platformFee: numeric("platform_fee", { precision: 12, scale: 2 }),
  escrowStartedAt: timestamp("escrow_started_at"),
  deliveredAt: timestamp("delivered_at"),
  releasedAt: timestamp("released_at"),
  disputeReason: text("dispute_reason"),

  trackingNumber: text("tracking_number"),
  courierName: text("courier_name"),
  shippingName: text("shipping_name"),
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingZip: text("shipping_zip"),
  shippingCountry: text("shipping_country"),
  paymentMethod: text("payment_method"),
  paymentId: text("payment_id"),
  buyerNote: text("buyer_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => productsTable.id),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
