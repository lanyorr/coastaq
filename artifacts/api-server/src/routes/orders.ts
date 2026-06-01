import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, shopsTable, productsTable, usersTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

// ── Buyer: place a simple order request ─────────────────────────────────────
router.post("/request", requireAuth, async (req, res) => {
  const { productId, quantity = 1, buyerNote = "" } = req.body;
  if (!productId) {
    res.status(400).json({ error: "productId is required" });
    return;
  }
  try {
    const product = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, productId),
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const total = (parseFloat(product.price as string) * quantity).toFixed(2);
    const [order] = await db.insert(ordersTable).values({
      userId: req.userId!,
      status: "PENDING",
      total,
      buyerNote: buyerNote || null,
    }).returning();
    await db.insert(orderItemsTable).values({
      orderId: order.id,
      productId: product.id,
      quantity,
      price: product.price as string,
    });
    res.status(201).json({ ...order, total: parseFloat(order.total) });
  } catch (err) {
    req.log.error({ err }, "Place order request error");
    res.status(500).json({ error: "Failed to place order" });
  }
});

// ── Seller: list all orders for their products ───────────────────────────────
router.get("/seller", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }

    const shopProducts = await db.select({ id: productsTable.id })
      .from(productsTable).where(eq(productsTable.shopId, shop.id));
    const productIds = shopProducts.map(p => p.id);

    if (productIds.length === 0) {
      res.json([]);
      return;
    }

    const orderItems = await db.query.orderItemsTable.findMany({
      where: inArray(orderItemsTable.productId, productIds),
      with: {
        product: true,
        order: {
          with: {
            items: { with: { product: true } },
          },
        },
      },
      orderBy: [desc(orderItemsTable.createdAt)],
    });

    // Fetch buyer info for each order
    const orderMap = new Map<string, any>();
    for (const item of orderItems) {
      if (!orderMap.has(item.orderId)) {
        orderMap.set(item.orderId, {
          ...item.order,
          total: parseFloat(item.order.total as string),
          items: item.order.items.map((i: any) => ({ ...i, price: parseFloat(i.price) })),
        });
      }
    }

    // Attach buyer names
    const orders = Array.from(orderMap.values());
    const buyerIds = [...new Set(orders.map((o: any) => o.userId))];
    const buyers = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
      .from(usersTable).where(inArray(usersTable.id, buyerIds));
    const buyerMap = new Map(buyers.map(b => [b.id, b]));

    res.json(orders.map(o => ({
      ...o,
      buyer: buyerMap.get(o.userId) ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "List seller orders error");
    res.status(500).json({ error: "Failed to list seller orders" });
  }
});

// ── Seller: update tracking info ──────────────────────────────────────────────
router.patch("/:id/tracking", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const { trackingNumber, courierName } = req.body;
  if (!trackingNumber) {
    res.status(400).json({ error: "trackingNumber is required" });
    return;
  }
  try {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, req.params.id as string),
      with: { items: { with: { product: { with: { shop: true } } } } },
    });
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    const shop = await db.query.shopsTable.findFirst({ where: eq(shopsTable.userId, req.userId!) });
    const ownsProduct = (order.items as any[]).some((i: any) => i.product?.shopId === shop?.id);
    if (!ownsProduct && req.userRole !== "ADMIN") {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    const [updated] = await db.update(ordersTable)
      .set({ trackingNumber, courierName: courierName || null, updatedAt: new Date() })
      .where(eq(ordersTable.id, req.params.id as string))
      .returning();
    res.json({ ...updated, total: parseFloat(updated.total) });
  } catch (err) {
    req.log.error({ err }, "Update tracking error");
    res.status(500).json({ error: "Failed to update tracking" });
  }
});

// ── Seller: update order status ───────────────────────────────────────────────
router.patch("/:id/status", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const { status } = req.body;
  const allowed = ["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  try {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, req.params.id as string),
      with: { items: { with: { product: { with: { shop: true } } } } },
    });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    // Verify the order belongs to this seller's products
    const shop = await db.query.shopsTable.findFirst({ where: eq(shopsTable.userId, req.userId!) });
    const ownsProduct = (order.items as any[]).some((i: any) => i.product?.shopId === shop?.id);
    if (!ownsProduct && req.userRole !== "ADMIN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const setFields: Record<string, any> = { status, updatedAt: new Date() };
    // Track delivery timestamp for escrow auto-release countdown
    if (status === "DELIVERED") {
      setFields.deliveredAt = new Date();
    }
    const [updated] = await db.update(ordersTable)
      .set(setFields)
      .where(eq(ordersTable.id, req.params.id as string))
      .returning();
    res.json({ ...updated, total: parseFloat(updated.total) });
  } catch (err) {
    req.log.error({ err }, "Update order status error");
    res.status(500).json({ error: "Failed to update order" });
  }
});

// ── Buyer: list own orders ────────────────────────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const orders = await db.query.ordersTable.findMany({
      where: eq(ordersTable.userId, req.userId!),
      orderBy: [desc(ordersTable.createdAt)],
      with: {
        items: { with: { product: true } },
      },
    });
    res.json(orders.map(o => ({
      ...o,
      total: parseFloat(o.total),
      items: o.items.map(i => ({ ...i, price: parseFloat(i.price as string) })),
    })));
  } catch (err) {
    req.log.error({ err }, "List orders error");
    res.status(500).json({ error: "Failed to list orders" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, req.params.id as string),
      with: { items: { with: { product: true } } },
    });
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (order.userId !== req.userId && req.userRole !== "ADMIN") {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    res.json({
      ...order,
      total: parseFloat(order.total),
      items: order.items.map(i => ({ ...i, price: parseFloat(i.price as string) })),
    });
  } catch (err) {
    req.log.error({ err }, "Get order error");
    res.status(500).json({ error: "Failed to get order" });
  }
});

export default router;
