import { useRoute, useLocation } from "wouter";
import { useGetShopBySlug, useListProducts, useGetMe } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale/context";
import {
  Store, MapPin, ShieldCheck, MessageCircle, ExternalLink,
  Phone, Package, Calendar, Globe, Facebook, Instagram,
  Twitter, Youtube, Share2, ArrowLeft, Clock,
} from "lucide-react";

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.53V6.77a4.85 4.85 0 0 1-1.02-.08z"/>
    </svg>
  );
}

function monthsAgo(date: string | Date): string {
  const months = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const years = Math.floor(months / 12);
  if (years >= 1) return years === 1 ? "1 year" : `${years} years`;
  return months === 1 ? "1 month" : `${months} months`;
}

const FALLBACK_BANNER = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=300&fit=crop&auto=format";
const FALLBACK_LOGO = null;

export default function ShopPage() {
  const [, params] = useRoute("/shop/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug || "";
  const { data: user } = useGetMe({ query: { retry: false } });

  const { data: shop, isLoading, isError } = useGetShopBySlug(slug) as any;
  const { data: productsData } = useListProducts({ shopId: shop?.id, limit: 48 }, { query: { enabled: !!shop?.id } });

  const accentColor = shop?.accentColor || "#1d4ed8";
  const products = productsData?.products ?? [];

  const handleMessage = async () => {
    if (!shop) return;
    if (!user) { setLocation("/auth/login"); return; }
    if (user.role === "SELLER" || user.role === "ADMIN") return;
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: null, sellerId: shop.userId }),
      });
      const data = await res.json();
      if (data?.id) setLocation(`/messages/${data.id}`);
    } catch { /* silent */ }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1">
          <Skeleton className="w-full h-52" />
          <div className="max-w-5xl mx-auto px-4 pt-6 space-y-4">
            <div className="flex items-end gap-4 -mt-12">
              <Skeleton className="w-24 h-24 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2 pb-1">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !shop) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-center px-4 py-20">
          <div>
            <Store className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">Shop not found</h2>
            <p className="text-muted-foreground mb-6">This store doesn't exist or may have been removed.</p>
            <Button onClick={() => setLocation("/")} className="rounded-xl gap-2">
              <ArrowLeft className="w-4 h-4" /> Browse Marketplace
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const socialLinks = [
    { url: shop.facebookUrl, icon: <Facebook className="w-4 h-4" />, label: "Facebook", color: "#1877f2" },
    { url: shop.instagramUrl, icon: <Instagram className="w-4 h-4" />, label: "Instagram", color: "#e1306c" },
    { url: shop.tiktokUrl, icon: <TiktokIcon className="w-4 h-4" />, label: "TikTok", color: "#010101" },
    { url: shop.twitterUrl, icon: <Twitter className="w-4 h-4" />, label: "X/Twitter", color: "#14171a" },
    { url: shop.youtubeUrl, icon: <Youtube className="w-4 h-4" />, label: "YouTube", color: "#ff0000" },
  ].filter(s => s.url);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Banner */}
      <div className="relative w-full h-48 sm:h-64 overflow-hidden bg-secondary">
        <img
          src={shop.banner || FALLBACK_BANNER}
          alt={`${shop.name} banner`}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_BANNER; }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45) 100%)" }} />
        <button
          onClick={() => setLocation("/")}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-white/90 text-xs font-medium bg-black/25 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-black/40 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
        </button>
      </div>

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Shop header row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-12 mb-6 relative z-10">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-background shadow-xl shrink-0 bg-white">
              {shop.logo ? (
                <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: accentColor }}>
                  <Store className="w-10 h-10 text-white" />
                </div>
              )}
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-display font-bold text-foreground truncate">{shop.name}</h1>
                {shop.isApproved && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {(shop.city || shop.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[shop.city, shop.country].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {monthsAgo(shop.createdAt)} on Coastaq
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {(shop as any).productCount ?? products.length} listings
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 shrink-0 pb-1">
              <Button
                onClick={handleMessage}
                className="rounded-xl gap-2 text-sm h-10"
                style={{ background: accentColor }}
              >
                <MessageCircle className="w-4 h-4" /> Message
              </Button>
              {shop.website && (
                <a href={shop.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="rounded-xl gap-2 text-sm h-10">
                    <Globe className="w-4 h-4" /> Website
                  </Button>
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-12">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">

              {/* About */}
              {shop.description && (
                <div className="bg-card border border-border/50 rounded-2xl p-5">
                  <h3 className="font-semibold text-sm text-foreground mb-2">About This Shop</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{shop.description}</p>
                </div>
              )}

              {/* Contact info */}
              {(shop.phone || shop.whatsapp || shop.email) && (
                <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-3">
                  <h3 className="font-semibold text-sm text-foreground">Contact</h3>
                  {shop.phone && (
                    <a href={`tel:${shop.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="truncate">{shop.phone}</span>
                    </a>
                  )}
                  {shop.whatsapp && (
                    <a href={`https://wa.me/${shop.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors">
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                  )}
                  {shop.email && (
                    <a href={`mailto:${shop.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                      <span className="truncate">{shop.email}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Business hours */}
              {shop.businessHours && (
                <div className="bg-card border border-border/50 rounded-2xl p-5">
                  <h3 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" /> Business Hours
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{shop.businessHours}</p>
                </div>
              )}

              {/* Social links */}
              {socialLinks.length > 0 && (
                <div className="bg-card border border-border/50 rounded-2xl p-5">
                  <h3 className="font-semibold text-sm text-foreground mb-3">Follow Us</h3>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map(s => (
                      <a
                        key={s.label}
                        href={s.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={s.label}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                      >
                        {s.icon} {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust badges */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-2">
                <h3 className="font-semibold text-sm text-blue-800">Buyer Protection</h3>
                <p className="text-xs text-blue-600 leading-relaxed">All purchases through Coastaq are escrow-protected. Funds are only released to the seller after you confirm receipt.</p>
              </div>
            </div>

            {/* Products grid */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-bold text-foreground">
                  All Listings
                  {products.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">({products.length})</span>
                  )}
                </h2>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-20 bg-secondary/30 rounded-3xl">
                  <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No listings yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Check back later for new products.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
