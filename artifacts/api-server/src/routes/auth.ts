import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, shopsTable, productsTable, ordersTable, orderItemsTable, userRolesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import {
  signToken, signRefreshToken, verifyRefreshToken,
  hashPassword, comparePassword, requireAuth,
  ensureUserRole, getUserRoles,
} from "../lib/auth.js";
import rateLimit from "express-rate-limit";

const router = Router();

// ── Rate limiters ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "Too many registration attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { email, password, name, role, shopName, shopDescription } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ error: "Missing required fields" }); return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" }); return;
    }
    if (!["BUYER", "SELLER"].includes(role)) {
      res.status(400).json({ error: "Role must be BUYER or SELLER" }); return;
    }
    if (role === "SELLER" && !shopName) {
      res.status(400).json({ error: "Shop name is required for sellers" }); return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" }); return;
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({ email, passwordHash, name, role }).returning();

    // ── Grant initial role in user_roles ──────────────────────────────────
    await ensureUserRole(user.id, role as "BUYER" | "SELLER");
    // Sellers also get BUYER role (they can buy too)
    if (role === "SELLER") await ensureUserRole(user.id, "BUYER");

    let shop = null;
    if (role === "SELLER" && shopName) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      const [newShop] = await db.insert(shopsTable).values({
        name: shopName, description: shopDescription || "",
        userId: user.id, isApproved: true,
        subscriptionStatus: "TRIAL", trialEndsAt,
      }).returning();
      shop = newShop;
    }

    const roles = await getUserRoles(user.id);
    const token = signToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, roles, shop, createdAt: user.createdAt },
      token,
      refreshToken,
    });
  } catch (err) {
    req.log.error({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" }); return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }
    if (user.isBlocked) { res.status(403).json({ error: "Account suspended. Contact support." }); return; }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Invalid credentials" }); return; }

    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.userId, user.id)).limit(1);

    // ── Backfill user_roles for legacy users (migration safety) ──────────
    let roles = await getUserRoles(user.id);
    if (roles.length === 0) {
      await ensureUserRole(user.id, user.role as "BUYER" | "SELLER" | "ADMIN");
      if (user.role === "SELLER") await ensureUserRole(user.id, "BUYER");
      roles = await getUserRoles(user.id);
    }

    const token = signToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, roles, shop: shop || null, createdAt: user.createdAt },
      token,
      refreshToken,
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ error: "refreshToken is required" }); return; }

    const payload = verifyRefreshToken(refreshToken);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (!user || user.isBlocked) { res.status(403).json({ error: "Account not available" }); return; }

    const token = signToken({ userId: user.id, role: user.role });
    const roles = await getUserRoles(user.id);
    res.json({ token, roles });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.userId, user.id)).limit(1);
    const roles = req.userRoles ?? [user.role];
    res.json({
      id: user.id, email: user.email, name: user.name, role: user.role,
      roles, shop: shop || null, createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Failed to get user" });
  }
});

// ── DELETE /api/auth/me ───────────────────────────────────────────────────────
router.delete("/me", requireAuth, async (req, res) => {
  try {
    const { password } = req.body as { password: string };
    if (!password) { res.status(400).json({ error: "Password is required to delete your account" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    if (user.role === "ADMIN") { res.status(403).json({ error: "Admin accounts cannot be deleted via this endpoint" }); return; }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Incorrect password" }); return; }

    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.userId, user.id)).limit(1);
    if (shop) {
      const shopProducts = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.shopId, shop.id));
      const productIds = shopProducts.map(p => p.id);
      if (productIds.length > 0) await db.delete(orderItemsTable).where(inArray(orderItemsTable.productId, productIds));
      await db.delete(productsTable).where(eq(productsTable.shopId, shop.id));
      await db.delete(shopsTable).where(eq(shopsTable.id, shop.id));
    }

    await db.delete(ordersTable).where(eq(ordersTable.userId, user.id));
    await db.delete(usersTable).where(eq(usersTable.id, user.id));

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Delete account error");
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
