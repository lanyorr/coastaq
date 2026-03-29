import { Router } from "express";
import { requireAuth } from "../lib/auth.js";

const router = Router();

function getPaypalBaseUrl() {
  const mode = process.env["PAYPAL_MODE"] ?? "live";
  return mode === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

async function getPaypalAccessToken(): Promise<string> {
  const clientId = process.env["PAYPAL_CLIENT_ID"];
  const secret = process.env["PAYPAL_CLIENT_SECRET"];
  if (!clientId || !secret) throw new Error("PayPal credentials not configured");
  const credentials = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${getPaypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export interface ShopProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  priceNum: number;
  category: string;
  badge?: string;
  highlights: string[];
  deliverable: string;
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: "seller-starter-pack",
    title: "Seller Starter Pack",
    description: "Everything you need to launch your Coastaq store fast. Includes listing templates, pricing guides, and a 30-day launch checklist.",
    price: "9.99",
    priceNum: 9.99,
    category: "Business",
    badge: "Best Value",
    highlights: ["50 Listing Templates", "Pricing Strategy Guide", "30-Day Launch Checklist", "Email Scripts"],
    deliverable: "Instant digital download — ZIP archive",
  },
  {
    id: "marketing-mastery-bundle",
    title: "Marketing Mastery Bundle",
    description: "A complete digital marketing toolkit built for online marketplace sellers. Social, email, and ad copy included.",
    price: "24.99",
    priceNum: 24.99,
    category: "Marketing",
    highlights: ["100+ Canva Templates", "Email Campaign Sequences", "Ad Copy Swipe File", "Hashtag Strategy Guide"],
    deliverable: "Instant digital download — PDF + Canva links",
  },
  {
    id: "ecommerce-blueprint",
    title: "E-commerce Business Blueprint",
    description: "A step-by-step digital course covering everything from product sourcing to scaling your online business to 6 figures.",
    price: "29.99",
    priceNum: 29.99,
    category: "Course",
    badge: "Most Popular",
    highlights: ["12 Video Modules", "Workbook & Action Plans", "Private Community Access", "Lifetime Updates"],
    deliverable: "Instant access — online course portal",
  },
  {
    id: "brand-identity-kit",
    title: "Brand Identity Kit",
    description: "Professional branding templates to make your shop look polished and trustworthy. Editable in Canva — no designer needed.",
    price: "14.99",
    priceNum: 14.99,
    category: "Design",
    highlights: ["Logo Variations (50+)", "Brand Colour Palettes", "Social Media Banners", "Business Card Templates"],
    deliverable: "Instant digital download — Canva + PNG files",
  },
  {
    id: "social-media-content-pack",
    title: "Social Media Content Pack",
    description: "200+ ready-to-use social media templates optimised for product promotion. Boost your reach and drive traffic to your shop.",
    price: "12.99",
    priceNum: 12.99,
    category: "Marketing",
    highlights: ["200+ Post Templates", "Stories & Reels Formats", "Caption Copy Library", "Hashtag Sets per Niche"],
    deliverable: "Instant digital download — Canva links",
  },
  {
    id: "legal-contract-templates",
    title: "Legal Contract Templates",
    description: "Protect your business with professional, lawyer-reviewed contract templates. Ready to customise and use immediately.",
    price: "19.99",
    priceNum: 19.99,
    category: "Legal",
    highlights: ["Client Agreement Template", "Freelance Contract", "NDA Template", "Refund Policy Template"],
    deliverable: "Instant digital download — DOCX + PDF",
  },
];

// ── GET /api/shop/products (public) ──────────────────────────────────────────
router.get("/products", (_req, res) => {
  res.json({ products: SHOP_PRODUCTS });
});

// ── POST /api/shop/create-order (auth required) ───────────────────────────────
router.post("/create-order", requireAuth, async (req, res) => {
  const { productId } = req.body;
  if (!productId) { res.status(400).json({ error: "productId is required" }); return; }

  const product = SHOP_PRODUCTS.find(p => p.id === productId);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  try {
    const accessToken = await getPaypalAccessToken();
    const host = process.env["REPLIT_DOMAINS"]?.split(",")[0] ?? `${req.protocol}://${req.get("host")}`;
    const baseUrl = host.startsWith("http") ? host : `https://${host}`;

    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: product.price },
          description: `Coastaq Shop — ${product.title}`,
          custom_id: `${req.userId}:${product.id}`,
        },
      ],
      application_context: {
        brand_name: "Coastaq Marketplace",
        user_action: "PAY_NOW",
        return_url: `${baseUrl}/shop`,
        cancel_url: `${baseUrl}/shop`,
      },
    };

    const orderRes = await fetch(`${getPaypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      req.log.error({ err }, "PayPal create shop order failed");
      res.status(502).json({ error: "Failed to create PayPal order" });
      return;
    }

    const order = await orderRes.json() as { id: string };
    res.json({ orderID: order.id, product });
  } catch (err: any) {
    req.log.error({ err }, "Create shop PayPal order error");
    res.status(500).json({ error: err.message ?? "Failed to create order" });
  }
});

// ── POST /api/shop/capture-order (auth required) ──────────────────────────────
router.post("/capture-order", requireAuth, async (req, res) => {
  const { orderID } = req.body;
  if (!orderID) { res.status(400).json({ error: "orderID is required" }); return; }

  try {
    const accessToken = await getPaypalAccessToken();

    const captureRes = await fetch(
      `${getPaypalBaseUrl()}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!captureRes.ok) {
      const err = await captureRes.text();
      req.log.error({ err, orderID }, "PayPal shop capture failed");
      res.status(502).json({ error: "Payment capture failed" });
      return;
    }

    const capture = await captureRes.json() as {
      status: string;
      id: string;
      purchase_units?: Array<{
        custom_id?: string;
        payments?: { captures?: Array<{ status: string }> };
      }>;
    };

    const captureStatus = capture.purchase_units?.[0]?.payments?.captures?.[0]?.status;
    if (capture.status !== "COMPLETED" && captureStatus !== "COMPLETED") {
      res.status(402).json({ error: `Payment not completed (status: ${capture.status})` });
      return;
    }

    const customId = capture.purchase_units?.[0]?.custom_id ?? "";
    const productId = customId.split(":")[1] ?? "";
    const product = SHOP_PRODUCTS.find(p => p.id === productId);

    req.log.info({ userId: req.userId, orderID, productId }, "Shop purchase completed");

    res.json({
      success: true,
      paypalOrderId: orderID,
      product: product ?? null,
      message: "Payment successful! Your purchase is ready.",
    });
  } catch (err: any) {
    req.log.error({ err }, "Capture shop PayPal order error");
    res.status(500).json({ error: err.message ?? "Failed to capture payment" });
  }
});

export default router;
