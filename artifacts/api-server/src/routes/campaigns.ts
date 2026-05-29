import { Router } from "express";
import { db } from "@workspace/db";
import {
  affiliateCampaignsTable, affiliateCampaignMembersTable,
  affiliateCampaignProductsTable, affiliatesTable, shopsTable, productsTable,
  usersTable, affiliateCampaignInvitationsTable,
} from "@workspace/db";
import { eq, desc, and, sql, inArray, or, ilike } from "drizzle-orm";
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

// GET /api/seller/campaigns — list seller's campaigns with product list + member count + pending invites
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

      const [pendingInviteRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(affiliateCampaignInvitationsTable)
        .where(and(
          eq(affiliateCampaignInvitationsTable.campaignId, c.id),
          eq(affiliateCampaignInvitationsTable.status, "pending"),
        ));

      const campaignProducts = await db
        .select({ productId: affiliateCampaignProductsTable.productId })
        .from(affiliateCampaignProductsTable)
        .where(eq(affiliateCampaignProductsTable.campaignId, c.id));

      return {
        ...c,
        memberCount: Number(memberRow?.count ?? 0),
        pendingInviteCount: Number(pendingInviteRow?.count ?? 0),
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

// ── SELLER invitation routes ──────────────────────────────────────────────────

// GET /api/seller/affiliates/search?q=... — search affiliates by email or name
router.get("/seller/affiliates/search", requireAuth, requireRole("SELLER"), async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) { res.json([]); return; }

    const results = await db
      .select({
        affiliateId: affiliatesTable.id,
        userId: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        isApproved: affiliatesTable.isApproved,
      })
      .from(affiliatesTable)
      .innerJoin(usersTable, eq(affiliatesTable.userId, usersTable.id))
      .where(
        or(
          ilike(usersTable.email, `%${q}%`),
          ilike(usersTable.name, `%${q}%`),
        )
      )
      .limit(10);

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Search affiliates error");
    res.status(500).json({ error: "Failed to search affiliates" });
  }
});

// POST /api/seller/campaigns/:id/invitations — invite an affiliate
router.post("/seller/campaigns/:id/invitations", requireAuth, requireRole("SELLER"), async (req, res) => {
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

    const { affiliateId } = req.body;
    if (!affiliateId) { res.status(400).json({ error: "affiliateId is required" }); return; }

    // Ensure the affiliate exists
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.id, affiliateId),
    });
    if (!affiliate) { res.status(404).json({ error: "Affiliate not found" }); return; }

    // Check if already an active member
    const existingMembership = await db.query.affiliateCampaignMembersTable.findFirst({
      where: and(
        eq(affiliateCampaignMembersTable.campaignId, campaign.id),
        eq(affiliateCampaignMembersTable.affiliateId, affiliateId),
        eq(affiliateCampaignMembersTable.status, "active"),
      ),
    });
    if (existingMembership) {
      res.status(409).json({ error: "This affiliate is already a member of the campaign" }); return;
    }

    // Check for existing pending invitation
    const existingInvitation = await db.query.affiliateCampaignInvitationsTable.findFirst({
      where: and(
        eq(affiliateCampaignInvitationsTable.campaignId, campaign.id),
        eq(affiliateCampaignInvitationsTable.affiliateId, affiliateId),
        eq(affiliateCampaignInvitationsTable.status, "pending"),
      ),
    });
    if (existingInvitation) {
      res.status(409).json({ error: "A pending invitation already exists for this affiliate" }); return;
    }

    const [invitation] = await db
      .insert(affiliateCampaignInvitationsTable)
      .values({ campaignId: campaign.id, affiliateId })
      .returning();

    res.status(201).json(invitation);
  } catch (err) {
    req.log.error({ err }, "Invite affiliate error");
    res.status(500).json({ error: "Failed to send invitation" });
  }
});

// GET /api/seller/campaigns/:id/invitations — list invitations for a campaign
router.get("/seller/campaigns/:id/invitations", requireAuth, requireRole("SELLER"), async (req, res) => {
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

    const invitations = await db
      .select({
        id: affiliateCampaignInvitationsTable.id,
        status: affiliateCampaignInvitationsTable.status,
        createdAt: affiliateCampaignInvitationsTable.createdAt,
        affiliateId: affiliatesTable.id,
        affiliateName: usersTable.name,
        affiliateEmail: usersTable.email,
      })
      .from(affiliateCampaignInvitationsTable)
      .innerJoin(affiliatesTable, eq(affiliateCampaignInvitationsTable.affiliateId, affiliatesTable.id))
      .innerJoin(usersTable, eq(affiliatesTable.userId, usersTable.id))
      .where(eq(affiliateCampaignInvitationsTable.campaignId, campaign.id))
      .orderBy(desc(affiliateCampaignInvitationsTable.createdAt));

    res.json(invitations);
  } catch (err) {
    req.log.error({ err }, "List campaign invitations error");
    res.status(500).json({ error: "Failed to list invitations" });
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

// GET /api/affiliates/me/invitations — list pending invitations for the current affiliate
router.get("/affiliates/me/invitations", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }

    const invitations = await db
      .select({
        id: affiliateCampaignInvitationsTable.id,
        status: affiliateCampaignInvitationsTable.status,
        createdAt: affiliateCampaignInvitationsTable.createdAt,
        campaign: affiliateCampaignsTable,
        shopName: shopsTable.name,
        shopLogo: shopsTable.logo,
      })
      .from(affiliateCampaignInvitationsTable)
      .innerJoin(affiliateCampaignsTable, eq(affiliateCampaignInvitationsTable.campaignId, affiliateCampaignsTable.id))
      .innerJoin(shopsTable, eq(affiliateCampaignsTable.shopId, shopsTable.id))
      .where(and(
        eq(affiliateCampaignInvitationsTable.affiliateId, affiliate.id),
        eq(affiliateCampaignInvitationsTable.status, "pending"),
      ))
      .orderBy(desc(affiliateCampaignInvitationsTable.createdAt));

    res.json(invitations.map(row => {
      const { id: _campaignId, ...campaignFields } = row.campaign;
      return {
        id: row.id,
        campaignId: row.campaign.id,
        status: row.status,
        createdAt: row.createdAt,
        ...campaignFields,
        shopName: row.shopName,
        shopLogo: row.shopLogo,
      };
    }));
  } catch (err) {
    req.log.error({ err }, "Get my invitations error");
    res.status(500).json({ error: "Failed to get invitations" });
  }
});

// POST /api/affiliates/me/invitations/:id/accept — accept an invitation and auto-join
router.post("/affiliates/me/invitations/:id/accept", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }
    if (!affiliate.isApproved) { res.status(403).json({ error: "Affiliate account pending approval" }); return; }

    const invitation = await db.query.affiliateCampaignInvitationsTable.findFirst({
      where: and(
        eq(affiliateCampaignInvitationsTable.id, req.params.id),
        eq(affiliateCampaignInvitationsTable.affiliateId, affiliate.id),
        eq(affiliateCampaignInvitationsTable.status, "pending"),
      ),
    });
    if (!invitation) { res.status(404).json({ error: "Invitation not found or already responded to" }); return; }

    // Ensure the campaign is still active
    const campaign = await db.query.affiliateCampaignsTable.findFirst({
      where: and(
        eq(affiliateCampaignsTable.id, invitation.campaignId),
        eq(affiliateCampaignsTable.status, "active"),
      ),
    });
    if (!campaign) { res.status(400).json({ error: "Campaign is no longer active" }); return; }

    // Mark invitation as accepted and upsert membership atomically
    await db
      .update(affiliateCampaignInvitationsTable)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(affiliateCampaignInvitationsTable.id, invitation.id));

    const existingMembership = await db.query.affiliateCampaignMembersTable.findFirst({
      where: and(
        eq(affiliateCampaignMembersTable.campaignId, invitation.campaignId),
        eq(affiliateCampaignMembersTable.affiliateId, affiliate.id),
      ),
    });

    if (existingMembership) {
      await db
        .update(affiliateCampaignMembersTable)
        .set({ status: "active", joinedAt: new Date() })
        .where(eq(affiliateCampaignMembersTable.id, existingMembership.id));
    } else {
      await db.insert(affiliateCampaignMembersTable).values({
        campaignId: invitation.campaignId,
        affiliateId: affiliate.id,
      });
    }

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Accept invitation error");
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

// POST /api/affiliates/me/invitations/:id/decline — decline an invitation
router.post("/affiliates/me/invitations/:id/decline", requireAuth, async (req, res) => {
  try {
    const affiliate = await db.query.affiliatesTable.findFirst({
      where: eq(affiliatesTable.userId, req.userId!),
    });
    if (!affiliate) { res.status(404).json({ error: "No affiliate account" }); return; }

    const invitation = await db.query.affiliateCampaignInvitationsTable.findFirst({
      where: and(
        eq(affiliateCampaignInvitationsTable.id, req.params.id),
        eq(affiliateCampaignInvitationsTable.affiliateId, affiliate.id),
        eq(affiliateCampaignInvitationsTable.status, "pending"),
      ),
    });
    if (!invitation) { res.status(404).json({ error: "Invitation not found or already responded to" }); return; }

    await db
      .update(affiliateCampaignInvitationsTable)
      .set({ status: "declined", updatedAt: new Date() })
      .where(eq(affiliateCampaignInvitationsTable.id, invitation.id));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Decline invitation error");
    res.status(500).json({ error: "Failed to decline invitation" });
  }
});

export default router;
