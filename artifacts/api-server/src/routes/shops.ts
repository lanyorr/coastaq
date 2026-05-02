import { Router } from "express";
import { db } from "@workspace/db";
import { shopsTable, productsTable } from "@workspace/db";
import { eq, desc, sql, or } from "drizzle-orm";
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
  let attempt = 0;
  while (true) {
    const slug = attempt === 0 ? candidate : `${candidate}-${attempt}`;
    const existing = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.slug, slug),
      columns: { id: true, slug: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    attempt++;
  }
}

router.get("/", async (req, res) => {
  try {
    const shops = await db
      .select({
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
        createdAt: shopsTable.createdAt,
        updatedAt: shopsTable.updatedAt,
        productCount: sql<number>`(select count(*) from products where products.shop_id = ${shopsTable.id})::int`,
      })
      .from(shopsTable)
      .where(eq(shopsTable.isApproved, true))
      .orderBy(desc(shopsTable.createdAt));
    res.json(shops);
  } catch (err) {
    req.log.error({ err }, "List shops error");
    res.status(500).json({ error: "Failed to list shops" });
  }
});

router.get("/my", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const [shop] = await db
      .select({
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
      })
      .from(shopsTable)
      .where(eq(shopsTable.userId, req.userId!));
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
    const {
      name, description, logo, banner, phone, whatsapp,
      email, website, address, city, country, businessHours,
      accentColor, facebookUrl, instagramUrl, tiktokUrl, twitterUrl, youtubeUrl,
    } = req.body;

    const current = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.userId, req.userId!),
      columns: { id: true, slug: true, name: true },
    });
    if (!current) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }

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

    // Auto-generate slug if not set yet, or if name changed and slug was auto-derived
    if (!current.slug) {
      updates.slug = await uniqueSlug(String(name ?? current.name), current.id);
    }

    const [shop] = await db.update(shopsTable).set(updates)
      .where(eq(shopsTable.userId, req.userId!)).returning();
    res.json(shop);
  } catch (err) {
    req.log.error({ err }, "Update shop error");
    res.status(500).json({ error: "Failed to update shop" });
  }
});

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

router.get("/:id", async (req, res) => {
  try {
    const shop = await db.query.shopsTable.findFirst({
      where: eq(shopsTable.id, req.params.id),
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

export default router;
