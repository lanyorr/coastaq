import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { ordersTable } from "./orders";

// Escrow transaction log — every deposit, release, refund or platform fee is recorded here
export const escrowTransactionsTable = pgTable("escrow_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  buyerId: text("buyer_id").notNull().references(() => usersTable.id),
  sellerId: text("seller_id").notNull().references(() => usersTable.id),
  // deposit = buyer paid into escrow; release = seller paid out; refund = buyer refunded; fee = platform commission
  type: text("type").notNull().$type<"deposit" | "release" | "refund" | "fee">(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("completed").$type<"completed" | "pending" | "failed">(),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type EscrowTransaction = typeof escrowTransactionsTable.$inferSelect;
