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
import { inventoryLogsTable } from "./inventory";
import { shipmentsTable } from "./shipments";
import { pageViewsTable } from "./analytics";
import {
  affiliatesTable, affiliateLinksTable, affiliateClicksTable,
  affiliateCommissionsTable, affiliatePayoutsTable,
  affiliateCouponsTable, affiliateCampaignsTable, affiliateCampaignMembersTable,
  affiliateCampaignProductsTable, affiliateCampaignInvitationsTable,
} from "./affiliates";
import { userRolesTable } from "./user-roles";

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  shop: one(shopsTable, { fields: [usersTable.id], references: [shopsTable.userId] }),
  affiliate: one(affiliatesTable, { fields: [usersTable.id], references: [affiliatesTable.userId] }),
  pageViews: many(pageViewsTable),
  roles: many(userRolesTable),
}));

export const userRolesRelations = relations(userRolesTable, ({ one }) => ({
  user: one(usersTable, { fields: [userRolesTable.userId], references: [usersTable.id] }),
  grantedByUser: one(usersTable, { fields: [userRolesTable.grantedBy], references: [usersTable.id], relationName: "grantedRoles" }),
}));

export const shopsRelations = relations(shopsTable, ({ one, many }) => ({
  user: one(usersTable, { fields: [shopsTable.userId], references: [usersTable.id] }),
  products: many(productsTable),
  pageViews: many(pageViewsTable),
  campaigns: many(affiliateCampaignsTable),
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
  shop: one(shopsTable, { fields: [productsTable.shopId], references: [shopsTable.id] }),
  category: one(categoriesTable, { fields: [productsTable.categoryId], references: [categoriesTable.id] }),
  orderItems: many(orderItemsTable),
  inventoryLogs: many(inventoryLogsTable),
  pageViews: many(pageViewsTable),
  affiliateLinks: many(affiliateLinksTable),
}));

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  user: one(usersTable, { fields: [ordersTable.userId], references: [usersTable.id] }),
  seller: one(usersTable, { fields: [ordersTable.sellerId], references: [usersTable.id], relationName: "sellerOrders" }),
  items: many(orderItemsTable),
  escrowTransactions: many(escrowTransactionsTable),
  shipments: many(shipmentsTable),
  inventoryLogs: many(inventoryLogsTable),
  commissions: many(affiliateCommissionsTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, { fields: [orderItemsTable.orderId], references: [ordersTable.id] }),
  product: one(productsTable, { fields: [orderItemsTable.productId], references: [productsTable.id] }),
}));

export const escrowTransactionsRelations = relations(escrowTransactionsTable, ({ one }) => ({
  order: one(ordersTable, { fields: [escrowTransactionsTable.orderId], references: [ordersTable.id] }),
  buyer: one(usersTable, { fields: [escrowTransactionsTable.buyerId], references: [usersTable.id], relationName: "buyerEscrowTransactions" }),
  seller: one(usersTable, { fields: [escrowTransactionsTable.sellerId], references: [usersTable.id], relationName: "sellerEscrowTransactions" }),
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

export const inventoryLogsRelations = relations(inventoryLogsTable, ({ one }) => ({
  product: one(productsTable, { fields: [inventoryLogsTable.productId], references: [productsTable.id] }),
  order: one(ordersTable, { fields: [inventoryLogsTable.orderId], references: [ordersTable.id] }),
  createdByUser: one(usersTable, { fields: [inventoryLogsTable.createdBy], references: [usersTable.id] }),
}));

export const shipmentsRelations = relations(shipmentsTable, ({ one }) => ({
  order: one(ordersTable, { fields: [shipmentsTable.orderId], references: [ordersTable.id] }),
  createdByUser: one(usersTable, { fields: [shipmentsTable.createdBy], references: [usersTable.id] }),
}));

export const pageViewsRelations = relations(pageViewsTable, ({ one }) => ({
  product: one(productsTable, { fields: [pageViewsTable.productId], references: [productsTable.id] }),
  shop: one(shopsTable, { fields: [pageViewsTable.shopId], references: [shopsTable.id] }),
  user: one(usersTable, { fields: [pageViewsTable.userId], references: [usersTable.id] }),
}));

export const affiliatesRelations = relations(affiliatesTable, ({ one, many }) => ({
  user: one(usersTable, { fields: [affiliatesTable.userId], references: [usersTable.id] }),
  links: many(affiliateLinksTable),
  clicks: many(affiliateClicksTable),
  commissions: many(affiliateCommissionsTable),
  payouts: many(affiliatePayoutsTable),
  coupons: many(affiliateCouponsTable),
  campaignMemberships: many(affiliateCampaignMembersTable),
}));

export const affiliateLinksRelations = relations(affiliateLinksTable, ({ one, many }) => ({
  affiliate: one(affiliatesTable, { fields: [affiliateLinksTable.affiliateId], references: [affiliatesTable.id] }),
  product: one(productsTable, { fields: [affiliateLinksTable.productId], references: [productsTable.id] }),
  shop: one(shopsTable, { fields: [affiliateLinksTable.shopId], references: [shopsTable.id] }),
  commissions: many(affiliateCommissionsTable),
  clicks: many(affiliateClicksTable),
}));

export const affiliateClicksRelations = relations(affiliateClicksTable, ({ one }) => ({
  link: one(affiliateLinksTable, { fields: [affiliateClicksTable.linkId], references: [affiliateLinksTable.id] }),
  affiliate: one(affiliatesTable, { fields: [affiliateClicksTable.affiliateId], references: [affiliatesTable.id] }),
}));

export const affiliateCommissionsRelations = relations(affiliateCommissionsTable, ({ one }) => ({
  affiliate: one(affiliatesTable, { fields: [affiliateCommissionsTable.affiliateId], references: [affiliatesTable.id] }),
  order: one(ordersTable, { fields: [affiliateCommissionsTable.orderId], references: [ordersTable.id] }),
  link: one(affiliateLinksTable, { fields: [affiliateCommissionsTable.linkId], references: [affiliateLinksTable.id] }),
}));

export const affiliatePayoutsRelations = relations(affiliatePayoutsTable, ({ one }) => ({
  affiliate: one(affiliatesTable, { fields: [affiliatePayoutsTable.affiliateId], references: [affiliatesTable.id] }),
}));

export const affiliateCouponsRelations = relations(affiliateCouponsTable, ({ one }) => ({
  affiliate: one(affiliatesTable, { fields: [affiliateCouponsTable.affiliateId], references: [affiliatesTable.id] }),
}));

export const affiliateCampaignsRelations = relations(affiliateCampaignsTable, ({ one, many }) => ({
  shop: one(shopsTable, { fields: [affiliateCampaignsTable.shopId], references: [shopsTable.id] }),
  members: many(affiliateCampaignMembersTable),
  products: many(affiliateCampaignProductsTable),
  invitations: many(affiliateCampaignInvitationsTable),
}));

export const affiliateCampaignMembersRelations = relations(affiliateCampaignMembersTable, ({ one }) => ({
  campaign: one(affiliateCampaignsTable, { fields: [affiliateCampaignMembersTable.campaignId], references: [affiliateCampaignsTable.id] }),
  affiliate: one(affiliatesTable, { fields: [affiliateCampaignMembersTable.affiliateId], references: [affiliatesTable.id] }),
}));

export const affiliateCampaignProductsRelations = relations(affiliateCampaignProductsTable, ({ one }) => ({
  campaign: one(affiliateCampaignsTable, { fields: [affiliateCampaignProductsTable.campaignId], references: [affiliateCampaignsTable.id] }),
  product: one(productsTable, { fields: [affiliateCampaignProductsTable.productId], references: [productsTable.id] }),
}));

export const affiliateCampaignInvitationsRelations = relations(affiliateCampaignInvitationsTable, ({ one }) => ({
  campaign: one(affiliateCampaignsTable, { fields: [affiliateCampaignInvitationsTable.campaignId], references: [affiliateCampaignsTable.id] }),
  affiliate: one(affiliatesTable, { fields: [affiliateCampaignInvitationsTable.affiliateId], references: [affiliatesTable.id] }),
}));
