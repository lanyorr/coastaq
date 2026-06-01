import { pgTable, text, timestamp, pgEnum, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";
import { usersTable } from "./users";
import { shopsTable } from "./shops";

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "label_created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "returned",
]);

export const shipmentsTable = pgTable("shipments", {
  id:                  text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId:             text("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  shopId:              text("shop_id").references(() => shopsTable.id, { onDelete: "cascade" }),
  carrier:             text("carrier").notNull(),
  trackingNumber:      text("tracking_number").notNull(),
  trackingUrl:         text("tracking_url"),
  status:              shipmentStatusEnum("status").notNull().default("label_created"),
  estimatedDelivery:   timestamp("estimated_delivery"),
  deliveredAt:         timestamp("delivered_at"),
  dispatchedAt:        timestamp("dispatched_at"),
  originAddress:       text("origin_address"),
  destinationAddress:  text("destination_address"),
  weight:              text("weight"),
  dimensions:          text("dimensions"),
  shippingCost:        text("shipping_cost").default("0"),
  method:              text("method").default("standard"),   // economy | standard | express
  labelUrl:            text("label_url"),
  notes:               text("notes"),
  createdBy:           text("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
  updatedAt:           timestamp("updated_at").notNull().defaultNow(),
});

export const insertShipmentSchema = createInsertSchema(shipmentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipmentsTable.$inferSelect;
