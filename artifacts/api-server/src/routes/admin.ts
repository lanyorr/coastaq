import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, shopsTable, productsTable, ordersTable,
  categoriesTable, reportsTable, adminActionsTable,
} from "@workspace/db";
import { eq, sql, ilike, or, and, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

async function logAction(
  adminId: string, action: string, targetType: string,
  targetId?: string, details?: string,
) {
  await db.insert(adminActionsTable).values({ adminId, action, targetType, targetId, details });
}

// ── GET /api/admin/dashboard ───────────────────────────────────────────────────
router.get("/dashboard", async (req, res) => {
  try {
    const [
      usersCount, sellersCount, buyersCount, pendingShops,
      totalProducts, totalOrders, revenueResult, pendingReports, recentActions,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
      db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "SELLER")),
      db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "BUYER")),
      db.select({ count: sql<number>`count(*)` }).from(shopsTable).where(eq(shopsTable.isApproved, false)),
      db.select({ count: sql<number>`count(*)` }).from(productsTable),
      db.select({ count: sql<number>`count(*)` }).from(ordersTable),
      db.select({ total: sql<string>`coalesce(sum(total), 0)` }).from(ordersTable),
      db.select({ count: sql<number>`count(*)` }).from(reportsTable).where(eq(reportsTable.status, "PENDING")),
      db.select({
        id: adminActionsTable.id,
        action: adminActionsTable.action,
        targetType: adminActionsTable.targetType,
        targetId: adminActionsTable.targetId,
        details: adminActionsTable.details,
        createdAt: adminActionsTable.createdAt,
        adminName: usersTable.name,
      })
        .from(adminActionsTable)
        .leftJoin(usersTable, eq(adminActionsTable.adminId, usersTable.id))
        .orderBy(desc(adminActionsTable.createdAt))
        .limit(8),
    ]);
    res.json({
      totalUsers: Number(usersCount[0]?.count ?? 0),
      totalSellers: Number(sellersCount[0]?.count ?? 0),
      totalBuyers: Number(buyersCount[0]?.count ?? 0),
      pendingShops: Number(pendingShops[0]?.count ?? 0),
      totalProducts: Number(totalProducts[0]?.count ?? 0),
      totalOrders: Number(totalOrders[0]?.count ?? 0),
      platformRevenue: parseFloat(revenueResult[0]?.total ?? "0"),
      pendingReports: Number(pendingReports[0]?.count ?? 0),
      recentActions,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard error");
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

// ── GET /api/admin/users ───────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { search = "", role = "", status = "", page = "1", limit = "20" } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    if (search) conditions.push(or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`))!);
    if (role) conditions.push(eq(usersTable.role, role as any));
    if (status === "blocked") conditions.push(eq(usersTable.isBlocked, true));
    if (status === "active") conditions.push(eq(usersTable.isBlocked, false));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [users, countResult] = await Promise.all([
      db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, isBlocked: usersTable.isBlocked, createdAt: usersTable.createdAt })
        .from(usersTable).where(where).orderBy(desc(usersTable.createdAt)).limit(parseInt(limit)).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(usersTable).where(where),
    ]);
    res.json({ users, total: Number(countResult[0]?.count ?? 0) });
  } catch (err) {
    req.log.error({ err }, "List users error");
    res.status(500).json({ error: "Failed to list users" });
  }
});

// ── POST /api/admin/users/:id/block ───────────────────────────────────────────
router.post("/users/:id/block", async (req, res) => {
  try {
    const { block } = req.body as { block: boolean };
    const [updated] = await db.update(usersTable).set({ isBlocked: block, updatedAt: new Date() }).where(eq(usersTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    await logAction(req.userId!, block ? "BLOCK_USER" : "UNBLOCK_USER", "USER", updated.id, updated.email);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: "Failed to update user" }); }
});

// ── POST /api/admin/users/:id/role ────────────────────────────────────────────
router.post("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body as { role: string };
    const [updated] = await db.update(usersTable).set({ role: role as any, updatedAt: new Date() }).where(eq(usersTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    await logAction(req.userId!, "CHANGE_ROLE", "USER", updated.id, `→ ${role}`);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: "Failed to change role" }); }
});

// ── GET /api/admin/shops ───────────────────────────────────────────────────────
router.get("/shops", async (req, res) => {
  try {
    const { search = "", status = "all", page = "1", limit = "20" } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    if (search) conditions.push(ilike(shopsTable.name, `%${search}%`));
    if (status === "pending") conditions.push(eq(shopsTable.isApproved, false));
    if (status === "approved") conditions.push(eq(shopsTable.isApproved, true));
    if (status === "suspended") conditions.push(eq(shopsTable.isSuspended, true));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [shops, countResult] = await Promise.all([
      db.select({
        id: shopsTable.id, name: shopsTable.name, description: shopsTable.description,
        isApproved: shopsTable.isApproved, isSuspended: shopsTable.isSuspended,
        subscriptionStatus: shopsTable.subscriptionStatus, createdAt: shopsTable.createdAt,
        userId: shopsTable.userId, ownerName: usersTable.name, ownerEmail: usersTable.email,
      })
        .from(shopsTable).leftJoin(usersTable, eq(shopsTable.userId, usersTable.id))
        .where(where).orderBy(desc(shopsTable.createdAt)).limit(parseInt(limit)).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(shopsTable).where(where),
    ]);
    res.json({ shops, total: Number(countResult[0]?.count ?? 0) });
  } catch (err) {
    req.log.error({ err }, "List shops error");
    res.status(500).json({ error: "Failed to list shops" });
  }
});

// ── POST /api/admin/shops/:id/approve ─────────────────────────────────────────
router.post("/shops/:id/approve", async (req, res) => {
  try {
    const { action } = req.body as { action: "approve" | "reject" };
    const [updated] = await db.update(shopsTable).set({ isApproved: action === "approve", updatedAt: new Date() }).where(eq(shopsTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Shop not found" }); return; }
    await logAction(req.userId!, action === "approve" ? "APPROVE_SHOP" : "REJECT_SHOP", "SHOP", updated.id, updated.name);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: "Failed to update shop" }); }
});

// ── POST /api/admin/shops/:id/suspend ─────────────────────────────────────────
router.post("/shops/:id/suspend", async (req, res) => {
  try {
    const { suspend } = req.body as { suspend: boolean };
    const [updated] = await db.update(shopsTable).set({ isSuspended: suspend, updatedAt: new Date() }).where(eq(shopsTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Shop not found" }); return; }
    await logAction(req.userId!, suspend ? "SUSPEND_SHOP" : "UNSUSPEND_SHOP", "SHOP", updated.id, updated.name);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: "Failed to update shop" }); }
});

// ── GET /api/admin/products ───────────────────────────────────────────────────
router.get("/products", async (req, res) => {
  try {
    const { search = "", status = "", page = "1", limit = "20" } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    if (search) conditions.push(ilike(productsTable.title, `%${search}%`));
    if (status) conditions.push(eq(productsTable.status, status as any));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [products, countResult] = await Promise.all([
      db.select({
        id: productsTable.id, title: productsTable.title, price: productsTable.price,
        status: productsTable.status, images: productsTable.images, condition: productsTable.condition,
        createdAt: productsTable.createdAt, shopId: productsTable.shopId, shopName: shopsTable.name,
      })
        .from(productsTable).leftJoin(shopsTable, eq(productsTable.shopId, shopsTable.id))
        .where(where).orderBy(desc(productsTable.createdAt)).limit(parseInt(limit)).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(productsTable).where(where),
    ]);
    res.json({ products, total: Number(countResult[0]?.count ?? 0) });
  } catch (err) {
    req.log.error({ err }, "List products error");
    res.status(500).json({ error: "Failed to list products" });
  }
});

// ── POST /api/admin/products/:id/status ───────────────────────────────────────
router.post("/products/:id/status", async (req, res) => {
  try {
    const { status } = req.body as { status: "ACTIVE" | "FLAGGED" | "SUSPENDED" };
    const [updated] = await db.update(productsTable).set({ status, updatedAt: new Date() }).where(eq(productsTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Product not found" }); return; }
    await logAction(req.userId!, `PRODUCT_${status}`, "PRODUCT", updated.id, updated.title);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: "Failed to update product" }); }
});

// ── DELETE /api/admin/products/:id ────────────────────────────────────────────
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await db.query.productsTable.findFirst({ where: eq(productsTable.id, req.params.id) });
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    await db.delete(productsTable).where(eq(productsTable.id, req.params.id));
    await logAction(req.userId!, "DELETE_PRODUCT", "PRODUCT", product.id, product.title);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete product" }); }
});

// ── GET /api/admin/reports ────────────────────────────────────────────────────
router.get("/reports", async (req, res) => {
  try {
    const { status = "", page = "1", limit = "20" } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    if (status) conditions.push(eq(reportsTable.status, status as any));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [reports, countResult] = await Promise.all([
      db.select({
        id: reportsTable.id, reason: reportsTable.reason, details: reportsTable.details,
        status: reportsTable.status, targetType: reportsTable.targetType,
        targetId: reportsTable.targetId, adminNote: reportsTable.adminNote,
        createdAt: reportsTable.createdAt, reporterName: usersTable.name, reporterEmail: usersTable.email,
      })
        .from(reportsTable).leftJoin(usersTable, eq(reportsTable.reporterId, usersTable.id))
        .where(where).orderBy(desc(reportsTable.createdAt)).limit(parseInt(limit)).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(reportsTable).where(where),
    ]);
    res.json({ reports, total: Number(countResult[0]?.count ?? 0) });
  } catch (err) {
    req.log.error({ err }, "List reports error");
    res.status(500).json({ error: "Failed to list reports" });
  }
});

// ── POST /api/admin/reports/:id/resolve ───────────────────────────────────────
router.post("/reports/:id/resolve", async (req, res) => {
  try {
    const { action, adminNote } = req.body as { action: "RESOLVED" | "DISMISSED"; adminNote?: string };
    const [updated] = await db.update(reportsTable).set({ status: action, adminNote: adminNote ?? null, updatedAt: new Date() }).where(eq(reportsTable.id, req.params.id)).returning();
    if (!updated) { res.status(404).json({ error: "Report not found" }); return; }
    await logAction(req.userId!, action === "RESOLVED" ? "RESOLVE_REPORT" : "DISMISS_REPORT", "REPORT", updated.id);
    res.json(updated);
  } catch (err) { res.status(500).json({ error: "Failed to update report" }); }
});

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
router.get("/analytics", async (req, res) => {
  try {
    const [usersCount, sellersCount, productsCount, ordersCount, revenueResult, pendingApprovals, usersByRole, ordersByStatus, topShops] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
      db.select({ count: sql<number>`count(*)` }).from(usersTable).where(eq(usersTable.role, "SELLER")),
      db.select({ count: sql<number>`count(*)` }).from(productsTable),
      db.select({ count: sql<number>`count(*)` }).from(ordersTable),
      db.select({ total: sql<string>`coalesce(sum(total), 0)` }).from(ordersTable),
      db.select({ count: sql<number>`count(*)` }).from(shopsTable).where(eq(shopsTable.isApproved, false)),
      db.select({ role: usersTable.role, count: sql<number>`count(*)` }).from(usersTable).groupBy(usersTable.role),
      db.select({ status: ordersTable.status, count: sql<number>`count(*)` }).from(ordersTable).groupBy(ordersTable.status),
      db.select({ shopName: shopsTable.name, revenue: sql<string>`coalesce(sum(${ordersTable.total}), 0)`, orders: sql<number>`count(*)` })
        .from(ordersTable).leftJoin(usersTable, eq(ordersTable.userId, usersTable.id)).leftJoin(shopsTable, eq(usersTable.id, shopsTable.userId))
        .groupBy(shopsTable.name).orderBy(desc(sql`sum(${ordersTable.total})`)).limit(5),
    ]);
    res.json({
      totalUsers: Number(usersCount[0]?.count ?? 0),
      totalSellers: Number(sellersCount[0]?.count ?? 0),
      totalProducts: Number(productsCount[0]?.count ?? 0),
      totalOrders: Number(ordersCount[0]?.count ?? 0),
      totalRevenue: parseFloat(revenueResult[0]?.total ?? "0"),
      pendingApprovals: Number(pendingApprovals[0]?.count ?? 0),
      usersByRole,
      ordersByStatus,
      topShops: topShops.map(s => ({ shopName: s.shopName ?? "Unknown", revenue: parseFloat(s.revenue), orders: Number(s.orders) })),
    });
  } catch (err) {
    req.log.error({ err }, "Analytics error");
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// ── Categories ────────────────────────────────────────────────────────────────
router.get("/categories", async (_req, res) => {
  try {
    res.json(await db.select().from(categoriesTable).orderBy(categoriesTable.name));
  } catch { res.status(500).json({ error: "Failed to list categories" }); }
});

router.post("/categories", async (req, res) => {
  try {
    const { name, parentId } = req.body as { name: string; parentId?: string };
    const [cat] = await db.insert(categoriesTable).values({ name, parentId: parentId ?? null }).returning();
    await logAction(req.userId!, "CREATE_CATEGORY", "CATEGORY", cat.id, name);
    res.json(cat);
  } catch { res.status(500).json({ error: "Failed to create category" }); }
});

router.patch("/categories/:id", async (req, res) => {
  try {
    const [cat] = await db.update(categoriesTable).set({ name: req.body.name }).where(eq(categoriesTable.id, req.params.id)).returning();
    res.json(cat);
  } catch { res.status(500).json({ error: "Failed to update category" }); }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const products = await db.select({ count: sql<number>`count(*)` }).from(productsTable).where(eq(productsTable.categoryId, req.params.id));
    if (Number(products[0]?.count) > 0) { res.status(400).json({ error: "Cannot delete category with products" }); return; }
    await db.delete(categoriesTable).where(eq(categoriesTable.id, req.params.id));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete category" }); }
});

// ── Legacy sellers endpoints ────────────────────────────────────────────────────
router.get("/sellers", async (req, res) => {
  try {
    const sellers = await db.query.usersTable.findMany({ where: eq(usersTable.role, "SELLER"), with: { shop: true } });
    res.json(sellers.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, shop: u.shop, createdAt: u.createdAt })));
  } catch { res.status(500).json({ error: "Failed to list sellers" }); }
});

router.post("/sellers/:id/approve", async (req, res) => {
  try {
    const [shop] = await db.update(shopsTable).set({ isApproved: true, updatedAt: new Date() }).where(eq(shopsTable.userId, req.params.id)).returning();
    res.json(shop);
  } catch { res.status(500).json({ error: "Failed to approve" }); }
});

router.post("/sellers/:id/reject", async (req, res) => {
  try {
    const [shop] = await db.update(shopsTable).set({ isApproved: false, updatedAt: new Date() }).where(eq(shopsTable.userId, req.params.id)).returning();
    res.json(shop);
  } catch { res.status(500).json({ error: "Failed to reject" }); }
});

export default router;
