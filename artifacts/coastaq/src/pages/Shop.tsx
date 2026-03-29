import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, CheckCircle2, Download, Star, Zap, Shield,
  BookOpen, Palette, FileText, Megaphone, Briefcase, X, Loader2,
} from "lucide-react";
import { usePaypalConfig } from "@/hooks/use-subscription";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShopProduct {
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

// ── Category icon map ─────────────────────────────────────────────────────────

const categoryConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Business:  { icon: Briefcase,  color: "text-blue-600",   bg: "bg-blue-50"   },
  Marketing: { icon: Megaphone,  color: "text-pink-600",   bg: "bg-pink-50"   },
  Course:    { icon: BookOpen,   color: "text-violet-600", bg: "bg-violet-50" },
  Design:    { icon: Palette,    color: "text-amber-600",  bg: "bg-amber-50"  },
  Legal:     { icon: FileText,   color: "text-green-600",  bg: "bg-green-50"  },
};

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchShopProducts(): Promise<ShopProduct[]> {
  const res = await fetch("/api/shop/products");
  if (!res.ok) throw new Error("Failed to load shop products");
  const data = await res.json();
  return data.products;
}

async function createOrder(productId: string): Promise<{ orderID: string; product: ShopProduct }> {
  const token = localStorage.getItem("coastaq_token");
  const res = await fetch("/api/shop/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Failed to create order");
  }
  return res.json();
}

async function captureOrder(orderID: string): Promise<{ success: boolean; product: ShopProduct; message: string }> {
  const token = localStorage.getItem("coastaq_token");
  const res = await fetch("/api/shop/capture-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ orderID }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Payment failed");
  }
  return res.json();
}

// ── PayPal Button Component ───────────────────────────────────────────────────

function PayPalButton({
  product,
  onSuccess,
  onClose,
}: {
  product: ShopProduct;
  onSuccess: (product: ShopProduct) => void;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { data: paypalConfig } = usePaypalConfig();
  const [phase, setPhase] = useState<"idle" | "creating" | "approving" | "capturing">("idle");

  const createMut = useMutation({
    mutationFn: () => createOrder(product.id),
    onSuccess: async ({ orderID, product: p }) => {
      setPhase("approving");
      const baseUrl = paypalConfig?.mode === "sandbox"
        ? "https://www.sandbox.paypal.com"
        : "https://www.paypal.com";
      const approveUrl = `${baseUrl}/checkoutnow?token=${orderID}`;

      const popup = window.open(approveUrl, "paypal_checkout", "width=600,height=680,left=200,top=100");

      const poll = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(poll);
          setPhase("capturing");
          try {
            const result = await captureOrder(orderID);
            if (result.success) {
              onSuccess(result.product ?? p);
            } else {
              toast({ title: "Payment not completed", description: "Please try again.", variant: "destructive" });
              setPhase("idle");
            }
          } catch (err: any) {
            toast({ title: "Payment failed", description: err.message, variant: "destructive" });
            setPhase("idle");
          }
        }
      }, 800);
    },
    onError: (err: any) => {
      toast({ title: "Could not start checkout", description: err.message, variant: "destructive" });
      setPhase("idle");
    },
  });

  const busy = phase !== "idle" || createMut.isPending;

  return (
    <div className="space-y-3">
      <Button
        className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-xl shadow-md shadow-blue-200 text-sm gap-2 disabled:opacity-60"
        onClick={() => { setPhase("creating"); createMut.mutate(); }}
        disabled={busy}
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {phase === "creating" ? "Creating order…" : phase === "approving" ? "Awaiting PayPal…" : "Confirming payment…"}
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.379 4.367-1.596 8.22-6.51 8.22H11.37a.764.764 0 0 0-.757.652l-1.174 7.43-.032.21-.5 3.168a.418.418 0 0 0 .413.486h3.97a.563.563 0 0 0 .556-.474l.023-.118.444-2.815.028-.155a.563.563 0 0 1 .556-.474h.351c2.269 0 4.047-.92 4.565-3.584.217-1.115.105-2.046-.47-2.7a2.235 2.235 0 0 0-.14-.15z"/></svg>
            Pay ${product.price} with PayPal
          </>
        )}
      </Button>
      <button
        onClick={onClose}
        className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
        disabled={busy}
      >
        Cancel
      </button>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onBuy,
}: {
  product: ShopProduct;
  onBuy: (product: ShopProduct) => void;
}) {
  const cfg = categoryConfig[product.category] ?? { icon: ShoppingBag, color: "text-gray-600", bg: "bg-gray-50" };
  const Icon = cfg.icon;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
      {product.badge && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 shadow-md shadow-primary/30">
            {product.badge}
          </Badge>
        </div>
      )}

      <div className={`${cfg.bg} px-6 pt-7 pb-5`}>
        <div className={`w-12 h-12 rounded-xl ${cfg.bg} border border-white/60 shadow-sm flex items-center justify-center mb-4`}>
          <Icon className={`w-6 h-6 ${cfg.color}`} />
        </div>
        <Badge variant="outline" className={`text-[11px] ${cfg.color} border-current/20 mb-2`}>
          {product.category}
        </Badge>
        <h3 className="font-bold text-gray-900 text-lg leading-tight font-display">{product.title}</h3>
        <p className="text-gray-500 text-sm mt-1.5 leading-relaxed line-clamp-2">{product.description}</p>
      </div>

      <div className="px-6 py-4 flex-1 flex flex-col gap-4">
        <ul className="space-y-1.5">
          {product.highlights.map(h => (
            <li key={h} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
              {h}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
          <Download className="w-3.5 h-3.5 shrink-0" />
          {product.deliverable}
        </div>

        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">${product.price}</span>
            <span className="text-sm text-gray-400 ml-1">USD</span>
          </div>
          <Button
            onClick={() => onBuy(product)}
            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold px-5 shadow-md shadow-primary/25 gap-1.5 text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Purchase Success Modal ────────────────────────────────────────────────────

function SuccessModal({ product, onClose }: { product: ShopProduct; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 font-display mb-2">Purchase Complete!</h2>
        <p className="text-gray-500 mb-1">You've successfully purchased</p>
        <p className="font-semibold text-gray-800 mb-4">{product.title}</p>
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 mb-6">
          <Download className="w-4 h-4 inline mr-1.5" />
          {product.deliverable}. Check your PayPal email for the receipt and download instructions.
        </div>
        <Button onClick={onClose} className="w-full rounded-xl bg-primary text-white font-semibold">
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}

// ── Checkout Modal ────────────────────────────────────────────────────────────

function CheckoutModal({
  product,
  onSuccess,
  onClose,
}: {
  product: ShopProduct;
  onSuccess: (product: ShopProduct) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-display">{product.title}</h2>
            <p className="text-sm text-gray-500">{product.category}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Item</span>
            <span className="font-medium text-gray-800">{product.title}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery</span>
            <span className="text-green-600 font-medium">Instant</span>
          </div>
          <div className="border-t border-gray-200 mt-1 pt-2 flex justify-between">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="font-bold text-primary text-lg">${product.price} USD</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
          <Shield className="w-3.5 h-3.5" /> Secured by PayPal — Coastaq never stores your card details.
        </div>

        <PayPalButton product={product} onSuccess={onSuccess} onClose={onClose} />
      </div>
    </div>
  );
}

// ── Main Shop Page ────────────────────────────────────────────────────────────

const CATEGORIES = ["All", "Business", "Marketing", "Course", "Design", "Legal"];

export default function Shop() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe({ query: { retry: false } });
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/shop/products"],
    queryFn: fetchShopProducts,
  });
  const [activeCategory, setActiveCategory] = useState("All");
  const [checkoutProduct, setCheckoutProduct] = useState<ShopProduct | null>(null);
  const [purchasedProduct, setPurchasedProduct] = useState<ShopProduct | null>(null);

  const filtered = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory);

  const handleBuy = (product: ShopProduct) => {
    if (!user) {
      setLocation("/auth/login");
      return;
    }
    setCheckoutProduct(product);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-violet-700 text-white py-20 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white" />
        </div>
        <div className="relative container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/20">
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            Official Coastaq Digital Store
          </div>
          <h1 className="text-4xl md:text-5xl font-black font-display leading-tight mb-4">
            Tools & Resources to<br />
            <span className="text-yellow-300">Grow Your Business</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-xl mx-auto mb-8">
            Premium digital products created by the Coastaq team — templates, courses, toolkits, and more. Buy once, use forever.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-blue-100">
            {[
              { icon: Zap, label: "Instant delivery" },
              { icon: Shield, label: "Secure PayPal checkout" },
              { icon: Star, label: "Lifetime access" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category filter */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto max-w-6xl px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <main className="container mx-auto max-w-6xl px-4 py-12 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 font-display">
                {activeCategory === "All" ? "All Products" : activeCategory}
                <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length})</span>
              </h2>
              {!user && (
                <p className="text-sm text-gray-500">
                  <button onClick={() => setLocation("/auth/login")} className="text-primary font-semibold hover:underline">
                    Sign in
                  </button>{" "}to purchase
                </p>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No products in this category yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(product => (
                  <ProductCard key={product.id} product={product} onBuy={handleBuy} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Trust badges */}
      <section className="bg-white border-t border-gray-100 py-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Shield, title: "Secure Payments", desc: "Protected by PayPal" },
              { icon: Download, title: "Instant Delivery", desc: "Get access immediately" },
              { icon: Star, title: "Lifetime Access", desc: "No subscription needed" },
              { icon: CheckCircle2, title: "Quality Guarantee", desc: "Coastaq-approved content" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-sm text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Modals */}
      {checkoutProduct && !purchasedProduct && (
        <CheckoutModal
          product={checkoutProduct}
          onSuccess={(p) => { setCheckoutProduct(null); setPurchasedProduct(p); }}
          onClose={() => setCheckoutProduct(null)}
        />
      )}
      {purchasedProduct && (
        <SuccessModal
          product={purchasedProduct}
          onClose={() => setPurchasedProduct(null)}
        />
      )}
    </div>
  );
}
