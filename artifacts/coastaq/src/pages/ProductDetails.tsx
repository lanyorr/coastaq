import { useRoute } from "wouter";
import { useGetProduct } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, MapPin, Store, ShieldCheck, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function ProductDetails() {
  const [, params] = useRoute("/products/:id");
  const id = params?.id || "";
  
  const { data: product, isLoading, isError } = useGetProduct(id);
  const addItem = useCart(state => state.addItem);
  const { toast } = useToast();
  const [activeImage, setActiveImage] = useState(0);

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

  {/* product placeholder abstract elegant */}
  const defaultImage = "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1000&h=1000&fit=crop";
  const images = product.images?.length ? product.images : [defaultImage];

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      shopId: product.shopId,
    });
    toast({
      title: "Added to cart",
      description: "Item successfully added to your cart.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        <div className="bg-card border border-border/50 rounded-[2rem] p-6 md:p-12 shadow-xl shadow-black/5">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Image Gallery */}
            <div className="w-full lg:w-1/2 space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-border">
                <img 
                  src={images[activeImage]} 
                  alt={product.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50'}`}
                    >
                      <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="mb-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold tracking-wider mb-4">
                  {product.condition}
                </div>
                <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground leading-tight mb-4">
                  {product.title}
                </h1>
                <div className="text-4xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-muted-foreground mb-8">
                <p>{product.description || "No description provided."}</p>
              </div>

              <div className="bg-secondary/30 rounded-2xl p-6 mb-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                  <div className="bg-white p-2 rounded-lg shadow-sm"><Store className="w-5 h-5 text-primary" /></div>
                  Sold by <a href={`/shops/${product.shopId}`} className="text-primary hover:underline">{product.shop?.name || "Unknown Shop"}</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                  <div className="bg-white p-2 rounded-lg shadow-sm"><MapPin className="w-5 h-5 text-primary" /></div>
                  Ships from {product.location || "Anywhere"}
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground font-medium">
                  <div className="bg-white p-2 rounded-lg shadow-sm"><ShieldCheck className="w-5 h-5 text-primary" /></div>
                  Coastaq Buyer Protection
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                  <Truck className="w-4 h-4" />
                  <span>Ships within 2-3 business days</span>
                </div>
                <Button 
                  size="lg" 
                  className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </Button>
                {product.stock > 0 && product.stock <= 5 && (
                  <p className="text-center text-accent mt-3 text-sm font-semibold">
                    Only {product.stock} left in stock!
                  </p>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
