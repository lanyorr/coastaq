import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, hashPassword, comparePassword, requireAuth } from "../lib/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, shopName, shopDescription } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    if (!["BUYER", "SELLER"].includes(role)) {
      res.status(400).json({ error: "Role must be BUYER or SELLER" });
      return;
    }

    if (role === "SELLER" && !shopName) {
      res.status(400).json({ error: "Shop name is required for sellers" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      email,
      passwordHash,
      name,
      role,
    }).returning();

    let shop = null;
    if (role === "SELLER" && shopName) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      const [newShop] = await db.insert(shopsTable).values({
        name: shopName,
        description: shopDescription || "",
        userId: user.id,
        isApproved: true,
        subscriptionStatus: "TRIAL",
        trialEndsAt,
      }).returning();
      shop = newShop;
    }

    const token = signToken({ userId: user.id, role: user.role });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, shop, createdAt: user.createdAt },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const shop = await db.select().from(shopsTable).where(eq(shopsTable.userId, user.id)).limit(1);
    const token = signToken({ userId: user.id, role: user.role });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, shop: shop[0] || null, createdAt: user.createdAt },
      token,
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const shop = await db.select().from(shopsTable).where(eq(shopsTable.userId, user.id)).limit(1);
    res.json({
      id: user.id, email: user.email, name: user.name, role: user.role,
      shop: shop[0] || null, createdAt: user.createdAt
    });
  } catch (err) {
    req.log.error({ err }, "Get me error");
    res.status(500).json({ error: "Failed to get user" });
  }
});

router.delete("/me", requireAuth, async (req, res) => {
  try {
    const { password } = req.body as { password: string };
    if (!password) {
      res.status(400).json({ error: "Password is required to delete your account" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Prevent admins from self-deleting via this endpoint
    if (user.role === "ADMIN") {
      res.status(403).json({ error: "Admin accounts cannot be deleted via this endpoint" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    // Delete user — shop/products/orders cascade via FK constraints
    await db.delete(usersTable).where(eq(usersTable.id, user.id));

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Delete account error");
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
