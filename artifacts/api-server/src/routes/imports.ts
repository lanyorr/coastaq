import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";
import {
  db,
  sellerImportsTable,
  sellerImportRowsTable,
  fieldMappingProfilesTable,
  shopsTable,
  productsTable,
  categoriesTable,
} from "@workspace/db";
import { eq, desc, and, ilike } from "drizzle-orm";
import { getSubscriptionInfo } from "./subscription.js";

const router = Router();

/* ─── helpers ──────────────────────────────────────────────────────────────── */

async function requireActiveSubscription(req: Request, res: Response, next: NextFunction) {
  const shops = await db
    .select()
    .from(shopsTable)
    .where(eq(shopsTable.userId, (req as any).user.id))
    .limit(1);
  if (!shops.length) return res.status(404).json({ error: "Shop not found" });
  const info = getSubscriptionInfo(shops[0]);
  if (info.status !== "ACTIVE") {
    return res.status(403).json({
      error: "CSV Import requires an Active (paid) subscription",
      code: "SUBSCRIPTION_REQUIRED",
    });
  }
  (req as any).shop = shops[0];
  next();
}

/* ─── GET /api/imports/categories ─────────────────────────────────────────── */
router.get("/categories", requireAuth, async (_req, res) => {
  const cats = await db
    .select({ id: categoriesTable.id, name: categoriesTable.name })
    .from(categoriesTable)
    .orderBy(categoriesTable.name);
  res.json(cats);
});

/* ─── GET /api/imports/mapping-profiles ───────────────────────────────────── */
router.get("/mapping-profiles", requireAuth, requireRole("SELLER"), async (req, res) => {
  const shops = await db
    .select({ id: shopsTable.id })
    .from(shopsTable)
    .where(eq(shopsTable.userId, (req as any).user.id))
    .limit(1);
  if (!shops.length) return res.json([]);
  const profiles = await db
    .select()
    .from(fieldMappingProfilesTable)
    .where(eq(fieldMappingProfilesTable.shopId, shops[0].id))
    .orderBy(desc(fieldMappingProfilesTable.createdAt));
  res.json(profiles.map(p => ({ ...p, mappings: JSON.parse(p.mappings) })));
});

/* ─── POST /api/imports/mapping-profiles ──────────────────────────────────── */
router.post("/mapping-profiles", requireAuth, requireRole("SELLER"), async (req, res) => {
  const shops = await db
    .select({ id: shopsTable.id })
    .from(shopsTable)
    .where(eq(shopsTable.userId, (req as any).user.id))
    .limit(1);
  if (!shops.length) return res.status(404).json({ error: "Shop not found" });
  const { name, mappings } = req.body;
  if (!name || !mappings) return res.status(400).json({ error: "name and mappings required" });
  const [profile] = await db
    .insert(fieldMappingProfilesTable)
    .values({ shopId: shops[0].id, name, mappings: JSON.stringify(mappings) })
    .returning();
  res.json({ ...profile, mappings });
});

/* ─── POST /api/imports/validate ──────────────────────────────────────────── */
router.post(
  "/validate",
  requireAuth,
  requireRole("SELLER"),
  requireActiveSubscription,
  async (req, res) => {
    const {
      rows,
      mapping,
    }: { rows: Record<string, string>[]; mapping: Record<string, string> } = req.body;

    if (!Array.isArray(rows) || rows.length === 0)
      return res.status(400).json({ error: "No rows provided" });

    const categories = await db
      .select({ id: categoriesTable.id, name: categoriesTable.name })
      .from(categoriesTable);
    const categoryByName = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
    const VALID_CONDITIONS = new Set(["NEW", "USED", "REFURBISHED"]);
    const seenTitles = new Set<string>();

    const validatedRows = rows.map((rawRow, idx) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      /* apply mapping */
      const mapped: Record<string, string> = {};
      for (const [csvCol, pField] of Object.entries(mapping)) {
        if (pField && pField !== "_ignore") {
          mapped[pField] = (rawRow[csvCol] ?? "").trim();
        }
      }

      /* required: title */
      if (!mapped.title) errors.push("Product Name is required");

      /* required: price */
      if (!mapped.price) {
        errors.push("Price is required");
      } else {
        const p = parseFloat(mapped.price.replace(/[^0-9.]/g, ""));
        if (isNaN(p) || p <= 0) errors.push(`Invalid price: "${mapped.price}"`);
      }

      /* optional: stock */
      if (!mapped.stock) {
        warnings.push("Stock not set — will default to 0");
      } else {
        const s = parseInt(mapped.stock, 10);
        if (isNaN(s) || s < 0) errors.push(`Invalid stock: "${mapped.stock}"`);
      }

      /* optional: condition */
      if (mapped.condition) {
        const cond = mapped.condition.toUpperCase().trim();
        if (!VALID_CONDITIONS.has(cond)) {
          warnings.push(`Condition "${mapped.condition}" unknown — will use NEW`);
          mapped.condition = "NEW";
        } else {
          mapped.condition = cond;
        }
      }

      /* optional: category */
      if (mapped.category) {
        const catId = categoryByName.get(mapped.category.toLowerCase().trim());
        if (!catId) {
          warnings.push(`Category "${mapped.category}" not found — will be uncategorized`);
          delete mapped.category;
        } else {
          mapped.categoryId = catId;
        }
      }

      /* duplicate title detection */
      if (mapped.title) {
        const key = mapped.title.toLowerCase();
        if (seenTitles.has(key)) warnings.push(`Duplicate title "${mapped.title}" in this batch`);
        else seenTitles.add(key);
      }

      const status = errors.length > 0 ? "ERROR" : warnings.length > 0 ? "WARNING" : "READY";
      return { rowIndex: idx + 2, rawRow, mapped, status, errors, warnings };
    });

    res.json({
      rows: validatedRows,
      summary: {
        total: validatedRows.length,
        ready: validatedRows.filter(r => r.status === "READY").length,
        warnings: validatedRows.filter(r => r.status === "WARNING").length,
        errors: validatedRows.filter(r => r.status === "ERROR").length,
      },
    });
  },
);

/* ─── POST /api/imports/execute ───────────────────────────────────────────── */
router.post(
  "/execute",
  requireAuth,
  requireRole("SELLER"),
  requireActiveSubscription,
  async (req, res) => {
    const {
      rows,
      fileName,
      mode = "CREATE",
    }: {
      rows: Array<{ rowIndex: number; rawRow: Record<string, string>; mapped: Record<string, string>; status: string }>;
      fileName: string;
      mode: "CREATE" | "UPDATE" | "UPSERT";
    } = req.body;

    const shop = (req as any).shop;

    if (!Array.isArray(rows) || rows.length === 0)
      return res.status(400).json({ error: "No rows to import" });

    const categories = await db
      .select({ id: categoriesTable.id, name: categoriesTable.name })
      .from(categoriesTable);
    const categoryByName = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

    const importableRows = rows.filter(r => r.status !== "ERROR");
    let importedCount = 0;
    let failedCount = 0;

    const rowResults: Array<{
      rowIndex: number;
      status: string;
      productId?: string;
      errorMessage?: string;
      rowData: string;
    }> = [];

    for (const row of importableRows) {
      try {
        const m = row.mapped;
        let categoryId: string | undefined;
        if (m.categoryId) {
          categoryId = m.categoryId;
        } else if (m.category) {
          categoryId = categoryByName.get(m.category.toLowerCase().trim()) ?? undefined;
        }

        const price = parseFloat((m.price ?? "0").replace(/[^0-9.]/g, "")) || 0;
        const stock = parseInt(m.stock ?? "0", 10) || 0;
        const condition = (["NEW", "USED", "REFURBISHED"] as const).includes(
          (m.condition ?? "").toUpperCase() as any,
        )
          ? (m.condition.toUpperCase() as "NEW" | "USED" | "REFURBISHED")
          : "NEW";
        const images = m.images
          ? m.images.split(",").map((u: string) => u.trim()).filter(Boolean)
          : [];

        if (mode === "UPDATE" || mode === "UPSERT") {
          if (!m.title) throw new Error("Title required for UPDATE/UPSERT");
          const existing = await db
            .select({ id: productsTable.id })
            .from(productsTable)
            .where(and(eq(productsTable.shopId, shop.id), ilike(productsTable.title, m.title)))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(productsTable)
              .set({
                ...(m.description ? { description: m.description } : {}),
                price: price.toString(),
                stock,
                condition,
                ...(m.location ? { location: m.location } : {}),
                ...(images.length ? { images } : {}),
                ...(categoryId ? { categoryId } : {}),
                updatedAt: new Date(),
              })
              .where(eq(productsTable.id, existing[0].id));
            rowResults.push({ rowIndex: row.rowIndex, status: "IMPORTED", productId: existing[0].id, rowData: JSON.stringify(row.rawRow) });
            importedCount++;
            continue;
          }
          if (mode === "UPDATE") throw new Error(`Product "${m.title}" not found`);
        }

        /* CREATE (or UPSERT fallback) */
        if (!m.title) throw new Error("Product Name is required");
        const [product] = await db
          .insert(productsTable)
          .values({ title: m.title, description: m.description || "", price: price.toString(), stock, condition, location: m.location || "", images, categoryId, shopId: shop.id })
          .returning({ id: productsTable.id });

        rowResults.push({ rowIndex: row.rowIndex, status: "IMPORTED", productId: product.id, rowData: JSON.stringify(row.rawRow) });
        importedCount++;
      } catch (err: any) {
        rowResults.push({ rowIndex: row.rowIndex, status: "FAILED", errorMessage: err.message, rowData: JSON.stringify(row.rawRow) });
        failedCount++;
      }
    }

    const status = failedCount === 0 ? "COMPLETED" : importedCount === 0 ? "FAILED" : "PARTIAL";
    const [importRecord] = await db
      .insert(sellerImportsTable)
      .values({
        shopId: shop.id,
        fileName: fileName || "import.csv",
        status,
        mode,
        totalRows: importableRows.length,
        importedRows: importedCount,
        failedRows: failedCount,
        errorSummary: failedCount > 0
          ? JSON.stringify(rowResults.filter(r => r.status === "FAILED").map(r => ({ row: r.rowIndex, error: r.errorMessage })))
          : null,
      })
      .returning();

    if (rowResults.length > 0) {
      await db.insert(sellerImportRowsTable).values(
        rowResults.map(r => ({
          importId: importRecord.id,
          rowIndex: r.rowIndex,
          status: r.status,
          productId: r.productId ?? null,
          errorMessage: r.errorMessage ?? null,
          rowData: r.rowData,
        })),
      );
    }

    res.json({
      importId: importRecord.id,
      status,
      totalRows: importableRows.length,
      importedRows: importedCount,
      failedRows: failedCount,
      errorRows: rowResults.filter(r => r.status === "FAILED").slice(0, 20),
    });
  },
);

/* ─── GET /api/imports/history ────────────────────────────────────────────── */
router.get("/history", requireAuth, requireRole("SELLER"), async (req, res) => {
  const shops = await db
    .select({ id: shopsTable.id })
    .from(shopsTable)
    .where(eq(shopsTable.userId, (req as any).user.id))
    .limit(1);
  if (!shops.length) return res.json([]);
  const imports = await db
    .select()
    .from(sellerImportsTable)
    .where(eq(sellerImportsTable.shopId, shops[0].id))
    .orderBy(desc(sellerImportsTable.createdAt))
    .limit(50);
  res.json(imports);
});

/* ─── GET /api/imports/:id ────────────────────────────────────────────────── */
router.get("/:id", requireAuth, requireRole("SELLER"), async (req, res) => {
  const shops = await db
    .select({ id: shopsTable.id })
    .from(shopsTable)
    .where(eq(shopsTable.userId, (req as any).user.id))
    .limit(1);
  if (!shops.length) return res.status(404).json({ error: "Not found" });

  const [imp] = await db
    .select()
    .from(sellerImportsTable)
    .where(and(eq(sellerImportsTable.id, req.params.id), eq(sellerImportsTable.shopId, shops[0].id)))
    .limit(1);
  if (!imp) return res.status(404).json({ error: "Import not found" });

  const rowsData = await db
    .select()
    .from(sellerImportRowsTable)
    .where(eq(sellerImportRowsTable.importId, imp.id))
    .orderBy(sellerImportRowsTable.rowIndex)
    .limit(200);

  res.json({ ...imp, rows: rowsData });
});

export default router;
