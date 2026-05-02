import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useCart } from "@/store/use-cart";
import { ShoppingCart, Trash2, Plus, Minus, Package, Shield, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/locale/context";

const PLATFORM_FEE_RATE = 0.05;

export default function Cart() {
  const [, setLocation] = useLocation();
  const items = useCart(s => s.items);
  const removeItem = useCart(s => s.removeItem);
  const updateQuantity = useCart(s => s.updateQuantity);
  const getTotal = useCart(s => s.getTotal);
  const clearCart = useCart(s => s.clearCart);
  const { formatPrice, t } = useLocale();

  const subtotal = getTotal();
  const total = subtotal;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-32 max-w-lg text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-3">{t("cart.empty")}</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {t("cart.emptyDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="rounded-xl px-8" onClick={() => setLocation("/")}>
              {t("cart.browseListing")}
            </Button>
            <Button variant="outline" className="rounded-xl px-8" onClick={() => setLocation("/buyer/dashboard")}>
              {t("cart.myOrders")}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            {t("cart.title")}
            <span className="text-sm font-normal text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full ml-1">
              {items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
            </span>
          </h1>
          <button
            onClick={() => clearCart()}
            className="text-xs text-muted-foreground hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> {t("cart.clearAll")}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map(item => (
              <div key={item.productId} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground line-clamp-2">{item.title}</p>
                  <p className="text-primary font-bold text-sm mt-0.5">
                    {formatPrice(item.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-right shrink-0 min-w-[60px]">
                  <p className="font-bold text-primary text-sm">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-[11px] text-muted-foreground hover:text-red-600 transition-colors mt-0.5 flex items-center gap-0.5 ml-auto"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="space-y-4">
            <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-3 sticky top-4">
              <h3 className="font-semibold text-foreground">{t("cart.orderSummary")}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t("cart.escrowFee")}</span>
                  <span className="text-muted-foreground">{t("cart.escrowFeeIncluded")}</span>
                </div>
                <div className="border-t border-border/60 pt-2 flex justify-between font-bold text-base">
                  <span>{t("cart.total")}</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>
              <Button
                className="w-full rounded-xl py-3 text-sm font-semibold"
                onClick={() => setLocation("/checkout")}
              >
                {t("cart.checkout")} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <button
                onClick={() => setLocation("/")}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                {t("cart.continueShopping")}
              </button>
            </div>

            {/* Escrow notice */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)" }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-white" />
                <p className="text-xs font-bold text-white">{t("cart.buyerProtection")}</p>
              </div>
              <p className="text-[11px] text-blue-100 leading-relaxed">
                {t("cart.buyerProtectionDesc")}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
