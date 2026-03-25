import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/store/use-cart";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Cart() {
  const { items, updateQuantity, removeItem, getTotal } = useCart();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        <h1 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
          <ShoppingBag className="text-primary w-8 h-8" />
          Your Cart
        </h1>

        {items.length === 0 ? (
          <div className="bg-card rounded-[2rem] border border-border/50 p-12 text-center shadow-sm">
            <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-3">It's empty here!</h2>
            <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Button size="lg" className="rounded-full px-8" onClick={() => setLocation("/")}>
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  {/* Since image isn't reliably stored in minimal cart state, use placeholder for now or modify cart store to accept it. We'll just use a beautiful abstract placeholder */}
                  <div className="w-24 h-24 rounded-xl bg-secondary/50 overflow-hidden shrink-0">
                    <img src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=200&h=200&fit=crop" alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground truncate">{item.title}</h3>
                    <p className="text-primary font-semibold">${item.price.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-3 bg-secondary/30 p-1 rounded-lg">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-2 hover:bg-white rounded-md text-muted-foreground hover:text-foreground transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-2 hover:bg-white rounded-md text-muted-foreground hover:text-foreground transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeItem(item.productId)}
                    className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors ml-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="w-full lg:w-[380px] shrink-0">
              <div className="bg-card border border-border/50 rounded-[2rem] p-8 shadow-lg sticky top-28">
                <h3 className="text-xl font-bold font-display mb-6">Order Summary</h3>
                
                <div className="space-y-4 mb-6 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-foreground font-medium">${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-primary font-medium">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-border pt-4 flex justify-between items-end">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-3xl font-bold text-primary">${getTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full rounded-xl h-14 text-lg font-bold shadow-lg shadow-primary/20"
                  onClick={() => setLocation("/checkout")}
                >
                  Proceed to Checkout <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
