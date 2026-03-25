import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/store/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Checkout() {
  const { items, getTotal, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Since APIs aren't connected yet, we stub the flow
  const handleCheckoutMock = (method: 'stripe' | 'paypal') => {
    setIsProcessing(true);
    setTimeout(() => {
      toast({ title: "Order Placed!", description: `Payment simulated via ${method}.`});
      clearCart();
      setLocation("/orders");
    }, 1500);
  };

  if (items.length === 0 && !isProcessing) {
    setLocation("/cart");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Form Side */}
          <div className="flex-1 space-y-10">
            <section className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">1</div>
                Shipping Address
              </h2>
              <form className="space-y-5">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input className="h-12 rounded-xl" defaultValue="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <Input className="h-12 rounded-xl" defaultValue="123 Ocean Drive" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input className="h-12 rounded-xl" defaultValue="Malibu" />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input className="h-12 rounded-xl" defaultValue="CA" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ZIP Code</Label>
                    <Input className="h-12 rounded-xl" defaultValue="90265" />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input className="h-12 rounded-xl" defaultValue="USA" />
                  </div>
                </div>
              </form>
            </section>

            <section className="bg-card p-8 rounded-[2rem] border border-border/50 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">2</div>
                Payment Method
              </h2>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => handleCheckoutMock('stripe')}
                  disabled={isProcessing}
                  className="w-full h-16 rounded-xl bg-[#635BFF] hover:bg-[#635BFF]/90 text-white text-lg flex items-center justify-center gap-3 shadow-md"
                >
                  <CreditCard className="w-6 h-6" /> Pay with Stripe
                </Button>
                
                <Button 
                  onClick={() => handleCheckoutMock('paypal')}
                  disabled={isProcessing}
                  className="w-full h-16 rounded-xl bg-[#0070BA] hover:bg-[#0070BA]/90 text-white text-lg flex items-center justify-center gap-3 shadow-md"
                >
                  Pay with PayPal
                </Button>
                
                <p className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-green-500" /> Secure encrypted checkout
                </p>
              </div>
            </section>
          </div>

          {/* Order Summary Side */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-secondary/20 p-8 rounded-[2rem] border border-border/50 sticky top-28">
              <h3 className="text-xl font-bold font-display mb-6">In your bag</h3>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <div className="flex gap-3">
                      <span className="font-bold text-muted-foreground">{item.quantity}x</span>
                      <span className="text-foreground truncate max-w-[180px]">{item.title}</span>
                    </div>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-border/50 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>$15.00</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>${(getTotal() * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-border/50">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-primary">
                    ${(getTotal() + 15 + getTotal() * 0.08).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
