import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import {
  db, shopsTable, productsTable, orderItemsTable, ordersTable,
  sellerVerificationsTable, verificationDocumentsTable,
} from "@workspace/db";
import { eq, inArray, and, desc } from "drizzle-orm";

const router = Router();

interface Notification {
  id: string;
  type: "order" | "shipping" | "verification" | "document" | "message" | "system";
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
  icon?: string;
}

router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const notifications: Notification[] = [];

  try {
    // ── Seller notifications ──────────────────────────────────────────────────
    const [shop] = await db.select({ id: shopsTable.id, name: shopsTable.name })
      .from(shopsTable).where(eq(shopsTable.userId, userId)).limit(1);

    if (shop) {
      // Products for this shop
      const products = await db.select({ id: productsTable.id })
        .from(productsTable).where(eq(productsTable.shopId, shop.id));
      const pIds = products.map(p => p.id);

      if (pIds.length > 0) {
        const ois = await db.select({ orderId: orderItemsTable.orderId })
          .from(orderItemsTable).where(inArray(orderItemsTable.productId, pIds));
        const oIds = [...new Set(ois.map(i => i.orderId))];

        if (oIds.length > 0) {
          // Pending orders (need attention)
          const pending = await db.select({ id: ordersTable.id, total: ordersTable.total, createdAt: ordersTable.createdAt })
            .from(ordersTable).where(and(inArray(ordersTable.id, oIds), eq(ordersTable.status, "PENDING")))
            .orderBy(desc(ordersTable.createdAt)).limit(5);

          for (const o of pending) {
            notifications.push({
              id: `order-pending-${o.id}`, type: "order",
              title: "New order pending",
              body: `Order #${o.id.slice(0, 8).toUpperCase()} · $${Number(o.total).toFixed(2)}`,
              href: "/seller/orders", read: false,
              createdAt: (o.createdAt as Date).toISOString(),
              icon: "📦",
            });
          }

          // Confirmed orders (ready to ship)
          const confirmed = await db.select({ id: ordersTable.id, total: ordersTable.total, createdAt: ordersTable.createdAt })
            .from(ordersTable).where(and(inArray(ordersTable.id, oIds), eq(ordersTable.status, "CONFIRMED")))
            .orderBy(desc(ordersTable.createdAt)).limit(3);

          for (const o of confirmed) {
            notifications.push({
              id: `order-ship-${o.id}`, type: "shipping",
              title: "Ready to ship",
              body: `Order #${o.id.slice(0, 8).toUpperCase()} awaiting shipment`,
              href: "/seller/shipping/new", read: false,
              createdAt: (o.createdAt as Date).toISOString(),
              icon: "🚚",
            });
          }
        }
      }

      // Verification updates
      const [ver] = await db.select({
        overallStatus: sellerVerificationsTable.overallStatus,
        identityStatus: sellerVerificationsTable.identityStatus,
        updatedAt: sellerVerificationsTable.updatedAt,
      }).from(sellerVerificationsTable).where(eq(sellerVerificationsTable.shopId, shop.id)).limit(1);

      if (ver) {
        if (ver.overallStatus === "pending_review") {
          notifications.push({
            id: "ver-pending", type: "verification",
            title: "Verification in review",
            body: "Our team is reviewing your submitted documents",
            href: "/seller/verification", read: true,
            createdAt: (ver.updatedAt as Date).toISOString(),
            icon: "🔍",
          });
        }

        // Check for rejected documents
        const rejectedDocs = await db.select({ id: verificationDocumentsTable.id, docType: verificationDocumentsTable.docType, reviewedAt: verificationDocumentsTable.reviewedAt })
          .from(verificationDocumentsTable)
          .where(and(eq(verificationDocumentsTable.shopId, shop.id), eq(verificationDocumentsTable.status, "rejected")))
          .limit(2);

        for (const doc of rejectedDocs) {
          notifications.push({
            id: `doc-rejected-${doc.id}`, type: "document",
            title: "Document rejected",
            body: `Your ${doc.docType.replace(/_/g, " ")} requires resubmission`,
            href: "/seller/verification/documents", read: false,
            createdAt: doc.reviewedAt ? (doc.reviewedAt as Date).toISOString() : new Date().toISOString(),
            icon: "⚠️",
          });
        }

        // Check for approved documents
        const approvedDocs = await db.select({ id: verificationDocumentsTable.id, docType: verificationDocumentsTable.docType, reviewedAt: verificationDocumentsTable.reviewedAt })
          .from(verificationDocumentsTable)
          .where(and(eq(verificationDocumentsTable.shopId, shop.id), eq(verificationDocumentsTable.status, "approved")))
          .limit(2);

        for (const doc of approvedDocs) {
          if (doc.reviewedAt) {
            notifications.push({
              id: `doc-approved-${doc.id}`, type: "document",
              title: "Document approved ✓",
              body: `Your ${doc.docType.replace(/_/g, " ")} has been verified`,
              href: "/seller/verification", read: true,
              createdAt: (doc.reviewedAt as Date).toISOString(),
              icon: "✅",
            });
          }
        }
      }
    }

    // Sort newest first, deduplicate
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(notifications.slice(0, 12));
  } catch (err) {
    console.error("Notifications error:", err);
    res.json([]);
  }
});

export default router;
