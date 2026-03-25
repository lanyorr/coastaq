import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, shopsTable, categoriesTable } from "@workspace/db";
import { eq, desc, ilike, and, sql } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { categoryId, search, shopId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
    if (shopId) conditions.push(eq(productsTable.shopId, shopId));
    if (search) conditions.push(ilike(productsTable.title, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [products, countResult] = await Promise.all([
      db.query.productsTable.findMany({
        where,
        limit: limitNum,
        offset,
        orderBy: [desc(productsTable.createdAt)],
        with: {
          shop: true,
          category: true,
        },
      }),
      db.select({ count: sql<number>`count(*)` }).from(productsTable).where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    res.json({
      products: products.map(p => ({
        ...p,
        price: parseFloat(p.price),
        images: p.images || [],
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error({ err }, "List products error");
    res.status(500).json({ error: "Failed to list products" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, req.params.id),
      with: { shop: true, category: true },
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ ...product, price: parseFloat(product.price), images: product.images || [] });
  } catch (err) {
    req.log.error({ err }, "Get product error");
    res.status(500).json({ error: "Failed to get product" });
  }
});

router.post("/", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
    });
    if (!shop) {
      res.status(403).json({ error: "No shop found. Create a shop first." });
      return;
    }
    if (!shop.isApproved) {
      res.status(403).json({ error: "Your shop is pending approval." });
      return;
    }

    const { title, description, price, stock, condition, location, images, categoryId } = req.body;
    if (!title || price == null || stock == null || !condition) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [product] = await db.insert(productsTable).values({
      title,
      description: description || "",
      price: String(price),
      stock: parseInt(stock),
      condition,
      location: location || "",
      images: images || [],
      categoryId: categoryId || null,
      shopId: shop.id,
    }).returning();

    const full = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, product.id),
      with: { shop: true, category: true },
    });

    res.json({ ...full!, price: parseFloat(full!.price), images: full!.images || [] });
  } catch (err) {
    req.log.error({ err }, "Create product error");
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/:id", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const product = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, req.params.id),
      with: { shop: true },
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (req.userRole !== "ADMIN" && product.shop?.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { title, description, price, stock, condition, location, images, categoryId } = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = String(price);
    if (stock !== undefined) updates.stock = parseInt(stock);
    if (condition !== undefined) updates.condition = condition;
    if (location !== undefined) updates.location = location;
    if (images !== undefined) updates.images = images;
    if (categoryId !== undefined) updates.categoryId = categoryId;

    await db.update(productsTable).set(updates).where(eq(productsTable.id, req.params.id));
    const updated = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, req.params.id),
      with: { shop: true, category: true },
    });

    res.json({ ...updated!, price: parseFloat(updated!.price), images: updated!.images || [] });
  } catch (err) {
    req.log.error({ err }, "Update product error");
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const product = await db.query.productsTable.findFirst({
      where: eq(productsTable.id, req.params.id),
      with: { shop: true },
    });
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (req.userRole !== "ADMIN" && product.shop?.userId !== req.userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(productsTable).where(eq(productsTable.id, req.params.id));
    res.json({ message: "Product deleted" });
  } catch (err) {
    req.log.error({ err }, "Delete product error");
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
