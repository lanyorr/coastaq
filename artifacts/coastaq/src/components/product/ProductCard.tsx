import { useState } from "react";
import { Link } from "wouter";
import { type Product } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MapPin, Shield } from "lucide-react";
import { useCart } from "@/store/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/lib/locale/context";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();
  const { formatPrice, t } = useLocale();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
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

  const FALLBACK = "https://images.unsplash.com/photo-1614179924047-e1ab49a0a0cf?w=600&h=600&fit=crop&auto=format";
  const rawImage = product.images?.[0] || FALLBACK;
  // Use relative upload URLs as-is; only apply fallback on load error
  const [imgSrc, setImgSrc] = useState(rawImage);

  return (
    <Link href={`/products/${product.id}`} className="group block h-full">
      <div className="bg-card rounded-2xl overflow-hidden border border-border/50 hover-lift h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-secondary/30">
          <img
            src={imgSrc}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgSrc(FALLBACK)}
          />
          {(product.condition === "NEW" || product.condition === "REFURBISHED") && (
            <div className={`absolute top-3 left-3 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-bold shadow-sm ${product.condition === "NEW" ? "bg-white/90 text-primary" : "bg-amber-100/90 text-amber-700"}`}>
              {product.condition === "NEW" ? t("product.condition.NEW") : t("product.condition.REFURBISHED")}
            </div>
          )}
          {/* Escrow badge overlay */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
            <Shield className="w-2.5 h-2.5" />
            {t("product.escrow")}
          </div>
        </div>

        <div className="p-3 sm:p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-1 sm:mb-2 gap-1">
            <h3 className="font-display font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </div>
          <span className="font-bold text-sm sm:text-base text-primary mb-1">
            {formatPrice(product.price)}
          </span>

          {product.shop && (
            <p className="text-xs text-muted-foreground mb-2 font-medium truncate">
              {product.shop.name}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between pt-2 sm:pt-4">
            <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md min-w-0">
              <MapPin className="w-3 h-3 mr-1 shrink-0" />
              <span className="truncate max-w-[60px] sm:max-w-[100px]">{product.location || t("product.placeholderLocation")}</span>
            </div>

            <Button
              size="sm"
              className="rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors h-7 sm:h-8 px-2 sm:px-3 text-xs"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">{t("product.add")}</span>
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
