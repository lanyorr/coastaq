import { Router } from "express";
import { requireAuth, requireRole } from "../lib/auth.js";

const router = Router();

const AI_BASE_URL = process.env["AI_API_BASE_URL"] || "https://openrouter.ai/api/v1";
const AI_API_KEY = process.env["AI_API_KEY"] || process.env["OPENAI_API_KEY"] || "";

async function callAI(messages: Array<{ role: string; content: string }>, maxTokens = 500): Promise<string> {
  if (!AI_API_KEY) throw new Error("AI API key not configured");

  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI request failed: ${err}`);
  }

  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content ?? "";
}

// POST /api/ai/product-description — generate a product description
router.post("/product-description", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const { title, category, condition, price, location, keywords } = req.body;

    if (!title) {
      res.status(400).json({ error: "title is required" }); return;
    }

    const prompt = [
      `Write a compelling product description for an e-commerce marketplace listing.`,
      `Product title: ${title}`,
      category ? `Category: ${category}` : "",
      condition ? `Condition: ${condition}` : "",
      price ? `Price: $${price}` : "",
      location ? `Location: ${location}` : "",
      keywords ? `Key features/keywords: ${keywords}` : "",
      `\nWrite 2-3 paragraphs. Be clear, honest, and highlight benefits. Avoid marketing fluff. Do not include a title or heading — just the body text.`,
    ].filter(Boolean).join("\n");

    const description = await callAI([
      { role: "system", content: "You are a professional e-commerce copywriter helping sellers write clear, honest product descriptions." },
      { role: "user", content: prompt },
    ]);

    res.json({ description: description.trim() });
  } catch (err: any) {
    req.log.error({ err }, "AI description error");
    if (err.message?.includes("not configured")) {
      res.status(503).json({ error: "AI service not configured" }); return;
    }
    res.status(500).json({ error: "Failed to generate description" });
  }
});

// POST /api/ai/product-title — suggest improved product titles
router.post("/product-title", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const { currentTitle, category, keywords } = req.body;
    if (!currentTitle) { res.status(400).json({ error: "currentTitle is required" }); return; }

    const prompt = [
      `Suggest 3 improved product listing titles for an e-commerce marketplace.`,
      `Current title: ${currentTitle}`,
      category ? `Category: ${category}` : "",
      keywords ? `Keywords: ${keywords}` : "",
      `\nReturn exactly 3 titles, one per line, numbered 1. 2. 3. — no extra text.`,
    ].filter(Boolean).join("\n");

    const raw = await callAI([
      { role: "system", content: "You are an e-commerce SEO expert. Write clear, keyword-rich product titles under 80 characters." },
      { role: "user", content: prompt },
    ]);

    const titles = raw.split("\n")
      .map(l => l.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    res.json({ titles });
  } catch (err: any) {
    req.log.error({ err }, "AI title error");
    if (err.message?.includes("not configured")) {
      res.status(503).json({ error: "AI service not configured" }); return;
    }
    res.status(500).json({ error: "Failed to generate titles" });
  }
});

// POST /api/ai/pricing-suggestion — suggest a competitive price
router.post("/pricing-suggestion", requireAuth, requireRole("SELLER", "ADMIN"), async (req, res) => {
  try {
    const { title, category, condition, currentPrice } = req.body;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const prompt = [
      `Give a brief pricing analysis for this marketplace listing.`,
      `Product: ${title}`,
      category ? `Category: ${category}` : "",
      condition ? `Condition: ${condition}` : "",
      currentPrice ? `Current price: $${currentPrice}` : "",
      `\nProvide: 1) Whether the price seems reasonable, 2) A suggested price range, 3) One sentence of advice. Keep it under 100 words.`,
    ].filter(Boolean).join("\n");

    const advice = await callAI([
      { role: "system", content: "You are a marketplace pricing analyst. Be practical and concise." },
      { role: "user", content: prompt },
    ], 200);

    res.json({ advice: advice.trim() });
  } catch (err: any) {
    req.log.error({ err }, "AI pricing error");
    if (err.message?.includes("not configured")) {
      res.status(503).json({ error: "AI service not configured" }); return;
    }
    res.status(500).json({ error: "Failed to get pricing advice" });
  }
});

export default router;
