import { Router } from "express";
import { db } from "@workspace/db";
import {
  pageViewsTable, productsTable, shopsTable,
  ordersTable, orderItemsTable, usersTable,
} from "@workspace/db";
import { eq, and, gte, sql, desc, count } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

// POST /api/analytics/track — record a page view (public, fire-and-forget)
router.post("/track", async (req, res) => {
  try {
    const { event, productId, shopId, visitorId, referrer } = req.body;
    const validEvents = ["product_view", "shop_view", "search"];
    if (!validEvents.includes(event)) {
      res.status(400).json({ error: "Invalid event type" }); return;
    }

    const authHeader = req.headers.authorization;
    let userId: string | undefined;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { verifyToken } = await import("../lib/auth.js");
        const payload = verifyToken(authHeader.slice(7));
        userId = payload.userId;
      } catch { /* anonymous view */ }
    }

    await db.insert(pageViewsTable).values({
      event,
      productId: productId || null,
      shopId: shopId || null,
      visitorId: visitorId || null,
      userId: userId || null,
      referrer: referrer || null,
      userAgent: req.headers["user-agent"] || null,
    });

    res.json({ ok: true });
  } catch (err) {
    res.json({ ok: true });
  }
});

// GET /api/analytics/seller — seller's own shop analytics
router.get("/seller", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }

    const shopId = shop.id;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [totalViews, productViews, recentOrders, topProducts] = await Promise.all([
      db
        .select({ count: count() })
        .from(pageViewsTable)
        .where(and(eq(pageViewsTable.shopId, shopId), gte(pageViewsTable.createdAt, since))),

      db
        .select({ count: count(), productId: pageViewsTable.productId })
        .from(pageViewsTable)
        .where(and(eq(pageViewsTable.shopId, shopId), eq(pageViewsTable.event, "product_view"), gte(pageViewsTable.createdAt, since)))
        .groupBy(pageViewsTable.productId)
        .orderBy(desc(count()))
        .limit(10),

      db
        .select()
        .from(ordersTable)
        .where(and(eq(ordersTable.sellerId, req.userId!), gte(ordersTable.createdAt, since)))
        .orderBy(desc(ordersTable.createdAt))
        .limit(20),

      db
        .select({
          productId: orderItemsTable.productId,
          totalSold: sql<number>`sum(${orderItemsTable.quantity})`,
          totalRevenue: sql<number>`sum(${orderItemsTable.quantity} * cast(${orderItemsTable.price} as numeric))`,
        })
        .from(orderItemsTable)
        .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
        .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
        .where(and(eq(productsTable.shopId, shopId), gte(ordersTable.createdAt, since)))
        .groupBy(orderItemsTable.productId)
        .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
        .limit(10),
    ]);

    const totalRevenue = recentOrders.reduce((sum, o) => sum + parseFloat(String(o.total)), 0);
    const orderCount = recentOrders.length;

    res.json({
      period: "last_30_days",
      shopViews: Number(totalViews[0]?.count ?? 0),
      topProductViews: productViews,
      orderCount,
      totalRevenue: totalRevenue.toFixed(2),
      topProducts,
    });
  } catch (err) {
    req.log.error({ err }, "Seller analytics error");
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// GET /api/analytics/product/:productId — views for a specific product (seller/admin)
router.get("/product/:productId", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const product = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, req.params.productId),
      with: { shop: true },
    });
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    if (req.userRole !== "ADMIN" && product.shop?.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const views = await db
      .select({ count: count() })
      .from(pageViewsTable)
      .where(and(eq(pageViewsTable.productId, req.params.productId), gte(pageViewsTable.createdAt, since)));

    const daily = await db
      .select({
        date: sql<string>`date_trunc('day', ${pageViewsTable.createdAt})::date`,
        count: count(),
      })
      .from(pageViewsTable)
      .where(and(eq(pageViewsTable.productId, req.params.productId), gte(pageViewsTable.createdAt, since)))
      .groupBy(sql`date_trunc('day', ${pageViewsTable.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${pageViewsTable.createdAt})::date`);

    res.json({
      productId: req.params.productId,
      totalViews: Number(views[0]?.count ?? 0),
      dailyViews: daily,
      period: "last_30_days",
    });
  } catch (err) {
    req.log.error({ err }, "Product analytics error");
    res.status(500).json({ error: "Failed to get product analytics" });
  }
});

export default router;
