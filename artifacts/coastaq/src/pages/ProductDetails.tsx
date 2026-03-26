import { useRoute, useLocation } from "wouter";
import { useGetProduct, useGetMe } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Store, ShieldCheck, MessageCircle,
  ChevronRight, Flag, AlertCircle, CheckCircle2, Clock,
  Heart, Loader2, ShoppingBag, X, Minus, Plus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

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
  const [activeImage, setActiveImage] = useState(0);
  const [messageSending, setMessageSending] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderQty, setOrderQty] = useState(1);
  const [orderNote, setOrderNote] = useState("");
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
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
          shopName: shop?.name || "Unknown Shop",
          image: product.images?.[0] || "",
          location: product.location || "",
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("coastaq_saved", JSON.stringify([...existing, entry]));
        setSaved(true);
        toast({ title: "Saved!", description: "Listing added to your saved items." });
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
      toast({ title: "Buyers only", description: "Only buyers can message sellers." });
      return;
    }

    if (!sellerId) {
      toast({ title: "Unable to message", description: "This seller's profile is unavailable.", variant: "destructive" });
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

  const handlePlaceOrder = async () => {
    if (!product) return;
    if (!user) { setLocation("/auth/login"); return; }
    if (user.role === "SELLER" || user.role === "ADMIN") {
      toast({ title: "Buyers only", description: "Only buyers can place orders." });
      return;
    }
    setOrderPlacing(true);
    try {
      const r = await fetch("/api/orders/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: orderQty, buyerNote: orderNote }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      setOrderDone(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not place order.", variant: "destructive" });
    }
    setOrderPlacing(false);
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
          <h2 className="text-3xl font-display font-bold mb-4">Product not found</h2>
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 pb-24 lg:pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
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
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 p-4 overflow-x-auto">
                  {images.map((img, idx) => (
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
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold tracking-wider px-2.5 py-1 rounded-full bg-secondary text-muted-foreground uppercase">
                  {product.condition}
                </span>
                {product.category && (
                  <span className="text-xs text-muted-foreground">{product.category.name}</span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-snug">
                  {product.title}
                </h1>
                <button
                  onClick={toggleSave}
                  title={saved ? "Remove from saved" : "Save listing"}
                  className={`shrink-0 p-2 rounded-full border transition-colors mt-1 ${saved ? "border-rose-300 bg-rose-50 text-rose-500" : "border-border text-muted-foreground hover:border-rose-300 hover:text-rose-400"}`}
                >
                  <Heart className={`w-5 h-5 ${saved ? "fill-current" : ""}`} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{product.location || "Location not specified"}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h2 className="font-display font-semibold text-foreground mb-3 text-base">Description</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* ── Right: Price + Contact ──────────────────────────────── */}
          <div className="w-full lg:w-80 xl:w-88 shrink-0 space-y-4">

            {/* Price Card */}
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <div className="text-3xl font-bold text-foreground mb-2">
                ${Number(product.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                Fixed price
              </span>
            </div>

            {/* Seller Card */}
            <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
              {/* Shop Info */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
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
                    {shop?.name || "Unknown Shop"}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      {shopMonths} on Coastaq
                    </span>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Typically replies within minutes
                  </p>
                </div>
              </div>

              {/* Message seller */}
              <button
                onClick={handleMessageSeller}
                disabled={messageSending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 disabled:opacity-60"
              >
                {messageSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                {messageSending ? "Opening chat…" : "Message seller"}
              </button>

              {/* Place Order */}
              <button
                onClick={() => {
                  if (!user) { setLocation("/auth/login"); return; }
                  setOrderDone(false);
                  setOrderQty(1);
                  setOrderNote("");
                  setOrderModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                Place Order
              </button>
            </div>

            {/* Safety tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Safety tip:</strong> Meet seller in a safe, public place. Inspect item before payment. Never pay in advance.
                </p>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="flex gap-2">
              <button
                onClick={() => toast({ title: "Marked unavailable", description: "Thank you for letting us know." })}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-xs font-medium hover:border-foreground/20 hover:text-foreground transition-colors"
              >
                Mark unavailable
              </button>
              <button
                onClick={() => toast({ title: "Report submitted", description: "We'll review this listing shortly.", variant: "destructive" })}
                className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Abuse
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Mobile sticky bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/40 px-4 py-3 flex items-center gap-3">
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-lg text-foreground leading-none">
            ${Number(product.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-muted-foreground truncate">{product.title}</span>
        </div>
        <div className="flex gap-2 ml-auto shrink-0">
          <button
            onClick={handleMessageSeller}
            disabled={messageSending}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
          >
            {messageSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {messageSending ? "Opening…" : "Message"}
          </button>
          <button
            onClick={() => {
              if (!user) { setLocation("/auth/login"); return; }
              setOrderDone(false); setOrderQty(1); setOrderNote(""); setOrderModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Order
          </button>
        </div>
      </div>

      {/* Place Order Modal */}
      {orderModalOpen && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border/60 rounded-3xl shadow-2xl w-full max-w-md">
            {orderDone ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-display font-bold text-foreground">Order Placed!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your order request has been sent to the seller. They'll review it shortly.
                  You can track your orders in the buyer dashboard.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setOrderModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { setOrderModalOpen(false); setLocation("/buyer/dashboard"); }}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    View Orders
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-display font-bold text-foreground">Place Order</h2>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{product.title}</p>
                  </div>
                  <button onClick={() => setOrderModalOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Price summary */}
                <div className="bg-secondary/60 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Unit price</span>
                    <span className="font-semibold text-foreground">${Number(product.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground">Quantity</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOrderQty(q => Math.max(1, q - 1))}
                        className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-semibold text-foreground">{orderQty}</span>
                      <button
                        onClick={() => setOrderQty(q => Math.min(product.stock || 99, q + 1))}
                        className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-border/60 pt-3 flex items-center justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">
                      ${(Number(product.price) * orderQty).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Optional note */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Note to seller (optional)</label>
                  <textarea
                    value={orderNote}
                    onChange={e => setOrderNote(e.target.value)}
                    placeholder="Any special instructions or questions for the seller..."
                    rows={3}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
                  />
                </div>

                {/* CTA */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={orderPlacing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {orderPlacing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                  {orderPlacing ? "Placing order…" : `Place Order · $${(Number(product.price) * orderQty).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
