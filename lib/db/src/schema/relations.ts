import { relations } from "drizzle-orm";
import { usersTable } from "./users";
import { shopsTable } from "./shops";
import { productsTable } from "./products";
import { categoriesTable } from "./categories";
import { ordersTable, orderItemsTable } from "./orders";
import { escrowTransactionsTable } from "./escrow";
import { conversationsTable, messagesTable } from "./messages";
import { reportsTable } from "./reports";
import { adminActionsTable } from "./admin-actions";

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
  seller: one(usersTable, {
    fields: [ordersTable.sellerId],
    references: [usersTable.id],
    relationName: "sellerOrders",
  }),
  items: many(orderItemsTable),
  escrowTransactions: many(escrowTransactionsTable),
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

export const escrowTransactionsRelations = relations(escrowTransactionsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [escrowTransactionsTable.orderId],
    references: [ordersTable.id],
  }),
  buyer: one(usersTable, {
    fields: [escrowTransactionsTable.buyerId],
    references: [usersTable.id],
    relationName: "buyerEscrowTransactions",
  }),
  seller: one(usersTable, {
    fields: [escrowTransactionsTable.sellerId],
    references: [usersTable.id],
    relationName: "sellerEscrowTransactions",
  }),
}));

export const conversationsRelations = relations(conversationsTable, ({ one, many }) => ({
  buyer: one(usersTable, { fields: [conversationsTable.buyerId], references: [usersTable.id], relationName: "buyerConversations" }),
  seller: one(usersTable, { fields: [conversationsTable.sellerId], references: [usersTable.id], relationName: "sellerConversations" }),
  product: one(productsTable, { fields: [conversationsTable.productId], references: [productsTable.id] }),
  messages: many(messagesTable),
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  conversation: one(conversationsTable, { fields: [messagesTable.conversationId], references: [conversationsTable.id] }),
  sender: one(usersTable, { fields: [messagesTable.senderId], references: [usersTable.id] }),
}));

export const reportsRelations = relations(reportsTable, ({ one }) => ({
  reporter: one(usersTable, { fields: [reportsTable.reporterId], references: [usersTable.id] }),
}));

export const adminActionsRelations = relations(adminActionsTable, ({ one }) => ({
  admin: one(usersTable, { fields: [adminActionsTable.adminId], references: [usersTable.id] }),
}));
