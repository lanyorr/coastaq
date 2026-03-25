import { Router } from "express";
import { db } from "@workspace/db";
import { shopsTable, productsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const shops = await db.query.shopsTable.findMany({
      where: eq(shopsTable.isApproved, true),
      orderBy: [desc(shopsTable.createdAt)],
    });
    res.json(shops);
  } catch (err) {
    req.log.error({ err }, "List shops error");
    res.status(500).json({ error: "Failed to list shops" });
  }
});

router.get("/my", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    res.json(shop);
  } catch (err) {
    req.log.error({ err }, "Get my shop error");
    res.status(500).json({ error: "Failed to get shop" });
  }
});

router.put("/my", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const { name, description, logo, banner, phone, whatsapp } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (logo !== undefined) updates.logo = logo;
    if (banner !== undefined) updates.banner = banner;
    if (phone !== undefined) updates.phone = phone;
    if (whatsapp !== undefined) updates.whatsapp = whatsapp;

    const [shop] = await db.update(shopsTable).set(updates)
      .where(eq(shopsTable.userId, req.userId!)).returning();
    res.json(shop);
  } catch (err) {
    req.log.error({ err }, "Update shop error");
    res.status(500).json({ error: "Failed to update shop" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.id, req.params.id),
    });
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    res.json(shop);
  } catch (err) {
    req.log.error({ err }, "Get shop error");
    res.status(500).json({ error: "Failed to get shop" });
  }
});

export default router;
