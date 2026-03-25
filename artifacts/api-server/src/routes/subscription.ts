import { Router } from "express";
import { db } from "@workspace/db";
import { shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

const PLAN_PRICE_USD = "20.00";
const PLAN_DAYS = 30;

// ── PayPal helpers ────────────────────────────────────────────────────────────

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

// ── Subscription info helper ──────────────────────────────────────────────────

function getSubscriptionInfo(shop: typeof shopsTable.$inferSelect) {
  const now = new Date();

  if (shop.subscriptionStatus === "TRIAL") {
    const trialEnd = shop.trialEndsAt ? new Date(shop.trialEndsAt) : null;
    const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)) : 0;
    const isTrialActive = trialEnd ? now < trialEnd : false;
    return {
      status: isTrialActive ? "TRIAL" : "EXPIRED",
      isActive: isTrialActive,
      trialEndsAt: trialEnd?.toISOString() ?? null,
      trialDaysLeft: daysLeft,
      subscriptionCurrentPeriodEnd: null,
      planPrice: 20,
    };
  }

  if (shop.subscriptionStatus === "ACTIVE") {
    const periodEnd = shop.subscriptionCurrentPeriodEnd ? new Date(shop.subscriptionCurrentPeriodEnd) : null;
    const isActive = periodEnd ? now < periodEnd : false;
    return {
      status: isActive ? "ACTIVE" : "EXPIRED",
      isActive,
      trialEndsAt: null,
      trialDaysLeft: 0,
      subscriptionCurrentPeriodEnd: periodEnd?.toISOString() ?? null,
      planPrice: 20,
    };
  }

  return {
    status: shop.subscriptionStatus,
    isActive: false,
    trialEndsAt: null,
    trialDaysLeft: 0,
    subscriptionCurrentPeriodEnd: null,
    planPrice: 20,
  };
}

// ── GET /api/subscription/config (public) ────────────────────────────────────
router.get("/config", (_req, res) => {
  const clientId = process.env["PAYPAL_CLIENT_ID"];
  const mode = process.env["PAYPAL_MODE"] ?? "live";
  res.json({
    paypalClientId: clientId ?? null,
    paypalConfigured: !!clientId,
    mode,
  });
});

// ── GET /api/subscription/status ─────────────────────────────────────────────
router.get("/status", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }
    res.json(getSubscriptionInfo(shop));
  } catch (err) {
    req.log.error({ err }, "Get subscription status error");
    res.status(500).json({ error: "Failed to get subscription status" });
  }
});

// ── POST /api/subscription/create-order ──────────────────────────────────────
router.post("/create-order", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const accessToken = await getPaypalAccessToken();

    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: PLAN_PRICE_USD },
          description: "Coastaq Seller Subscription — 1 Month",
          custom_id: req.userId,
        },
      ],
      application_context: {
        brand_name: "Coastaq Marketplace",
        user_action: "PAY_NOW",
        return_url: "https://coastaq.replit.app/seller/dashboard",
        cancel_url: "https://coastaq.replit.app/seller/dashboard",
      },
    };

    const orderRes = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      req.log.error({ err }, "PayPal create order failed");
      res.status(502).json({ error: "Failed to create PayPal order" });
      return;
    }

    const order = await orderRes.json() as { id: string };
    res.json({ orderID: order.id });
  } catch (err: any) {
    req.log.error({ err }, "Create PayPal order error");
    res.status(500).json({ error: err.message ?? "Failed to create order" });
  }
});

// ── POST /api/subscription/capture-order ─────────────────────────────────────
router.post("/capture-order", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const { orderID } = req.body;
  if (!orderID) { res.status(400).json({ error: "orderID is required" }); return; }

  try {
    const accessToken = await getPaypalAccessToken();

    const captureRes = await fetch(
      `${getPaypalBaseUrl()}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!captureRes.ok) {
      const err = await captureRes.text();
      req.log.error({ err, orderID }, "PayPal capture failed");
      res.status(502).json({ error: "Payment capture failed" });
      return;
    }

    const capture = await captureRes.json() as {
      status: string;
      id: string;
      purchase_units?: Array<{ payments?: { captures?: Array<{ status: string }> } }>;
    };

    const captureStatus = capture.purchase_units?.[0]?.payments?.captures?.[0]?.status;
    if (capture.status !== "COMPLETED" && captureStatus !== "COMPLETED") {
      res.status(402).json({ error: `Payment not completed (status: ${capture.status})` });
      return;
    }

    // Activate subscription
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + PLAN_DAYS);

    const [updated] = await db.update(shopsTable)
      .set({
        subscriptionStatus: "ACTIVE",
        subscriptionCurrentPeriodEnd: periodEnd,
        lastPaypalOrderId: orderID,
        updatedAt: now,
      })
      .where(eq(shopsTable.userId, req.userId!))
      .returning();

    req.log.info({ userId: req.userId, orderID }, "Subscription activated via PayPal");

    res.json({
      ...getSubscriptionInfo(updated),
      message: `Subscription activated until ${periodEnd.toDateString()}`,
      paypalOrderId: orderID,
    });
  } catch (err: any) {
    req.log.error({ err }, "Capture PayPal order error");
    res.status(500).json({ error: err.message ?? "Failed to capture payment" });
  }
});

// ── POST /api/subscription/cancel ────────────────────────────────────────────
router.post("/cancel", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) { res.status(404).json({ error: "Shop not found" }); return; }

    const [updated] = await db.update(shopsTable)
      .set({ subscriptionStatus: "CANCELLED", updatedAt: new Date() })
      .where(eq(shopsTable.userId, req.userId!))
      .returning();

    res.json({
      ...getSubscriptionInfo(updated),
      message: "Subscription cancelled",
    });
  } catch (err) {
    req.log.error({ err }, "Cancel subscription error");
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

export { getSubscriptionInfo };
export default router;
