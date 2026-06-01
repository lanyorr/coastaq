import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Navbar } from "@/components/layout/Navbar";
import { PersonalizedQuickBar } from "@/components/layout/PersonalizedQuickBar";
import { Footer } from "@/components/layout/Footer";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Filter, Search, ChevronDown, ChevronRight, ChevronLeft,
  Store, MapPin, Plus, Zap, Users, Shield, Lock, CheckCircle2,
  Laptop, Car, Building2, Shirt, Sofa, Heart, Trophy,
  Briefcase, Wrench, PawPrint, Leaf, ShoppingBag, Package,
  Camera, Cpu, Bike, Hammer, Apple, Music, BookOpen,
  Baby, Gem, Plug
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/lib/locale/context";
import { tCat } from "@/lib/locale/categoryTranslations";

// Maps a category name → { icon, bg color }
function getCategoryMeta(name: string): { icon: React.ReactNode; bg: string; fg: string } {
  const n = name.toLowerCase();
  if (n.includes("electron") || n.includes("gadget") || n.includes("computer") || n.includes("laptop") || n.includes("phone"))
    return { icon: <Laptop className="w-4 h-4" />, bg: "#dbeafe", fg: "#1d4ed8" };
  if (n.includes("mobile") || n.includes("accessori"))
    return { icon: <Cpu className="w-4 h-4" />, bg: "#e0e7ff", fg: "#4338ca" };
  if (n.includes("vehicle") || n.includes("car") || n.includes("auto") || n.includes("truck"))
    return { icon: <Car className="w-4 h-4" />, bg: "#ffedd5", fg: "#c2410c" };
  if (n.includes("bike") || n.includes("motor"))
    return { icon: <Bike className="w-4 h-4" />, bg: "#fef9c3", fg: "#a16207" };
  if (n.includes("property") || n.includes("real estate") || n.includes("land") || n.includes("house") || n.includes("apartment"))
    return { icon: <Building2 className="w-4 h-4" />, bg: "#dcfce7", fg: "#15803d" };
  if (n.includes("fashion") || n.includes("cloth") || n.includes("wear") || n.includes("dress") || n.includes("shirt"))
    return { icon: <Shirt className="w-4 h-4" />, bg: "#fae8ff", fg: "#9333ea" };
  if (n.includes("shoe") || n.includes("footwear") || n.includes("bag") || n.includes("jewel") || n.includes("accessori"))
    return { icon: <Gem className="w-4 h-4" />, bg: "#fdf2f8", fg: "#db2777" };
  if (n.includes("furniture") || n.includes("home") || n.includes("kitchen") || n.includes("applian") || n.includes("sofa"))
    return { icon: <Sofa className="w-4 h-4" />, bg: "#fef3c7", fg: "#d97706" };
  if (n.includes("health") || n.includes("beauty") || n.includes("cosmetic") || n.includes("medical") || n.includes("pharma"))
    return { icon: <Heart className="w-4 h-4" />, bg: "#ffe4e6", fg: "#e11d48" };
  if (n.includes("sport") || n.includes("outdoor") || n.includes("gym") || n.includes("fitness"))
    return { icon: <Trophy className="w-4 h-4" />, bg: "#d1fae5", fg: "#059669" };
  if (n.includes("art") || n.includes("craft") || n.includes("music") || n.includes("instrument"))
    return { icon: <Music className="w-4 h-4" />, bg: "#ede9fe", fg: "#7c3aed" };
  if (n.includes("job") || n.includes("career") || n.includes("employ") || n.includes("hire") || n.includes("recruit"))
    return { icon: <Briefcase className="w-4 h-4" />, bg: "#e0e7ff", fg: "#4f46e5" };
  if (n.includes("service") || n.includes("repair") || n.includes("technician") || n.includes("plumb") || n.includes("electric"))
    return { icon: <Wrench className="w-4 h-4" />, bg: "#f1f5f9", fg: "#475569" };
  if (n.includes("animal") || n.includes("pet") || n.includes("dog") || n.includes("cat") || n.includes("bird"))
    return { icon: <PawPrint className="w-4 h-4" />, bg: "#fef9c3", fg: "#92400e" };
  if (n.includes("food") || n.includes("agric") || n.includes("farm") || n.includes("grocery") || n.includes("crop"))
    return { icon: <Leaf className="w-4 h-4" />, bg: "#dcfce7", fg: "#16a34a" };
  if (n.includes("baby") || n.includes("kid") || n.includes("child") || n.includes("toy"))
    return { icon: <Baby className="w-4 h-4" />, bg: "#fce7f3", fg: "#be185d" };
  if (n.includes("book") || n.includes("education") || n.includes("learn") || n.includes("school"))
    return { icon: <BookOpen className="w-4 h-4" />, bg: "#ecfdf5", fg: "#065f46" };
  if (n.includes("camera") || n.includes("photo") || n.includes("video"))
    return { icon: <Camera className="w-4 h-4" />, bg: "#dbeafe", fg: "#1e40af" };
  if (n.includes("tool") || n.includes("hardware") || n.includes("equipment") || n.includes("construct"))
    return { icon: <Hammer className="w-4 h-4" />, bg: "#ffedd5", fg: "#9a3412" };
  if (n.includes("electric") || n.includes("solar") || n.includes("power") || n.includes("energy"))
    return { icon: <Plug className="w-4 h-4" />, bg: "#fef9c3", fg: "#ca8a04" };
  // default
  return { icon: <Package className="w-4 h-4" />, bg: "#f1f5f9", fg: "#475569" };
}

const PAGE_SIZE = 24;

export default function Home() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const searchQuery = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("category") || undefined;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [heroSearch, setHeroSearch] = useState("");
  const { t, formatPrice, lang } = useLocale();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroSearch.trim();
    if (q) {
      const next = new URLSearchParams();
      if (categoryId) next.set("category", categoryId);
      next.set("search", q);
      setLocation(`/?${next.toString()}`);
    }
  };

  const filterKey = `${searchQuery ?? ""}|${categoryId ?? ""}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data: productsData, isLoading: loadingProducts } = useListProducts({ 
    search: searchQuery,
    categoryId: categoryId,
    limit: PAGE_SIZE,
    page,
  });
  
  const { data: categories, isLoading: loadingCats } = useListCategories();

  // Featured carousel
  const CAROUSEL_FALLBACK = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format";
  const { data: featuredData } = useListProducts({ limit: 6, page: 1 });
  const featuredProducts = featuredData?.products ?? [];
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const featuredTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentFeatured = featuredProducts[featuredIdx] ?? null;
  const [carouselImgSrc, setCarouselImgSrc] = useState<string>(CAROUSEL_FALLBACK);

  useEffect(() => {
    const raw = currentFeatured?.images?.[0];
    setCarouselImgSrc(raw || CAROUSEL_FALLBACK);
  }, [currentFeatured?.id]);

  useEffect(() => {
    if (featuredProducts.length < 2) return;
    featuredTimerRef.current = setInterval(() => {
      setFeaturedIdx(i => (i + 1) % featuredProducts.length);
    }, 4000);
    return () => { if (featuredTimerRef.current) clearInterval(featuredTimerRef.current); };
  }, [featuredProducts.length]);

  const goFeaturedPrev = () => {
    if (featuredTimerRef.current) clearInterval(featuredTimerRef.current);
    setFeaturedIdx(i => (i - 1 + featuredProducts.length) % featuredProducts.length);
  };
  const goFeaturedNext = () => {
    if (featuredTimerRef.current) clearInterval(featuredTimerRef.current);
    setFeaturedIdx(i => (i + 1) % featuredProducts.length);
  };

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <Navbar />
      <PersonalizedQuickBar />

      {/* Mobile category chips */}
      <div className="md:hidden border-b border-border/20 bg-background">
        <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
          <button
            onClick={() => {
              const next = new URLSearchParams();
              if (searchQuery) next.set("search", searchQuery);
              setLocation(`/${next.toString() ? `?${next}` : ""}`);
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${!categoryId ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"}`}
          >
            All
          </button>
          {!loadingCats && categories?.map((cat) => {
            const isActive = categoryId === cat.id || (cat as any).children?.some((c: any) => c.id === categoryId);
            return (
              <button
                key={cat.id}
                onClick={() => {
                  const next = new URLSearchParams();
                  next.set("category", cat.id);
                  if (searchQuery) next.set("search", searchQuery);
                  setLocation(`/?${next.toString()}`);
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${isActive ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"}`}
              >
                {tCat(cat.name, lang)}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:flex flex-col w-72 shrink-0 border-r border-border bg-white">
          <div className="sticky top-16 overflow-y-auto" style={{ maxHeight: "calc(100vh - 64px)" }}>
            <div className="px-5 pt-6 pb-3">
              <p className="font-display font-bold text-base text-foreground">{t("browse.categories")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("browse.findWhat")}</p>
            </div>

            {loadingCats ? (
              <div className="px-4 space-y-2 pb-4">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
              </div>
            ) : (
              <ul className="px-3 pb-6 space-y-0.5">
                <li>
                  <button
                    onClick={() => {
                      const next = new URLSearchParams();
                      if (searchQuery) next.set("search", searchQuery);
                      setLocation(`/${next.toString() ? `?${next}` : ""}`);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${!categoryId ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: !categoryId ? "#1d4ed8" : "#dbeafe", color: !categoryId ? "#fff" : "#1d4ed8" }}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <span>{t("browse.allProducts")}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  </button>
                </li>
                {categories?.map((cat) => {
                  const children = (cat as any).children ?? [];
                  const isParentActive = categoryId === cat.id;
                  const isChildActive = children.some((c: any) => c.id === categoryId);
                  const isOpen = expanded.has(cat.id) || isParentActive || isChildActive;

                  const navToCategory = (id: string) => {
                    const next = new URLSearchParams();
                    next.set("category", id);
                    if (searchQuery) next.set("search", searchQuery);
                    setLocation(`/?${next.toString()}`);
                  };

                  return (
                    <li key={cat.id}>
                      <button
                        onClick={() => children.length > 0 ? toggleExpand(cat.id) : navToCategory(cat.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${isParentActive || isChildActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-gray-50'}`}
                        aria-expanded={children.length > 0 ? isOpen : undefined}
                      >
                        <div className="flex items-center gap-3">
                          {(() => {
                            const meta = getCategoryMeta(cat.name);
                            return (
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                  background: isParentActive || isChildActive ? "#1d4ed8" : meta.bg,
                                  color: isParentActive || isChildActive ? "#fff" : meta.fg,
                                }}
                              >
                                {meta.icon}
                              </div>
                            );
                          })()}
                          <span className="truncate">{tCat(cat.name, lang)}</span>
                        </div>
                        {children.length > 0 ? (
                          <ChevronDown
                            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-0 text-primary' : '-rotate-90 text-muted-foreground/50 group-hover:text-muted-foreground'}`}
                          />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
                        )}
                      </button>

                      {children.length > 0 && isOpen && (
                        <ul className="ml-3 mt-0.5 mb-1 pl-3 border-l border-border space-y-0.5">
                          {children.map((child: any) => (
                            <li key={child.id}>
                              <button
                                onClick={() => navToCategory(child.id)}
                                className={`w-full text-left block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryId === child.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-gray-50 hover:text-foreground'}`}
                              >
                                {tCat(child.name, lang)}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Right column: hero (home only) + product grid */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Hero Banner — only on home (no search/category filter) */}
          {!searchQuery && !categoryId && (
            <section
              className="relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0c2461 0%, #1a56db 70%, #1e6fd9 100%)",
                minHeight: 460,
              }}
            >
              {/* Reflective white gloss — top-left highlight simulating light reflection */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.10) 20%, rgba(255,255,255,0.03) 45%, transparent 65%)" }} />
              {/* Subtle secondary shimmer on right edge */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(225deg, rgba(255,255,255,0.07) 0%, transparent 40%)" }} />

              <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }} />
              <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #93c5fd, transparent)" }} />

              <div className="relative px-8 py-10 md:py-14 flex flex-col md:flex-row items-center gap-8 md:gap-10 h-full" style={{ minHeight: 460 }}>
                {/* Left: Hero content */}
                <div className="flex-1 flex flex-col gap-6 z-10">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-[1.1] tracking-tight mb-4">
                      {t("hero.title")}
                    </h1>
                    <p className="text-base text-white/95 max-w-md leading-relaxed font-medium">
                      {t("hero.subtitle")}
                    </p>
                  </div>

                  {/* Search bar */}
                  <form onSubmit={handleHeroSearch} className="flex items-center gap-0 max-w-lg">
                    <div className="flex items-center flex-1 bg-white rounded-l-full px-4 py-3 shadow-lg gap-3">
                      <Search className="h-4 w-4 text-gray-400 shrink-0" />
                      <input
                        type="search"
                        placeholder={t("hero.searchPlaceholder")}
                        className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 min-w-0"
                        value={heroSearch}
                        onChange={(e) => setHeroSearch(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-r-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90 shrink-0"
                      style={{ background: "linear-gradient(135deg, #f97316, #ef4444)" }}
                    >
                      {t("common.search")}
                    </button>
                  </form>

                  {/* CTA Buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setLocation("/auth/register?role=SELLER")}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t("hero.postAd")}
                    </button>
                    <button
                      onClick={() => document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" })}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-white/30 text-white/90 text-sm font-semibold hover:bg-white/10 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      {t("hero.browseDeals")}
                    </button>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-8 pt-2">
                    {[
                      { value: "2.5M+", label: t("hero.stats.listings") },
                      { value: "850K+", label: t("hero.stats.sellers") },
                      { value: "100%", label: t("hero.stats.escrowSafe") },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col">
                        <span className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">{s.value}</span>
                        <span className="text-xs text-blue-200/70 font-medium uppercase tracking-wide">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Escrow trust pill */}
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 w-fit">
                    <Shield className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-semibold tracking-wide">{t("hero.escrowNote")}</span>
                  </div>
                </div>

                {/* Right: Live featured listing carousel */}
                <div className="hidden lg:flex flex-col gap-3 shrink-0 w-[856px] z-10">
                  <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    {/* Image area */}
                    <div className="relative h-[533px] overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)" }}>
                      <img
                        src={carouselImgSrc}
                        alt={currentFeatured?.title ?? "Featured listing"}
                        className="w-full h-full object-cover transition-opacity duration-500"
                        onError={() => setCarouselImgSrc(CAROUSEL_FALLBACK)}
                      />
                      {/* Dark overlay for readability */}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
                      {/* Prev / Next */}
                      <button
                        onClick={goFeaturedPrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm flex items-center justify-center transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={goFeaturedNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-sm flex items-center justify-center transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                      {/* Badges */}
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "#f97316" }}>Featured</span>
                        {currentFeatured?.shop && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-primary">Top Seller</span>
                        )}
                      </div>
                      {/* Dot indicators */}
                      {featuredProducts.length > 1 && (
                        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5">
                          {featuredProducts.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setFeaturedIdx(i)}
                              className="w-1.5 h-1.5 rounded-full transition-all"
                              style={{ background: i === featuredIdx ? "#fff" : "rgba(255,255,255,0.4)" }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div
                      className="p-4 cursor-pointer"
                      style={{ background: "rgba(15, 30, 80, 0.88)", backdropFilter: "blur(12px)" }}
                      onClick={() => currentFeatured && setLocation(`/products/${currentFeatured.id}`)}
                    >
                      <h3 className="text-white font-display font-bold text-base leading-tight mb-1 line-clamp-1">
                        {currentFeatured?.title ?? "Premium Marketplace Deals"}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-blue-200/60">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-xs truncate max-w-[140px]">
                            {currentFeatured?.location ?? "Coastaq Global"}
                          </span>
                        </div>
                        <span className="font-bold text-sm shrink-0" style={{ color: "#60a5fa" }}>
                          {currentFeatured?.price != null ? formatPrice(Number(currentFeatured.price)) : "Explore"} →
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-blue-200/60 text-xs">
                    <Users className="w-3.5 h-3.5" />
                    <span>Thousands of buyers active right now</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Escrow Trust Strip — always visible */}
          <div className="px-4 md:px-6 py-4 border-b border-border/50" style={{ background: "linear-gradient(90deg, #eff6ff 0%, #f0f9ff 100%)" }}>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-0 justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-800 leading-none">{t("escrow.paymentInEscrow")}</p>
                  <p className="text-[11px] text-blue-600/80 mt-0.5">{t("escrow.fundsHeld")}</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-blue-200/60" />
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-800 leading-none">{t("escrow.disputeProtection")}</p>
                  <p className="text-[11px] text-blue-600/80 mt-0.5">{t("escrow.disputeDesc")}</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-blue-200/60" />
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-800 leading-none">{t("escrow.autoRelease")}</p>
                  <p className="text-[11px] text-blue-600/80 mt-0.5">{t("escrow.autoReleaseDesc")}</p>
                </div>
              </div>
              <div className="hidden sm:block w-px h-8 bg-blue-200/60" />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">{t("escrow.everyOrder")}</span>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div id="product-grid" className="flex-1 px-4 md:px-6 py-6 md:py-8">
          {/* Header: title + count */}
          <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
            <h2 className="text-xl font-display font-bold text-foreground">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : categoryId
                ? (() => {
                    const all = categories ?? [];
                    const flat = all.flatMap(c => [c, ...((c as any).children ?? [])]);
                    const found = flat.find((c: any) => c.id === categoryId);
                    return found ? found.name : "Browse Products";
                  })()
                : t("browse.allProducts")}
            </h2>
            {!loadingProducts && productsData && productsData.total > 0 && (
              <span className="text-sm text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full">
                {productsData.total.toLocaleString()} {t("common.listings")}
              </span>
            )}
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              ))}
            </div>
          ) : productsData?.products.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-3xl">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary mb-4">
                <Store className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-2">{t("browse.noProducts")}</h3>
              <p className="text-muted-foreground">{t("browse.noProductsDesc")}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {productsData?.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {productsData && productsData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1"
                    disabled={page <= 1}
                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </Button>

                  {Array.from({ length: Math.min(productsData.totalPages, 7) }, (_, i) => {
                    const totalPages = productsData.totalPages;
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        className="rounded-xl w-9 h-9 p-0"
                        onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1"
                    disabled={page >= productsData.totalPages}
                    onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </main>

      {/* ── Earn With Coastaq ─────────────────────────────────────────── */}
      {!searchQuery && !categoryId && (
        <section
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 60%, #ddd6fe 100%)" }}
        >
          {/* Background blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #c4b5fd, transparent)" }} />
          </div>

          <div className="relative container mx-auto px-4 py-14 md:py-16">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold rounded-full px-3 py-1 mb-4 uppercase tracking-wide">
                💸 For Creators & Promoters
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2">
                Earn With Coastaq
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                Share products you love. Earn 5% commission on every sale you refer — paid directly to your PayPal.
              </p>
            </div>

            {/* Three benefit cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
              {[
                {
                  icon: "💰",
                  title: "5% Commission",
                  desc: "Earn on every purchase made through your unique affiliate link. No cap on earnings.",
                },
                {
                  icon: "📊",
                  title: "Real-time Tracking",
                  desc: "See your clicks, conversions, and earnings update live on your affiliate dashboard.",
                },
                {
                  icon: "⚡",
                  title: "Instant PayPal Payouts",
                  desc: "Request your earnings any time you reach $10. Processed within 1–3 business days.",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white/70 backdrop-blur-sm border border-purple-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-3">{icon}</div>
                  <p className="font-semibold text-gray-900 mb-1.5 text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 mb-4">Join 2,500+ Coastaq Affiliates</p>
              <button
                onClick={() => window.location.assign("/affiliate/earn")}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-bold text-white transition-all hover:scale-105 shadow-lg shadow-purple-400/25"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
              >
                Learn More & Apply Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <p className="text-xs text-muted-foreground mt-3">Free to join · No minimum following required</p>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
