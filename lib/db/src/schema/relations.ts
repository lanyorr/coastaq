import { relations } from "drizzle-orm";
import { usersTable } from "./users";
import { shopsTable } from "./shops";
import { productsTable } from "./products";
import { categoriesTable } from "./categories";
import { ordersTable, orderItemsTable } from "./orders";

export const usersRelations = relations(usersTable, ({ one }) => ({
  shop: one(shopsTable, {
    fields: [usersTable.id],
    references: [shopsTable.userId],
  }),
}));

export const shopsRelations = relations(shopsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [shopsTable.userId],
    references: [usersTable.id],
  }),
  products: many(productsTable),
}));

export const categoriesRelations = relations(categoriesTable, ({ one, many }) => ({
  parent: one(categoriesTable, {
    fields: [categoriesTable.parentId],
    references: [categoriesTable.id],
    relationName: "subcategories",
  }),
  children: many(categoriesTable, { relationName: "subcategories" }),
  products: many(productsTable),
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  shop: one(shopsTable, {
    fields: [productsTable.shopId],
    references: [shopsTable.id],
  }),
  category: one(categoriesTable, {
    fields: [productsTable.categoryId],
    references: [categoriesTable.id],
  }),
  orderItems: many(orderItemsTable),
}));

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [ordersTable.userId],
    references: [usersTable.id],
  }),
  items: many(orderItemsTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.orderId],
    references: [ordersTable.id],
  }),
  product: one(productsTable, {
    fields: [orderItemsTable.productId],
    references: [productsTable.id],
  }),
}));
