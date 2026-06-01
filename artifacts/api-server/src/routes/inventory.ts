import { Router } from "express";
import { db } from "@workspace/db";
import { inventoryLogsTable, productsTable, shopsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

export async function recordInventoryMovement(
  productId: string,
  type: "restock" | "sale" | "adjustment" | "return" | "reserved",
  quantity: number,
  note?: string,
  orderId?: string,
  createdBy?: string,
) {
  const product = await db.query.productsTable.findFirst({
    where: eq(productsTable.id, productId),
  });
  if (!product) return;

  const stockBefore = product.stock;
  const stockAfter = stockBefore + quantity;

  await db.insert(inventoryLogsTable).values({
    productId,
    type,
    quantity,
    stockBefore,
    stockAfter: Math.max(0, stockAfter),
    note,
    orderId: orderId || null,
    createdBy: createdBy || null,
  });

  await db
    .update(productsTable)
    .set({ stock: Math.max(0, stockAfter), updatedAt: new Date() })
    .where(eq(productsTable.id, productId));
}

// GET /api/inventory/:productId — log for a specific product (seller/admin only)
router.get("/:productId", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const product = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, req.params.productId as string),
      with: { shop: true },
    });

    if (!product) { res.status(404).json({ error: "Product not found" }); return; }

    if (req.userRole !== "ADMIN" && product.shop?.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const logs = await db
      .select()
      .from(inventoryLogsTable)
      .where(eq(inventoryLogsTable.productId, req.params.productId as string))
      .orderBy(desc(inventoryLogsTable.createdAt))
      .limit(100);

    res.json({ product: { id: product.id, title: product.title, stock: product.stock }, logs });
  } catch (err) {
    req.log.error({ err }, "Inventory log error");
    res.status(500).json({ error: "Failed to get inventory log" });
  }
});

// POST /api/inventory/:productId/adjust — manual stock adjustment (seller/admin)
router.post("/:productId/adjust", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const { quantity, note } = req.body as { quantity: number; note?: string };
    if (quantity === undefined || isNaN(Number(quantity))) {
      res.status(400).json({ error: "quantity is required" }); return;
    }

    const product = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, req.params.productId as string),
      with: { shop: true },
    });
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    if (req.userRole !== "ADMIN" && product.shop?.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    await recordInventoryMovement(
      req.params.productId as string,
      "adjustment",
      Number(quantity),
      note || "Manual adjustment",
      undefined,
      req.userId,
    );

    const updated = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, req.params.productId as string),
    });

    res.json({ success: true, newStock: updated?.stock });
  } catch (err) {
    req.log.error({ err }, "Stock adjustment error");
    res.status(500).json({ error: "Failed to adjust stock" });
  }
});

// POST /api/inventory/:productId/restock — add stock (seller/admin)
router.post("/:productId/restock", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const { quantity, note } = req.body as { quantity: number; note?: string };
    if (!quantity || Number(quantity) <= 0) {
      res.status(400).json({ error: "quantity must be a positive number" }); return;
    }

    const product = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, req.params.productId as string),
      with: { shop: true },
    });
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    if (req.userRole !== "ADMIN" && product.shop?.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    await recordInventoryMovement(
      req.params.productId as string,
      "restock",
      Math.abs(Number(quantity)),
      note || "Restock",
      undefined,
      req.userId,
    );

    const updated = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, req.params.productId as string),
    });

    res.json({ success: true, newStock: updated?.stock });
  } catch (err) {
    req.log.error({ err }, "Restock error");
    res.status(500).json({ error: "Failed to restock" });
  }
});

export default router;
