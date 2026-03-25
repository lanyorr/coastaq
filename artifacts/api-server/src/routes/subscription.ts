import { Router } from "express";
import { db } from "@workspace/db";
import { shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

const PLAN_PRICE_USD = 20;
const PLAN_DAYS = 30;

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
      planPrice: PLAN_PRICE_USD,
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
      planPrice: PLAN_PRICE_USD,
    };
  }

  return {
    status: shop.subscriptionStatus,
    isActive: false,
    trialEndsAt: null,
    trialDaysLeft: 0,
    subscriptionCurrentPeriodEnd: null,
    planPrice: PLAN_PRICE_USD,
  };
}

// GET /api/subscription/status
router.get("/status", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    res.json(getSubscriptionInfo(shop));
  } catch (err) {
    req.log.error({ err }, "Get subscription status error");
    res.status(500).json({ error: "Failed to get subscription status" });
  }
});

// POST /api/subscription/activate
// Stub endpoint — in production this would be called after Stripe payment confirmation.
// For demo purposes it activates the subscription immediately for 30 days.
router.post("/activate", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + PLAN_DAYS);

    const [updated] = await db.update(shopsTable)
      .set({
        subscriptionStatus: "ACTIVE",
        subscriptionCurrentPeriodEnd: periodEnd,
        updatedAt: now,
      })
      .where(eq(shopsTable.userId, req.userId!))
      .returning();

    res.json({
      ...getSubscriptionInfo(updated),
      message: `Subscription activated until ${periodEnd.toDateString()}`,
    });
  } catch (err) {
    req.log.error({ err }, "Activate subscription error");
    res.status(500).json({ error: "Failed to activate subscription" });
  }
});

// POST /api/subscription/cancel
router.post("/cancel", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }

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
