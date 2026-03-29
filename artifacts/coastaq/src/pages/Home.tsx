import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Search, ChevronDown, ChevronRight, ChevronLeft, Store, MapPin, Star, Plus, Zap, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

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

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Banner */}
      {!searchQuery && !categoryId && (
        <section
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0f2d6e 0%, #1a4a9e 30%, #1e5cbf 55%, #1a4a9e 80%, #0d2558 100%)",
            minHeight: 460,
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }} />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #93c5fd, transparent)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{ background: "radial-gradient(circle, #bfdbfe, transparent)" }} />

          <div className="relative container mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col md:flex-row items-center gap-8 md:gap-12" style={{ minHeight: 460 }}>
            {/* Left: Hero content */}
            <div className="flex-1 flex flex-col gap-6 md:gap-7 z-10">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight mb-4">
                  Where Every<br />
                  Transaction Builds<br />
                  <span style={{ color: "#60a5fa" }}>Community</span>
                </h1>
                <p className="text-base md:text-lg text-blue-100/80 max-w-md leading-relaxed">
                  Discover trusted marketplace connecting coastal commerce globally. Buy, sell, and trade with confidence in our vibrant community.
                </p>
              </div>

              {/* Search bar */}
              <form onSubmit={handleHeroSearch} className="flex items-center gap-0 max-w-lg">
                <div className="flex items-center flex-1 bg-white rounded-l-full px-4 py-3 shadow-lg gap-3">
                  <Search className="h-4 w-4 text-gray-400 shrink-0" />
                  <input
                    type="search"
                    placeholder="Search for anything..."
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
                  Search
                </button>
              </form>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setLocation("/auth/register?role=SELLER")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Post Free Ad
                </button>
                <button
                  onClick={() => document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-white/30 text-white/90 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Browse Deals
                </button>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 md:gap-8 pt-2">
                {[
                  { value: "2.5M+", label: "Listings", icon: <TrendingUp className="w-4 h-4" /> },
                  { value: "850K+", label: "Sellers", icon: <Store className="w-4 h-4" /> },
                  { value: "4.8★", label: "Rating", icon: <Star className="w-4 h-4 fill-current" /> },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <span className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">{s.value}</span>
                    <span className="text-xs text-blue-200/70 font-medium uppercase tracking-wide">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Featured listing card */}
            <div className="hidden md:flex flex-col gap-3 shrink-0 w-[340px] z-10">
              <div
                className="rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)" }}
              >
                {/* Card image placeholder */}
                <div className="relative h-48 overflow-hidden" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)" }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-blue-200/40">
                      <Store className="w-16 h-16 mx-auto mb-2" />
                      <p className="text-xs font-medium">Featured Listings</p>
                    </div>
                  </div>
                  {/* Carousel arrows */}
                  <button className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors">
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                  {/* Badges */}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "#f97316" }}>
                      Featured
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-primary">
                      Top Seller
                    </span>
                  </div>
                </div>
                {/* Card info */}
                <div className="p-4" style={{ background: "rgba(15, 30, 80, 0.85)", backdropFilter: "blur(12px)" }}>
                  <h3 className="text-white font-display font-bold text-lg leading-tight mb-1">
                    Premium Marketplace Deals
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-200/60">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs">Coastaq Global</span>
                    </div>
                    <span className="text-white font-bold text-lg" style={{ color: "#60a5fa" }}>Explore →</span>
                  </div>
                </div>
              </div>

              {/* Live indicator */}
              <div className="flex items-center justify-center gap-2 text-blue-200/60 text-xs">
                <Users className="w-3.5 h-3.5" />
                <span>Thousands of buyers active right now</span>
              </div>
            </div>
          </div>
        </section>
      )}

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
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-28 glass-panel p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-6 text-foreground font-display font-semibold text-lg">
              <Filter className="w-5 h-5 text-primary" />
              Categories
            </div>
            
            {loadingCats ? (
              <div className="space-y-3">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-6 w-3/4 rounded-md" />)}
              </div>
            ) : (
              <ul className="space-y-0.5">
                <li>
                  <button
                    onClick={() => {
                      const next = new URLSearchParams();
                      if (searchQuery) next.set("search", searchQuery);
                      setLocation(`/${next.toString() ? `?${next}` : ""}`);
                    }}
                    className={`w-full text-left block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${!categoryId ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                  >
                    All Products
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
                      {/* Parent row */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navToCategory(cat.id)}
                          className={`flex-1 text-left block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isParentActive || isChildActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                        >
                          {cat.name}
                        </button>
                        {children.length > 0 && (
                          <button
                            onClick={() => toggleExpand(cat.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors shrink-0"
                            aria-label={isOpen ? "Collapse" : "Expand"}
                          >
                            {isOpen
                              ? <ChevronDown className="w-3.5 h-3.5" />
                              : <ChevronRight className="w-3.5 h-3.5" />
                            }
                          </button>
                        )}
                      </div>

                      {/* Subcategories */}
                      {children.length > 0 && isOpen && (
                        <ul className="ml-3 mt-0.5 mb-1 pl-3 border-l border-border space-y-0.5">
                          {children.map((child: any) => (
                            <li key={child.id}>
                              <button
                                onClick={() => navToCategory(child.id)}
                                className={`w-full text-left block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryId === child.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                              >
                                {child.name}
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

        {/* Product Grid */}
        <div id="product-grid" className="flex-1 min-w-0">
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
                : "All Products"}
            </h2>
            {!loadingProducts && productsData && productsData.total > 0 && (
              <span className="text-sm text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full">
                {productsData.total.toLocaleString()} listing{productsData.total !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
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
              <h3 className="text-xl font-display font-bold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
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
      </main>

      <Footer />
    </div>
  );
}
