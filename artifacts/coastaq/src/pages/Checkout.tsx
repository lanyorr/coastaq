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
  MapPin, CreditCard, Package, ChevronRight, AlertCircle,
} from "lucide-react";
import {
  PayPalScriptProvider,
  PayPalButtons,
} from "@paypal/react-paypal-js";

const PLATFORM_FEE_RATE = 0.05;

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

// ── Individual product checkout (from ?productId=&qty= query params) ──────────
function ProductCheckout({ productId, qty }: { productId: string; qty: number }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState<ShippingForm>(EMPTY_SHIPPING);
  const [payMethod, setPayMethod] = useState<PayMethod>("paypal");
  const [orderNote, setOrderNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState<{ orderId: string; amount: number } | null>(null);
  const [shippingValid, setShippingValid] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: paypalCfg } = usePaypalConfig();
  const token = localStorage.getItem("coastaq_token");

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(d => { setProduct(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    const { name, address, city, state, zip, country } = shipping;
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
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: qty, price: unitPrice, title: product.title, shopId: product.shopId }],
          shipping,
          buyerNote: orderNote,
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
        <ShippingFormSection shipping={shipping} onChange={setShipping} />
        <PaymentMethodSection
          payMethod={payMethod}
          onSelect={setPayMethod}
          paypalConfigured={!!paypalCfg?.paypalConfigured}
        />
        {payMethod === "paypal" && paypalCfg?.paypalConfigured && shippingValid && (
          <PayPalScriptProvider options={{ clientId: paypalCfg.clientId!, currency: "USD", intent: "capture" }}>
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Pay with PayPal
              </p>
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect", color: "blue", label: "pay" }}
                createOrder={async () => {
                  const r = await fetch("/api/checkout/paypal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ productId: product.id, quantity: qty }),
                  });
                  if (!r.ok) throw new Error("Failed to create PayPal order");
                  const d = await r.json();
                  return d.paypalOrderId;
                }}
                onApprove={async (data) => {
                  const r = await fetch("/api/checkout/paypal/capture", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ paypalOrderId: data.orderID, productId: product.id, quantity: qty, shipping }),
                  });
                  if (!r.ok) throw new Error("Payment capture failed");
                  const result = await r.json();
                  setDone({ orderId: result.orderId, amount: total });
                }}
                onError={(err) => {
                  toast({ variant: "destructive", title: "PayPal error", description: "Payment failed. Please try again." });
                  console.error(err);
                }}
              />
            </div>
          </PayPalScriptProvider>
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
        {payMethod === "paypal" && !shippingValid && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            Complete your shipping address above to unlock payment.
          </p>
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
  const token = localStorage.getItem("coastaq_token");

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
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
        {payMethod === "paypal" && paypalCfg?.paypalConfigured && shippingValid && items.length > 0 && (
          <PayPalScriptProvider options={{ clientId: paypalCfg.clientId!, currency: "USD", intent: "capture" }}>
            <div className="bg-card border border-border/50 rounded-2xl p-5">
              <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Pay with PayPal
              </p>
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect", color: "blue", label: "pay" }}
                createOrder={async () => {
                  const r = await fetch("/api/checkout/paypal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ productId: items[0].productId, quantity: items[0].quantity }),
                  });
                  if (!r.ok) throw new Error("Failed to create PayPal order");
                  const d = await r.json();
                  return d.paypalOrderId;
                }}
                onApprove={async (data) => {
                  const r = await fetch("/api/checkout/paypal/capture", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ paypalOrderId: data.orderID, productId: items[0].productId, quantity: items[0].quantity, shipping }),
                  });
                  if (!r.ok) throw new Error("Payment capture failed");
                  const result = await r.json();
                  clearCart();
                  setDone({ orderId: result.orderId, amount: total });
                }}
                onError={() => toast({ variant: "destructive", title: "PayPal error", description: "Payment failed. Please try again." })}
              />
            </div>
          </PayPalScriptProvider>
        )}
        {payMethod === "paypal" && !shippingValid && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            Complete your shipping address above to unlock payment.
          </p>
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
              <p className="text-xs text-muted-foreground">Secure payment via PayPal</p>
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
        <div className="mb-6 flex items-center gap-3">
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
        {productId ? (
          <ProductCheckout productId={productId} qty={qty} />
        ) : (
          <CartCheckout />
        )}
      </main>
      <Footer />
    </div>
  );
}
