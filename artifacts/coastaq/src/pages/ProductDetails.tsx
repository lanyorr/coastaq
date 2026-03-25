import { useRoute, useLocation } from "wouter";
import { useGetProduct } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Store, ShieldCheck, Phone, MessageCircle,
  ChevronRight, Flag, AlertCircle, CheckCircle2, Clock,
  PhoneCall, X, Heart,
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
  const { toast } = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [callbackSent, setCallbackSent] = useState(false);
  const [saved, setSaved] = useState(() => {
    try {
      const list = JSON.parse(localStorage.getItem("coastaq_saved") || "[]");
      return list.some((s: any) => s.productId === id);
    } catch { return false; }
  });

  const trackEnquiry = (type: "contact" | "chat" | "callback") => {
    if (!product) return;
    const shop = product.shop as any;
    const entry = {
      productId: product.id,
      title: product.title,
      price: product.price,
      shopName: shop?.name || "Unknown Shop",
      image: product.images?.[0] || "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=200&h=200&fit=crop",
      location: product.location || "",
      type,
      date: new Date().toISOString(),
    };
    try {
      const existing = JSON.parse(localStorage.getItem("coastaq_enquiries") || "[]");
      localStorage.setItem("coastaq_enquiries", JSON.stringify([...existing, entry]));
    } catch { /* silent */ }
  };

  const toggleSave = () => {
    if (!product) return;
    const shop = product.shop as any;
    try {
      const existing: any[] = JSON.parse(localStorage.getItem("coastaq_saved") || "[]");
      if (saved) {
        const next = existing.filter((s: any) => s.productId !== product.id);
        localStorage.setItem("coastaq_saved", JSON.stringify(next));
        setSaved(false);
      } else {
        const entry = {
          productId: product.id,
          title: product.title,
          price: product.price,
          shopName: shop?.name || "Unknown Shop",
          image: product.images?.[0] || "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=200&h=200&fit=crop",
          location: product.location || "",
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem("coastaq_saved", JSON.stringify([...existing, entry]));
        setSaved(true);
      }
    } catch { /* silent */ }
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
  const shopPhone = shop?.phone || null;
  const shopWhatsapp = shop?.whatsapp || null;
  const shopMonths = shop?.createdAt ? monthsAgo(shop.createdAt) : "1 month";
  const isVerified = shop?.isApproved;

  const handleRequestCallback = (e: React.FormEvent) => {
    e.preventDefault();
    trackEnquiry("callback");
    setCallbackSent(true);
    setTimeout(() => {
      setShowCallbackForm(false);
      setCallbackSent(false);
      setCallbackName("");
      setCallbackPhone("");
    }, 2500);
  };

  const handleStartChat = () => {
    trackEnquiry("chat");
    if (shopWhatsapp) {
      const msg = encodeURIComponent(`Hi, I'm interested in your listing: ${product.title}`);
      window.open(`https://wa.me/${shopWhatsapp.replace(/\D/g, "")}?text=${msg}`, "_blank");
    } else {
      toast({ title: "Contact seller", description: "Seller hasn't added a WhatsApp number yet." });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
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
            <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
              <div>
                <div className="text-3xl font-bold text-foreground mb-2">
                  ₦{Number(product.price).toLocaleString()}
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  Fixed price
                </span>
              </div>

              {/* Request Callback */}
              {!showCallbackForm ? (
                <button
                  onClick={() => setShowCallbackForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/5 transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  Request call back
                </button>
              ) : (
                <div className="border border-primary/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-foreground">Request a call back</span>
                    <button onClick={() => setShowCallbackForm(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {callbackSent ? (
                    <div className="flex items-center gap-2 text-green-600 text-sm py-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Request sent! The seller will call you back soon.
                    </div>
                  ) : (
                    <form onSubmit={handleRequestCallback} className="space-y-2">
                      <input
                        required
                        placeholder="Your name"
                        value={callbackName}
                        onChange={e => setCallbackName(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        required
                        placeholder="Your phone number"
                        value={callbackPhone}
                        onChange={e => setCallbackPhone(e.target.value)}
                        className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <Button type="submit" size="sm" className="w-full rounded-lg bg-primary text-white font-semibold">
                        Send request
                      </Button>
                    </form>
                  )}
                </div>
              )}
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
                  <a
                    href={`/shops/${product.shopId}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors text-sm leading-tight block truncate"
                  >
                    {shop?.name || "Unknown Shop"}
                  </a>
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

              <div className="space-y-2.5">
                {/* Show Contact */}
                {shopPhone && !phoneRevealed ? (
                  <button
                    onClick={() => { setPhoneRevealed(true); trackEnquiry("contact"); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                  >
                    <Phone className="w-4 h-4" />
                    Show contact
                  </button>
                ) : phoneRevealed && shopPhone ? (
                  <a
                    href={`tel:${shopPhone}`}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
                  >
                    <Phone className="w-4 h-4" />
                    {shopPhone}
                  </a>
                ) : (
                  <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-muted-foreground text-sm">
                    <Phone className="w-4 h-4" />
                    No contact added
                  </div>
                )}

                {/* Start Chat */}
                <button
                  onClick={handleStartChat}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Start chat
                </button>
              </div>
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

      <Footer />
    </div>
  );
}
