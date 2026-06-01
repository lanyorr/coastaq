import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/store/use-cart";
import { usePaypalConfig } from "@/hooks/use-subscription";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Lock, CheckCircle2, ArrowLeft, Loader2, ShoppingBag,
  MapPin, CreditCard, Package, ChevronRight, AlertCircle, Plus, Minus,
} from "lucide-react";

const PLATFORM_FEE_RATE = 0.05;
const PAYPAL_PENDING_KEY = "coastaq_paypal_pending";

interface ShippingForm {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const EMPTY_SHIPPING: ShippingForm = {
  name: "", address: "", city: "", state: "", zip: "", country: "NG",
};

type PayMethod = "paypal" | "manual";

// ── PayPal redirect-based payment button ───────────────────────────────────────
function PayPalRedirectButton({
  items,
  shipping,
  onSuccess,
}: {
  items: Array<{ productId: string; quantity: number; price?: number; title?: string; shopId?: string }>;
  shipping: ShippingForm;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePay = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as any).error || "Failed to create PayPal order");
      }
      const { paypalOrderId, approvalUrl } = await r.json();
      if (!approvalUrl) throw new Error("No PayPal approval URL returned");

      // Save the checkout context so the return page can finalise the order
      sessionStorage.setItem(PAYPAL_PENDING_KEY, JSON.stringify({ paypalOrderId, items, shipping }));

      // Redirect to PayPal
      window.location.href = approvalUrl;
    } catch (e: any) {
      toast({ variant: "destructive", title: "PayPal error", description: e.message });
      setLoading(false);
    }
  };

  return (
    <Button
      className="w-full rounded-xl py-3 text-sm font-semibold bg-[#0070ba] hover:bg-[#003087] text-white"
      onClick={handlePay}
      disabled={loading}
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting to PayPal…</>
      ) : (
        <><CreditCard className="w-4 h-4 mr-2" /> Continue to PayPal</>
      )}
    </Button>
  );
}

// ── Individual product checkout (from ?productId=&qty= query params) ──────────
function ProductCheckout({ productId, initialQty }: { productId: string; initialQty: number }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(initialQty);
  const [shipping, setShipping] = useState<ShippingForm>(EMPTY_SHIPPING);
  const [payMethod, setPayMethod] = useState<PayMethod>("paypal");
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<{ orderId: string; amount: number } | null>(null);
  const [shippingValid, setShippingValid] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: paypalCfg } = usePaypalConfig();

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(d => { setProduct(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    const { name, address, city, state, country } = shipping;
    setShippingValid(!!(name && address && city && state && country));
  }, [shipping]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-semibold">Product not found</p>
      </div>
    );
  }

  const unitPrice = parseFloat(product.price);
  const subtotal = unitPrice * qty;
  const platformFee = subtotal * PLATFORM_FEE_RATE;
  const total = subtotal;

  const handleManualOrder = async () => {
    if (!shippingValid) return;
    setPlacing(true);
    try {
      const res = await fetch("/api/checkout/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: qty, price: unitPrice, title: product.title, shopId: product.shopId }],
          shipping,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Order failed");
      }
      const data = await res.json();
      setDone({ orderId: data.id, amount: total });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Order failed", description: e.message });
    } finally {
      setPlacing(false);
    }
  };

  if (done) {
    return <OrderSuccess orderId={done.orderId} amount={done.amount} onDone={() => setLocation("/buyer/dashboard")} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Left: Form */}
      <div className="lg:col-span-3 space-y-6">
        {/* Quantity stepper */}
        <div className="bg-card border border-border/50 rounded-2xl p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-primary" /> Quantity
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-3 py-2 text-foreground hover:bg-secondary transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-5 py-2 text-sm font-bold text-foreground min-w-[3rem] text-center select-none">
                {qty}
              </span>
              <button
                onClick={() => setQty(q => q + 1)}
                className="px-3 py-2 text-foreground hover:bg-secondary transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{product.title}</p>
              <p className="text-xs text-muted-foreground">${unitPrice.toFixed(2)} each</p>
            </div>
          </div>
        </div>

        <ShippingFormSection shipping={shipping} onChange={setShipping} />
        <PaymentMethodSection
          payMethod={payMethod}
          onSelect={setPayMethod}
          paypalConfigured={!!paypalCfg?.paypalConfigured}
        />

        {payMethod === "paypal" && paypalCfg?.paypalConfigured && (
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Pay with PayPal
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              You'll be redirected to PayPal to complete your payment securely.
            </p>
            {shippingValid ? (
              <PayPalRedirectButton
                items={[{ productId: product.id, quantity: qty }]}
                shipping={shipping}
              />
            ) : (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                Complete your shipping address above to unlock payment.
              </p>
            )}
          </div>
        )}

        {payMethod === "manual" && (
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Cash on Delivery / Manual Payment
            </p>
            <p className="text-xs text-muted-foreground mb-4">Your order will be placed and the seller will contact you with payment instructions.</p>
            <Button
              className="w-full rounded-xl py-3 text-sm font-semibold"
              onClick={handleManualOrder}
              disabled={placing || !shippingValid}
            >
              {placing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing Order…</> : <>Place Order · ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>}
            </Button>
          </div>
        )}
      </div>

      {/* Right: Order summary */}
      <div className="lg:col-span-2 space-y-4">
        <OrderSummary
          items={[{ title: product.title, image: product.images?.[0], price: unitPrice, qty }]}
          subtotal={subtotal}
          platformFee={platformFee}
          total={total}
        />
        <EscrowNotice />
      </div>
    </div>
  );
}

// ── Cart checkout ──────────────────────────────────────────────────────────────
function CartCheckout() {
  const items = useCart(s => s.items);
  const getTotal = useCart(s => s.getTotal);
  const clearCart = useCart(s => s.clearCart);
  const [shipping, setShipping] = useState<ShippingForm>(EMPTY_SHIPPING);
  const [payMethod, setPayMethod] = useState<PayMethod>("paypal");
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<{ orderId: string; amount: number } | null>(null);
  const [shippingValid, setShippingValid] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: paypalCfg } = usePaypalConfig();

  useEffect(() => {
    const { name, address, city, state, country } = shipping;
    setShippingValid(!!(name && address && city && state && country));
  }, [shipping]);

  if (items.length === 0 && !done) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-semibold mb-2">Your cart is empty</p>
        <Button variant="outline" className="rounded-xl" onClick={() => setLocation("/")}>Browse listings</Button>
      </div>
    );
  }

  const subtotal = getTotal();
  const platformFee = subtotal * PLATFORM_FEE_RATE;
  const total = subtotal;

  const handleManualOrder = async () => {
    if (!shippingValid) return;
    setPlacing(true);
    try {
      const apiItems = items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price, title: i.title, shopId: i.shopId }));
      const res = await fetch("/api/checkout/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: apiItems, shipping }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Order failed");
      }
      const data = await res.json();
      clearCart();
      setDone({ orderId: data.id, amount: total });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Order failed", description: e.message });
    } finally {
      setPlacing(false);
    }
  };

  if (done) {
    return <OrderSuccess orderId={done.orderId} amount={done.amount} onDone={() => setLocation("/buyer/dashboard")} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <ShippingFormSection shipping={shipping} onChange={setShipping} />
        <PaymentMethodSection
          payMethod={payMethod}
          onSelect={setPayMethod}
          paypalConfigured={!!paypalCfg?.paypalConfigured}
        />

        {payMethod === "paypal" && paypalCfg?.paypalConfigured && (
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Pay with PayPal
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              You'll be redirected to PayPal to complete your payment securely.
            </p>
            {shippingValid && items.length > 0 ? (
              <PayPalRedirectButton
                items={items.map(i => ({ productId: i.productId, quantity: i.quantity }))}
                shipping={shipping}
              />
            ) : (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                Complete your shipping address above to unlock payment.
              </p>
            )}
          </div>
        )}

        {payMethod === "manual" && (
          <div className="bg-card border border-border/50 rounded-2xl p-5">
            <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Cash on Delivery / Manual Payment
            </p>
            <p className="text-xs text-muted-foreground mb-4">Your order will be placed and the seller will contact you with payment instructions.</p>
            <Button className="w-full rounded-xl py-3 text-sm font-semibold" onClick={handleManualOrder} disabled={placing || !shippingValid}>
              {placing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing Order…</> : <>Place Order · ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>}
            </Button>
          </div>
        )}
      </div>
      <div className="lg:col-span-2 space-y-4">
        <OrderSummary
          items={items.map(i => ({ title: i.title, price: i.price, qty: i.quantity }))}
          subtotal={subtotal}
          platformFee={platformFee}
          total={total}
        />
        <EscrowNotice />
      </div>
    </div>
  );
}

// ── PayPal Return Handler ───────────────────────────────────────────────────────
// Mounted at /checkout/paypal/return — PayPal redirects here after approval
export function PayPalReturnPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [orderId, setOrderId] = useState("");
  const [amount, setAmount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token"); // PayPal order ID
    const payerID = params.get("PayerID");

    if (!token) {
      setErrorMsg("No PayPal token found. The payment may have been cancelled.");
      setStatus("error");
      return;
    }

    const raw = sessionStorage.getItem(PAYPAL_PENDING_KEY);
    if (!raw) {
      setErrorMsg("Checkout session expired. Please start your order again.");
      setStatus("error");
      return;
    }

    const pending = JSON.parse(raw) as {
      paypalOrderId: string;
      items: Array<{ productId: string; quantity: number }>;
      shipping: ShippingForm;
    };

    sessionStorage.removeItem(PAYPAL_PENDING_KEY);

    fetch("/api/checkout/paypal/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paypalOrderId: token,
        items: pending.items,
        shipping: pending.shipping,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setOrderId(data.orderId);
          setAmount(parseFloat(data.amount || "0"));
          setStatus("success");
        } else {
          throw new Error(data.error || "Payment capture failed");
        }
      })
      .catch(e => {
        setErrorMsg(e.message);
        setStatus("error");
      });
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-lg font-semibold text-foreground">Confirming your payment…</p>
            <p className="text-sm text-muted-foreground">Please wait while we secure your funds in escrow.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center space-y-6 py-12">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">Payment Failed</h2>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="rounded-xl" onClick={() => setLocation("/checkout")}>Try Again</Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setLocation("/")}>Back to Shop</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <OrderSuccess
          orderId={orderId}
          amount={amount}
          onDone={() => setLocation("/buyer/dashboard")}
        />
      </main>
      <Footer />
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function ShippingFormSection({ shipping, onChange }: { shipping: ShippingForm; onChange: (s: ShippingForm) => void }) {
  const set = (k: keyof ShippingForm) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...shipping, [k]: e.target.value });
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" /> Shipping Address
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium">Full Name *</Label>
          <Input value={shipping.name} onChange={set("name")} placeholder="John Doe" className="rounded-xl h-10" />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-xs font-medium">Street Address *</Label>
          <Input value={shipping.address} onChange={set("address")} placeholder="123 Market Street" className="rounded-xl h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">City *</Label>
          <Input value={shipping.city} onChange={set("city")} placeholder="Lagos" className="rounded-xl h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">State / Province *</Label>
          <Input value={shipping.state} onChange={set("state")} placeholder="Lagos State" className="rounded-xl h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Postal Code</Label>
          <Input value={shipping.zip} onChange={set("zip")} placeholder="100001" className="rounded-xl h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Country *</Label>
          <Input value={shipping.country} onChange={set("country")} placeholder="NG" className="rounded-xl h-10" />
        </div>
      </div>
    </div>
  );
}

function PaymentMethodSection({ payMethod, onSelect, paypalConfigured }: {
  payMethod: PayMethod; onSelect: (m: PayMethod) => void; paypalConfigured: boolean;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-3">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-primary" /> Payment Method
      </h3>
      <div className="space-y-2">
        {paypalConfigured && (
          <button
            onClick={() => onSelect("paypal")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${payMethod === "paypal" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#003087] flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-black">PP</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">PayPal</p>
              <p className="text-xs text-muted-foreground">Redirects to PayPal for secure payment</p>
            </div>
            {payMethod === "paypal" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
          </button>
        )}
        <button
          onClick={() => onSelect("manual")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left ${payMethod === "manual" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
        >
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Cash on Delivery</p>
            <p className="text-xs text-muted-foreground">Pay when your item arrives</p>
          </div>
          {payMethod === "manual" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
        </button>
      </div>
    </div>
  );
}

function OrderSummary({ items, subtotal, platformFee, total }: {
  items: { title: string; image?: string; price: number; qty: number }[];
  subtotal: number; platformFee: number; total: number;
}) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 sticky top-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <ShoppingBag className="w-4 h-4 text-primary" /> Order Summary
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {item.image ? (
              <img src={item.image} alt={item.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-2">{item.title}</p>
              <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
            </div>
            <p className="text-sm font-bold text-primary shrink-0">
              ${(item.price * item.qty).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">${subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> Escrow fee (5%)</span>
          <span className="text-muted-foreground">Included</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-1 border-t border-border/60">
          <span className="text-foreground">Total</span>
          <span className="text-primary">${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}

function EscrowNotice() {
  return (
    <div className="rounded-2xl p-4 space-y-3" style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)" }}>
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-white shrink-0" />
        <p className="text-sm font-bold text-white">Buyer Protection Active</p>
      </div>
      <p className="text-xs text-blue-100 leading-relaxed">
        Your payment is protected. <strong className="text-white">Seller is paid only after successful delivery.</strong>
        Funds are held in escrow and automatically released 7 days after delivery if you take no action.
      </p>
      <div className="space-y-1.5">
        {[
          "Payment held securely until you confirm receipt",
          "Open a dispute if anything goes wrong",
          "Full refund if seller can't fulfill",
        ].map(t => (
          <div key={t} className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-200 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-100">{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderSuccess({ orderId, amount, onDone }: { orderId: string; amount: number; onDone: () => void }) {
  return (
    <div className="max-w-md mx-auto text-center py-12 space-y-6">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">Order Placed!</h2>
        <p className="text-muted-foreground text-sm">Order #{orderId.slice(-8).toUpperCase()}</p>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <p className="text-sm font-semibold text-blue-800">Payment secured in escrow</p>
        </div>
        <p className="text-xs text-blue-700 leading-relaxed">
          Your payment of <strong>${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> is held safely.
          The seller will fulfill your order and funds are only released when you confirm receipt.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button className="rounded-xl py-3" onClick={onDone}>
          Track Your Order <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ── Order timeline ─────────────────────────────────────────────────────────────
function OrderTimeline({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  const steps = [
    { key: "placed",    label: "Placed" },
    { key: "escrowed",  label: "Payment Secured" },
    { key: "confirmed", label: "Confirmed" },
    { key: "shipped",   label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "released",  label: "Released" },
  ];

  function getActiveStep(): number {
    if (paymentStatus === "released") return 5;
    if (paymentStatus === "refunded") return 5;
    if (status === "DELIVERED") return 4;
    if (status === "SHIPPED") return 3;
    if (status === "CONFIRMED") return 2;
    if (paymentStatus === "escrowed") return 1;
    return 0;
  }

  const active = getActiveStep();

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center shrink-0">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
              i <= active ? "bg-primary border-primary text-white" : "bg-background border-border text-muted-foreground"
            }`}>
              {i < active ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
            </div>
            <p className={`text-[9px] font-medium mt-1 whitespace-nowrap ${i <= active ? "text-primary" : "text-muted-foreground/60"}`}>
              {step.label}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-6 sm:w-8 mx-0.5 mb-4 ${i < active ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export { OrderTimeline };

// ── Checkout step indicator ────────────────────────────────────────────────────
function CheckoutSteps({ activeStep }: { activeStep: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Shipping" },
    { n: 2, label: "Payment" },
    { n: 3, label: "Confirm" },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              step.n < activeStep
                ? "bg-primary border-primary text-white"
                : step.n === activeStep
                  ? "bg-primary border-primary text-white ring-4 ring-primary/20"
                  : "bg-background border-border text-muted-foreground"
            }`}>
              {step.n < activeStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.n}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${step.n <= activeStep ? "text-foreground" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-8 sm:w-16 mx-2 sm:mx-3 rounded ${step.n < activeStep ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Checkout() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const productId = params.get("productId");
  const qty = parseInt(params.get("qty") || "1", 10);
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold text-foreground">Checkout</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" /> Escrow Protected
            </span>
          </div>
        </div>
        <CheckoutSteps activeStep={1} />
        {productId ? (
          <ProductCheckout productId={productId} initialQty={qty} />
        ) : (
          <CartCheckout />
        )}
      </main>
      <Footer />
    </div>
  );
}
