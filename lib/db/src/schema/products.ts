import { pgTable, text, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { shopsTable } from "./shops";
import { categoriesTable } from "./categories";

export const conditionEnum = pgEnum("condition", ["NEW", "USED", "REFURBISHED"]);
export const productStatusEnum = pgEnum("product_status", ["ACTIVE", "FLAGGED", "SUSPENDED"]);

export const productsTable = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  condition: conditionEnum("condition").notNull().default("NEW"),
  location: text("location"),
  images: text("images").array().notNull().default([]),
  categoryId: text("category_id").references(() => categoriesTable.id),
  shopId: text("shop_id").notNull().references(() => shopsTable.id, { onDelete: "cascade" }),
  status: productStatusEnum("status").notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
