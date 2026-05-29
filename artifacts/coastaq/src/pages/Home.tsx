import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLocation, useSearch } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown, ChevronRight, ChevronLeft,
  Store, Lock, CheckCircle2,
  Laptop, Car, Building2, Shirt, Sofa, Heart, Trophy,
  Briefcase, Wrench, PawPrint, Leaf, ShoppingBag, Package,
  Camera, Cpu, Bike, Hammer, Music, BookOpen,
  Baby, Gem, Plug, Menu, Shield, Users, TrendingUp,
  Zap, Globe, Award, Tag,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocale } from "@/lib/locale/context";
import { tCat } from "@/lib/locale/categoryTranslations";

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
  if (n.includes("shoe") || n.includes("footwear") || n.includes("bag") || n.includes("jewel"))
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
  return { icon: <Package className="w-4 h-4" />, bg: "#f1f5f9", fg: "#475569" };
}

const BANNERS = [
  {
    id: 1,
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1a56db 100%)",
    accentColor: "#60a5fa",
    badge: "🔒 100% Escrow Protected",
    heading: "Source Products\nGlobally",
    sub: "Connect with 850,000+ verified sellers across Africa and beyond",
    cta: "Browse Products",
    ctaHref: "/shop",
    stat: "2.5M+ Listings Available",
  },
  {
    id: 2,
    gradient: "linear-gradient(135deg, #052e16 0%, #064e3b 60%, #047857 100%)",
    accentColor: "#34d399",
    badge: "🏆 Top Seller Program",
    heading: "Grow Your\nBusiness Online",
    sub: "Reach millions of buyers. Easy setup, powerful tools, fast payouts",
    cta: "Start Selling Free",
    ctaHref: "/auth/register?role=SELLER",
    stat: "850K+ Active Sellers",
  },
  {
    id: 3,
    gradient: "linear-gradient(135deg, #3b0764 0%, #6b21a8 60%, #7c3aed 100%)",
    accentColor: "#c084fc",
    badge: "💰 Earn Commissions",
    heading: "Join Our\nAffiliate Program",
    sub: "Earn on every sale you refer. No inventory, no risk — just share and earn",
    cta: "Join Free Today",
    ctaHref: "/auth/register?role=AFFILIATE",
    stat: "Up to 15% Commission",
  },
];

const PAGE_SIZE = 24;

export default function Home() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const searchQuery = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("category") || undefined;

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const { t, formatPrice, lang } = useLocale();

  // Banner carousel
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    bannerTimerRef.current = setInterval(() => {
      setBannerIdx(i => (i + 1) % BANNERS.length);
    }, 4500);
    return () => { if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); };
  }, []);

  const goBannerPrev = () => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    setBannerIdx(i => (i - 1 + BANNERS.length) % BANNERS.length);
  };
  const goBannerNext = () => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    setBannerIdx(i => (i + 1) % BANNERS.length);
  };

  // Reset page when filter changes
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

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const navToCategory = (id: string) => {
    const next = new URLSearchParams();
    next.set("category", id);
    if (searchQuery) next.set("search", searchQuery);
    setLocation(`/?${next.toString()}`);
  };

  const clearFilters = () => {
    setLocation("/");
    setPage(1);
  };

  const isHomepage = !searchQuery && !categoryId;

  // ── Shared: Mobile category chips ──────────────────────────────────────────
  const mobileCategoryChips = (
    <div className="md:hidden border-b border-gray-200 bg-white">
      <div
        className="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <button
          onClick={clearFilters}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
            !categoryId
              ? "bg-market text-white border-market"
              : "bg-white text-gray-600 border-gray-300 hover:border-market hover:text-market"
          }`}
        >
          All
        </button>
        {!loadingCats && categories?.map((cat) => {
          const isActive = categoryId === cat.id || (cat as any).children?.some((c: any) => c.id === categoryId);
          return (
            <button
              key={cat.id}
              onClick={() => navToCategory(cat.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                isActive
                  ? "bg-market text-white border-market"
                  : "bg-white text-gray-600 border-gray-300 hover:border-market hover:text-market"
              }`}
            >
              {tCat(cat.name, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Product grid (shared between homepage and browse mode) ──────────────────
  const productGridSection = (
    <div id="product-grid">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-display font-bold text-gray-900">
            {searchQuery
              ? `Results for "${searchQuery}"`
              : categoryId
              ? (() => {
                  const all = categories ?? [];
                  const flat = all.flatMap(c => [c, ...((c as any).children ?? [])]);
                  const found = flat.find((c: any) => c.id === categoryId);
                  return found ? tCat(found.name, lang) : "Browse Products";
                })()
              : "Latest Products"}
          </h2>
          {!loadingProducts && productsData && productsData.total > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
              {productsData.total.toLocaleString()} listings
            </span>
          )}
        </div>
        {(searchQuery || categoryId) && (
          <button
            onClick={clearFilters}
            className="text-xs text-market hover:underline font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {loadingProducts ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : productsData?.products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded border border-gray-200">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
            <Store className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-display font-bold text-gray-800 mb-2">{t("browse.noProducts")}</h3>
          <p className="text-gray-500 text-sm">{t("browse.noProductsDesc")}</p>
          <button onClick={clearFilters} className="mt-4 px-5 py-2 mkt-btn text-sm font-semibold rounded">
            Browse All Products
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {productsData?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {productsData && productsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10">
              <button
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:border-market hover:text-market disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                disabled={page <= 1}
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>

              {Array.from({ length: Math.min(productsData.totalPages, 7) }, (_, i) => {
                const totalPages = productsData.totalPages;
                let pageNum: number;
                if (totalPages <= 7) pageNum = i + 1;
                else if (page <= 4) pageNum = i + 1;
                else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                else pageNum = page - 3 + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => { setPage(pageNum); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={`w-9 h-9 text-sm rounded border font-medium transition-colors ${
                      pageNum === page
                        ? "bg-market border-market text-white"
                        : "border-gray-300 text-gray-700 hover:border-market hover:text-market"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:border-market hover:text-market disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                disabled={page >= productsData.totalPages}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">

        {/* ══════════════════════════════════════════════════════
            HOMEPAGE LAYOUT (no search/category filter)
        ══════════════════════════════════════════════════════ */}
        {isHomepage ? (
          <>
            {/* Mobile category chips */}
            {mobileCategoryChips}

            {/* ── Hero: 3-column marketplace layout ── */}
            <section className="bg-white border-b border-gray-200">
              <div className="container mx-auto px-0 lg:px-4">
                <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr_185px]">

                  {/* Left: Category sidebar */}
                  <aside className="hidden lg:block border-r border-gray-200">
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 text-white text-sm font-semibold">
                      <Menu className="w-4 h-4" />
                      All Categories
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {loadingCats
                        ? Array.from({ length: 10 }).map((_, i) => (
                            <li key={i} className="px-4 py-2.5">
                              <Skeleton className="h-4 w-3/4" />
                            </li>
                          ))
                        : categories?.slice(0, 14).map(cat => {
                            const meta = getCategoryMeta(cat.name);
                            return (
                              <li key={cat.id}>
                                <button
                                  onClick={() => navToCategory(cat.id)}
                                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-red-50 hover:text-market group transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                                      style={{ background: meta.bg, color: meta.fg }}
                                    >
                                      {meta.icon}
                                    </span>
                                    <span className="truncate">{tCat(cat.name, lang)}</span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-market shrink-0" />
                                </button>
                              </li>
                            );
                          })}
                      {!loadingCats && (
                        <li>
                          <button
                            onClick={() => setLocation("/shop")}
                            className="w-full text-left px-3 py-2.5 text-xs text-market font-semibold hover:bg-red-50 transition-colors"
                          >
                            View All Categories →
                          </button>
                        </li>
                      )}
                    </ul>
                  </aside>

                  {/* Center: Banner carousel */}
                  <div className="relative overflow-hidden" style={{ minHeight: 340 }}>
                    {BANNERS.map((banner, i) => (
                      <div
                        key={banner.id}
                        className="absolute inset-0 transition-opacity duration-700 flex items-center"
                        style={{
                          background: banner.gradient,
                          opacity: i === bannerIdx ? 1 : 0,
                          pointerEvents: i === bannerIdx ? "auto" : "none",
                        }}
                      >
                        <div className="px-8 md:px-12 py-10 flex flex-col gap-4 max-w-xl">
                          <span
                            className="text-xs font-semibold px-3 py-1 rounded-full w-fit"
                            style={{ background: "rgba(255,255,255,0.15)", color: banner.accentColor }}
                          >
                            {banner.badge}
                          </span>
                          <h1
                            className="text-3xl md:text-4xl font-display font-bold text-white leading-tight whitespace-pre-line"
                          >
                            {banner.heading}
                          </h1>
                          <p className="text-white/80 text-sm leading-relaxed max-w-sm">
                            {banner.sub}
                          </p>
                          <div className="flex items-center gap-4 flex-wrap">
                            <button
                              onClick={() => setLocation(banner.ctaHref)}
                              className="mkt-btn px-6 py-2.5 rounded text-sm font-bold transition-colors"
                            >
                              {banner.cta}
                            </button>
                            <span className="text-xs font-medium" style={{ color: banner.accentColor }}>
                              {banner.stat}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Prev / Next */}
                    <button
                      onClick={goBannerPrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white z-10 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={goBannerNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white z-10 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Dot indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {BANNERS.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setBannerIdx(i)}
                          className="w-2 h-2 rounded-full transition-colors"
                          style={{ background: i === bannerIdx ? "#fff" : "rgba(255,255,255,0.4)" }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Right: Quick panels */}
                  <aside className="hidden lg:flex flex-col border-l border-gray-200">
                    {/* Buyer Center */}
                    <div
                      className="flex-1 p-4 border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                      onClick={() => setLocation("/account")}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded bg-blue-100 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-3.5 h-3.5 text-blue-700" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">Buyer Center</span>
                      </div>
                      <ul className="text-[11px] text-gray-500 space-y-1 pl-9">
                        <li className="hover:text-blue-700 cursor-pointer">→ Source Products</li>
                        <li className="hover:text-blue-700 cursor-pointer">→ Track Orders</li>
                        <li className="hover:text-blue-700 cursor-pointer">→ Escrow Protection</li>
                      </ul>
                    </div>

                    {/* Seller Center */}
                    <div
                      className="flex-1 p-4 border-b border-gray-200 hover:bg-green-50 cursor-pointer transition-colors"
                      onClick={() => setLocation("/seller")}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded bg-green-100 flex items-center justify-center shrink-0">
                          <Store className="w-3.5 h-3.5 text-green-700" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">Seller Center</span>
                      </div>
                      <ul className="text-[11px] text-gray-500 space-y-1 pl-9">
                        <li className="hover:text-green-700 cursor-pointer">→ List Products</li>
                        <li className="hover:text-green-700 cursor-pointer">→ Manage Orders</li>
                        <li className="hover:text-green-700 cursor-pointer">→ Grow Revenue</li>
                      </ul>
                    </div>

                    {/* Affiliate Center */}
                    <div
                      className="flex-1 p-4 border-b border-gray-200 hover:bg-purple-50 cursor-pointer transition-colors"
                      onClick={() => setLocation("/affiliate")}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded bg-purple-100 flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5 text-purple-700" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">Affiliate Center</span>
                      </div>
                      <ul className="text-[11px] text-gray-500 space-y-1 pl-9">
                        <li className="hover:text-purple-700 cursor-pointer">→ Earn Commissions</li>
                        <li className="hover:text-purple-700 cursor-pointer">→ Share Links</li>
                        <li className="hover:text-purple-700 cursor-pointer">→ Track Earnings</li>
                      </ul>
                    </div>

                    {/* App download teaser */}
                    <div className="p-4 bg-gray-800 text-white">
                      <p className="text-[11px] font-bold mb-1">📱 Coastaq App</p>
                      <p className="text-[10px] text-gray-400 mb-2">Trade on the go</p>
                      <button
                        onClick={() => setLocation("/auth/register")}
                        className="w-full py-1.5 text-[11px] font-semibold rounded bg-market hover:bg-red-700 transition-colors"
                      >
                        Get Started Free
                      </button>
                    </div>
                  </aside>

                </div>
              </div>
            </section>

            {/* ── Category Showcase ── */}
            {!loadingCats && categories && categories.length > 0 && (
              <section className="bg-white border-b border-gray-200 py-6">
                <div className="container mx-auto px-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-display font-bold text-gray-900">Browse by Category</h2>
                    <button
                      onClick={() => setLocation("/shop")}
                      className="text-xs text-market hover:underline font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {categories.slice(0, 16).map(cat => {
                      const meta = getCategoryMeta(cat.name);
                      return (
                        <button
                          key={cat.id}
                          onClick={() => navToCategory(cat.id)}
                          className="flex flex-col items-center gap-2 p-3 rounded bg-white border border-gray-200 hover:border-market hover:shadow-sm transition-all group"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                            style={{ background: meta.bg, color: meta.fg }}
                          >
                            {meta.icon}
                          </div>
                          <span className="text-[11px] text-gray-600 text-center font-medium leading-tight line-clamp-2 group-hover:text-market transition-colors">
                            {tCat(cat.name, lang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ── Trust Strip ── */}
            <section className="bg-white border-b border-gray-200 py-4">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: <Lock className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50", title: t("escrow.paymentInEscrow"), desc: t("escrow.fundsHeld") },
                    { icon: <Shield className="w-5 h-5 text-green-600" />, bg: "bg-green-50", title: t("escrow.disputeProtection"), desc: t("escrow.disputeDesc") },
                    { icon: <CheckCircle2 className="w-5 h-5 text-orange-500" />, bg: "bg-orange-50", title: t("escrow.autoRelease"), desc: t("escrow.autoReleaseDesc") },
                    { icon: <Award className="w-5 h-5 text-purple-600" />, bg: "bg-purple-50", title: "Verified Sellers", desc: "All suppliers checked and reviewed" },
                  ].map(item => (
                    <div key={item.title} className="flex items-start gap-3">
                      <div className={`w-9 h-9 ${item.bg} rounded-full flex items-center justify-center shrink-0`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800 leading-none">{item.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Stats Banner ── */}
            <div className="bg-market py-3">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
                  {[
                    { value: "2.5M+", label: t("hero.stats.listings") },
                    { value: "850K+", label: t("hero.stats.sellers") },
                    { value: "50+", label: "Countries" },
                    { value: "100%", label: t("hero.stats.escrowSafe") },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-xl font-display font-bold text-white leading-none">{s.value}</p>
                      <p className="text-[10px] text-white/70 font-medium uppercase tracking-wide mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Latest Products ── */}
            <section className="container mx-auto px-4 py-8">
              {productGridSection}
            </section>

            {/* ── Role Portals ── */}
            <section className="bg-white border-t border-gray-200 py-12">
              <div className="container mx-auto px-4">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">The Coastaq Ecosystem</h2>
                  <p className="text-gray-500 text-sm max-w-xl mx-auto">One platform for buyers, sellers, and affiliates to connect, trade, and grow</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Buyer portal */}
                  <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-6 text-white">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-display font-bold mb-1">Buyer Center</h3>
                      <p className="text-blue-200 text-sm">Source products globally with full escrow protection</p>
                    </div>
                    <div className="p-5 bg-white">
                      <ul className="space-y-2 mb-5">
                        {["Browse 2.5M+ verified listings", "Escrow-protected payments", "Direct supplier communication", "Track orders in real time"].map(item => (
                          <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => setLocation("/auth/register")}
                        className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded transition-colors"
                      >
                        Start Buying →
                      </button>
                    </div>
                  </div>

                  {/* Seller portal */}
                  <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-br from-green-700 to-emerald-900 p-6 text-white">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                        <Store className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-display font-bold mb-1">Seller Center</h3>
                      <p className="text-green-200 text-sm">List products and reach millions of global buyers</p>
                    </div>
                    <div className="p-5 bg-white">
                      <ul className="space-y-2 mb-5">
                        {["Free shop setup in minutes", "Fast escrow payouts", "Manage orders & inventory", "Analytics & performance tools"].map(item => (
                          <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => setLocation("/auth/register?role=SELLER")}
                        className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded transition-colors"
                      >
                        Start Selling Free →
                      </button>
                    </div>
                  </div>

                  {/* Affiliate portal */}
                  <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-br from-purple-700 to-violet-900 p-6 text-white">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-display font-bold mb-1">Affiliate Center</h3>
                      <p className="text-purple-200 text-sm">Earn commissions by sharing Coastaq with your audience</p>
                    </div>
                    <div className="p-5 bg-white">
                      <ul className="space-y-2 mb-5">
                        {["Earn up to 15% per sale", "Custom affiliate links", "Real-time commission tracking", "Monthly payouts"].map(item => (
                          <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => setLocation("/auth/register?role=AFFILIATE")}
                        className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded transition-colors"
                      >
                        Join Program Free →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Why Coastaq ── */}
            <section className="bg-gray-50 py-10 border-t border-gray-200">
              <div className="container mx-auto px-4">
                <h2 className="text-xl font-display font-bold text-gray-900 text-center mb-6">Why Trade on Coastaq?</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: <Globe className="w-6 h-6 text-blue-600" />, title: "Global Reach", desc: "Connect with buyers and sellers in 50+ countries" },
                    { icon: <Shield className="w-6 h-6 text-green-600" />, title: "Safe Payments", desc: "Every transaction protected by escrow" },
                    { icon: <Zap className="w-6 h-6 text-yellow-500" />, title: "Fast & Easy", desc: "Start buying or selling in minutes" },
                    { icon: <Tag className="w-6 h-6 text-market" />, title: "Best Prices", desc: "Competitive pricing from verified suppliers" },
                  ].map(item => (
                    <div key={item.title} className="bg-white rounded border border-gray-200 p-5 text-center hover:shadow-sm transition-shadow">
                      <div className="flex justify-center mb-3">{item.icon}</div>
                      <h4 className="font-display font-bold text-sm text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : (

          /* ══════════════════════════════════════════════════════
              BROWSE/SEARCH LAYOUT (with filter active)
          ══════════════════════════════════════════════════════ */
          <>
            {mobileCategoryChips}

            {/* Trust strip compact */}
            <div className="bg-white border-b border-gray-200 py-2.5 hidden md:block">
              <div className="container mx-auto px-4">
                <div className="flex items-center gap-6 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-blue-500" /> {t("escrow.paymentInEscrow")}</span>
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-green-500" /> {t("escrow.disputeProtection")}</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-orange-400" /> Verified Sellers</span>
                  <button onClick={clearFilters} className="ml-auto text-market hover:underline font-medium">
                    ← Back to Homepage
                  </button>
                </div>
              </div>
            </div>

            <div className="flex">
              {/* Category sidebar */}
              <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-gray-200 bg-white">
                <div
                  className="sticky overflow-y-auto"
                  style={{ top: "136px", maxHeight: "calc(100vh - 136px)" }}
                >
                  <div className="px-4 pt-5 pb-3 border-b border-gray-100">
                    <p className="font-display font-bold text-sm text-gray-900">{t("browse.categories")}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t("browse.findWhat")}</p>
                  </div>

                  {loadingCats ? (
                    <div className="px-4 space-y-2 py-4">
                      {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-9 w-full rounded" />)}
                    </div>
                  ) : (
                    <ul className="px-3 py-3 space-y-0.5">
                      <li>
                        <button
                          onClick={clearFilters}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm font-medium transition-colors ${!categoryId ? "bg-red-50 text-market" : "text-gray-700 hover:bg-gray-50"}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${!categoryId ? "bg-market text-white" : "bg-blue-100 text-blue-700"}`}>
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </div>
                            <span>{t("browse.allProducts")}</span>
                          </div>
                        </button>
                      </li>
                      {categories?.map((cat) => {
                        const children = (cat as any).children ?? [];
                        const isParentActive = categoryId === cat.id;
                        const isChildActive = children.some((c: any) => c.id === categoryId);
                        const isOpen = expanded.has(cat.id) || isParentActive || isChildActive;
                        const meta = getCategoryMeta(cat.name);

                        return (
                          <li key={cat.id}>
                            <button
                              onClick={() => children.length > 0 ? toggleExpand(cat.id) : navToCategory(cat.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm font-medium transition-colors ${
                                isParentActive || isChildActive ? "bg-red-50 text-market" : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                                  style={{
                                    background: isParentActive || isChildActive ? "#dc2626" : meta.bg,
                                    color: isParentActive || isChildActive ? "#fff" : meta.fg,
                                  }}
                                >
                                  {meta.icon}
                                </div>
                                <span className="truncate">{tCat(cat.name, lang)}</span>
                              </div>
                              {children.length > 0 ? (
                                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? "rotate-0 text-market" : "-rotate-90 text-gray-300"}`} />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                              )}
                            </button>

                            {children.length > 0 && isOpen && (
                              <ul className="ml-3 mt-0.5 mb-1 pl-3 border-l border-gray-200 space-y-0.5">
                                {children.map((child: any) => (
                                  <li key={child.id}>
                                    <button
                                      onClick={() => navToCategory(child.id)}
                                      className={`w-full text-left px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                        categoryId === child.id
                                          ? "bg-red-50 text-market"
                                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                      }`}
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

              {/* Product grid */}
              <div className="flex-1 min-w-0 px-4 md:px-6 py-6">
                {productGridSection}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
