import { Router } from "express";
import { db } from "@workspace/db";
import {
  affiliateCampaignsTable, affiliateCampaignMembersTable,
  affiliateCampaignProductsTable, affiliatesTable, shopsTable, productsTable,
} from "@workspace/db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

// ── SELLER campaign routes ────────────────────────────────────────────────────

// POST /api/seller/campaigns — create a campaign with optional product list
router.post("/seller/campaigns", requireAuth, requireRole("SELLER"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) { res.status(404).json({ error: "No shop found for this seller" }); return; }

    const { name, description, commissionRate = 10, budget, startsAt, endsAt, productIds } = req.body;
    if (!name) { res.status(400).json({ error: "Campaign name is required" }); return; }

    const rate = parseFloat(String(commissionRate));
    if (isNaN(rate) || rate < 1 || rate > 50) {
      res.status(400).json({ error: "Commission rate must be between 1% and 50%" }); return;
    }

    // Validate product IDs belong to this shop
    const validProductIds: string[] = [];
    if (Array.isArray(productIds) && productIds.length > 0) {
      const ids = productIds.map(String).slice(0, 100);
      const ownedProducts = await db
        .select({ id: productsTable.id })
        .from(productsTable)
        .where(and(
          inArray(productsTable.id, ids),
          eq(productsTable.shopId, shop.id),
        ));
      validProductIds.push(...ownedProducts.map(p => p.id));
    }

    const [campaign] = await db.insert(affiliateCampaignsTable).values({
      shopId: shop.id,
      name: name.trim(),
      description: description || null,
      commissionRate: String(rate.toFixed(2)),
      budget: budget ? String(parseFloat(String(budget)).toFixed(2)) : null,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
    }).returning();

    // Insert product associations
    if (validProductIds.length > 0) {
      await db.insert(affiliateCampaignProductsTable).values(
        validProductIds.map(pid => ({ campaignId: campaign.id, productId: pid }))
      );
    }

    res.status(201).json({ ...campaign, productIds: validProductIds });
  } catch (err) {
    req.log.error({ err }, "Create campaign error");
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// GET /api/seller/campaigns — list seller's campaigns with product list + member count
router.get("/seller/campaigns", requireAuth, requireRole("SELLER"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) { res.status(404).json({ error: "No shop found" }); return; }

    const campaigns = await db
      .select()
      .from(affiliateCampaignsTable)
      .where(eq(affiliateCampaignsTable.shopId, shop.id))
      .orderBy(desc(affiliateCampaignsTable.createdAt));

    const enriched = await Promise.all(campaigns.map(async (c) => {
      const [memberRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(affiliateCampaignMembersTable)
        .where(and(
          eq(affiliateCampaignMembersTable.campaignId, c.id),
          eq(affiliateCampaignMembersTable.status, "active"),
        ));

      const campaignProducts = await db
        .select({ productId: affiliateCampaignProductsTable.productId })
        .from(affiliateCampaignProductsTable)
        .where(eq(affiliateCampaignProductsTable.campaignId, c.id));

      return {
        ...c,
        memberCount: Number(memberRow?.count ?? 0),
        productIds: campaignProducts.map(p => p.productId),
      };
    }));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "List seller campaigns error");
    res.status(500).json({ error: "Failed to list campaigns" });
  }
});

// PATCH /api/seller/campaigns/:id — update/pause/end a campaign; optionally replace product list
router.patch("/seller/campaigns/:id", requireAuth, requireRole("SELLER"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) { res.status(404).json({ error: "No shop found" }); return; }

    const campaign = await db.query.affiliateCampaignsTable.findFirst({
      where: and(
        eq(affiliateCampaignsTable.id, req.params.id),
        eq(affiliateCampaignsTable.shopId, shop.id),
      ),
    });
    if (!campaign) { res.status(404).json({ error: "Campaign not found" }); return; }

    const { name, description, commissionRate, budget, status, startsAt, endsAt, productIds } = req.body;
    const validStatuses = ["active", "paused", "ended"];

    const [updated] = await db
      .update(affiliateCampaignsTable)
      .set({
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(commissionRate !== undefined && { commissionRate: String(parseFloat(String(commissionRate)).toFixed(2)) }),
        ...(budget !== undefined && { budget: budget ? String(parseFloat(String(budget)).toFixed(2)) : null }),
        ...(status && validStatuses.includes(status) && { status }),
        ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
        ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }),
        updatedAt: new Date(),
      })
      .where(eq(affiliateCampaignsTable.id, campaign.id))
      .returning();

    // Replace product list if provided
    if (Array.isArray(productIds)) {
      await db
        .delete(affiliateCampaignProductsTable)
        .where(eq(affiliateCampaignProductsTable.campaignId, campaign.id));

      if (productIds.length > 0) {
        const ids = productIds.map(String).slice(0, 100);
        const ownedProducts = await db
          .select({ id: productsTable.id })
          .from(productsTable)
          .where(and(
            inArray(productsTable.id, ids),
            eq(productsTable.shopId, shop.id),
          ));
        if (ownedProducts.length > 0) {
          await db.insert(affiliateCampaignProductsTable).values(
            ownedProducts.map(p => ({ campaignId: campaign.id, productId: p.id }))
          );
        }
        const campaignProducts = await db
          .select({ productId: affiliateCampaignProductsTable.productId })
          .from(affiliateCampaignProductsTable)
          .where(eq(affiliateCampaignProductsTable.campaignId, campaign.id));
        res.json({ ...updated, productIds: campaignProducts.map(p => p.productId) }); return;
      }
      res.json({ ...updated, productIds: [] }); return;
    }

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Update campaign error");
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

// ── AFFILIATE campaign routes ─────────────────────────────────────────────────

/**
 * GET /api/affiliate-campaigns
 * Query params:
 *   page        — page number, 1-based (default: 1)
 *   limit       — results per page (default: 20, max: 100)
 *   showJoined  — "true" to include already-joined campaigns (default: only unjoined)
 */
router.get("/affiliate-campaigns", requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));
    const offset = (page - 1) * limit;
    const showJoined = req.query.showJoined === "true";

    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });

    // Collect joined campaign IDs so we can filter/flag them
    let joinedSet = new Set<string>();
    if (affiliate) {
      const memberships = await db
        .select({ campaignId: affiliateCampaignMembersTable.campaignId })
        .from(affiliateCampaignMembersTable)
        .where(and(
          eq(affiliateCampaignMembersTable.affiliateId, affiliate.id),
          eq(affiliateCampaignMembersTable.status, "active"),
        ));
      joinedSet = new Set(memberships.map(m => m.campaignId));
    }

    const allActive = await db
      .select({
        campaign: affiliateCampaignsTable,
        shopName: shopsTable.name,
        shopLogo: shopsTable.logo,
      })
      .from(affiliateCampaignsTable)
      .innerJoin(shopsTable, eq(affiliateCampaignsTable.shopId, shopsTable.id))
      .where(eq(affiliateCampaignsTable.status, "active"))
      .orderBy(desc(affiliateCampaignsTable.createdAt));

    // Filter or keep based on showJoined
    const filtered = showJoined
      ? allActive
      : allActive.filter(row => !joinedSet.has(row.campaign.id));

    const total = filtered.length;
    const page_results = filtered.slice(offset, offset + limit);

    // Enrich with product count
    const enriched = await Promise.all(page_results.map(async (row) => {
      const [productCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(affiliateCampaignProductsTable)
        .where(eq(affiliateCampaignProductsTable.campaignId, row.campaign.id));

      return {
        ...row.campaign,
        shopName: row.shopName,
        shopLogo: row.shopLogo,
        joined: joinedSet.has(row.campaign.id),
        productCount: Number(productCount?.count ?? 0),
      };
    }));

    res.json({
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: offset + limit < total,
      },
    });
  } catch (err) {
    req.log.error({ err }, "List affiliate campaigns error");
    res.status(500).json({ error: "Failed to list campaigns" });
  }
});

// POST /api/affiliate-campaigns/:id/join — join a campaign
router.post("/affiliate-campaigns/:id/join", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }
    if (!affiliate.isApproved) { res.status(403).json({ error: "Affiliate account pending approval" }); return; }

    const campaign = await db.query.affiliateCampaignsTable.findFirst({
      where: and(
        eq(affiliateCampaignsTable.id, req.params.id),
        eq(affiliateCampaignsTable.status, "active"),
      ),
    });
    if (!campaign) { res.status(404).json({ error: "Campaign not found or no longer active" }); return; }

    const existing = await db.query.affiliateCampaignMembersTable.findFirst({
      where: and(
        eq(affiliateCampaignMembersTable.campaignId, campaign.id),
        eq(affiliateCampaignMembersTable.affiliateId, affiliate.id),
      ),
    });
    if (existing) {
      if (existing.status === "active") { res.status(409).json({ error: "Already a member of this campaign" }); return; }
      const [rejoined] = await db
        .update(affiliateCampaignMembersTable)
        .set({ status: "active", joinedAt: new Date() })
        .where(eq(affiliateCampaignMembersTable.id, existing.id))
        .returning();
      res.json(rejoined); return;
    }

    const [member] = await db.insert(affiliateCampaignMembersTable).values({
      campaignId: campaign.id,
      affiliateId: affiliate.id,
    }).returning();
    res.status(201).json(member);
  } catch (err) {
    req.log.error({ err }, "Join campaign error");
    res.status(500).json({ error: "Failed to join campaign" });
  }
});

// GET /api/affiliates/me/campaigns — list campaigns the current affiliate has joined
router.get("/affiliates/me/campaigns", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }

    const memberships = await db
      .select({
        membership: affiliateCampaignMembersTable,
        campaign: affiliateCampaignsTable,
        shopName: shopsTable.name,
        shopLogo: shopsTable.logo,
      })
      .from(affiliateCampaignMembersTable)
      .innerJoin(affiliateCampaignsTable, eq(affiliateCampaignMembersTable.campaignId, affiliateCampaignsTable.id))
      .innerJoin(shopsTable, eq(affiliateCampaignsTable.shopId, shopsTable.id))
      .where(and(
        eq(affiliateCampaignMembersTable.affiliateId, affiliate.id),
        eq(affiliateCampaignMembersTable.status, "active"),
      ))
      .orderBy(desc(affiliateCampaignMembersTable.joinedAt));

    res.json(memberships.map(row => ({
      ...row.campaign,
      shopName: row.shopName,
      shopLogo: row.shopLogo,
      joinedAt: row.membership.joinedAt,
    })));
  } catch (err) {
    req.log.error({ err }, "Get my campaigns error");
    res.status(500).json({ error: "Failed to get campaigns" });
  }
});

export default router;
