---
name: Shipping module architecture
description: Full shipping management module added to Coastaq — tables, API routes, and frontend pages.
---

## Rule
The shipping module extends (not replaces) existing order/tracking fields. Orders already have
trackingNumber + courierName fields — shipments table is the authoritative source for full
shipment lifecycle; orders sync status from shipments via API side-effects.

**Why:** Orders had basic tracking fields before. Rather than duplicate, the API auto-updates
orders (status → SHIPPED on shipment create, status → DELIVERED on delivered event).

**How to apply:**
- Creating shipment → POST /api/shipping/shipments — this updates order.status automatically
- Delivered event → POST /api/shipping/shipments/:id/events with status=delivered — updates order
- Seller shipping stats use shipmentsTable filtered by shopId (not ordersTable)
- ETA calculator is rule-based in the API (no external service needed)
- Courier recommendations: cheapest=LOCAL, fastest=DHL, balanced=UPS (by SPEED_RANK map)
- Label printing: client-side window.open() with full HTML + window.print() on load — no PDF lib needed
- New tables: couriers, shipment_events, shipping_rates, delivery_issues (all in lib/db/src/schema/shipping.ts)
- Extended shipments table: shop_id, dispatched_at, shipping_cost, method (added via ALTER TABLE)
