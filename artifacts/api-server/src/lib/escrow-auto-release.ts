import { db } from "@workspace/db";
import { ordersTable, escrowTransactionsTable } from "@workspace/db";
import { eq, and, lte, isNull, isNotNull } from "drizzle-orm";
import { logger } from "./logger.js";

// Configurable marketplace commission rate (5%)
export const PLATFORM_FEE_RATE = 0.05;

// Auto-release window: 7 days after delivery with no dispute or confirmation
const AUTO_RELEASE_DAYS = 7;

/**
 * Computes escrow split amounts for a given order total.
 */
export function computeEscrowAmounts(total: number) {
  const platformFee = parseFloat((total * PLATFORM_FEE_RATE).toFixed(2));
  const sellerAmount = parseFloat((total - platformFee).toFixed(2));
  return { escrowAmount: total, sellerAmount, platformFee };
}

/**
 * Releases escrow funds for a single order.
 * Creates transaction records for the seller release and the platform fee.
 * Idempotent — skips if already released.
 */
export async function releaseEscrow(orderId: string, note: string = "Released to seller") {
  const order = await db.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
  });

  if (!order) throw new Error(`Order ${orderId} not found`);
  if (order.paymentStatus === "released") {
    logger.info({ orderId }, "Escrow already released — skipping");
    return order;
  }
  if (!order.sellerId) throw new Error(`Order ${orderId} has no sellerId`);

  const escrowAmount = parseFloat(order.escrowAmount as string || order.total as string);
  const platformFee = parseFloat((escrowAmount * PLATFORM_FEE_RATE).toFixed(2));
  const sellerAmount = parseFloat((escrowAmount - platformFee).toFixed(2));

  // Update order to released state
  const [updated] = await db.update(ordersTable)
    .set({
      paymentStatus: "released",
      sellerAmount: String(sellerAmount),
      platformFee: String(platformFee),
      releasedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, orderId))
    .returning();

  // Record seller payout transaction
  await db.insert(escrowTransactionsTable).values({
    orderId,
    buyerId: order.userId,
    sellerId: order.sellerId,
    type: "release",
    amount: String(sellerAmount),
    status: "completed",
    note,
  });

  // Record platform fee transaction
  await db.insert(escrowTransactionsTable).values({
    orderId,
    buyerId: order.userId,
    sellerId: order.sellerId,
    type: "fee",
    amount: String(platformFee),
    status: "completed",
    note: "5% platform commission",
  });

  logger.info({ orderId, sellerAmount, platformFee }, "Escrow released to seller");
  return updated;
}

/**
 * Refunds escrow funds to the buyer.
 */
export async function refundEscrow(orderId: string, note: string = "Refunded to buyer") {
  const order = await db.query.ordersTable.findFirst({
    where: eq(ordersTable.id, orderId),
  });

  if (!order) throw new Error(`Order ${orderId} not found`);
  if (order.paymentStatus === "refunded") {
    logger.info({ orderId }, "Escrow already refunded — skipping");
    return order;
  }
  if (!order.sellerId) throw new Error(`Order ${orderId} has no sellerId`);

  const escrowAmount = parseFloat(order.escrowAmount as string || order.total as string);

  const [updated] = await db.update(ordersTable)
    .set({
      paymentStatus: "refunded",
      releasedAt: new Date(),
      status: "CANCELLED",
      updatedAt: new Date(),
    })
    .where(eq(ordersTable.id, orderId))
    .returning();

  await db.insert(escrowTransactionsTable).values({
    orderId,
    buyerId: order.userId,
    sellerId: order.sellerId,
    type: "refund",
    amount: String(escrowAmount),
    status: "completed",
    note,
  });

  logger.info({ orderId, escrowAmount }, "Escrow refunded to buyer");
  return updated;
}

/**
 * Scans for orders eligible for auto-release:
 * - paymentStatus = "escrowed"
 * - status = "DELIVERED"
 * - deliveredAt is older than AUTO_RELEASE_DAYS
 * Runs on server startup and every hour.
 */
export async function runAutoRelease() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - AUTO_RELEASE_DAYS);

  try {
    const eligible = await db.select({ id: ordersTable.id })
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.paymentStatus, "escrowed"),
          eq(ordersTable.status, "DELIVERED"),
          isNotNull(ordersTable.deliveredAt),
          lte(ordersTable.deliveredAt, cutoff),
          isNull(ordersTable.disputeReason),
        )
      );

    if (eligible.length === 0) return;

    logger.info({ count: eligible.length }, "Auto-releasing eligible escrow orders");

    for (const row of eligible) {
      try {
        await releaseEscrow(row.id, "Auto-released: buyer did not confirm within 7 days");
      } catch (err) {
        logger.error({ err, orderId: row.id }, "Auto-release failed for order");
      }
    }
  } catch (err) {
    logger.error({ err }, "Auto-release scan failed");
  }
}

/**
 * Schedules auto-release to run every hour.
 */
export function startAutoReleaseScheduler() {
  // Run once on startup
  runAutoRelease();
  // Then every hour
  setInterval(runAutoRelease, 60 * 60 * 1000);
  logger.info("Escrow auto-release scheduler started (runs every hour)");
}
