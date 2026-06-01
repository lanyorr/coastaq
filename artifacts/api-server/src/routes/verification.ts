import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";
import {
  db,
  sellerVerificationsTable, verificationDocumentsTable,
  sellerTrustScoresTable, verificationAuditLogsTable,
  shopsTable, usersTable, ordersTable, orderItemsTable,
  productsTable, shipmentsTable,
} from "@workspace/db";
import { eq, and, desc, inArray, or, sql } from "drizzle-orm";

const router = Router();

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */

const BADGE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  basic:      { label: "Basic Seller",    emoji: "🏷️",  color: "#94a3b8" },
  verified:   { label: "Verified Seller", emoji: "✅",  color: "#2563eb" },
  premium:    { label: "Premium Merchant",emoji: "⭐",  color: "#8b5cf6" },
  enterprise: { label: "Enterprise Store",emoji: "💎",  color: "#f59e0b" },
};

function determineBadge(
  identityStatus: string,
  businessStatus: string,
  trustScore: number,
  totalOrders: number,
): "basic" | "verified" | "premium" | "enterprise" {
  if (businessStatus === "approved" && trustScore >= 80 && totalOrders >= 50) return "enterprise";
  if (identityStatus === "approved" && trustScore >= 60 && totalOrders >= 10) return "premium";
  if (identityStatus === "approved") return "verified";
  return "basic";
}

async function getSellerShop(userId: string) {
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.userId, userId)).limit(1);
  return shop ?? null;
}

async function getOrCreateVerification(shopId: string) {
  let [ver] = await db.select().from(sellerVerificationsTable).where(eq(sellerVerificationsTable.shopId, shopId)).limit(1);
  if (!ver) {
    [ver] = await db.insert(sellerVerificationsTable).values({ shopId }).returning();
  }
  return ver;
}

async function auditLog(shopId: string | null, actorId: string | null, action: string, entityType?: string, entityId?: string, details?: object) {
  await db.insert(verificationAuditLogsTable).values({
    shopId, actorId, action, entityType, entityId,
    details: details ? JSON.stringify(details) : null,
  });
}

async function computeTrustScore(shopId: string): Promise<{
  totalScore: number; deliveryScore: number; completionScore: number;
  disputeScore: number; refundScore: number; ageScore: number; volumeScore: number;
  metrics: Record<string, number>; recommendations: string[];
}> {
  const [shop] = await db.select({ createdAt: shopsTable.createdAt }).from(shopsTable).where(eq(shopsTable.id, shopId)).limit(1);
  const accountDays = shop ? Math.floor((Date.now() - new Date(shop.createdAt).getTime()) / (86400000)) : 0;

  // Orders for this shop (via products)
  const shopProducts = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.shopId, shopId));
  const pIds = shopProducts.map(p => p.id);

  let totalOrders = 0, deliveredOrders = 0, disputedOrders = 0, refundedOrders = 0;
  if (pIds.length > 0) {
    const ois = await db.select({ orderId: orderItemsTable.orderId }).from(orderItemsTable).where(inArray(orderItemsTable.productId, pIds));
    const oIds = [...new Set(ois.map(i => i.orderId))];
    if (oIds.length > 0) {
      const orders = await db.select({ status: ordersTable.status, paymentStatus: ordersTable.paymentStatus })
        .from(ordersTable).where(inArray(ordersTable.id, oIds));
      totalOrders = orders.length;
      deliveredOrders = orders.filter(o => o.status === "DELIVERED").length;
      disputedOrders = orders.filter(o => o.paymentStatus === "disputed").length;
      refundedOrders = orders.filter(o => o.paymentStatus === "refunded").length;
    }
  }

  // Shipments
  const shipments = await db.select({ status: shipmentsTable.status }).from(shipmentsTable).where(eq(shipmentsTable.shopId, shopId));
  const totalShipments = shipments.length;
  const deliveredShipments = shipments.filter(s => s.status === "delivered").length;
  const deliveryRate = totalShipments > 0 ? deliveredShipments / totalShipments : 0;
  const completionRate = totalOrders > 0 ? deliveredOrders / totalOrders : 0;
  const disputeRate   = totalOrders > 0 ? disputedOrders / totalOrders : 0;
  const refundRate    = totalOrders > 0 ? refundedOrders / totalOrders : 0;

  const deliveryScore  = deliveryRate * 30;
  const completionScore= completionRate * 20;
  const disputeScore   = Math.max(0, 1 - disputeRate * 5) * 15;
  const refundScore    = Math.max(0, 1 - refundRate * 4) * 10;
  const ageScore       = Math.min(accountDays / 365, 1) * 10;
  const volumeScore    = Math.min(totalOrders / 50, 1) * 15;
  const totalScore     = Math.min(100, Math.round(deliveryScore + completionScore + disputeScore + refundScore + ageScore + volumeScore));

  const recommendations: string[] = [];
  if (deliveryRate < 0.7) recommendations.push("Ship orders promptly to improve delivery success rate");
  if (completionRate < 0.8) recommendations.push("Confirm and complete more orders to improve completion rate");
  if (disputeRate > 0.1)   recommendations.push("Reduce dispute rate by improving product quality and descriptions");
  if (refundRate > 0.1)    recommendations.push("Minimise refunds by ensuring accurate product listings");
  if (accountDays < 90)    recommendations.push("Build account history — trust grows with time");
  if (totalOrders < 20)    recommendations.push("Complete more orders to boost your volume score");

  const metrics = {
    totalOrders, deliveredOrders, disputedOrders, refundedOrders,
    totalShipments, deliveredShipments,
    deliveryRate:    Math.round(deliveryRate * 100),
    completionRate:  Math.round(completionRate * 100),
    disputeRate:     Math.round(disputeRate * 100),
    refundRate:      Math.round(refundRate * 100),
    accountDays,
  };

  // Upsert cache
  const [existing] = await db.select({ id: sellerTrustScoresTable.id }).from(sellerTrustScoresTable).where(eq(sellerTrustScoresTable.shopId, shopId)).limit(1);
  const vals = {
    totalScore: String(totalScore), deliveryScore: String(Math.round(deliveryScore * 10) / 10),
    completionScore: String(Math.round(completionScore * 10) / 10),
    disputeScore: String(Math.round(disputeScore * 10) / 10),
    refundScore: String(Math.round(refundScore * 10) / 10),
    ageScore: String(Math.round(ageScore * 10) / 10),
    volumeScore: String(Math.round(volumeScore * 10) / 10),
    metrics: JSON.stringify(metrics), computedAt: new Date(), updatedAt: new Date(),
  };
  if (existing) {
    await db.update(sellerTrustScoresTable).set(vals).where(eq(sellerTrustScoresTable.shopId, shopId));
  } else {
    await db.insert(sellerTrustScoresTable).values({ shopId, ...vals });
  }

  return { totalScore, deliveryScore: +deliveryScore.toFixed(1), completionScore: +completionScore.toFixed(1), disputeScore: +disputeScore.toFixed(1), refundScore: +refundScore.toFixed(1), ageScore: +ageScore.toFixed(1), volumeScore: +volumeScore.toFixed(1), metrics, recommendations };
}

function detectFraudFlags(metrics: Record<string, number>, accountDays: number) {
  const flags: { type: string; severity: string; message: string }[] = [];
  if (metrics.disputeRate > 30)   flags.push({ type: "excessive_disputes",  severity: "high",   message: `Dispute rate ${metrics.disputeRate}% exceeds 30% threshold` });
  if (metrics.refundRate > 25)    flags.push({ type: "high_refund_rate",     severity: "medium", message: `Refund rate ${metrics.refundRate}% exceeds 25% threshold` });
  if (metrics.totalOrders > 10 && metrics.deliveryRate === 0) flags.push({ type: "no_deliveries", severity: "high", message: "No successful deliveries despite significant order volume" });
  if (accountDays < 30 && metrics.totalOrders > 20) flags.push({ type: "new_high_volume", severity: "medium", message: "New account with unusually high order volume" });
  return flags;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SELLER: VERIFICATION STATUS
═══════════════════════════════════════════════════════════════════════════ */

router.get("/status", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return void res.status(404).json({ error: "Shop not found" });

  const ver = await getOrCreateVerification(shop.id);
  const docs = await db.select({
    id: verificationDocumentsTable.id, docType: verificationDocumentsTable.docType,
    docCategory: verificationDocumentsTable.docCategory, fileName: verificationDocumentsTable.fileName,
    fileSize: verificationDocumentsTable.fileSize, mimeType: verificationDocumentsTable.mimeType,
    status: verificationDocumentsTable.status, rejectionReason: verificationDocumentsTable.rejectionReason,
    uploadedAt: verificationDocumentsTable.uploadedAt, reviewedAt: verificationDocumentsTable.reviewedAt,
  }).from(verificationDocumentsTable)
    .where(eq(verificationDocumentsTable.shopId, shop.id))
    .orderBy(desc(verificationDocumentsTable.uploadedAt));

  // Progress steps
  const hasIdentityDoc = docs.some(d => d.docCategory === "identity");
  const hasApprovedIdentity = docs.some(d => d.docCategory === "identity" && d.status === "approved");
  const hasBusinessDoc = docs.some(d => d.docCategory === "business");

  const steps = [
    { id: "account",   label: "Account Created",          done: true },
    { id: "identity",  label: "Identity Verification",    done: hasApprovedIdentity, pending: hasIdentityDoc && !hasApprovedIdentity },
    { id: "submit",    label: "Submit for Review",        done: !!ver.submittedAt },
    { id: "business",  label: "Business Verification",    done: ver.businessStatus === "approved", optional: true },
  ];

  res.json({ ...ver, shop: { id: shop.id, name: shop.name }, documents: docs, steps, badgeInfo: BADGE_LABELS[ver.badgeLevel] ?? BADGE_LABELS.basic });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SELLER: TRUST SCORE
═══════════════════════════════════════════════════════════════════════════ */

router.get("/trust-score", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return void res.status(404).json({ error: "Shop not found" });

  const score = await computeTrustScore(shop.id);
  const ver = await getOrCreateVerification(shop.id);
  const badge = determineBadge(ver.identityStatus, ver.businessStatus, score.totalScore, score.metrics.totalOrders);

  // Update badge if changed
  if (badge !== ver.badgeLevel) {
    await db.update(sellerVerificationsTable).set({ badgeLevel: badge, updatedAt: new Date() }).where(eq(sellerVerificationsTable.shopId, shop.id));
    await auditLog(shop.id, req.userId!, "badge_changed", "badge", shop.id, { from: ver.badgeLevel, to: badge, trustScore: score.totalScore });
  }

  res.json({ ...score, badgeLevel: badge, badgeInfo: BADGE_LABELS[badge] });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SELLER: DOCUMENT UPLOAD
═══════════════════════════════════════════════════════════════════════════ */

router.post("/documents", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return void res.status(404).json({ error: "Shop not found" });

  const { docType, docCategory = "identity", fileName, fileSize, mimeType, fileData } = req.body;
  if (!docType || !fileName || !fileData) return void res.status(400).json({ error: "docType, fileName and fileData required" });

  if (fileSize && fileSize > 5 * 1024 * 1024) return void res.status(400).json({ error: "File too large (max 5 MB)" });

  const ver = await getOrCreateVerification(shop.id);

  const [doc] = await db.insert(verificationDocumentsTable).values({
    shopId: shop.id, verificationId: ver.id, docType, docCategory, fileName, fileSize, mimeType,
    fileData, status: "pending_review",
  }).returning();

  await auditLog(shop.id, req.userId!, "doc_uploaded", "document", doc.id, { docType, fileName });
  res.status(201).json({ ...doc, fileData: undefined });
});

router.delete("/documents/:docId", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return void res.status(404).json({ error: "Shop not found" });

  const [doc] = await db.select().from(verificationDocumentsTable)
    .where(and(eq(verificationDocumentsTable.id, req.params.docId as string), eq(verificationDocumentsTable.shopId, shop.id))).limit(1);
  if (!doc) return void res.status(404).json({ error: "Document not found" });
  if (doc.status !== "pending_review" && doc.status !== "rejected" && doc.status !== "requires_update") {
    return void res.status(400).json({ error: "Cannot delete an approved document" });
  }

  await db.delete(verificationDocumentsTable).where(eq(verificationDocumentsTable.id, doc.id));
  res.json({ ok: true });
});

// Serve document file to owner or admin
router.get("/documents/:docId/file", requireAuth, async (req, res) => {
  const [doc] = await db.select().from(verificationDocumentsTable).where(eq(verificationDocumentsTable.id, req.params.docId as string)).limit(1);
  if (!doc) return void res.status(404).json({ error: "Not found" });

  // Auth check: must be the shop owner or admin
  const shop = await getSellerShop(req.userId!);
  const isOwner = shop?.id === doc.shopId;
  const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  const isAdmin = user?.role === "ADMIN";

  if (!isOwner && !isAdmin) return void res.status(403).json({ error: "Forbidden" });
  if (!doc.fileData) return void res.status(404).json({ error: "No file data" });

  // fileData is a dataURL: "data:image/jpeg;base64,..."
  const matches = doc.fileData.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return void res.status(500).json({ error: "Invalid file data format" });

  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${doc.fileName}"`);
  res.send(buffer);
});

/* ═══════════════════════════════════════════════════════════════════════════
   SELLER: SUBMIT FOR REVIEW
═══════════════════════════════════════════════════════════════════════════ */

router.post("/submit", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return void res.status(404).json({ error: "Shop not found" });

  const docs = await db.select().from(verificationDocumentsTable)
    .where(and(eq(verificationDocumentsTable.shopId, shop.id), eq(verificationDocumentsTable.docCategory, "identity")));
  if (docs.length === 0) return void res.status(400).json({ error: "Upload at least one identity document before submitting" });

  const ver = await getOrCreateVerification(shop.id);
  const [updated] = await db.update(sellerVerificationsTable).set({
    overallStatus: "pending_review", submittedAt: new Date(), updatedAt: new Date(),
  }).where(eq(sellerVerificationsTable.shopId, shop.id)).returning();

  await auditLog(shop.id, req.userId!, "submitted_for_review", "shop", shop.id);
  res.json(updated);
});

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN: VERIFICATION QUEUE
═══════════════════════════════════════════════════════════════════════════ */

router.get("/admin/queue", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { status } = req.query as Record<string, string>;

  const verifications = await db.select().from(sellerVerificationsTable)
    .where(status && status !== "ALL" ? eq(sellerVerificationsTable.overallStatus, status as any) : undefined)
    .orderBy(desc(sellerVerificationsTable.submittedAt));

  const enriched = await Promise.all(verifications.map(async v => {
    const [shop] = await db.select({ id: shopsTable.id, name: shopsTable.name, isSuspended: shopsTable.isSuspended, country: shopsTable.country, userId: shopsTable.userId, createdAt: shopsTable.createdAt })
      .from(shopsTable).where(eq(shopsTable.id, v.shopId)).limit(1);
    const docCount = await db.select({ count: sql<number>`count(*)` })
      .from(verificationDocumentsTable).where(eq(verificationDocumentsTable.shopId, v.shopId));
    let owner = null;
    if (shop?.userId) {
      const [u] = await db.select({ name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, shop.userId)).limit(1);
      owner = u;
    }
    return { ...v, shop, owner, docCount: Number(docCount[0]?.count ?? 0) };
  }));

  res.json(enriched);
});

router.get("/admin/queue/:shopId", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const shopId = req.params.shopId as string;
  const ver = await getOrCreateVerification(shopId);
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, shopId)).limit(1);
  if (!shop) return void res.status(404).json({ error: "Shop not found" });

  const docs = await db.select().from(verificationDocumentsTable)
    .where(eq(verificationDocumentsTable.shopId, shopId))
    .orderBy(desc(verificationDocumentsTable.uploadedAt));
  // Don't send file data in list
  const docsClean = docs.map(d => ({ ...d, fileData: undefined }));

  const [owner] = await db.select({ name: usersTable.name, email: usersTable.email, createdAt: usersTable.createdAt })
    .from(usersTable).where(eq(usersTable.id, shop.userId)).limit(1);

  const trustScore = await computeTrustScore(shopId);

  res.json({ verification: ver, shop, owner, documents: docsClean, trustScore });
});

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN: APPROVE / REJECT DOCUMENT
═══════════════════════════════════════════════════════════════════════════ */

router.patch("/admin/documents/:docId", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { action, rejectionReason, note } = req.body; // action: approve | reject | requires_update
  if (!["approve", "reject", "requires_update"].includes(action)) {
    return void res.status(400).json({ error: "action must be approve | reject | requires_update" });
  }

  const [doc] = await db.select().from(verificationDocumentsTable).where(eq(verificationDocumentsTable.id, req.params.docId as string)).limit(1);
  if (!doc) return void res.status(404).json({ error: "Document not found" });

  const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "requires_update";
  const [updated] = await db.update(verificationDocumentsTable).set({
    status: newStatus, rejectionReason: rejectionReason || null, reviewedAt: new Date(),
  }).where(eq(verificationDocumentsTable.id, doc.id)).returning();

  // Update parent verification record
  const ver = await getOrCreateVerification(doc.shopId);
  const allDocs = await db.select({ docCategory: verificationDocumentsTable.docCategory, status: verificationDocumentsTable.status })
    .from(verificationDocumentsTable).where(eq(verificationDocumentsTable.shopId, doc.shopId));

  const identityApproved = allDocs.some(d => d.docCategory === "identity" && d.status === "approved");
  const businessApproved = allDocs.some(d => d.docCategory === "business" && d.status === "approved");

  const newIdentityStatus = identityApproved ? "approved" : allDocs.some(d => d.docCategory === "identity" && d.status === "rejected") ? "rejected" : ver.identityStatus;
  const newBusinessStatus = businessApproved ? "approved" : allDocs.some(d => d.docCategory === "business" && d.status === "rejected") ? "rejected" : ver.businessStatus;

  // Compute new badge
  const scoreRow = await sellerTrustScoresTable ? db.select({ totalScore: sellerTrustScoresTable.totalScore, metrics: sellerTrustScoresTable.metrics }).from(sellerTrustScoresTable).where(eq(sellerTrustScoresTable.shopId, doc.shopId)).limit(1) : [];
  const cachedScore = (await scoreRow)[0];
  const trustScore = cachedScore ? parseFloat(String(cachedScore.totalScore)) : 0;
  const cachedMetrics = cachedScore?.metrics ? JSON.parse(cachedScore.metrics) : {};
  const badge = determineBadge(newIdentityStatus, newBusinessStatus, trustScore, cachedMetrics.totalOrders ?? 0);

  await db.update(sellerVerificationsTable).set({
    identityStatus: newIdentityStatus as any, businessStatus: newBusinessStatus as any,
    badgeLevel: badge, reviewedBy: req.userId!, reviewNote: note || null,
    reviewedAt: new Date(), updatedAt: new Date(),
    overallStatus: (identityApproved || businessApproved) ? "approved" : "pending_review",
  }).where(eq(sellerVerificationsTable.shopId, doc.shopId));

  await auditLog(doc.shopId, req.userId!, `doc_${action}d`, "document", doc.id, { docType: doc.docType, rejectionReason, note });

  res.json(updated);
});

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN: SELLER ACTIONS (warning, suspend, restore, remove_verification)
═══════════════════════════════════════════════════════════════════════════ */

router.post("/admin/shops/:shopId/action", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const shopId = req.params.shopId as string;
  const { action, reason } = req.body;

  if (!["warning", "suspend", "restore", "remove_verification"].includes(action)) {
    return void res.status(400).json({ error: "Invalid action" });
  }

  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, shopId)).limit(1);
  if (!shop) return void res.status(404).json({ error: "Shop not found" });

  if (action === "suspend") {
    await db.update(shopsTable).set({ isSuspended: true, updatedAt: new Date() }).where(eq(shopsTable.id, shopId));
  } else if (action === "restore") {
    await db.update(shopsTable).set({ isSuspended: false, updatedAt: new Date() }).where(eq(shopsTable.id, shopId));
  } else if (action === "remove_verification") {
    await db.update(sellerVerificationsTable).set({
      identityStatus: "not_submitted", businessStatus: "not_submitted",
      overallStatus: "not_submitted", badgeLevel: "basic", submittedAt: null, reviewedAt: null, updatedAt: new Date(),
    }).where(eq(sellerVerificationsTable.shopId, shopId));
    await db.update(verificationDocumentsTable).set({ status: "rejected", rejectionReason: reason || "Verification removed by admin" })
      .where(eq(verificationDocumentsTable.shopId, shopId));
  }
  // "warning" action: just log it

  await auditLog(shopId, req.userId!, action, "shop", shopId, { reason, shopName: shop.name });

  res.json({ ok: true, action, shopId });
});

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN: FRAUD ALERTS
═══════════════════════════════════════════════════════════════════════════ */

router.get("/admin/fraud-alerts", requireAuth, requireRole("ADMIN"), async (req, res) => {
  // Get all shops with cached trust scores
  const scores = await db.select({
    shopId: sellerTrustScoresTable.shopId, totalScore: sellerTrustScoresTable.totalScore,
    metrics: sellerTrustScoresTable.metrics,
  }).from(sellerTrustScoresTable);

  const flagged: any[] = [];
  for (const s of scores) {
    const metrics = s.metrics ? JSON.parse(s.metrics) : {};
    const flags = detectFraudFlags(metrics, metrics.accountDays ?? 999);
    if (flags.length > 0) {
      const [shop] = await db.select({ id: shopsTable.id, name: shopsTable.name, isSuspended: shopsTable.isSuspended, isApproved: shopsTable.isApproved })
        .from(shopsTable).where(eq(shopsTable.id, s.shopId)).limit(1);
      if (shop) {
        flagged.push({ shop, trustScore: parseFloat(String(s.totalScore)), flags, metrics });
      }
    }
  }

  // Sort: high-severity first
  flagged.sort((a, b) => {
    const aHigh = a.flags.some((f: any) => f.severity === "high") ? 0 : 1;
    const bHigh = b.flags.some((f: any) => f.severity === "high") ? 0 : 1;
    return aHigh - bHigh;
  });

  res.json(flagged);
});

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN: AUDIT LOGS
═══════════════════════════════════════════════════════════════════════════ */

router.get("/admin/audit-logs", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { shopId, limit = "50" } = req.query as Record<string, string>;
  const logs = await db.select().from(verificationAuditLogsTable)
    .where(shopId ? eq(verificationAuditLogsTable.shopId, shopId) : undefined)
    .orderBy(desc(verificationAuditLogsTable.createdAt))
    .limit(parseInt(limit));
  res.json(logs);
});

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC: SHOP BADGE (for product pages / shop pages)
═══════════════════════════════════════════════════════════════════════════ */

router.get("/badge/:shopId", async (req, res) => {
  const [ver] = await db.select({ badgeLevel: sellerVerificationsTable.badgeLevel })
    .from(sellerVerificationsTable).where(eq(sellerVerificationsTable.shopId, req.params.shopId as string)).limit(1);
  const badge = ver?.badgeLevel ?? "basic";
  res.json({ badgeLevel: badge, ...BADGE_LABELS[badge] });
});

export default router;
