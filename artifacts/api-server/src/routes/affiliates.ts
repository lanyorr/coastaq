import { Router } from "express";
import { db } from "@workspace/db";
import {
  affiliatesTable, affiliateLinksTable, affiliateCommissionsTable,
  affiliatePayoutsTable, affiliateCouponsTable,
  productsTable, shopsTable, ordersTable,
} from "@workspace/db";
import { eq, desc, and, sql, gte } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { recordAffiliateClick, getClientIp, hashIp, isSafeReferral } from "../lib/fraud.js";

const router = Router();

function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function uniqueCode(base?: string): Promise<string> {
  const candidate = base ? base.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20) : generateCode();
  if (!candidate) return uniqueCode();
  const exists = await db.query.affiliateLinksTable.findFirst({ where: eq(affiliateLinksTable.code, candidate) });
  if (exists) return generateCode();
  return candidate;
}

// ── POST /api/affiliates/apply ────────────────────────────────────────────────
router.post("/apply", requireAuth, async (req, res) => {
  try {
    const { bio, websiteUrl, paypalEmail } = req.body;
    const existing = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (existing) {
      res.status(409).json({ error: "You already have an affiliate account", affiliate: existing }); return;
    }
    const [affiliate] = await db.insert(affiliatesTable).values({
      userId: req.userId!,
      bio: bio || null,
      websiteUrl: websiteUrl || null,
      paypalEmail: paypalEmail || null,
      status: "pending",
      isApproved: false,
    }).returning();
    res.status(201).json(affiliate);
  } catch (err) {
    req.log.error({ err }, "Affiliate apply error");
    res.status(500).json({ error: "Failed to apply" });
  }
});

// ── GET /api/affiliates/me ────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
      with: { links: true, commissions: true },
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account found" }); return; }
    res.json(affiliate);
  } catch (err) {
    req.log.error({ err }, "Get affiliate error");
    res.status(500).json({ error: "Failed to get affiliate" });
  }
});

// ── PATCH /api/affiliates/me ──────────────────────────────────────────────────
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account found" }); return; }

    const { bio, websiteUrl, paypalEmail, instagram, twitter } = req.body;
    const [updated] = await db
      .update(affiliatesTable)
      .set({
        ...(bio !== undefined && { bio }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(paypalEmail !== undefined && { paypalEmail }),
        ...(instagram !== undefined && { instagram }),
        ...(twitter !== undefined && { twitter }),
        updatedAt: new Date(),
      })
      .where(eq(affiliatesTable.id, affiliate.id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Update affiliate profile error");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ── GET /api/affiliates/me/links ──────────────────────────────────────────────
router.get("/me/links", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }
    if (!affiliate.isApproved) { res.status(403).json({ error: "Affiliate account pending approval" }); return; }

    const links = await db
      .select()
      .from(affiliateLinksTable)
      .where(eq(affiliateLinksTable.affiliateId, affiliate.id))
      .orderBy(desc(affiliateLinksTable.createdAt));
    res.json(links);
  } catch (err) {
    req.log.error({ err }, "Get links error");
    res.status(500).json({ error: "Failed to get links" });
  }
});

// ── POST /api/affiliates/me/links ─────────────────────────────────────────────
router.post("/me/links", requireAuth, async (req, res) => {
  try {
    const { productId, shopId } = req.body;
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }
    if (!affiliate.isApproved) { res.status(403).json({ error: "Affiliate account pending approval" }); return; }
    if (!productId && !shopId) { res.status(400).json({ error: "productId or shopId is required" }); return; }

    const code = await uniqueCode();
    const [link] = await db.insert(affiliateLinksTable).values({
      affiliateId: affiliate.id,
      code,
      productId: productId || null,
      shopId: shopId || null,
    }).returning();
    res.status(201).json(link);
  } catch (err) {
    req.log.error({ err }, "Create link error");
    res.status(500).json({ error: "Failed to create link" });
  }
});

// ── GET /api/affiliates/me/commissions ────────────────────────────────────────
router.get("/me/commissions", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }

    const commissions = await db
      .select()
      .from(affiliateCommissionsTable)
      .where(eq(affiliateCommissionsTable.affiliateId, affiliate.id))
      .orderBy(desc(affiliateCommissionsTable.createdAt))
      .limit(100);
    res.json(commissions);
  } catch (err) {
    req.log.error({ err }, "Get commissions error");
    res.status(500).json({ error: "Failed to get commissions" });
  }
});

// ── PAYOUT ROUTES ─────────────────────────────────────────────────────────────

// POST /api/affiliates/me/payouts — request a payout
router.post("/me/payouts", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }
    if (!affiliate.isApproved) { res.status(403).json({ error: "Affiliate account pending approval" }); return; }

    const { amount, method = "paypal" } = req.body;
    if (!amount || isNaN(parseFloat(amount))) {
      res.status(400).json({ error: "Valid amount is required" }); return;
    }
    const requestedAmount = parseFloat(amount);
    const pending = parseFloat(String(affiliate.pendingEarnings));

    if (requestedAmount < 10) {
      res.status(400).json({ error: "Minimum payout is $10.00" }); return;
    }
    if (requestedAmount > pending) {
      res.status(400).json({ error: `Insufficient balance. Available: $${pending.toFixed(2)}` }); return;
    }

    const validMethods = ["paypal", "bank", "mobile_money", "crypto"];
    if (!validMethods.includes(method)) {
      res.status(400).json({ error: "Invalid payout method" }); return;
    }

    const [payout] = await db.insert(affiliatePayoutsTable).values({
      affiliateId: affiliate.id,
      amount: String(requestedAmount.toFixed(2)),
      method,
      status: "pending",
    }).returning();

    res.status(201).json(payout);
  } catch (err) {
    req.log.error({ err }, "Request payout error");
    res.status(500).json({ error: "Failed to request payout" });
  }
});

// GET /api/affiliates/me/payouts — list my payout history
router.get("/me/payouts", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }

    const payouts = await db
      .select()
      .from(affiliatePayoutsTable)
      .where(eq(affiliatePayoutsTable.affiliateId, affiliate.id))
      .orderBy(desc(affiliatePayoutsTable.createdAt));
    res.json(payouts);
  } catch (err) {
    req.log.error({ err }, "Get payouts error");
    res.status(500).json({ error: "Failed to get payouts" });
  }
});

// ── COUPON ROUTES ─────────────────────────────────────────────────────────────

// GET /api/affiliates/me/coupons — list my coupons
router.get("/me/coupons", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }
    if (!affiliate.isApproved) { res.status(403).json({ error: "Affiliate account pending approval" }); return; }

    const coupons = await db
      .select()
      .from(affiliateCouponsTable)
      .where(eq(affiliateCouponsTable.affiliateId, affiliate.id))
      .orderBy(desc(affiliateCouponsTable.createdAt));
    res.json(coupons);
  } catch (err) {
    req.log.error({ err }, "Get coupons error");
    res.status(500).json({ error: "Failed to get coupons" });
  }
});

// POST /api/affiliates/me/coupons — generate a new coupon
router.post("/me/coupons", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }
    if (!affiliate.isApproved) { res.status(403).json({ error: "Affiliate account pending approval" }); return; }

    const { code: rawCode, discountPct = 10, maxUses, expiresAt } = req.body;

    const discountNum = parseFloat(String(discountPct));
    if (isNaN(discountNum) || discountNum < 1 || discountNum > 30) {
      res.status(400).json({ error: "Discount must be between 1% and 30%" }); return;
    }

    let code = rawCode
      ? rawCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20)
      : generateCode(8);
    if (!code) code = generateCode(8);

    const existing = await db.query.affiliateCouponsTable.findFirst({
      where: eq(affiliateCouponsTable.code, code),
    });
    if (existing) {
      res.status(409).json({ error: `Coupon code "${code}" is already taken` }); return;
    }

    const [coupon] = await db.insert(affiliateCouponsTable).values({
      affiliateId: affiliate.id,
      code,
      discountPct: String(discountNum.toFixed(2)),
      maxUses: maxUses ? parseInt(String(maxUses)) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning();
    res.status(201).json(coupon);
  } catch (err) {
    req.log.error({ err }, "Create coupon error");
    res.status(500).json({ error: "Failed to create coupon" });
  }
});

// PATCH /api/affiliates/me/coupons/:id — toggle active/inactive
router.patch("/me/coupons/:id", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }

    const coupon = await db.query.affiliateCouponsTable.findFirst({
      where: and(
        eq(affiliateCouponsTable.id, req.params.id),
        eq(affiliateCouponsTable.affiliateId, affiliate.id),
      ),
    });
    if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }

    const { isActive } = req.body;
    const [updated] = await db
      .update(affiliateCouponsTable)
      .set({ isActive: Boolean(isActive) })
      .where(eq(affiliateCouponsTable.id, coupon.id))
      .returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update coupon" });
  }
});

// ── CLICK TRACKING ────────────────────────────────────────────────────────────

// GET /api/affiliates/track/:code — track click + redirect
router.get("/track/:code", async (req, res) => {
  try {
    const link = await db.query.affiliateLinksTable.findFirst({
      where: eq(affiliateLinksTable.code, req.params.code),
    });
    if (!link || !link.isActive) { res.redirect("/"); return; }

    const ip = getClientIp({ headers: req.headers as any, socket: req.socket });
    const ipHash = hashIp(ip);
    await recordAffiliateClick(
      link.id,
      link.affiliateId,
      ipHash,
      req.headers["user-agent"],
      req.headers["referer"],
    );

    res.cookie("aff", req.params.code, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax" });

    if (link.productId) {
      res.redirect(`/products/${link.productId}?ref=${req.params.code}`);
    } else if (link.shopId) {
      res.redirect(`/shop/${link.shopId}?ref=${req.params.code}`);
    } else {
      res.redirect(`/?ref=${req.params.code}`);
    }
  } catch {
    res.redirect("/");
  }
});

// ── ADMIN ENDPOINTS ───────────────────────────────────────────────────────────

// GET /api/affiliates — list all affiliates (admin)
router.get("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const affiliates = await db
      .select()
      .from(affiliatesTable)
      .orderBy(desc(affiliatesTable.createdAt));
    res.json(affiliates);
  } catch (err) {
    req.log.error({ err }, "List affiliates error");
    res.status(500).json({ error: "Failed to list affiliates" });
  }
});

// GET /api/affiliates/payouts — list all payout requests (admin)
router.get("/payouts", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { status } = req.query;
    const rows = await db
      .select({
        payout: affiliatePayoutsTable,
        affiliateUserId: affiliatesTable.userId,
        paypalEmail: affiliatesTable.paypalEmail,
      })
      .from(affiliatePayoutsTable)
      .innerJoin(affiliatesTable, eq(affiliatePayoutsTable.affiliateId, affiliatesTable.id))
      .where(status ? eq(affiliatePayoutsTable.status, status as any) : undefined)
      .orderBy(desc(affiliatePayoutsTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "List payouts error");
    res.status(500).json({ error: "Failed to list payouts" });
  }
});

// PATCH /api/affiliates/payouts/:id/approve — approve payout (admin)
router.patch("/payouts/:id/approve", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const [payout] = await db
      .update(affiliatePayoutsTable)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(affiliatePayoutsTable.id, req.params.id))
      .returning();
    if (!payout) { res.status(404).json({ error: "Payout not found" }); return; }
    res.json(payout);
  } catch (err) {
    req.log.error({ err }, "Approve payout error");
    res.status(500).json({ error: "Failed to approve payout" });
  }
});

// PATCH /api/affiliates/payouts/:id/mark-paid — mark as paid + move earnings (admin)
router.patch("/payouts/:id/mark-paid", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const existing = await db.query.affiliatePayoutsTable.findFirst({
      where: eq(affiliatePayoutsTable.id, req.params.id),
    });
    if (!existing) { res.status(404).json({ error: "Payout not found" }); return; }
    if (existing.status === "paid") { res.json(existing); return; }

    const amount = parseFloat(String(existing.amount));

    const [payout] = await db
      .update(affiliatePayoutsTable)
      .set({ status: "paid", paidAt: new Date(), updatedAt: new Date(), note: req.body.note || null })
      .where(eq(affiliatePayoutsTable.id, existing.id))
      .returning();

    await db
      .update(affiliatesTable)
      .set({
        pendingEarnings: sql`GREATEST(0, ${affiliatesTable.pendingEarnings} - ${amount.toFixed(2)})`,
        paidEarnings: sql`${affiliatesTable.paidEarnings} + ${amount.toFixed(2)}`,
        updatedAt: new Date(),
      })
      .where(eq(affiliatesTable.id, existing.affiliateId));

    res.json(payout);
  } catch (err) {
    req.log.error({ err }, "Mark payout paid error");
    res.status(500).json({ error: "Failed to mark payout as paid" });
  }
});

// PATCH /api/affiliates/payouts/:id/reject — reject payout (admin)
router.patch("/payouts/:id/reject", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const [payout] = await db
      .update(affiliatePayoutsTable)
      .set({ status: "rejected", note: req.body.note || null, updatedAt: new Date() })
      .where(eq(affiliatePayoutsTable.id, req.params.id))
      .returning();
    if (!payout) { res.status(404).json({ error: "Payout not found" }); return; }
    res.json(payout);
  } catch (err) {
    res.status(500).json({ error: "Failed to reject payout" });
  }
});

// PATCH /api/affiliates/:id/approve — approve an affiliate (admin)
router.patch("/:id/approve", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    await db
      .update(affiliatesTable)
      .set({ isApproved: true, status: "approved", updatedAt: new Date() })
      .where(eq(affiliatesTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Approve affiliate error");
    res.status(500).json({ error: "Failed to approve" });
  }
});

// PATCH /api/affiliates/:id/suspend — suspend an affiliate (admin)
router.patch("/:id/suspend", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    await db
      .update(affiliatesTable)
      .set({ isApproved: false, status: "suspended", updatedAt: new Date() })
      .where(eq(affiliatesTable.id, req.params.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Suspend affiliate error");
    res.status(500).json({ error: "Failed to suspend" });
  }
});

// ── Commission resolution helper (called by checkout) ─────────────────────────

export async function resolveAffiliateCommission(
  orderId: string,
  orderTotal: number,
  buyerUserId: string,
  refCode?: string,
  couponCode?: string,
) {
  const code = refCode || couponCode;
  if (!code) return;
  try {
    let affiliateId: string | null = null;
    let linkId: string | null = null;
    let rate: number;

    if (refCode) {
      const link = await db.query.affiliateLinksTable.findFirst({
        where: and(eq(affiliateLinksTable.code, refCode), eq(affiliateLinksTable.isActive, true)),
        with: { affiliate: true },
      });
      if (!link || !link.affiliate.isApproved) return;
      if (!(await isSafeReferral(link.affiliateId, buyerUserId))) return;
      affiliateId = link.affiliateId;
      linkId = link.id;
      rate = parseFloat(String(link.affiliate.commissionRate));

      await db
        .update(affiliateLinksTable)
        .set({ conversions: sql`${affiliateLinksTable.conversions} + 1` })
        .where(eq(affiliateLinksTable.id, link.id));
    } else if (couponCode) {
      const coupon = await db.query.affiliateCouponsTable.findFirst({
        where: and(
          eq(affiliateCouponsTable.code, couponCode.toUpperCase()),
          eq(affiliateCouponsTable.isActive, true),
        ),
        with: { affiliate: true },
      });
      if (!coupon || !coupon.affiliate.isApproved) return;
      if (!(await isSafeReferral(coupon.affiliateId, buyerUserId))) return;
      affiliateId = coupon.affiliateId;
      rate = parseFloat(String(coupon.affiliate.commissionRate));

      await db
        .update(affiliateCouponsTable)
        .set({ uses: sql`${affiliateCouponsTable.uses} + 1` })
        .where(eq(affiliateCouponsTable.id, coupon.id));
    } else {
      return;
    }

    if (!affiliateId) return;

    const amount = (orderTotal * rate) / 100;

    await db.insert(affiliateCommissionsTable).values({
      affiliateId,
      orderId,
      linkId: linkId || null,
      amount: String(amount.toFixed(2)),
      rate: String(rate),
      status: "pending",
    });

    await db
      .update(affiliatesTable)
      .set({
        pendingEarnings: sql`${affiliatesTable.pendingEarnings} + ${amount.toFixed(2)}`,
        totalEarnings: sql`${affiliatesTable.totalEarnings} + ${amount.toFixed(2)}`,
        updatedAt: new Date(),
      })
      .where(eq(affiliatesTable.id, affiliateId));
  } catch (err) {
    console.error("Affiliate commission error:", err);
  }
}

export default router;
