import { useState } from "react";
import { Link, useLocation } from "wouter";
import { type Product } from "@workspace/api-client-react";
import { ShoppingCart, MapPin, Shield, MessageCircle, CheckCircle2 } from "lucide-react";
import { useCart } from "@/store/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useLocale } from "@/lib/locale/context";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();
  const { formatPrice, t } = useLocale();
  const [, setLocation] = useLocation();

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
      description: `${product.title} added to your cart.`,
    });
  };

  const handleInquire = (e: React.MouseEvent) => {
    e.preventDefault();
    setLocation(`/products/${product.id}`);
  };

  const FALLBACK = "https://images.unsplash.com/photo-1614179924047-e1ab49a0a0cf?w=600&h=600&fit=crop&auto=format";
  const [imgSrc, setImgSrc] = useState(product.images?.[0] || FALLBACK);

  return (
    <Link href={`/products/${product.id}`} className="group block h-full">
      <div className="bg-white rounded border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 h-full flex flex-col">

        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-t">
          <img
            src={imgSrc}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgSrc(FALLBACK)}
          />
          {/* Condition badge */}
          {product.condition === "NEW" && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              NEW
            </div>
          )}
          {product.condition === "REFURBISHED" && (
            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
              REFURB
            </div>
          )}
          {/* Escrow badge */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">
            <Shield className="w-2.5 h-2.5" />
            Escrow
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col flex-1 gap-1.5">
          {/* Title */}
          <h3 className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-market transition-colors">
            {product.title}
          </h3>

          {/* Price */}
          <p className="font-bold text-sm sm:text-base text-market">
            {formatPrice(product.price)}
          </p>

          {/* Supplier */}
          {product.shop && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
              <span className="text-xs text-gray-500 truncate">{product.shop.name}</span>
            </div>
          )}

          {/* Location */}
          {product.location && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{product.location}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto pt-2 flex gap-1.5">
            <button
              onClick={handleInquire}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold mkt-btn rounded"
            >
              Inquire
            </button>
            <button
              onClick={handleAddToCart}
              title={t("product.add")}
              className="flex items-center justify-center p-1.5 border border-gray-300 rounded hover:border-primary hover:text-primary transition-colors text-gray-500"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setLocation("/messages"); }}
              className="flex items-center justify-center p-1.5 border border-gray-300 rounded hover:border-primary hover:text-primary transition-colors text-gray-500"
              title="Chat"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
