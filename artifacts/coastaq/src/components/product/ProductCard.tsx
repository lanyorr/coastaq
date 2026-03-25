import { Link } from "wouter";
import { type Product } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MapPin } from "lucide-react";
import { useCart } from "@/store/use-cart";
import { useToast } from "@/hooks/use-toast";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to product detail
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      shopId: product.shopId,
    });
    toast({
      title: "Added to cart",
      description: `${product.title} has been added to your bag.`,
    });
  };

  {/* product placeholder abstract elegant */}
  const defaultImage = "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=500&h=500&fit=crop";
  const image = product.images?.[0] || defaultImage;

  return (
    <Link href={`/products/${product.id}`} className="group block h-full">
      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 hover-lift h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <img 
            src={image} 
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.condition === "NEW" && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold text-primary shadow-sm">
              NEW
            </div>
          )}
        </div>
        
        <div className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="font-display font-semibold text-lg text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {product.title}
            </h3>
            <span className="font-bold text-lg text-primary whitespace-nowrap">
              ${product.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          {product.shop && (
            <p className="text-sm text-muted-foreground mb-3 font-medium">
              by {product.shop.name}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between pt-4">
            <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate max-w-[100px]">{product.location || "Anywhere"}</span>
            </div>
            
            <Button 
              size="sm" 
              className="rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
