import { useRoute, useLocation } from "wouter";
import { useGetProduct, useGetMe } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Store, ShieldCheck, MessageCircle, Loader2,
  ChevronRight, Flag, AlertCircle, CheckCircle2, Clock,
  Heart, ShoppingCart, ShoppingBag, Shield, Lock, Plus, Minus, Star,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useLocale } from "@/lib/locale/context";
import { useCart } from "@/store/use-cart";

function monthsAgo(date: string | Date): string {
  const then = new Date(date).getTime();
  const months = Math.max(1, Math.round((Date.now() - then) / (1000 * 60 * 60 * 24 * 30)));
  return months === 1 ? "1 month" : `${months} months`;
}

export default function ProductDetails() {
  const [, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const id = params?.id || "";

  const { data: product, isLoading, isError } = useGetProduct(id);
  const { data: user } = useGetMe({ query: { retry: false } });
  const { toast } = useToast();
  const { t, formatPrice } = useLocale();
  const [activeImage, setActiveImage] = useState(0);
  const [messageSending, setMessageSending] = useState(false);
  const [qty, setQty] = useState(1);
  const addItem = useCart(s => s.addItem);

  const [saved, setSaved] = useState(() => {
    try {
      const list = JSON.parse(localStorage.getItem("coastaq_saved") || "[]");
      return list.some((s: any) => s.productId === id);
    } catch { return false; }
  });

  const toggleSave = () => {
    if (!product) return;
    const shop = product.shop as any;
    try {
      const existing: any[] = JSON.parse(localStorage.getItem("coastaq_saved") || "[]");
      if (saved) {
        localStorage.setItem("coastaq_saved", JSON.stringify(existing.filter((s: any) => s.productId !== product.id)));
        setSaved(false);
      } else {
        const entry = {
          productId: product.id,
          title: product.title,
          price: product.price,
          shopName: shop?.name || "",
          image: product.images?.[0] || "",
          location: product.location || "",
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("coastaq_saved", JSON.stringify([...existing, entry]));
        setSaved(true);
        toast({ title: "Saved to Wishlist!", description: "Find it anytime in your account." });
      }
    } catch { /* silent */ }
  };

  const handleMessageSeller = async () => {
    if (!product) return;
    const shop = product.shop as any;
    const sellerId = shop?.userId;

    if (!user) {
      setLocation("/auth/login");
      return;
    }

    if (user.role === "SELLER" || user.role === "ADMIN") {
      toast({ title: t("product.messageSeller"), description: t("product.buyersOnly" as any) || "Only buyers can message sellers." });
      return;
    }

    if (!sellerId) {
      toast({ title: t("product.messageSeller"), description: "This seller's profile is unavailable.", variant: "destructive" });
      return;
    }

    setMessageSending(true);
    try {
      const r = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, sellerId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      setLocation(`/messages/${data.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not start conversation.", variant: "destructive" });
    }
    setMessageSending(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) { setLocation("/auth/login"); return; }
    if (user.role === "SELLER" || user.role === "ADMIN") {
      toast({ title: "Add to Cart", description: "Only buyers can add items to cart." });
      return;
    }
    const shop = product.shop as any;
    addItem({
      productId: product.id,
      title: product.title,
      price: Number(product.price),
      shopId: product.shopId ?? shop?.id ?? "",
      image: product.images?.[0],
      shopName: shop?.name,
      quantity: qty,
    });
    toast({
      title: "Added to cart!",
      description: `${qty}× ${product.title.substring(0, 40)}${product.title.length > 40 ? "…" : ""}`,
    });
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!user) { setLocation("/auth/login"); return; }
    if (user.role === "SELLER" || user.role === "ADMIN") {
      toast({ title: "Buy Now", description: "Only buyers can place orders." });
      return;
    }
    setLocation(`/checkout?productId=${product.id}&qty=${qty}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
          <Skeleton className="w-full md:w-1/2 aspect-square rounded-3xl" />
          <div className="w-full md:w-1/2 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">{t("product.notFound")}</h2>
          <p className="text-muted-foreground">The product you're looking for doesn't exist or was removed.</p>
        </div>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1000&h=1000&fit=crop";
  const images = product.images?.length ? product.images : [defaultImage];
  const shop = product.shop as any;
  const shopMonths = shop?.createdAt ? monthsAgo(shop.createdAt) : "1 month";
  const isVerified = shop?.isApproved;
  const trustScore = (shop as any)?.trustScore;
  const stockQty = (product as any)?.stockQuantity ?? (product as any)?.quantity ?? null;
  const inStock = stockQty === null || stockQty > 0;

  const escrowItems = [
    { icon: Lock, key: "product.paymentHeld" as const },
    { icon: ShieldCheck, key: "product.openDispute" as const },
    { icon: CheckCircle2, key: "product.autoRelease7" as const },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 pb-28 lg:pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <a href="/" className="hover:text-primary transition-colors">{t("product.home")}</a>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left: Images + Description ─────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Image Gallery */}
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="aspect-[4/3] bg-secondary">
                <img
                  src={images[activeImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 p-4 overflow-x-auto">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImage === idx ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/40"}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title + meta */}
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-bold tracking-wider px-2.5 py-1 rounded-full bg-secondary text-muted-foreground uppercase">
                  {t(`product.condition.${product.condition}` as keyof import("@/lib/locale/translations").TranslationKeys)}
                </span>
                {product.category && (
                  <span className="text-xs text-muted-foreground">{product.category.name}</span>
                )}
                {inStock ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> In Stock{stockQty !== null ? ` (${stockQty} left)` : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" /> Out of Stock
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-snug">
                  {product.title}
                </h1>
                <button
                  onClick={toggleSave}
                  title={saved ? "Remove from wishlist" : "Save to wishlist"}
                  className={`shrink-0 p-2 rounded-full border transition-colors mt-1 ${saved ? "border-rose-300 bg-rose-50 text-rose-500" : "border-border text-muted-foreground hover:border-rose-300 hover:text-rose-400"}`}
                >
                  <Heart className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{product.location || t("product.locationNotSpecified")}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h2 className="font-display font-semibold text-foreground mb-3 text-base">{t("product.description")}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description || t("product.noDescription")}
              </p>
            </div>
          </div>

          {/* ── Right: Buy Panel ──────────────────────────────────── */}
          <div className="w-full lg:w-80 xl:w-88 shrink-0 space-y-4">

            {/* Price + Buy Actions */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-5">
              {/* Price */}
              <div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {formatPrice(Number(product.price))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    {t("product.fixedPrice")}
                  </span>
                  {qty > 1 && (
                    <span className="text-xs text-muted-foreground">
                      Total: <strong className="text-primary">{formatPrice(Number(product.price) * qty)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity selector */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quantity</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      disabled={qty <= 1}
                      className="px-3 py-2.5 text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 py-2 text-sm font-bold text-foreground min-w-[2.5rem] text-center select-none">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(q => Math.min(q + 1, stockQty ?? 99))}
                      disabled={stockQty !== null && qty >= stockQty}
                      className="px-3 py-2.5 text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {stockQty !== null && stockQty <= 5 && stockQty > 0 && (
                    <span className="text-xs text-orange-600 font-medium">Only {stockQty} left!</span>
                  )}
                </div>
              </div>

              {/* Primary CTA: Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </button>

              {/* Secondary CTA: Buy Now */}
              {inStock && (
                <button
                  onClick={handleBuyNow}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Buy Now
                </button>
              )}

              {/* Shipping estimate */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/60 pt-3">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Estimated delivery: <strong className="text-foreground">5–14 business days</strong></span>
              </div>
            </div>

            {/* Seller Card */}
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              {shop?.banner && (
                <div className="h-16 overflow-hidden">
                  <img src={shop.banner} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl overflow-hidden bg-secondary border border-border shrink-0 ${shop?.banner ? "-mt-8 ring-2 ring-background" : ""}`}>
                    {shop?.logo ? (
                      <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground text-sm leading-tight block truncate">
                      {shop?.name || ""}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {(shop?.city || shop?.country) && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {[shop.city, shop.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        {shopMonths} {t("product.onCoastaq")}
                      </span>
                      {isVerified && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" />
                          {t("product.verified")}
                        </span>
                      )}
                    </div>
                    {trustScore != null && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-[11px] font-semibold text-foreground">{trustScore.toFixed(0)}</span>
                        <span className="text-[11px] text-muted-foreground">/ 100 trust score</span>
                      </div>
                    )}
                  </div>
                </div>

                {shop?.description && (
                  <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">{shop.description}</p>
                )}

                <div className="flex gap-2">
                  {shop?.slug && (
                    <a
                      href={`/shop/${shop.slug}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-muted-foreground font-medium text-xs hover:text-foreground hover:border-foreground/30 transition-colors"
                    >
                      <Store className="w-3.5 h-3.5" />
                      {t("product.visitShop")}
                    </a>
                  )}
                  <button
                    onClick={handleMessageSeller}
                    disabled={messageSending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-muted-foreground font-medium text-xs hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-60"
                  >
                    {messageSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                    {messageSending ? "Opening…" : t("product.messageSeller")}
                  </button>
                </div>
              </div>
            </div>

            {/* Escrow Protection Badge */}
            <div className="bg-blue-600 rounded-2xl p-4 text-white space-y-3">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t("product.escrowProtected")}</p>
                  <p className="text-[11px] text-blue-200">{t("product.buyerProtectionGuaranteed")}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {escrowItems.map(({ icon: Icon, key }) => (
                  <div key={key} className="flex items-center gap-2 text-xs text-blue-100">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-blue-300" />
                    {t(key)}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex gap-2">
              <button
                onClick={() => toast({ title: t("product.markUnavailable"), description: "Thank you for letting us know." })}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-xs font-medium hover:border-foreground/20 hover:text-foreground transition-colors"
              >
                {t("product.markUnavailable")}
              </button>
              <button
                onClick={() => toast({ title: t("product.reportAbuse"), description: "We'll review this listing shortly.", variant: "destructive" })}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
              >
                <Flag className="w-3.5 h-3.5" />
                {t("product.reportAbuse")}
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Mobile sticky bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/40 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <span className="font-bold text-lg text-foreground leading-none">
              {formatPrice(Number(product.price) * qty)}
            </span>
            {qty > 1 && <span className="text-xs text-muted-foreground ml-1">({qty}×)</span>}
          </div>
          {/* Quantity controls */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden shrink-0">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1} className="px-2 py-1.5 hover:bg-secondary transition-colors disabled:opacity-40">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 text-sm font-bold">{qty}</span>
            <button onClick={() => setQty(q => Math.min(q + 1, stockQty ?? 99))} disabled={stockQty !== null && qty >= stockQty} className="px-2 py-1.5 hover:bg-secondary transition-colors disabled:opacity-40">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            disabled={!inStock}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <ShoppingBag className="w-4 h-4" />
            Buy Now
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
