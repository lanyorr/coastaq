import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";
import {
  db,
  shipmentsTable, shipmentEventsTable, couriersTable,
  shippingRatesTable, deliveryIssuesTable,
  ordersTable, orderItemsTable, shopsTable, productsTable, usersTable,
} from "@workspace/db";
import { eq, desc, and, inArray, sql, count } from "drizzle-orm";

const router = Router();

/* ═══════════════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════════════ */

async function getSellerShop(userId: string) {
  const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.userId, userId)).limit(1);
  return shop ?? null;
}

/* ETA calculator — rule-based */
function calculateETA(
  originCountry: string,
  destCountry: string,
  method: string = "standard",
  courier?: string,
): { minDays: number; maxDays: number; label: string } {
  const origin = (originCountry || "").toUpperCase();
  const dest   = (destCountry   || "").toUpperCase();
  let minD = 3, maxD = 7;

  if (origin === dest) { minD = 1; maxD = 3; }
  else {
    const AFRICA = ["NG","GH","KE","ZA","ET","TZ","UG","SN","CI","CM","EG","MA","TN","AO","MZ"];
    const inAfrica = (c: string) => AFRICA.includes(c);
    if (inAfrica(origin) && inAfrica(dest)) { minD = 3; maxD = 7; }
    else if (inAfrica(origin) || inAfrica(dest)) {
      const other = inAfrica(origin) ? dest : origin;
      const EUROPE = ["GB","DE","FR","NL","ES","IT","BE","SE","NO","CH","PT"];
      const AMERICAS = ["US","CA","BR","MX","AR","CL","CO"];
      const ASIA = ["CN","JP","IN","KR","SG","MY","TH","PH","ID","AE","SA"];
      if (EUROPE.includes(other) || AMERICAS.includes(other)) { minD = 7; maxD = 14; }
      else if (ASIA.includes(other)) { minD = 10; maxD = 21; }
      else { minD = 7; maxD = 21; }
    } else { minD = 5; maxD = 14; }
  }

  const factor = method === "express" ? 0.5 : method === "economy" ? 1.5 : 1.0;
  minD = Math.max(1, Math.round(minD * factor));
  maxD = Math.round(maxD * factor);

  const label = minD === maxD ? `${minD} days` : `${minD}–${maxD} days`;
  return { minDays: minD, maxDays: maxD, label };
}

/* Courier recommendations — rule-based (Phase 10) */
function recommendCouriers(couriers: any[], weight = 1, destCountry = "") {
  if (!couriers.length) return { cheapest: null, fastest: null, balanced: null };

  const SPEED_RANK: Record<string, number> = {
    DHL: 1, FEDEX: 2, UPS: 3, LOCAL: 4,
  };

  const active = couriers.filter(c => c.isActive);
  const sorted = [...active].sort((a, b) => (SPEED_RANK[a.code] ?? 9) - (SPEED_RANK[b.code] ?? 9));

  const etaFn = (c: any, method: string) => calculateETA("NG", destCountry || "NG", method, c.code);

  const cheapest  = sorted[sorted.length - 1] ?? active[0];
  const fastest   = sorted[0] ?? active[0];
  const balanced  = sorted[Math.floor(sorted.length / 2)] ?? active[0];

  return {
    cheapest:  cheapest  ? { courier: cheapest,  eta: etaFn(cheapest,  "economy"),  estCost: "Lowest rate",  reason: "Most affordable option for your destination" } : null,
    fastest:   fastest   ? { courier: fastest,   eta: etaFn(fastest,   "express"),  estCost: "Premium rate", reason: "Fastest guaranteed delivery time" }             : null,
    balanced:  balanced  ? { courier: balanced,  eta: etaFn(balanced,  "standard"), estCost: "Standard rate", reason: "Best balance of speed and cost" }               : null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   COURIERS
═══════════════════════════════════════════════════════════════════════════ */

router.get("/couriers", requireAuth, async (_req, res) => {
  const couriers = await db.select().from(couriersTable).where(eq(couriersTable.isActive, true)).orderBy(couriersTable.name);
  res.json(couriers);
});

router.get("/couriers/all", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const couriers = await db.select().from(couriersTable).orderBy(couriersTable.name);
  res.json(couriers);
});

router.post("/couriers", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { name, code, trackingUrlTemplate, logoUrl, type = "manual", settings } = req.body;
  if (!name || !code) return res.status(400).json({ error: "name and code required" });
  const [c] = await db.insert(couriersTable).values({ name, code: code.toUpperCase(), trackingUrlTemplate, logoUrl, type, settings }).returning();
  res.json(c);
});

router.patch("/couriers/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  const { name, trackingUrlTemplate, logoUrl, isActive, settings } = req.body;
  const [c] = await db.update(couriersTable).set({ name, trackingUrlTemplate, logoUrl, isActive, settings })
    .where(eq(couriersTable.id, req.params.id)).returning();
  if (!c) return res.status(404).json({ error: "Courier not found" });
  res.json(c);
});

/* ═══════════════════════════════════════════════════════════════════════════
   SHIPMENT STATS
═══════════════════════════════════════════════════════════════════════════ */

router.get("/stats", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const rows = await db.select().from(shipmentsTable).where(eq(shipmentsTable.shopId, shop.id));

  const total     = rows.length;
  const active    = rows.filter(s => ["in_transit", "out_for_delivery", "picked_up"].includes(s.status)).length;
  const delivered = rows.filter(s => s.status === "delivered").length;
  const failed    = rows.filter(s => ["failed", "returned"].includes(s.status)).length;
  const pending   = rows.filter(s => s.status === "label_created").length;
  const rate      = total > 0 ? Math.round((delivered / total) * 100) : 0;

  // Last 30 days breakdown
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = rows.filter(s => new Date(s.createdAt) > thirtyDaysAgo);
  const byDate: Record<string, number> = {};
  for (const s of recent) {
    const d = new Date(s.createdAt).toISOString().slice(0, 10);
    byDate[d] = (byDate[d] ?? 0) + 1;
  }

  res.json({ total, active, delivered, failed, pending, deliveryRate: rate, byDate });
});

/* ═══════════════════════════════════════════════════════════════════════════
   SHIPMENTS
═══════════════════════════════════════════════════════════════════════════ */

router.get("/shipments", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const { status, limit = "50" } = req.query as Record<string, string>;
  const conditions = [eq(shipmentsTable.shopId, shop.id)];
  if (status && status !== "ALL") {
    conditions.push(eq(shipmentsTable.status, status as any));
  }

  const shipments = await db.select().from(shipmentsTable)
    .where(and(...conditions))
    .orderBy(desc(shipmentsTable.createdAt))
    .limit(parseInt(limit));

  // Enrich with order + buyer info
  const enriched = await Promise.all(shipments.map(async s => {
    const [order] = await db.select({
      id: ordersTable.id, total: ordersTable.total, status: ordersTable.status,
      shippingName: ordersTable.shippingName, shippingCity: ordersTable.shippingCity,
      shippingCountry: ordersTable.shippingCountry, userId: ordersTable.userId,
    }).from(ordersTable).where(eq(ordersTable.id, s.orderId)).limit(1);

    let buyerName = "—";
    if (order?.userId) {
      const [buyer] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, order.userId)).limit(1);
      buyerName = buyer?.name ?? "—";
    }
    return { ...s, order, buyerName };
  }));

  res.json(enriched);
});

router.post("/shipments", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const {
    orderId, carrier, trackingNumber, trackingUrl, estimatedDelivery,
    weight, dimensions, method = "standard", shippingCost = "0", notes,
    originAddress, destinationAddress, courierId,
  } = req.body;

  if (!orderId || !carrier || !trackingNumber) {
    return res.status(400).json({ error: "orderId, carrier and trackingNumber required" });
  }

  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  // Validate order belongs to this shop
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order) return res.status(404).json({ error: "Order not found" });

  // Build tracking URL from courier template if not provided
  let resolvedTrackingUrl = trackingUrl;
  if (!resolvedTrackingUrl && courierId) {
    const [courier] = await db.select().from(couriersTable).where(eq(couriersTable.id, courierId)).limit(1);
    if (courier?.trackingUrlTemplate) {
      resolvedTrackingUrl = courier.trackingUrlTemplate.replace("{tracking}", trackingNumber);
    }
  }

  const [shipment] = await db.insert(shipmentsTable).values({
    orderId, shopId: shop.id, carrier, trackingNumber, trackingUrl: resolvedTrackingUrl,
    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
    weight, dimensions, method, shippingCost, notes,
    originAddress: originAddress || shop.address || "",
    destinationAddress: destinationAddress || `${order.shippingAddress}, ${order.shippingCity}, ${order.shippingCountry}`,
    dispatchedAt: new Date(),
    status: "label_created",
    createdBy: req.userId!,
  }).returning();

  // Create initial event
  await db.insert(shipmentEventsTable).values({
    shipmentId: shipment.id,
    status: "label_created",
    description: `Shipping label created. Carrier: ${carrier}. Tracking: ${trackingNumber}`,
    createdBy: req.userId!,
  });

  // Update order: status → SHIPPED + tracking fields
  await db.update(ordersTable).set({
    status: "SHIPPED",
    trackingNumber,
    courierName: carrier,
    updatedAt: new Date(),
  }).where(eq(ordersTable.id, orderId));

  res.status(201).json(shipment);
});

router.get("/shipments/:id", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const [shipment] = await db.select().from(shipmentsTable)
    .where(and(eq(shipmentsTable.id, req.params.id), eq(shipmentsTable.shopId, shop.id)))
    .limit(1);
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });

  const events = await db.select().from(shipmentEventsTable)
    .where(eq(shipmentEventsTable.shipmentId, shipment.id))
    .orderBy(shipmentEventsTable.createdAt);

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, shipment.orderId)).limit(1);
  const items = order ? await db.select({ qty: orderItemsTable.quantity, price: orderItemsTable.price, product: productsTable })
    .from(orderItemsTable).innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, order.id)) : [];

  let buyer = null;
  if (order?.userId) {
    const [b] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email }).from(usersTable).where(eq(usersTable.id, order.userId)).limit(1);
    buyer = b;
  }

  const issues = await db.select().from(deliveryIssuesTable).where(eq(deliveryIssuesTable.shipmentId, shipment.id));

  res.json({ ...shipment, events, order, items, buyer, issues });
});

router.patch("/shipments/:id", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const [existing] = await db.select().from(shipmentsTable)
    .where(and(eq(shipmentsTable.id, req.params.id), eq(shipmentsTable.shopId, shop.id))).limit(1);
  if (!existing) return res.status(404).json({ error: "Shipment not found" });

  const {
    status, trackingNumber, trackingUrl, estimatedDelivery,
    weight, dimensions, notes, location, eventDescription,
  } = req.body;

  const updates: Partial<typeof existing> = { updatedAt: new Date() };
  if (status)           updates.status = status;
  if (trackingNumber)   updates.trackingNumber = trackingNumber;
  if (trackingUrl)      updates.trackingUrl = trackingUrl;
  if (weight)           updates.weight = weight;
  if (dimensions)       updates.dimensions = dimensions;
  if (notes !== undefined) updates.notes = notes;
  if (estimatedDelivery) updates.estimatedDelivery = new Date(estimatedDelivery);
  if (status === "delivered") { updates.deliveredAt = new Date(); }
  if (status === "picked_up" || status === "in_transit") { updates.dispatchedAt = updates.dispatchedAt ?? existing.dispatchedAt ?? new Date(); }

  const [shipment] = await db.update(shipmentsTable).set(updates).where(eq(shipmentsTable.id, req.params.id)).returning();

  // Auto-create tracking event
  if (status) {
    const STATUS_LABELS: Record<string, string> = {
      label_created:    "Shipping label created",
      picked_up:        "Package picked up by carrier",
      in_transit:       "Package in transit",
      out_for_delivery: "Out for delivery",
      delivered:        "Package delivered",
      failed:           "Delivery attempt failed",
      returned:         "Package returned to sender",
    };
    await db.insert(shipmentEventsTable).values({
      shipmentId: shipment.id,
      status,
      description: eventDescription || STATUS_LABELS[status] || `Status updated to ${status}`,
      location: location || null,
      createdBy: req.userId!,
    });
  }

  // Sync order status for key milestones
  if (status === "delivered") {
    await db.update(ordersTable).set({ status: "DELIVERED", deliveredAt: new Date(), updatedAt: new Date() }).where(eq(ordersTable.id, existing.orderId));
  }

  res.json(shipment);
});

/* ═══════════════════════════════════════════════════════════════════════════
   TRACKING EVENTS
═══════════════════════════════════════════════════════════════════════════ */

router.get("/shipments/:id/events", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const [shipment] = await db.select({ id: shipmentsTable.id })
    .from(shipmentsTable).where(and(eq(shipmentsTable.id, req.params.id), eq(shipmentsTable.shopId, shop.id))).limit(1);
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });

  const events = await db.select().from(shipmentEventsTable)
    .where(eq(shipmentEventsTable.shipmentId, shipment.id))
    .orderBy(shipmentEventsTable.createdAt);
  res.json(events);
});

router.post("/shipments/:id/events", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const [shipment] = await db.select().from(shipmentsTable)
    .where(and(eq(shipmentsTable.id, req.params.id), eq(shipmentsTable.shopId, shop.id))).limit(1);
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });

  const { status, description, location } = req.body;
  if (!status || !description) return res.status(400).json({ error: "status and description required" });

  const [event] = await db.insert(shipmentEventsTable).values({
    shipmentId: shipment.id, status, description, location, createdBy: req.userId!,
  }).returning();

  // Keep shipment status in sync
  await db.update(shipmentsTable).set({ status: status as any, updatedAt: new Date() }).where(eq(shipmentsTable.id, shipment.id));
  if (status === "delivered") {
    await db.update(shipmentsTable).set({ deliveredAt: new Date() }).where(eq(shipmentsTable.id, shipment.id));
    await db.update(ordersTable).set({ status: "DELIVERED", deliveredAt: new Date(), updatedAt: new Date() }).where(eq(ordersTable.id, shipment.orderId));
  }

  res.json(event);
});

/* ═══════════════════════════════════════════════════════════════════════════
   LABEL
═══════════════════════════════════════════════════════════════════════════ */

router.get("/shipments/:id/label", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const [shipment] = await db.select().from(shipmentsTable)
    .where(and(eq(shipmentsTable.id, req.params.id), eq(shipmentsTable.shopId, shop.id))).limit(1);
  if (!shipment) return res.status(404).json({ error: "Shipment not found" });

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, shipment.orderId)).limit(1);
  const items = order ? await db.select({ qty: orderItemsTable.quantity, price: orderItemsTable.price, title: productsTable.title })
    .from(orderItemsTable).innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, order.id)) : [];

  const label = {
    shipmentId: shipment.id,
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber,
    method: shipment.method,
    weight: shipment.weight,
    dimensions: shipment.dimensions,
    estimatedDelivery: shipment.estimatedDelivery,
    from: { name: shop.name, address: shop.address, city: shop.city, country: shop.country, email: shop.email, phone: shop.phone },
    to: { name: order?.shippingName, address: order?.shippingAddress, city: order?.shippingCity, state: order?.shippingState, zip: order?.shippingZip, country: order?.shippingCountry },
    items,
    orderTotal: order?.total,
    orderId: order?.id,
    createdAt: shipment.createdAt,
  };

  res.json(label);
});

/* ═══════════════════════════════════════════════════════════════════════════
   SHIPPING RATES
═══════════════════════════════════════════════════════════════════════════ */

router.get("/rates", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.json([]);

  const rates = await db.select({
    rate: shippingRatesTable,
    courier: { id: couriersTable.id, name: couriersTable.name, code: couriersTable.code },
  }).from(shippingRatesTable)
    .leftJoin(couriersTable, eq(shippingRatesTable.courierId, couriersTable.id))
    .where(eq(shippingRatesTable.shopId, shop.id))
    .orderBy(desc(shippingRatesTable.createdAt));

  res.json(rates.map(r => ({ ...r.rate, courier: r.courier })));
});

router.post("/rates", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const { name, courierId, rateType, baseRate, perKgRate, freeShippingThreshold, countries, estimatedDaysMin, estimatedDaysMax } = req.body;
  if (!name || !baseRate) return res.status(400).json({ error: "name and baseRate required" });

  const [rate] = await db.insert(shippingRatesTable).values({
    shopId: shop.id, name, courierId: courierId || null, rateType: rateType || "flat",
    baseRate, perKgRate: perKgRate || null, freeShippingThreshold: freeShippingThreshold || null,
    countries: countries ? JSON.stringify(countries) : null,
    estimatedDaysMin: estimatedDaysMin || 3, estimatedDaysMax: estimatedDaysMax || 7,
  }).returning();
  res.json(rate);
});

router.patch("/rates/:id", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const { name, courierId, rateType, baseRate, perKgRate, freeShippingThreshold, countries, estimatedDaysMin, estimatedDaysMax, isActive } = req.body;
  const [rate] = await db.update(shippingRatesTable).set({
    name, courierId: courierId || undefined, rateType, baseRate, perKgRate, freeShippingThreshold,
    countries: countries ? JSON.stringify(countries) : undefined,
    estimatedDaysMin, estimatedDaysMax, isActive, updatedAt: new Date(),
  }).where(and(eq(shippingRatesTable.id, req.params.id), eq(shippingRatesTable.shopId, shop.id))).returning();
  if (!rate) return res.status(404).json({ error: "Rate not found" });
  res.json(rate);
});

router.delete("/rates/:id", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });
  await db.delete(shippingRatesTable).where(and(eq(shippingRatesTable.id, req.params.id), eq(shippingRatesTable.shopId, shop.id)));
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════════════════════
   DELIVERY ISSUES
═══════════════════════════════════════════════════════════════════════════ */

router.get("/issues", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const shop = await getSellerShop(req.userId!);
  if (!shop) return res.status(404).json({ error: "Shop not found" });

  const shopShipments = await db.select({ id: shipmentsTable.id }).from(shipmentsTable).where(eq(shipmentsTable.shopId, shop.id));
  if (!shopShipments.length) return res.json([]);

  const ids = shopShipments.map(s => s.id);
  const issues = await db.select().from(deliveryIssuesTable)
    .where(inArray(deliveryIssuesTable.shipmentId, ids))
    .orderBy(desc(deliveryIssuesTable.createdAt));
  res.json(issues);
});

router.post("/issues", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const { shipmentId, issueType, description } = req.body;
  if (!shipmentId || !issueType || !description) return res.status(400).json({ error: "shipmentId, issueType and description required" });

  const [issue] = await db.insert(deliveryIssuesTable).values({
    shipmentId, issueType, description, reportedBy: req.userId!,
  }).returning();

  // Update shipment status if applicable
  if (issueType === "failed_delivery") {
    await db.update(shipmentsTable).set({ status: "failed", updatedAt: new Date() }).where(eq(shipmentsTable.id, shipmentId));
    await db.insert(shipmentEventsTable).values({ shipmentId, status: "failed", description: `Delivery issue reported: ${issueType}`, createdBy: req.userId! });
  } else if (issueType === "returned") {
    await db.update(shipmentsTable).set({ status: "returned", updatedAt: new Date() }).where(eq(shipmentsTable.id, shipmentId));
  }

  res.status(201).json(issue);
});

router.patch("/issues/:id", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  const { status, resolution } = req.body;
  const updates: any = { status };
  if (resolution) updates.resolution = resolution;
  if (status === "resolved") { updates.resolvedAt = new Date(); updates.resolvedBy = req.userId!; }

  const [issue] = await db.update(deliveryIssuesTable).set(updates).where(eq(deliveryIssuesTable.id, req.params.id)).returning();
  if (!issue) return res.status(404).json({ error: "Issue not found" });
  res.json(issue);
});

/* ═══════════════════════════════════════════════════════════════════════════
   ETA + RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════ */

router.get("/eta", requireAuth, async (req, res) => {
  const { origin = "NG", dest = "NG", method = "standard", courier } = req.query as Record<string, string>;
  res.json(calculateETA(origin, dest, method, courier));
});

router.get("/recommend", requireAuth, async (req, res) => {
  const { weight = "1", dest = "NG" } = req.query as Record<string, string>;
  const couriers = await db.select().from(couriersTable).where(eq(couriersTable.isActive, true));
  res.json(recommendCouriers(couriers, parseFloat(weight), dest));
});

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN ANALYTICS
═══════════════════════════════════════════════════════════════════════════ */

router.get("/admin/analytics", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const all = await db.select({
    id: shipmentsTable.id, status: shipmentsTable.status, carrier: shipmentsTable.carrier,
    shopId: shipmentsTable.shopId, method: shipmentsTable.method, shippingCost: shipmentsTable.shippingCost,
    createdAt: shipmentsTable.createdAt, deliveredAt: shipmentsTable.deliveredAt,
  }).from(shipmentsTable).orderBy(desc(shipmentsTable.createdAt));

  const total     = all.length;
  const delivered = all.filter(s => s.status === "delivered").length;
  const failed    = all.filter(s => ["failed", "returned"].includes(s.status)).length;
  const active    = all.filter(s => ["in_transit", "out_for_delivery", "picked_up"].includes(s.status)).length;

  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  // By courier
  const byCourier: Record<string, { total: number; delivered: number }> = {};
  for (const s of all) {
    const c = s.carrier || "Unknown";
    if (!byCourier[c]) byCourier[c] = { total: 0, delivered: 0 };
    byCourier[c].total++;
    if (s.status === "delivered") byCourier[c].delivered++;
  }

  // By method
  const byMethod: Record<string, number> = {};
  for (const s of all) { byMethod[s.method || "standard"] = (byMethod[s.method || "standard"] ?? 0) + 1; }

  // Revenue
  const totalRevenue = all.reduce((sum, s) => sum + parseFloat(s.shippingCost || "0"), 0);

  // Monthly volume last 6 months
  const byMonth: Record<string, number> = {};
  const sixMo = new Date(); sixMo.setMonth(sixMo.getMonth() - 6);
  for (const s of all.filter(s => new Date(s.createdAt) > sixMo)) {
    const m = new Date(s.createdAt).toISOString().slice(0, 7);
    byMonth[m] = (byMonth[m] ?? 0) + 1;
  }

  res.json({ total, delivered, failed, active, deliveryRate, byCourier, byMethod, totalRevenue, byMonth });
});

/* ═══════════════════════════════════════════════════════════════════════════
   CALCULATE SHIPPING RATE (for checkout integration)
═══════════════════════════════════════════════════════════════════════════ */

router.post("/calculate", requireAuth, async (req, res) => {
  const { shopId, weight = 1, quantity = 1, orderTotal = 0, destCountry } = req.body;
  if (!shopId) return res.status(400).json({ error: "shopId required" });

  const rates = await db.select({
    rate: shippingRatesTable,
    courier: { id: couriersTable.id, name: couriersTable.name, code: couriersTable.code },
  }).from(shippingRatesTable)
    .leftJoin(couriersTable, eq(shippingRatesTable.courierId, couriersTable.id))
    .where(and(eq(shippingRatesTable.shopId, shopId), eq(shippingRatesTable.isActive, true)));

  const calculated = rates.map(r => {
    const rule = r.rate;
    const base = parseFloat(rule.baseRate || "0");
    let cost = base;

    if (rule.rateType === "weight") {
      cost = base + (parseFloat(rule.perKgRate || "0") * weight);
    } else if (rule.rateType === "per_item") {
      cost = base + (parseFloat(rule.perKgRate || "0") * quantity);
    }

    // Free shipping threshold
    if (rule.freeShippingThreshold && orderTotal >= parseFloat(rule.freeShippingThreshold)) cost = 0;

    const eta = calculateETA("NG", destCountry || "NG", "standard");
    return {
      rateId: rule.id, name: rule.name, cost: cost.toFixed(2), courier: r.courier,
      estimatedDaysMin: rule.estimatedDaysMin ?? eta.minDays, estimatedDaysMax: rule.estimatedDaysMax ?? eta.maxDays,
    };
  });

  res.json(calculated);
});

export default router;
