import { Router } from "express";
import { db } from "@workspace/db";
import {
  affiliatesTable, affiliateLinksTable, affiliateCommissionsTable,
  productsTable, shopsTable, ordersTable,
} from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// POST /api/affiliates/apply — apply to become an affiliate
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

// GET /api/affiliates/me — get my affiliate profile + stats
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

// GET /api/affiliates/me/links — get my affiliate links
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

// POST /api/affiliates/me/links — create an affiliate link
router.post("/me/links", requireAuth, async (req, res) => {
  try {
    const { productId, shopId } = req.body;

    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }
    if (!affiliate.isApproved) { res.status(403).json({ error: "Affiliate account pending approval" }); return; }

    if (!productId && !shopId) {
      res.status(400).json({ error: "productId or shopId is required" }); return;
    }

    let code = generateCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await db.query.affiliateLinksTable.findFirst({
        where: eq(affiliateLinksTable.code, code),
      });
      if (!exists) break;
      code = generateCode();
      attempts++;
    }

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

// GET /api/affiliates/me/commissions — get my commissions
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

// GET /api/affiliates/track/:code — track a link click and redirect
router.get("/track/:code", async (req, res) => {
  try {
    const link = await db.query.affiliateLinksTable.findFirst({
      where: eq(affiliateLinksTable.code, req.params.code),
    });

    if (!link || !link.isActive) {
      res.redirect("/"); return;
    }

    await db
      .update(affiliateLinksTable)
      .set({ clicks: link.clicks + 1 })
      .where(eq(affiliateLinksTable.id, link.id));

    // Set a referral cookie (30 day), then redirect
    res.cookie("aff", req.params.code, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax" });

    if (link.productId) {
      res.redirect(`/products/${link.productId}?ref=${req.params.code}`);
    } else if (link.shopId) {
      res.redirect(`/shop/${link.shopId}?ref=${req.params.code}`);
    } else {
      res.redirect(`/?ref=${req.params.code}`);
    }
  } catch (err) {
    res.redirect("/");
  }
});

// ── Admin endpoints ──────────────────────────────────────────────────────────

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

export async function resolveAffiliateCommission(
  orderId: string,
  orderTotal: number,
  refCode?: string,
) {
  if (!refCode) return;
  try {
    const link = await db.query.affiliateLinksTable.findFirst({
      where: and(eq(affiliateLinksTable.code, refCode), eq(affiliateLinksTable.isActive, true)),
      with: { affiliate: true },
    });
    if (!link || !link.affiliate.isApproved) return;

    const rate = parseFloat(String(link.affiliate.commissionRate));
    const amount = (orderTotal * rate) / 100;

    await db.insert(affiliateCommissionsTable).values({
      affiliateId: link.affiliateId,
      orderId,
      linkId: link.id,
      amount: String(amount.toFixed(2)),
      rate: String(rate),
      status: "pending",
    });

    await db
      .update(affiliateLinksTable)
      .set({ conversions: link.conversions + 1 })
      .where(eq(affiliateLinksTable.id, link.id));

    await db
      .update(affiliatesTable)
      .set({
        pendingEarnings: sql`${affiliatesTable.pendingEarnings} + ${amount.toFixed(2)}`,
        totalEarnings: sql`${affiliatesTable.totalEarnings} + ${amount.toFixed(2)}`,
        updatedAt: new Date(),
      })
      .where(eq(affiliatesTable.id, link.affiliateId));
  } catch (err) {
    console.error("Affiliate commission error:", err);
  }
}

export default router;
