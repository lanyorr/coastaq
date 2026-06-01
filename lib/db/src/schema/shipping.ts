import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { shipmentsTable } from "./shipments";
import { usersTable } from "./users";
import { shopsTable } from "./shops";

/* ─── Couriers ─────────────────────────────────────────────────────────────── */
export const couriersTable = pgTable("couriers", {
  id:                  text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:                text("name").notNull(),
  code:                text("code").notNull(),              // DHL | FEDEX | UPS | LOCAL
  trackingUrlTemplate: text("tracking_url_template"),      // {tracking} placeholder
  logoUrl:             text("logo_url"),
  type:                text("type").notNull().default("manual"),  // manual | api
  settings:            text("settings"),                   // JSON for future API configs
  isActive:            boolean("is_active").notNull().default(true),
  createdAt:           timestamp("created_at").notNull().defaultNow(),
});

/* ─── Shipment Events (tracking timeline) ──────────────────────────────────── */
export const shipmentEventsTable = pgTable("shipment_events", {
  id:         text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shipmentId: text("shipment_id").notNull().references(() => shipmentsTable.id, { onDelete: "cascade" }),
  status:     text("status").notNull(),
  description:text("description").notNull(),
  location:   text("location"),
  createdBy:  text("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
});

/* ─── Shipping Rates ────────────────────────────────────────────────────────── */
export const shippingRatesTable = pgTable("shipping_rates", {
  id:                      text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shopId:                  text("shop_id").notNull().references(() => shopsTable.id, { onDelete: "cascade" }),
  name:                    text("name").notNull(),
  courierId:               text("courier_id").references(() => couriersTable.id, { onDelete: "set null" }),
  rateType:                text("rate_type").notNull().default("flat"),  // flat | weight | per_item
  baseRate:                text("base_rate").notNull().default("0"),
  perKgRate:               text("per_kg_rate"),
  freeShippingThreshold:   text("free_shipping_threshold"),
  countries:               text("countries"),                // JSON array of country codes, null = all
  estimatedDaysMin:        integer("estimated_days_min").default(3),
  estimatedDaysMax:        integer("estimated_days_max").default(7),
  isActive:                boolean("is_active").notNull().default(true),
  createdAt:               timestamp("created_at").notNull().defaultNow(),
  updatedAt:               timestamp("updated_at").notNull().defaultNow(),
});

/* ─── Delivery Issues ──────────────────────────────────────────────────────── */
export const deliveryIssuesTable = pgTable("delivery_issues", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shipmentId:  text("shipment_id").notNull().references(() => shipmentsTable.id, { onDelete: "cascade" }),
  issueType:   text("issue_type").notNull(),    // failed_delivery | returned | address_problem | damaged | lost
  description: text("description").notNull(),
  status:      text("status").notNull().default("open"),  // open | in_review | resolved | escalated
  resolution:  text("resolution"),
  reportedBy:  text("reported_by").references(() => usersTable.id, { onDelete: "set null" }),
  resolvedBy:  text("resolved_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
  resolvedAt:  timestamp("resolved_at"),
});
