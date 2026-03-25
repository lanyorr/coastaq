import { useState } from "react";
import { Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { usePaypalConfig } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Store, User, CheckCircle2, LayoutDashboard, ArrowLeft,
  CreditCard, Zap, Clock, ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  PayPalScriptProvider,
  PayPalButtons,
  PayPalCardFieldsProvider,
  PayPalNameField,
  PayPalNumberField,
  PayPalExpiryField,
  PayPalCVVField,
  usePayPalCardFields,
  FUNDING,
} from "@paypal/react-paypal-js";

type RegisteredUser = { role: string; name: string; shopName?: string };
type SellerStep = "choice" | "payment";

const PLAN_FEATURES = [
  "Unlimited product listings",
  "Priority search placement",
  "Full seller analytics",
  "Custom shop branding",
  "Customer messaging",
  "Order management tools",
];

const FIELD_STYLE = {
  base: {
    color: "#0f172a",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "14px",
    padding: "0 12px",
  },
  focus: { color: "#0f172a" },
  invalid: { color: "#dc2626" },
  valid: { color: "#16a34a" },
};

const FIELD_CLASS =
  "h-10 w-full rounded-lg border border-input bg-background text-sm shadow-sm overflow-hidden";

async function createPaypalOrder(): Promise<string> {
  const token = localStorage.getItem("coastaq_token");
  const res = await fetch("/api/subscription/create-order", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Failed to create order");
  }
  const data = await res.json() as { orderID: string };
  return data.orderID;
}

async function capturePaypalOrder(orderID: string) {
  const token = localStorage.getItem("coastaq_token");
  const res = await fetch("/api/subscription/capture-order", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderID }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Could not complete payment");
  }
  return res.json();
}

function SubmitCardButton({ onProcessing }: { onProcessing: (v: boolean) => void }) {
  const { cardFieldsForm } = usePayPalCardFields();
  return (
    <Button
      className="w-full h-11 rounded-xl font-semibold text-sm gap-2"
      onClick={async () => { onProcessing(true); try { await cardFieldsForm.submit(); } catch { onProcessing(false); } }}
    >
      <CreditCard className="w-4 h-4" />
      Pay $20.00
    </Button>
  );
}

function PaymentUI({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"paypal" | "card">("paypal");
  const [cardProcessing, setCardProcessing] = useState(false);

  const handleApprove = async (data: { orderID: string }) => {
    try {
      const result = await capturePaypalOrder(data.orderID);
      qc.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      toast({ title: "Subscription activated!", description: result.message ?? "Your seller subscription is now active." });
      onSuccess();
    } catch (err: any) {
      setCardProcessing(false);
      toast({ variant: "destructive", title: "Payment failed", description: err.message || "Could not complete payment" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-secondary/60 p-1 rounded-xl text-sm">
        <button
          onClick={() => setActiveTab("paypal")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${activeTab === "paypal" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          PayPal
        </button>
        <button
          onClick={() => setActiveTab("card")}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${activeTab === "card" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}
        >
          Debit / Credit Card
        </button>
      </div>

      {activeTab === "paypal" && (
        <PayPalButtons
          fundingSource={FUNDING.PAYPAL}
          style={{ layout: "vertical", shape: "rect", label: "pay", height: 44 }}
          createOrder={createPaypalOrder}
          onApprove={handleApprove}
          onError={(err) => toast({ variant: "destructive", title: "PayPal error", description: String(err) })}
        />
      )}

      {activeTab === "card" && (
        <PayPalCardFieldsProvider
          createOrder={createPaypalOrder}
          onApprove={handleApprove}
          onError={(err) => { setCardProcessing(false); toast({ variant: "destructive", title: "Card error", description: String(err) }); }}
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cardholder Name</label>
              <div className={FIELD_CLASS}><PayPalNameField style={FIELD_STYLE} /></div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Card Number</label>
              <div className={FIELD_CLASS}><PayPalNumberField style={FIELD_STYLE} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Expiry</label>
                <div className={FIELD_CLASS}><PayPalExpiryField style={FIELD_STYLE} /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">CVV</label>
                <div className={FIELD_CLASS}><PayPalCVVField style={FIELD_STYLE} /></div>
              </div>
            </div>
            {cardProcessing
              ? <Button disabled className="w-full h-11 rounded-xl"><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing…</Button>
              : <SubmitCardButton onProcessing={setCardProcessing} />
            }
          </div>
        </PayPalCardFieldsProvider>
      )}
    </div>
  );
}

// ── Subscription choice step ──────────────────────────────────────────────────
function SellerSubscriptionStep({
  shopName,
  onPayNow,
  onFreeTrial,
}: {
  shopName?: string;
  onPayNow: () => void;
  onFreeTrial: () => void;
}) {
  return (
    <div className="glass-panel rounded-[2rem] p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Store className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h1 className="text-2xl font-bold font-display mb-1">
        {shopName ? `${shopName} is ready!` : "Your shop is ready!"}
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        Choose how you'd like to get started with Coastaq.
      </p>

      {/* Features */}
      <div className="bg-secondary/40 rounded-2xl p-4 text-left mb-6 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Everything included:</p>
        {PLAN_FEATURES.map(f => (
          <div key={f} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {/* Pay now */}
        <button
          onClick={onPayNow}
          className="w-full group relative overflow-hidden bg-primary text-primary-foreground rounded-2xl p-5 text-left hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4" />
                <span className="font-bold">Subscribe Now</span>
              </div>
              <p className="text-sm opacity-80">Start immediately, cancel anytime</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-xl font-bold">$20</p>
              <p className="text-xs opacity-70">/month</p>
            </div>
          </div>
        </button>

        {/* Free trial */}
        <button
          onClick={onFreeTrial}
          className="w-full group relative overflow-hidden bg-card border-2 border-border hover:border-primary/40 rounded-2xl p-5 text-left transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-bold">Start Free Trial</span>
              </div>
              <p className="text-sm text-muted-foreground">7 days free, then $20/month</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">7 days free</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Payment step (wrapped in PayPalScriptProvider) ────────────────────────────
function PayNowStep({
  shopName,
  onBack,
  onSuccess,
}: {
  shopName?: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { data: ppConfig, isLoading } = usePaypalConfig();

  if (isLoading || !ppConfig?.paypalClientId) {
    return (
      <div className="glass-panel rounded-[2rem] p-8 flex flex-col items-center justify-center min-h-[280px]">
        <Loader2 className="w-7 h-7 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading payment options…</p>
      </div>
    );
  }

  if (!ppConfig.paypalConfigured) {
    return (
      <div className="glass-panel rounded-[2rem] p-8 text-center">
        <p className="text-muted-foreground mb-4">Payment is not configured yet. You can subscribe from your dashboard later.</p>
        <Button onClick={onSuccess} className="w-full h-11 rounded-xl">Continue to Dashboard</Button>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: ppConfig.paypalClientId,
        currency: "USD",
        intent: "capture",
        components: "buttons,card-fields",
        ...(ppConfig.mode === "sandbox" ? {} : {}),
      }}
    >
      <div className="glass-panel rounded-[2rem] p-8">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold font-display">Subscribe · $20/month</h2>
            <p className="text-sm text-muted-foreground">Cancel anytime from your dashboard</p>
          </div>
        </div>

        <div className="bg-secondary/40 rounded-xl px-4 py-3 flex items-center justify-between mb-5 text-sm">
          <span className="text-muted-foreground">Seller subscription</span>
          <span className="font-bold">$20.00 / month</span>
        </div>

        <PaymentUI onSuccess={onSuccess} />

        <button onClick={onSuccess} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2">
          Skip for now — start 7-day trial instead
        </button>
      </div>
    </PayPalScriptProvider>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Register() {
  const searchParams = new URLSearchParams(window.location.search);
  const defaultRole = searchParams.get("role") === "SELLER" ? "SELLER" : "BUYER";

  const { toast } = useToast();
  const [role, setRole] = useState<"BUYER" | "SELLER">(defaultRole);
  const [registered, setRegistered] = useState<RegisteredUser | null>(null);
  const [sellerStep, setSellerStep] = useState<SellerStep>("choice");
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", shopName: "", shopDescription: "",
  });

  const { mutate: register, isPending } = useRegister({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("coastaq_token", data.token);
        setRegistered({ role: data.user.role, name: data.user.name, shopName: formData.shopName });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Registration failed", description: err.message });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ data: { ...formData, role } });
  };

  const goToDashboard = () => { window.location.href = "/seller/dashboard"; };

  // ── Seller post-registration flow ───────────────────────────────────────────
  if (registered?.role === "SELLER") {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-background py-12">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Background"
          className="fixed inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative z-10 w-full max-w-lg p-4">
          <Link href="/" className="flex justify-center w-full mb-6 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="Coastaq" className="h-24 w-auto object-contain drop-shadow-md" />
          </Link>

          {sellerStep === "choice" && (
            <SellerSubscriptionStep
              shopName={registered.shopName}
              onPayNow={() => setSellerStep("payment")}
              onFreeTrial={goToDashboard}
            />
          )}

          {sellerStep === "payment" && (
            <PayNowStep
              shopName={registered.shopName}
              onBack={() => setSellerStep("choice")}
              onSuccess={goToDashboard}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Buyer success screen ────────────────────────────────────────────────────
  if (registered?.role === "BUYER") {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-background py-12">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Background"
          className="fixed inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative z-10 w-full max-w-lg p-4">
          <Link href="/" className="flex justify-center w-full mb-6 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="Coastaq" className="h-24 w-auto object-contain drop-shadow-md" />
          </Link>

          <div className="glass-panel rounded-[2rem] p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold font-display mb-2">Welcome to Coastaq, {registered.name}!</h1>
            <p className="text-muted-foreground mb-6">Your account has been created successfully.</p>
            <div className="bg-secondary/60 rounded-2xl p-5 text-left mb-8 space-y-3">
              <p className="text-sm font-semibold text-foreground mb-1">As a buyer, you can:</p>
              {["Browse thousands of listings across all categories", "Contact sellers directly via in-app messaging", "Save listings and track your enquiry history", "Request callbacks from sellers"].map(f => (
                <div key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {f}
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <Button className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20" onClick={() => window.location.href = "/buyer/dashboard"}>
                <LayoutDashboard className="w-5 h-5 mr-2" />Go to My Dashboard
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-xl text-base font-semibold" onClick={() => window.location.href = "/"}>
                <ArrowLeft className="w-5 h-5 mr-2" />Browse Listings
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background py-12">
      <img
        src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover opacity-50"
      />

      <div className="relative z-10 w-full max-w-lg p-4">
        <Link href="/" className="flex justify-center w-full mb-6 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="Coastaq" className="h-24 w-auto object-contain drop-shadow-md" />
        </Link>

        <div className="glass-panel rounded-[2rem] p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-display text-foreground">Create an account</h1>
            <p className="text-muted-foreground mt-2">Join our marketplace community</p>
          </div>

          <div className="flex gap-4 mb-8 bg-secondary/50 p-2 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole("BUYER")}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${role === "BUYER" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <User className="w-4 h-4" /> Buyer
            </button>
            <button
              type="button"
              onClick={() => setRole("SELLER")}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${role === "SELLER" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Store className="w-4 h-4" /> Seller
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input required className="bg-white/50 h-12 rounded-xl" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required className="bg-white/50 h-12 rounded-xl" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" required minLength={6} className="bg-white/50 h-12 rounded-xl" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>

            {role === "SELLER" && (
              <div className="space-y-5 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-primary">Your Shop Details</h3>
                </div>
                <div className="space-y-2">
                  <Label>Shop Name</Label>
                  <Input required className="bg-white/50 h-12 rounded-xl" placeholder="e.g. Lagos Tech Hub" value={formData.shopName} onChange={e => setFormData({ ...formData, shopName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Shop Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea className="bg-white/50 rounded-xl" rows={3} placeholder="Tell buyers what you sell..." value={formData.shopDescription} onChange={e => setFormData({ ...formData, shopDescription: e.target.value })} />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20 mt-4"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                role === "SELLER" ? "Create Seller Account" : "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
