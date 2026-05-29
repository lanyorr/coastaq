import { Router } from "express";
import { db } from "@workspace/db";
import {
  affiliateCampaignsTable, affiliateCampaignMembersTable,
  affiliatesTable, shopsTable,
} from "@workspace/db";
import { eq, desc, and, ne } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

// ── SELLER campaign routes ────────────────────────────────────────────────────

// POST /api/seller/campaigns — create a campaign
router.post("/seller/campaigns", requireAuth, requireRole("SELLER"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) { res.status(404).json({ error: "No shop found for this seller" }); return; }

    const { name, description, commissionRate = 10, budget, startsAt, endsAt } = req.body;
    if (!name) { res.status(400).json({ error: "Campaign name is required" }); return; }

    const rate = parseFloat(String(commissionRate));
    if (isNaN(rate) || rate < 1 || rate > 50) {
      res.status(400).json({ error: "Commission rate must be between 1% and 50%" }); return;
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

    res.status(201).json(campaign);
  } catch (err) {
    req.log.error({ err }, "Create campaign error");
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// GET /api/seller/campaigns — list seller's campaigns
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

    // Enrich with member count
    const enriched = await Promise.all(campaigns.map(async (c) => {
      const members = await db
        .select({ id: affiliateCampaignMembersTable.id })
        .from(affiliateCampaignMembersTable)
        .where(and(
          eq(affiliateCampaignMembersTable.campaignId, c.id),
          eq(affiliateCampaignMembersTable.status, "active"),
        ));
      return { ...c, memberCount: members.length };
    }));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "List seller campaigns error");
    res.status(500).json({ error: "Failed to list campaigns" });
  }
});

// PATCH /api/seller/campaigns/:id — update/pause/end a campaign
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

    const { name, description, commissionRate, budget, status, startsAt, endsAt } = req.body;
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

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Update campaign error");
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

// ── AFFILIATE campaign routes ─────────────────────────────────────────────────

// GET /api/affiliate-campaigns — list active campaigns an affiliate can join
router.get("/affiliate-campaigns", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });

    const campaigns = await db
      .select({
        campaign: affiliateCampaignsTable,
        shopName: shopsTable.name,
        shopLogo: shopsTable.logo,
      })
      .from(affiliateCampaignsTable)
      .innerJoin(shopsTable, eq(affiliateCampaignsTable.shopId, shopsTable.id))
      .where(eq(affiliateCampaignsTable.status, "active"))
      .orderBy(desc(affiliateCampaignsTable.createdAt));

    // If affiliate exists, flag campaigns they've already joined
    if (affiliate) {
      const memberships = await db
        .select({ campaignId: affiliateCampaignMembersTable.campaignId })
        .from(affiliateCampaignMembersTable)
        .where(and(
          eq(affiliateCampaignMembersTable.affiliateId, affiliate.id),
          eq(affiliateCampaignMembersTable.status, "active"),
        ));
      const joinedSet = new Set(memberships.map(m => m.campaignId));

      return res.json(campaigns.map(row => ({
        ...row.campaign,
        shopName: row.shopName,
        shopLogo: row.shopLogo,
        joined: joinedSet.has(row.campaign.id),
      })));
    }

    res.json(campaigns.map(row => ({
      ...row.campaign,
      shopName: row.shopName,
      shopLogo: row.shopLogo,
      joined: false,
    })));
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
