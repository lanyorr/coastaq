import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

// Helper to create an order
async function createOrder(
  userId: string,
  items: Array<{ productId: string; quantity: number; price: number; title: string; shopId: string }>,
  shipping: { name: string; address: string; city: string; state: string; zip: string; country: string },
  paymentMethod: string,
  paymentId?: string,
) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [order] = await db.insert(ordersTable).values({
    userId,
    total: String(total.toFixed(2)),
    status: "PAID",
    shippingName: shipping.name,
    shippingAddress: shipping.address,
    shippingCity: shipping.city,
    shippingState: shipping.state,
    shippingZip: shipping.zip,
    shippingCountry: shipping.country,
    paymentMethod,
    paymentId: paymentId || null,
  }).returning();

  await db.insert(orderItemsTable).values(
    items.map(item => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: String(item.price.toFixed(2)),
    }))
  );

  return order;
}

// Stripe checkout (stub - returns placeholder when no API key)
router.post("/stripe", requireAuth, async (req, res) => {
  try {
    const stripeKey = process.env["STRIPE_SECRET_KEY"];
    if (!stripeKey) {
      res.status(503).json({ error: "Stripe is not configured yet. Please add your Stripe API key." });
      return;
    }
    // Stripe integration would go here
    res.json({ sessionId: "stripe_placeholder", url: "/checkout?method=stripe" });
  } catch (err) {
    req.log.error({ err }, "Stripe session error");
    res.status(500).json({ error: "Failed to create Stripe session" });
  }
});

// PayPal checkout (stub)
router.post("/paypal", requireAuth, async (req, res) => {
  try {
    const paypalId = process.env["PAYPAL_CLIENT_ID"];
    if (!paypalId) {
      res.status(503).json({ error: "PayPal is not configured yet. Please add your PayPal credentials." });
      return;
    }
    res.json({ orderId: "paypal_placeholder", approvalUrl: "/checkout?method=paypal" });
  } catch (err) {
    req.log.error({ err }, "PayPal order error");
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

// Capture PayPal order (stub)
router.post("/paypal/capture", requireAuth, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, orderId),
      with: { items: { with: { product: true } } },
    });
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({
      ...order,
      total: parseFloat(order.total),
      items: order.items.map((i) => ({ ...i, price: parseFloat(i.price) })),
    });
  } catch (err) {
    req.log.error({ err }, "Capture PayPal error");
    res.status(500).json({ error: "Failed to capture PayPal order" });
  }
});

// Manual/COD order creation for demo purposes
router.post("/manual", requireAuth, async (req, res) => {
  try {
    const { items, shipping } = req.body;
    if (!items || !shipping) {
      res.status(400).json({ error: "Items and shipping are required" });
      return;
    }

    const order = await createOrder(req.userId!, items, shipping, "MANUAL");
    const full = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, order.id),
      with: { items: { with: { product: true } } },
    });

    res.json({
      ...full!,
      total: parseFloat(full!.total),
      items: full!.items.map((i) => ({ ...i, price: parseFloat(i.price) })),
    });
  } catch (err) {
    req.log.error({ err }, "Manual checkout error");
    res.status(500).json({ error: "Failed to place order" });
  }
});

// Stripe webhook
router.post("/webhooks/stripe", async (req, res) => {
  res.json({ message: "Webhook received" });
});

export default router;
