import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Search, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 24;

export default function Home() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("category") || undefined;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [heroSearch, setHeroSearch] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroSearch.trim();
    if (q) setLocation(`/?search=${encodeURIComponent(q)}`);
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
        <section className="bg-gradient-to-r from-[#0ea5e9]/8 via-[#06b6d4]/5 to-[#3b82f6]/8 border-b border-primary/10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-6">
            {/* Tagline */}
            <p className="text-base md:text-lg font-display font-semibold text-foreground/85 tracking-tight shrink-0">
              Your everyday marketplace,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-500 to-cyan-500">
                powered by everyone
              </span>
            </p>

            {/* Compact Search */}
            <form onSubmit={handleHeroSearch} className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-white rounded-full border border-primary/20 shadow-sm px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Search className="h-3.5 w-3.5 text-primary/40 shrink-0 mr-2" />
                <input
                  type="search"
                  placeholder="Search products…"
                  className="bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/60 w-44"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="rounded-full bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 h-8 shadow-sm shadow-primary/20 shrink-0"
              >
                Search
              </Button>
            </form>
          </div>
        </section>
      )}

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
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
                  <a 
                    href="/" 
                    className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${!categoryId ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                  >
                    All Products
                  </a>
                </li>
                {categories?.map((cat) => {
                  const children = (cat as any).children ?? [];
                  const isParentActive = categoryId === cat.id;
                  const isChildActive = children.some((c: any) => c.id === categoryId);
                  // Auto-expand when this category or a child of it is active
                  const isOpen = expanded.has(cat.id) || isParentActive || isChildActive;

                  return (
                    <li key={cat.id}>
                      {/* Parent row */}
                      <div className="flex items-center gap-1">
                        <a
                          href={`/?category=${cat.id}`}
                          className={`flex-1 block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isParentActive || isChildActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                        >
                          {cat.name}
                        </a>
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
                              <a
                                href={`/?category=${child.id}`}
                                className={`block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryId === child.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                              >
                                {child.name}
                              </a>
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
        <div className="flex-1 min-w-0">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="space-y-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
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
