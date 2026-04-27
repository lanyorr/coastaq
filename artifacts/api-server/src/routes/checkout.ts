import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, shopsTable, usersTable, escrowTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { computeEscrowAmounts } from "../lib/escrow-auto-release.js";

const router = Router();

// ── PayPal helpers ─────────────────────────────────────────────────────────────

function getPaypalBaseUrl() {
  const mode = process.env["PAYPAL_MODE"] ?? "live";
  return mode === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function getPaypalAccessToken(): Promise<string> {
  const clientId = process.env["PAYPAL_CLIENT_ID"];
  const secret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!clientId || !secret) throw new Error("PayPal credentials not configured");
  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

function getBaseUrl(): string {
  const domain = process.env["REPLIT_DEV_DOMAIN"] || process.env["REPLIT_DOMAINS"]?.split(",")[0];
  return domain ? `https://${domain}` : "https://coastaq.replit.app";
}

// ── DB order helper (with escrow) ──────────────────────────────────────────────

async function createDbOrderWithEscrow(
  userId: string,
  items: Array<{ productId: string; quantity: number; price: number; title: string; shopId: string }>,
  shipping: { name: string; address: string; city: string; state: string; zip: string; country: string },
  paymentMethod: string,
  paymentId?: string,
) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { escrowAmount, sellerAmount, platformFee } = computeEscrowAmounts(total);

  // Resolve the seller (shop owner) from first item's shop
  let sellerId: string | null = null;
  if (items.length > 0) {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.id, items[0].shopId),
    });
    if (shop) {
      sellerId = shop.userId;
    }
  }

  const [order] = await db.insert(ordersTable).values({
    userId,
    sellerId,
    total: String(total.toFixed(2)),
    status: "CONFIRMED",
    // Escrow fields — funds are held on payment capture
    paymentStatus: "escrowed",
    escrowAmount: String(escrowAmount.toFixed(2)),
    sellerAmount: String(sellerAmount.toFixed(2)),
    platformFee: String(platformFee.toFixed(2)),
    escrowStartedAt: new Date(),
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

  // Record the escrow deposit transaction for audit trail
  if (sellerId) {
    await db.insert(escrowTransactionsTable).values({
      orderId: order.id,
      buyerId: userId,
      sellerId,
      type: "deposit",
      amount: String(escrowAmount.toFixed(2)),
      status: "completed",
      note: `Payment captured via ${paymentMethod} — funds held in escrow`,
    });
  }

  return order;
}

// ── POST /api/checkout/paypal ───────────────────────────────────────────────────
// Body: { productId, quantity? }
// Returns: { paypalOrderId, approvalUrl }
router.post("/paypal", requireAuth, async (req, res) => {
  try {
    const paypalId = process.env["PAYPAL_CLIENT_ID"];
    if (!paypalId) {
      res.status(503).json({ error: "PayPal is not configured. Please add your PayPal credentials." });
      return;
    }

    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      res.status(400).json({ error: "productId is required" });
      return;
    }

    const product = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, String(productId)),
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const amount = (parseFloat(String(product.price)) * Number(quantity)).toFixed(2);
    const accessToken = await getPaypalAccessToken();
    const baseUrl = getBaseUrl();

    const response = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `checkout-${Date.now()}-${req.userId}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: amount },
          description: product.title.slice(0, 127),
          reference_id: `${productId}-${req.userId}`,
        }],
        application_context: {
          return_url: `${baseUrl}/api/checkout/paypal/callback?status=success`,
          cancel_url: `${baseUrl}/api/checkout/paypal/callback?status=cancel`,
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          brand_name: "Coastaq",
        },
      }),
    });

    const orderData = await response.json() as any;
    if (!response.ok) {
      req.log.error({ orderData }, "PayPal order creation failed");
      res.status(502).json({ error: "Failed to create PayPal order" });
      return;
    }

    const approvalLink = orderData.links?.find((l: any) => l.rel === "approve");
    res.json({
      paypalOrderId: orderData.id,
      approvalUrl: approvalLink?.href,
    });
  } catch (err) {
    req.log.error({ err }, "PayPal order error");
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
});

// ── GET /api/checkout/paypal/callback ──────────────────────────────────────────
// PayPal redirects here after user approves/cancels payment
router.get("/paypal/callback", (req, res) => {
  const { status, token } = req.query;
  const scheme = "coastaq-mobile";
  if (status === "success" && token) {
    res.redirect(`${scheme}://paypal-success?token=${token}`);
  } else {
    res.redirect(`${scheme}://paypal-cancel`);
  }
});

// ── POST /api/checkout/paypal/capture ──────────────────────────────────────────
// Body: { paypalOrderId, productId, quantity?, shipping? }
router.post("/paypal/capture", requireAuth, async (req, res) => {
  try {
    const { paypalOrderId, productId, quantity = 1, shipping } = req.body;
    if (!paypalOrderId || !productId) {
      res.status(400).json({ error: "paypalOrderId and productId are required" });
      return;
    }

    const accessToken = await getPaypalAccessToken();
    const captureRes = await fetch(
      `${getPaypalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await captureRes.json() as any;
    if (!captureRes.ok || captureData.status !== "COMPLETED") {
      req.log.error({ captureData }, "PayPal capture failed");
      res.status(502).json({ error: "Payment capture failed. Please try again." });
      return;
    }

    const product = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, String(productId)),
      with: { shop: true },
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const defaultShipping = {
      name: "Coastaq Customer",
      address: "Online Purchase",
      city: "N/A",
      state: "N/A",
      zip: "N/A",
      country: "NG",
    };

    const order = await createDbOrderWithEscrow(
      req.userId!,
      [{
        productId: product.id,
        quantity: Number(quantity),
        price: parseFloat(String(product.price)),
        title: product.title,
        shopId: product.shopId,
      }],
      shipping || defaultShipping,
      "PAYPAL",
      paypalOrderId,
    );

    const capturedAmount = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value;
    req.log.info({ userId: req.userId, orderId: order.id, paypalOrderId }, "Product order captured via PayPal — funds in escrow");

    res.json({
      success: true,
      orderId: order.id,
      amount: capturedAmount,
      paymentStatus: "escrowed",
      message: "Payment captured. Funds are held in escrow until you confirm receipt.",
    });
  } catch (err) {
    req.log.error({ err }, "Capture PayPal error");
    res.status(500).json({ error: "Failed to capture payment" });
  }
});

// ── POST /api/checkout/manual ──────────────────────────────────────────────────
router.post("/manual", requireAuth, async (req, res) => {
  try {
    const { items, shipping } = req.body;
    if (!items || !shipping) {
      res.status(400).json({ error: "Items and shipping are required" });
      return;
    }
    const order = await createDbOrderWithEscrow(req.userId!, items, shipping, "MANUAL");
    const full = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, order.id),
      with: { items: { with: { product: true } } },
    });
    res.json({
      ...full!,
      total: parseFloat(full!.total as string),
      items: full!.items.map((i) => ({ ...i, price: parseFloat(i.price as string) })),
    });
  } catch (err) {
    req.log.error({ err }, "Manual checkout error");
    res.status(500).json({ error: "Failed to place order" });
  }
});

router.post("/webhooks/stripe", async (req, res) => {
  res.json({ message: "Webhook received" });
});

export default router;
