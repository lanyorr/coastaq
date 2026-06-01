import { Router } from "express";
import { db } from "@workspace/db";
import { shopsTable, productsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = toSlug(base) || "shop";
  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = attempt === 0 ? candidate : `${candidate}-${attempt}`;
    const existing = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.slug, slug),
      columns: { id: true, slug: true },
    });
    if (!existing || existing.id === excludeId) return slug;
  }
  return `${candidate}-${Date.now()}`;
}

const SHOP_SELECT_COLS = {
  id: shopsTable.id,
  name: shopsTable.name,
  slug: shopsTable.slug,
  description: shopsTable.description,
  logo: shopsTable.logo,
  banner: shopsTable.banner,
  phone: shopsTable.phone,
  whatsapp: shopsTable.whatsapp,
  email: shopsTable.email,
  website: shopsTable.website,
  address: shopsTable.address,
  city: shopsTable.city,
  country: shopsTable.country,
  businessHours: shopsTable.businessHours,
  accentColor: shopsTable.accentColor,
  facebookUrl: shopsTable.facebookUrl,
  instagramUrl: shopsTable.instagramUrl,
  tiktokUrl: shopsTable.tiktokUrl,
  twitterUrl: shopsTable.twitterUrl,
  youtubeUrl: shopsTable.youtubeUrl,
  isApproved: shopsTable.isApproved,
  isSuspended: shopsTable.isSuspended,
  userId: shopsTable.userId,
  subscriptionStatus: shopsTable.subscriptionStatus,
  trialEndsAt: shopsTable.trialEndsAt,
  subscriptionCurrentPeriodEnd: shopsTable.subscriptionCurrentPeriodEnd,
  createdAt: shopsTable.createdAt,
  updatedAt: shopsTable.updatedAt,
  productCount: sql<number>`(select count(*) from products where products.shop_id = ${shopsTable.id})::int`,
};

// ─── Public: list all approved shops ─────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const shops = await db
      .select(SHOP_SELECT_COLS)
      .from(shopsTable)
      .where(eq(shopsTable.isApproved, true))
      .orderBy(desc(shopsTable.createdAt));
    res.json(shops);
  } catch (err) {
    req.log.error({ err }, "List shops error");
    res.status(500).json({ error: "Failed to list shops" });
  }
});

// ─── Seller: get ALL own shops ────────────────────────────────────────────────
router.get("/my/all", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const shops = await db
      .select(SHOP_SELECT_COLS)
      .from(shopsTable)
      .where(eq(shopsTable.userId, req.userId!))
      .orderBy(shopsTable.createdAt);
    res.json(shops);
  } catch (err) {
    req.log.error({ err }, "List my shops error");
    res.status(500).json({ error: "Failed to list shops" });
  }
});

// ─── Seller: get first own shop (backward compat) ────────────────────────────
router.get("/my", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const [shop] = await db
      .select(SHOP_SELECT_COLS)
      .from(shopsTable)
      .where(eq(shopsTable.userId, req.userId!))
      .orderBy(shopsTable.createdAt)
      .limit(1);
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

// ─── Seller: create a new shop (max 3) ───────────────────────────────────────
router.post("/", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const existing = await db
      .select({ id: shopsTable.id })
      .from(shopsTable)
      .where(eq(shopsTable.userId, req.userId!));

    if (existing.length >= 3) {
      res.status(400).json({ error: "Maximum of 3 shops allowed per seller." });
      return;
    }

    const { name = "My Shop", description } = req.body;
    const slug = await uniqueSlug(String(name));

    const [shop] = await db.insert(shopsTable).values({
      name: String(name),
      description: description ?? null,
      userId: req.userId!,
      slug,
      isApproved: false,
    }).returning();

    res.status(201).json(shop);
  } catch (err) {
    req.log.error({ err }, "Create shop error");
    res.status(500).json({ error: "Failed to create shop" });
  }
});

// ─── Seller: update own shop (backward compat: updates first shop) ───────────
router.put("/my", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const [current] = await db
      .select({ id: shopsTable.id, slug: shopsTable.slug, name: shopsTable.name })
      .from(shopsTable)
      .where(eq(shopsTable.userId, req.userId!))
      .orderBy(shopsTable.createdAt)
      .limit(1);
    if (!current) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    const [shop] = await db.update(shopsTable)
      .set(await buildShopUpdates(req.body, current))
      .where(eq(shopsTable.id, current.id))
      .returning();
    res.json(shop);
  } catch (err) {
    req.log.error({ err }, "Update my shop error");
    res.status(500).json({ error: "Failed to update shop" });
  }
});

// ─── Public: get shop by slug ─────────────────────────────────────────────────
router.get("/slug/:slug", async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.slug, req.params.slug),
    });
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    const [productCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(eq(productsTable.shopId, shop.id));
    res.json({ ...shop, productCount: productCount?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Get shop by slug error");
    res.status(500).json({ error: "Failed to get shop" });
  }
});

// ─── Public: get shop by ID ───────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.id, req.params.id as string),
    });
    if (!shop) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }
    const [productCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(eq(productsTable.shopId, shop.id));
    res.json({ ...shop, productCount: productCount?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Get shop error");
    res.status(500).json({ error: "Failed to get shop" });
  }
});

// ─── Seller: update specific shop by ID ──────────────────────────────────────
router.put("/:id", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const current = await db.query.shopsTable.findFirst({
      where: and(eq(shopsTable.id, req.params.id as string), eq(shopsTable.userId, req.userId!)),
      columns: { id: true, slug: true, name: true },
    });
    if (!current) {
      res.status(404).json({ error: "Shop not found or not owned by you" });
      return;
    }
    const [shop] = await db.update(shopsTable)
      .set(await buildShopUpdates(req.body, current))
      .where(eq(shopsTable.id, current.id))
      .returning();
    res.json(shop);
  } catch (err) {
    req.log.error({ err }, "Update shop error");
    res.status(500).json({ error: "Failed to update shop" });
  }
});

// ─── Seller: delete specific shop ────────────────────────────────────────────
router.delete("/:id", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const existing = await db.query.shopsTable.findFirst({
      where: and(eq(shopsTable.id, req.params.id as string), eq(shopsTable.userId, req.userId!)),
      columns: { id: true },
    });
    if (!existing) {
      res.status(404).json({ error: "Shop not found or not owned by you" });
      return;
    }
    await db.delete(shopsTable).where(eq(shopsTable.id, req.params.id as string));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete shop error");
    res.status(500).json({ error: "Failed to delete shop" });
  }
});

// ─── Shared: build update payload ────────────────────────────────────────────
async function buildShopUpdates(
  body: Record<string, unknown>,
  current: { id: string; slug: string | null; name: string },
) {
  const {
    name, slug, description, logo, banner, phone, whatsapp,
    email, website, address, city, country, businessHours,
    accentColor, facebookUrl, instagramUrl, tiktokUrl, twitterUrl, youtubeUrl,
  } = body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (logo !== undefined) updates.logo = logo;
  if (banner !== undefined) updates.banner = banner;
  if (phone !== undefined) updates.phone = phone;
  if (whatsapp !== undefined) updates.whatsapp = whatsapp;
  if (email !== undefined) updates.email = email;
  if (website !== undefined) updates.website = website;
  if (address !== undefined) updates.address = address;
  if (city !== undefined) updates.city = city;
  if (country !== undefined) updates.country = country;
  if (businessHours !== undefined) updates.businessHours = businessHours;
  if (accentColor !== undefined) updates.accentColor = accentColor;
  if (facebookUrl !== undefined) updates.facebookUrl = facebookUrl;
  if (instagramUrl !== undefined) updates.instagramUrl = instagramUrl;
  if (tiktokUrl !== undefined) updates.tiktokUrl = tiktokUrl;
  if (twitterUrl !== undefined) updates.twitterUrl = twitterUrl;
  if (youtubeUrl !== undefined) updates.youtubeUrl = youtubeUrl;

  if (slug !== undefined && slug !== "") {
    // Seller is explicitly setting a custom slug
    updates.slug = await uniqueSlug(String(slug), current.id);
  } else if (!current.slug) {
    // Auto-generate slug on first save if none exists
    updates.slug = await uniqueSlug(String(name ?? current.name), current.id);
  }

  return updates;
}

export default router;
