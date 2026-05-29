import { Router } from "express";
import { db } from "@workspace/db";
import { userRolesTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";
import { requireAnyRole, type AppRole } from "../lib/rbac.js";

const router = Router();

const VALID_ROLES: AppRole[] = ["BUYER", "SELLER", "AFFILIATE", "ADMIN"];

// GET /api/roles/me — get my current roles
router.get("/me", requireAuth, async (req, res) => {
  try {
    const roles = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, req.userId!));

    res.json({
      userId: req.userId,
      roles: roles.map(r => r.role),
    });
  } catch (err) {
    req.log.error({ err }, "Get my roles error");
    res.status(500).json({ error: "Failed to get roles" });
  }
});

// GET /api/roles/user/:userId — get roles for a user (admin only)
router.get("/user/:userId", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const roles = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, req.params.userId));

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, req.params.userId),
    });

    res.json({
      userId: req.params.userId,
      userName: user?.name,
      roles: roles.map(r => ({ role: r.role, grantedAt: r.grantedAt })),
    });
  } catch (err) {
    req.log.error({ err }, "Get user roles error");
    res.status(500).json({ error: "Failed to get user roles" });
  }
});

// POST /api/roles/user/:userId/grant — grant a role (admin only)
router.post("/user/:userId/grant", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { role } = req.body as { role: AppRole };

    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
      return;
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, req.params.userId),
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Upsert — ignore duplicate
    await db
      .insert(userRolesTable)
      .values({
        userId: req.params.userId,
        role,
        grantedBy: req.userId!,
      })
      .onConflictDoNothing();

    res.json({ success: true, userId: req.params.userId, role });
  } catch (err) {
    req.log.error({ err }, "Grant role error");
    res.status(500).json({ error: "Failed to grant role" });
  }
});

// DELETE /api/roles/user/:userId/revoke — revoke a role (admin only)
router.delete("/user/:userId/revoke", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { role } = req.body as { role: AppRole };

    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
      return;
    }

    // Prevent removing the last ADMIN role
    if (role === "ADMIN") {
      const admins = await db
        .select()
        .from(userRolesTable)
        .where(eq(userRolesTable.role, "ADMIN"));
      if (admins.length <= 1 && admins[0]?.userId === req.params.userId) {
        res.status(400).json({ error: "Cannot remove the last admin role" });
        return;
      }
    }

    await db
      .delete(userRolesTable)
      .where(
        and(
          eq(userRolesTable.userId, req.params.userId),
          eq(userRolesTable.role, role),
        ),
      );

    res.json({ success: true, userId: req.params.userId, revokedRole: role });
  } catch (err) {
    req.log.error({ err }, "Revoke role error");
    res.status(500).json({ error: "Failed to revoke role" });
  }
});

// GET /api/roles/config — get permission map (for frontend reference, admin only)
router.get("/config", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const { PERMISSION_MAP, ROLE_DASHBOARD } = await import("../lib/rbac.js");
  res.json({ permissions: PERMISSION_MAP, dashboards: ROLE_DASHBOARD });
});

export default router;
