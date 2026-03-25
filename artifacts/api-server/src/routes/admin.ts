import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, shopsTable, productsTable, ordersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/sellers", async (req, res) => {
  try {
    const sellers = await db.query.usersTable.findMany({
      where: eq(usersTable.role, "SELLER"),
      with: { shop: true },
    });
    res.json(sellers.map(u => ({
      id: u.id, email: u.email, name: u.name, role: u.role,
      shop: u.shop, createdAt: u.createdAt
    })));
  } catch (err) {
    req.log.error({ err }, "Admin list sellers error");
    res.status(500).json({ error: "Failed to list sellers" });
  }
});

router.post("/sellers/:id/approve", async (req, res) => {
  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, req.params.id),
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [shop] = await db.update(shopsTable)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(shopsTable.userId, req.params.id))
      .returning();

    res.json(shop);
  } catch (err) {
    req.log.error({ err }, "Approve seller error");
    res.status(500).json({ error: "Failed to approve seller" });
  }
});

router.post("/sellers/:id/reject", async (req, res) => {
  try {
    const [shop] = await db.update(shopsTable)
      .set({ isApproved: false, updatedAt: new Date() })
      .where(eq(shopsTable.userId, req.params.id))
      .returning();
    res.json(shop);
  } catch (err) {
    req.log.error({ err }, "Reject seller error");
    res.status(500).json({ error: "Failed to reject seller" });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const [usersCount, sellersCount, productsCount, ordersCount, revenueResult, pendingResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
      db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "SELLER")),
      db.select({ count: sql<number>`count(*)` }).from(productsTable),
      db.select({ count: sql<number>`count(*)` }).from(ordersTable),
      db.select({ total: sql<string>`coalesce(sum(total), 0)` }).from(ordersTable).where(eq(ordersTable.status, "PAID")),
      db.select({ count: sql<number>`count(*)` }).from(shopsTable).where(eq(shopsTable.isApproved, false)),
    ]);

    res.json({
      totalUsers: Number(usersCount[0]?.count ?? 0),
      totalSellers: Number(sellersCount[0]?.count ?? 0),
      totalProducts: Number(productsCount[0]?.count ?? 0),
      totalOrders: Number(ordersCount[0]?.count ?? 0),
      totalRevenue: parseFloat(revenueResult[0]?.total ?? "0"),
      pendingApprovals: Number(pendingResult[0]?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Analytics error");
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

export default router;
