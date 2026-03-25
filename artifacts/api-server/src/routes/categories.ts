import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";
import { eq, isNull, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const all = await db.select().from(categoriesTable);

    // Build hierarchy
    const map = new Map<string, Record<string, unknown>>();
    const roots: Record<string, unknown>[] = [];

    for (const cat of all) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of all) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        (map.get(cat.parentId)!.children as unknown[]).push(node);
      } else {
        roots.push(node);
      }
    }

    res.json(roots);
  } catch (err) {
    req.log.error({ err }, "List categories error");
    res.status(500).json({ error: "Failed to list categories" });
  }
});

router.post("/", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    const [cat] = await db.insert(categoriesTable).values({
      name,
      parentId: parentId || null,
    }).returning();
    res.json({ ...cat, children: [] });
  } catch (err) {
    req.log.error({ err }, "Create category error");
    res.status(500).json({ error: "Failed to create category" });
  }
});

router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (parentId !== undefined) updates.parentId = parentId || null;

    const [cat] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, req.params.id)).returning();
    res.json({ ...cat, children: [] });
  } catch (err) {
    req.log.error({ err }, "Update category error");
    res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    await db.delete(categoriesTable).where(eq(categoriesTable.id, req.params.id));
    res.json({ message: "Category deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete category error");
    res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
