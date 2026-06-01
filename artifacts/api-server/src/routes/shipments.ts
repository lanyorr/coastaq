import { Router } from "express";
import { db } from "@workspace/db";
import { shipmentsTable, ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

// GET /api/shipments/order/:orderId — get shipments for an order
router.get("/order/:orderId", requireAuth, async (req, res) => {
  try {
    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, req.params.orderId as string),
    });
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }

    const isBuyer = order.userId === req.userId;
    const isSeller = order.sellerId === req.userId;
    const isAdmin = req.userRole === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const shipments = await db
      .select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.orderId, req.params.orderId as string))
      .orderBy(desc(shipmentsTable.createdAt));

    res.json(shipments);
  } catch (err) {
    req.log.error({ err }, "Get shipments error");
    res.status(500).json({ error: "Failed to get shipments" });
  }
});

// POST /api/shipments — create a shipment (seller/admin)
router.post("/", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const {
      orderId, carrier, trackingNumber, trackingUrl,
      estimatedDelivery, originAddress, destinationAddress,
      weight, dimensions, labelUrl, notes,
    } = req.body;

    if (!orderId || !carrier || !trackingNumber) {
      res.status(400).json({ error: "orderId, carrier, and trackingNumber are required" }); return;
    }

    const order = await db.query.ordersTable.findFirst({
      where: eq(ordersTable.id, orderId),
    });
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    if (req.userRole !== "ADMIN" && order.sellerId !== req.userId) {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const [shipment] = await db.insert(shipmentsTable).values({
      orderId,
      carrier,
      trackingNumber,
      trackingUrl: trackingUrl || null,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      originAddress: originAddress || null,
      destinationAddress: destinationAddress || null,
      weight: weight || null,
      dimensions: dimensions || null,
      labelUrl: labelUrl || null,
      notes: notes || null,
      createdBy: req.userId,
    }).returning();

    // Also update the order's tracking info for quick access
    await db
      .update(ordersTable)
      .set({
        trackingNumber,
        courierName: carrier,
        status: "SHIPPED",
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, orderId));

    res.status(201).json(shipment);
  } catch (err) {
    req.log.error({ err }, "Create shipment error");
    res.status(500).json({ error: "Failed to create shipment" });
  }
});

// PATCH /api/shipments/:id — update shipment status
router.patch("/:id", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const { status, estimatedDelivery, notes } = req.body;

    const shipment = await db.query.shipmentsTable.findFirst({
      where: eq(shipmentsTable.id, req.params.id as string),
    });
    if (!shipment) { res.status(404).json({ error: "Shipment not found" }); return; }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) {
      updates.status = status;
      if (status === "delivered") updates.deliveredAt = new Date();
    }
    if (estimatedDelivery) updates.estimatedDelivery = new Date(estimatedDelivery);
    if (notes !== undefined) updates.notes = notes;

    await db.update(shipmentsTable).set(updates).where(eq(shipmentsTable.id, req.params.id as string));
    const updated = await db.query.shipmentsTable.findFirst({
      where: eq(shipmentsTable.id, req.params.id as string),
    });

    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Update shipment error");
    res.status(500).json({ error: "Failed to update shipment" });
  }
});

export default router;
