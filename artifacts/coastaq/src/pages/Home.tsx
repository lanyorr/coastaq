import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Store } from "lucide-react";

export default function Home() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("category") || undefined;

  const { data: productsData, isLoading: loadingProducts } = useListProducts({ 
    search: searchQuery,
    categoryId: categoryId,
    limit: 20 
  });
  
  const { data: categories, isLoading: loadingCats } = useListCategories();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      {!searchQuery && !categoryId && (
        <section className="relative px-4 pt-6 pb-12 sm:pt-12 sm:pb-20">
          <div className="container mx-auto">
            <div className="relative rounded-[2rem] overflow-hidden bg-primary/5 border border-primary/10">
              <img 
                src={`${import.meta.env.BASE_URL}images/hero-coastal.png`} 
                alt="Coastal waves" 
                className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
              />
              <div className="relative z-10 p-8 md:p-16 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md text-primary text-sm font-semibold mb-6 shadow-sm">
                  <Store className="w-4 h-4" />
                  <span>Discover Independent Creators</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 leading-[1.1]">
                  Bring the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">breeze</span> to your life.
                </h1>
                <p className="text-lg text-foreground/80 mb-8 max-w-lg font-medium">
                  Shop unique, handcrafted, and curated items from seaside sellers around the world.
                </p>
                <Button size="lg" className="rounded-full font-bold px-8 shadow-lg shadow-primary/20 text-base" onClick={() => window.scrollTo({ top: 500, behavior: 'smooth'})}>
                  Start Exploring
                </Button>
              </div>
            </div>
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
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-6 w-3/4 rounded-md" />)}
              </div>
            ) : (
              <ul className="space-y-1">
                <li>
                  <a 
                    href="/" 
                    className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${!categoryId ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                  >
                    All Products
                  </a>
                </li>
                {categories?.map((cat) => (
                  <li key={cat.id}>
                    <a 
                      href={`/?category=${cat.id}`}
                      className={`block px-3 py-2 rounded-xl text-sm font-medium transition-colors ${categoryId === cat.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'}`}
                    >
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {searchQuery && (
            <h2 className="text-2xl font-display font-bold mb-6">
              Search results for "{searchQuery}"
            </h2>
          )}
          
          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productsData?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
