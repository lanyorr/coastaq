import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, escrowTransactionsTable, shopsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sum, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { releaseEscrow, refundEscrow } from "../lib/escrow-auto-release.js";

const router = Router();

// ── GET /api/escrow/seller/summary ────────────────────────────────────────────
// Returns a seller's escrow earnings summary
router.get("/seller/summary", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }

    const [escrowedResult, releasedResult, disputedResult] = await Promise.all([
      // Funds currently held in escrow (escrowed, awaiting confirmation)
      db.select({ total: sql<string>`coalesce(sum(escrow_amount), 0)` })
        .from(ordersTable)
        .where(and(eq(ordersTable.sellerId, req.userId!), eq(ordersTable.paymentStatus, "escrowed"))),

      // Released (paid out) seller amounts
      db.select({ total: sql<string>`coalesce(sum(seller_amount), 0)` })
        .from(ordersTable)
        .where(and(eq(ordersTable.sellerId, req.userId!), eq(ordersTable.paymentStatus, "released"))),

      // Disputed funds
      db.select({ count: sql<number>`count(*)` })
        .from(ordersTable)
        .where(and(eq(ordersTable.sellerId, req.userId!), eq(ordersTable.paymentStatus, "disputed"))),
    ]);

    const orderCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(and(eq(ordersTable.sellerId, req.userId!)));

    res.json({
      totalEscrowed: parseFloat(escrowedResult[0]?.total ?? "0"),
      totalReleased: parseFloat(releasedResult[0]?.total ?? "0"),
      disputedOrders: Number(disputedResult[0]?.count ?? 0),
      orderCount: Number(orderCountResult[0]?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Get seller escrow summary error");
    res.status(500).json({ error: "Failed to get escrow summary" });
  }
});

// ── GET /api/escrow/seller/orders ─────────────────────────────────────────────
// Returns a seller's orders that have escrow information
router.get("/seller/orders", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const orders = await db.query.ordersTable.findMany({
      where: eq(ordersTable.sellerId, req.userId!),
      orderBy: [desc(ordersTable.createdAt)],
      limit: 50,
      with: { items: { with: { product: true } } },
    });

    res.json(orders.map(o => ({
      ...o,
      total: parseFloat(o.total as string),
      escrowAmount: o.escrowAmount ? parseFloat(o.escrowAmount as string) : null,
      sellerAmount: o.sellerAmount ? parseFloat(o.sellerAmount as string) : null,
      platformFee: o.platformFee ? parseFloat(o.platformFee as string) : null,
    })));
  } catch (err) {
    req.log.error({ err }, "Get seller escrow orders error");
    res.status(500).json({ error: "Failed to get seller orders" });
  }
});

// ── GET /api/escrow/seller/transactions ───────────────────────────────────────
// Returns a seller's escrow transaction history
router.get("/seller/transactions", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const transactions = await db.query.escrowTransactionsTable.findMany({
      where: eq(escrowTransactionsTable.sellerId, req.userId!),
      orderBy: [desc(escrowTransactionsTable.createdAt)],
      limit: 50,
    });

    res.json(transactions.map(t => ({
      ...t,
      amount: parseFloat(t.amount as string),
    })));
  } catch (err) {
    req.log.error({ err }, "Get seller transactions error");
    res.status(500).json({ error: "Failed to get transactions" });
  }
});

// ── POST /api/escrow/:orderId/confirm-receipt ─────────────────────────────────
// Buyer confirms they received the item — releases funds to seller
router.post("/:orderId/confirm-receipt", requireAuth, async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, orderId),
    });

    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.userId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }

    if (!["escrowed", "disputed"].includes(order.paymentStatus)) {
      res.status(400).json({ error: `Cannot confirm receipt for order with payment status: ${order.paymentStatus}` });
      return;
    }

    // Mark as delivered if not already, then release escrow
    if (order.status !== "DELIVERED") {
      await db.update(ordersTable)
        .set({ status: "DELIVERED", deliveredAt: new Date(), updatedAt: new Date() })
        .where(eq(ordersTable.id, orderId));
    }

    const updated = await releaseEscrow(orderId, "Released by buyer — receipt confirmed");

    req.log.info({ orderId, userId: req.userId }, "Buyer confirmed receipt, escrow released");
    res.json({
      ...updated,
      total: parseFloat(updated.total as string),
      message: "Receipt confirmed. Funds have been released to the seller.",
    });
  } catch (err) {
    req.log.error({ err }, "Confirm receipt error");
    res.status(500).json({ error: "Failed to confirm receipt" });
  }
});

// ── POST /api/escrow/:orderId/dispute ─────────────────────────────────────────
// Buyer opens a dispute — holds funds until admin resolves
router.post("/:orderId/dispute", requireAuth, async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body as { reason: string };

  if (!reason || reason.trim().length < 10) {
    res.status(400).json({ error: "Please provide a clear dispute reason (at least 10 characters)" });
    return;
  }

  try {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, orderId),
    });

    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.userId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }

    if (!["escrowed"].includes(order.paymentStatus)) {
      res.status(400).json({ error: `Cannot open dispute for order with payment status: ${order.paymentStatus}` });
      return;
    }

    const [updated] = await db.update(ordersTable)
      .set({
        paymentStatus: "disputed",
        disputeReason: reason.trim(),
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, orderId))
      .returning();

    req.log.info({ orderId, userId: req.userId, reason }, "Buyer opened dispute");
    res.json({
      ...updated,
      total: parseFloat(updated.total as string),
      message: "Dispute opened. Our admin team will review and resolve within 48 hours.",
    });
  } catch (err) {
    req.log.error({ err }, "Open dispute error");
    res.status(500).json({ error: "Failed to open dispute" });
  }
});

// ── Admin: GET /api/escrow/admin/orders ───────────────────────────────────────
// List all escrow orders (for admin management)
router.get("/admin/orders", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { status = "" } = req.query as { status?: string };

    const conditions = status
      ? [eq(ordersTable.paymentStatus, status as any)]
      : [];

    const orders = await db.query.ordersTable.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(ordersTable.createdAt)],
      limit: 100,
      with: { items: { with: { product: true } } },
    });

    // Attach buyer and seller names
    const userIds = [...new Set([
      ...orders.map(o => o.userId),
      ...orders.filter(o => o.sellerId).map(o => o.sellerId!),
    ])];
    const users = userIds.length > 0
      ? await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
          .from(usersTable)
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    res.json(orders.map(o => ({
      ...o,
      total: parseFloat(o.total as string),
      escrowAmount: o.escrowAmount ? parseFloat(o.escrowAmount as string) : null,
      sellerAmount: o.sellerAmount ? parseFloat(o.sellerAmount as string) : null,
      platformFee: o.platformFee ? parseFloat(o.platformFee as string) : null,
      items: o.items.map((i: any) => ({ ...i, price: parseFloat(i.price) })),
      buyer: userMap.get(o.userId) ?? null,
      seller: o.sellerId ? userMap.get(o.sellerId) ?? null : null,
    })));
  } catch (err) {
    req.log.error({ err }, "List escrow orders error");
    res.status(500).json({ error: "Failed to list escrow orders" });
  }
});

// ── Admin: GET /api/escrow/admin/stats ────────────────────────────────────────
// Returns platform-wide escrow statistics
router.get("/admin/stats", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const [escrowed, released, disputed, refunded, commissions] = await Promise.all([
      db.select({ total: sql<string>`coalesce(sum(escrow_amount), 0)`, count: sql<number>`count(*)` })
        .from(ordersTable).where(eq(ordersTable.paymentStatus, "escrowed")),
      db.select({ total: sql<string>`coalesce(sum(seller_amount), 0)`, count: sql<number>`count(*)` })
        .from(ordersTable).where(eq(ordersTable.paymentStatus, "released")),
      db.select({ count: sql<number>`count(*)` })
        .from(ordersTable).where(eq(ordersTable.paymentStatus, "disputed")),
      db.select({ count: sql<number>`count(*)` })
        .from(ordersTable).where(eq(ordersTable.paymentStatus, "refunded")),
      db.select({ total: sql<string>`coalesce(sum(platform_fee), 0)` })
        .from(ordersTable).where(eq(ordersTable.paymentStatus, "released")),
    ]);

    res.json({
      escrowedFunds: parseFloat(escrowed[0]?.total ?? "0"),
      escrowedCount: Number(escrowed[0]?.count ?? 0),
      releasedFunds: parseFloat(released[0]?.total ?? "0"),
      releasedCount: Number(released[0]?.count ?? 0),
      disputedCount: Number(disputed[0]?.count ?? 0),
      refundedCount: Number(refunded[0]?.count ?? 0),
      commissionsEarned: parseFloat(commissions[0]?.total ?? "0"),
    });
  } catch (err) {
    req.log.error({ err }, "Escrow stats error");
    res.status(500).json({ error: "Failed to get escrow stats" });
  }
});

// ── Admin: POST /api/escrow/admin/:orderId/release ────────────────────────────
// Admin manually releases escrow funds to seller
router.post("/admin/:orderId/release", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { orderId } = req.params;
  const { note } = req.body as { note?: string };

  try {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, orderId),
    });
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (!["escrowed", "disputed"].includes(order.paymentStatus)) {
      res.status(400).json({ error: "Order is not in a releasable state" });
      return;
    }

    const updated = await releaseEscrow(orderId, note ?? "Admin manual release");
    req.log.info({ orderId, adminId: req.userId }, "Admin released escrow");
    res.json({ ...updated, total: parseFloat(updated.total as string), message: "Escrow released to seller." });
  } catch (err) {
    req.log.error({ err }, "Admin release error");
    res.status(500).json({ error: "Failed to release escrow" });
  }
});

// ── Admin: POST /api/escrow/admin/:orderId/refund ─────────────────────────────
// Admin refunds escrow funds to buyer
router.post("/admin/:orderId/refund", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { orderId } = req.params;
  const { note } = req.body as { note?: string };

  try {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, orderId),
    });
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (!["escrowed", "disputed"].includes(order.paymentStatus)) {
      res.status(400).json({ error: "Order is not in a refundable state" });
      return;
    }

    const updated = await refundEscrow(orderId, note ?? "Admin manual refund");
    req.log.info({ orderId, adminId: req.userId }, "Admin refunded escrow");
    res.json({ ...updated, total: parseFloat(updated.total as string), message: "Order refunded to buyer." });
  } catch (err) {
    req.log.error({ err }, "Admin refund error");
    res.status(500).json({ error: "Failed to refund escrow" });
  }
});

export default router;
