import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, shopsTable, productsTable } from "@workspace/db";
import { eq, desc, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const orders = await db.query.ordersTable.findMany({
      where: eq(ordersTable.userId, req.userId!),
      orderBy: [desc(ordersTable.createdAt)],
      with: {
        items: {
          with: { product: true },
        },
      },
    });
    res.json(orders.map(o => ({
      ...o,
      total: parseFloat(o.total),
      items: o.items.map(i => ({ ...i, price: parseFloat(i.price) })),
    })));
  } catch (err) {
    req.log.error({ err }, "List orders error");
    res.status(500).json({ error: "Failed to list orders" });
  }
});

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
        order: {
          with: {
            items: { with: { product: true } },
          },
        },
      },
    });

    const orderMap = new Map();
    for (const item of orderItems) {
      if (!orderMap.has(item.orderId)) {
        orderMap.set(item.orderId, item.order);
      }
    }

    const orders = Array.from(orderMap.values());
    res.json(orders.map(o => ({
      ...o,
      total: parseFloat(o.total),
      items: o.items.map((i: typeof orderItemsTable.$inferSelect & { product: unknown }) => ({
        ...i,
        price: parseFloat(i.price as string),
      })),
    })));
  } catch (err) {
    req.log.error({ err }, "List seller orders error");
    res.status(500).json({ error: "Failed to list seller orders" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, req.params.id),
      with: {
        items: { with: { product: true } },
      },
    });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (order.userId !== req.userId && req.userRole !== "ADMIN") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json({
      ...order,
      total: parseFloat(order.total),
      items: order.items.map(i => ({ ...i, price: parseFloat(i.price) })),
    });
  } catch (err) {
    req.log.error({ err }, "Get order error");
    res.status(500).json({ error: "Failed to get order" });
  }
});

export default router;
