import { useState, useCallback } from "react";
import { CoastaqLogo } from "@/components/layout/CoastaqLogo";
import { Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { usePaypalConfig } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Store, User, CheckCircle2, LayoutDashboard,
  CreditCard, Zap, Clock, ChevronLeft, Eye, EyeOff,
  TrendingUp, ChevronRight, Globe, Phone, MapPin,
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

// ── Types ─────────────────────────────────────────────────────────────────────
type FlowStep = "account" | "role" | "onboarding" | "activating" | "seller-sub" | "done";
type SelectedRole = "BUYER" | "SELLER" | "AFFILIATE";

interface AccountData {
  name: string; email: string; phone: string; password: string; country: string;
}
interface SellerData {
  shopName: string; shopDescription: string; businessType: string;
}
interface BuyerData {
  categories: string[]; shippingCountry: string;
}
interface AffiliateData {
  websiteUrl: string; bio: string; paypalEmail: string; trafficSource: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PLAN_FEATURES = [
  "Unlimited product listings",
  "Priority search placement",
  "Full seller analytics",
  "Custom shop branding",
  "Customer messaging",
  "Order management tools",
];

const FIELD_STYLE = {
  base: { color: "#0f172a", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: "14px", padding: "0 12px" },
  focus: { color: "#0f172a" },
  invalid: { color: "#dc2626" },
  valid: { color: "#16a34a" },
};
const FIELD_CLASS = "h-10 w-full rounded-lg border border-input bg-background text-sm shadow-sm overflow-hidden";

const COUNTRIES = [
  "Ghana", "Nigeria", "Kenya", "South Africa", "Tanzania", "Uganda", "Rwanda",
  "Senegal", "Côte d'Ivoire", "Cameroon", "Ethiopia", "Zambia", "Zimbabwe",
  "Mozambique", "Malawi", "Botswana", "Namibia", "Sierra Leone", "Liberia",
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Netherlands", "UAE", "Saudi Arabia", "India", "Singapore", "Other",
];

const BUYER_CATEGORIES = [
  "Electronics", "Fashion & Clothing", "Vehicles", "Property",
  "Home & Furniture", "Health & Beauty", "Sports & Outdoors",
  "Food & Beverages", "Books & Education", "Baby & Kids",
  "Agriculture", "Industrial & Machinery", "Jobs & Services",
];

const BUSINESS_TYPES = [
  "Individual / Sole Trader", "Small Business", "Retailer",
  "Wholesaler", "Manufacturer", "Service Provider", "Other",
];

const TRAFFIC_SOURCES = [
  "Instagram", "YouTube", "TikTok", "Twitter / X",
  "Facebook", "Blog / Website", "Email Newsletter",
  "WhatsApp Groups", "Other",
];

// ── PayPal helpers ─────────────────────────────────────────────────────────────
async function createPaypalOrder(): Promise<string> {
  const token = localStorage.getItem("coastaq_token");
  const res = await fetch("/api/subscription/create-order", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).error || "Failed to create order"); }
  const data = await res.json() as { orderID: string };
  return data.orderID;
}
async function capturePaypalOrder(orderID: string) {
  const token = localStorage.getItem("coastaq_token");
  const res = await fetch("/api/subscription/capture-order", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderID }) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error((err as any).error || "Could not complete payment"); }
  return res.json();
}

function SubmitCardButton({ onProcessing }: { onProcessing: (v: boolean) => void }) {
  const { cardFieldsForm } = usePayPalCardFields();
  return (
    <Button className="w-full h-11 rounded-xl font-semibold text-sm gap-2" onClick={async () => { onProcessing(true); try { await cardFieldsForm.submit(); } catch { onProcessing(false); } }}>
      <CreditCard className="w-4 h-4" />Pay $20.00
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
    } catch (err: any) { setCardProcessing(false); toast({ variant: "destructive", title: "Payment failed", description: err.message }); }
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-secondary/60 p-1 rounded-xl text-sm">
        {(["paypal", "card"] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${activeTab === t ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"}`}>
            {t === "paypal" ? "PayPal" : "Debit / Credit Card"}
          </button>
        ))}
      </div>
      {activeTab === "paypal" && (
        <PayPalButtons fundingSource={FUNDING.PAYPAL} style={{ layout: "vertical", shape: "rect", label: "pay", height: 44 }} createOrder={createPaypalOrder} onApprove={handleApprove} onError={(err) => toast({ variant: "destructive", title: "PayPal error", description: String(err) })} />
      )}
      {activeTab === "card" && (
        <PayPalCardFieldsProvider createOrder={createPaypalOrder} onApprove={handleApprove} onError={(err) => { setCardProcessing(false); toast({ variant: "destructive", title: "Card error", description: String(err) }); }}>
          <div className="space-y-3">
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Cardholder Name</label><div className={FIELD_CLASS}><PayPalNameField style={FIELD_STYLE} /></div></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Card Number</label><div className={FIELD_CLASS}><PayPalNumberField style={FIELD_STYLE} /></div></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Expiry</label><div className={FIELD_CLASS}><PayPalExpiryField style={FIELD_STYLE} /></div></div>
              <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">CVV</label><div className={FIELD_CLASS}><PayPalCVVField style={FIELD_STYLE} /></div></div>
            </div>
            {cardProcessing ? <Button disabled className="w-full h-11 rounded-xl"><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing…</Button> : <SubmitCardButton onProcessing={setCardProcessing} />}
          </div>
        </PayPalCardFieldsProvider>
      )}
    </div>
  );
}

function SellerSubscriptionStep({ shopName, onPayNow, onFreeTrial }: { shopName?: string; onPayNow: () => void; onFreeTrial: () => void }) {
  return (
    <div className="glass-panel rounded-[2rem] p-8 text-center">
      <div className="flex justify-center mb-4"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"><Store className="w-8 h-8 text-primary" /></div></div>
      <h1 className="text-2xl font-bold font-display mb-1">{shopName ? `${shopName} is ready!` : "Your shop is ready!"}</h1>
      <p className="text-muted-foreground text-sm mb-6">Choose how you'd like to get started with Coastaq.</p>
      <div className="bg-secondary/40 rounded-2xl p-4 text-left mb-6 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Everything included:</p>
        {PLAN_FEATURES.map(f => (
          <div key={f} className="flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" /><span>{f}</span></div>
        ))}
      </div>
      <div className="space-y-3">
        <button onClick={onPayNow} className="w-full relative overflow-hidden bg-primary text-primary-foreground rounded-2xl p-5 text-left hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
          <div className="flex items-start justify-between">
            <div><div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4" /><span className="font-bold">Subscribe Now</span></div><p className="text-sm opacity-80">Start immediately, cancel anytime</p></div>
            <div className="text-right shrink-0 ml-4"><p className="text-xl font-bold">$20</p><p className="text-xs opacity-70">/month</p></div>
          </div>
        </button>
        <button onClick={onFreeTrial} className="w-full relative overflow-hidden bg-card border-2 border-border hover:border-primary/40 rounded-2xl p-5 text-left transition-colors">
          <div className="flex items-start justify-between">
            <div><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-primary" /><span className="font-bold">Start Free Trial</span></div><p className="text-sm text-muted-foreground">7 days free, then $20/month</p></div>
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full self-start mt-1">7 days free</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function PayNowStep({ shopName, onBack, onSuccess }: { shopName?: string; onBack: () => void; onSuccess: () => void }) {
  const { data: ppConfig, isLoading } = usePaypalConfig();
  if (isLoading || !ppConfig?.paypalClientId) {
    return <div className="glass-panel rounded-[2rem] p-8 flex flex-col items-center justify-center min-h-[280px]"><Loader2 className="w-7 h-7 animate-spin text-primary mb-3" /><p className="text-sm text-muted-foreground">Loading payment options…</p></div>;
  }
  if (!ppConfig.paypalConfigured) {
    return <div className="glass-panel rounded-[2rem] p-8 text-center"><p className="text-muted-foreground mb-4">Payment is not configured yet. You can subscribe from your dashboard later.</p><Button onClick={onSuccess} className="w-full h-11 rounded-xl">Continue to Dashboard</Button></div>;
  }
  return (
    <PayPalScriptProvider options={{ clientId: ppConfig.paypalClientId, currency: "USD", intent: "capture", components: "buttons,card-fields" }}>
      <div className="glass-panel rounded-[2rem] p-8">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div><h2 className="text-lg font-bold font-display">Subscribe · $20/month</h2><p className="text-sm text-muted-foreground">Cancel anytime from your dashboard</p></div>
        </div>
        <div className="bg-secondary/40 rounded-xl px-4 py-3 flex items-center justify-between mb-5 text-sm"><span className="text-muted-foreground">Seller subscription</span><span className="font-bold">$20.00 / month</span></div>
        <PaymentUI onSuccess={onSuccess} />
        <button onClick={onSuccess} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2">Skip for now — start 7-day trial instead</button>
      </div>
    </PayPalScriptProvider>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: FlowStep }) {
  const steps = ["account", "role", "onboarding", "activating"];
  const current = Math.min(steps.indexOf(step), 3);
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {["Account", "Role", "Setup"].map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              i < current ? "bg-white border-white text-primary" :
              i === current ? "bg-white/20 border-white text-white" :
              "bg-transparent border-white/30 text-white/40"
            }`}>
              {i < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block transition-all ${i <= current ? "text-white" : "text-white/40"}`}>{label}</span>
          </div>
          {i < 2 && <div className={`w-8 h-px transition-all ${i < current ? "bg-white/70" : "bg-white/20"}`} />}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Account info ──────────────────────────────────────────────────────
function AccountStep({ data, onChange, onNext }: { data: AccountData; onChange: (d: AccountData) => void; onNext: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof AccountData, v: string) => { onChange({ ...data, [k]: v }); if (errors[k]) setErrors(e => ({ ...e, [k]: "" })); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.name.trim()) e.name = "Full name is required";
    if (!data.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Enter a valid email";
    if (!data.password) e.password = "Password is required";
    else if (data.password.length < 6) e.password = "Minimum 6 characters";
    if (!data.country) e.country = "Please select your country";
    return e;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onNext();
  };

  return (
    <div className="glass-panel rounded-[2rem] p-8">
      <div className="text-center mb-7">
        <h1 className="text-2xl font-bold font-display text-foreground">Create your account</h1>
        <p className="text-muted-foreground mt-1 text-sm">Fast, secure sign-up — takes under a minute</p>
      </div>

      <form onSubmit={handleNext} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />Full Name</Label>
          <Input id="name" placeholder="Jane Mensah" required className={`bg-white/50 h-11 rounded-xl ${errors.name ? "border-red-400" : ""}`} value={data.name} onChange={e => set("name", e.target.value)} />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" placeholder="jane@example.com" required className={`bg-white/50 h-11 rounded-xl ${errors.email ? "border-red-400" : ""}`} value={data.email} onChange={e => set("email", e.target.value)} />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Phone + Country */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input id="phone" type="tel" placeholder="+233 ..." className="bg-white/50 h-11 rounded-xl" value={data.phone} onChange={e => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country" className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Country</Label>
            <select
              id="country"
              required
              value={data.country}
              onChange={e => set("country", e.target.value)}
              className={`w-full h-11 rounded-xl border bg-white/50 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 ${errors.country ? "border-red-400" : "border-input"}`}
            >
              <option value="">Select…</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} required minLength={6} placeholder="Min. 6 characters" className={`bg-white/50 h-11 rounded-xl pr-11 ${errors.password ? "border-red-400" : ""}`} value={data.password} onChange={e => set("password", e.target.value)} />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20 mt-2 gap-2">
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary font-bold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

// ── Step 2: Role selection ─────────────────────────────────────────────────────
const ROLE_OPTIONS: { role: SelectedRole; icon: React.ReactNode; title: string; tagline: string; perks: string[]; accent: string }[] = [
  {
    role: "BUYER",
    icon: <User className="w-7 h-7" />,
    title: "Buyer",
    tagline: "Shop & discover products",
    perks: ["Browse thousands of listings", "Escrow-protected payments", "Direct seller messaging"],
    accent: "from-blue-500 to-blue-600",
  },
  {
    role: "SELLER",
    icon: <Store className="w-7 h-7" />,
    title: "Seller",
    tagline: "List & sell your products",
    perks: ["Unlimited listings", "Order & shop dashboard", "7-day free trial"],
    accent: "from-violet-500 to-violet-700",
  },
  {
    role: "AFFILIATE",
    icon: <TrendingUp className="w-7 h-7" />,
    title: "Affiliate",
    tagline: "Share links & earn commission",
    perks: ["5% on every referral", "Real-time dashboard", "PayPal payouts"],
    accent: "from-emerald-500 to-emerald-600",
  },
];

function RoleStep({ selected, onSelect, onNext, onBack }: { selected: SelectedRole | null; onSelect: (r: SelectedRole) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div className="glass-panel rounded-[2rem] p-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" />Back
      </button>
      <div className="text-center mb-7">
        <h1 className="text-2xl font-bold font-display">What would you like to do?</h1>
        <p className="text-muted-foreground mt-1 text-sm">You can activate additional roles later from your account settings.</p>
      </div>

      <div className="space-y-3 mb-6">
        {ROLE_OPTIONS.map(({ role, icon, title, tagline, perks, accent }) => (
          <button
            key={role}
            type="button"
            onClick={() => onSelect(role)}
            className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
              selected === role
                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                : "border-border hover:border-primary/40 hover:bg-secondary/30"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shrink-0`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{title}</p>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 transition-all ${selected === role ? "border-primary bg-primary" : "border-border"}`}>
                    {selected === role && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{tagline}</p>
                <div className="flex flex-wrap gap-1.5">
                  {perks.map(p => <span key={p} className="text-[10px] bg-secondary text-muted-foreground rounded-full px-2 py-0.5">{p}</span>)}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button className="w-full h-12 rounded-xl text-base font-bold gap-2" disabled={!selected} onClick={onNext}>
        Continue <ChevronRight className="w-4 h-4" />
      </Button>
      <p className="text-center text-xs text-muted-foreground mt-3">You can always add more roles from your account settings</p>
    </div>
  );
}

// ── Step 3a: Buyer onboarding ─────────────────────────────────────────────────
function BuyerOnboarding({ data, onChange, onNext, onBack, loading }: { data: BuyerData; onChange: (d: BuyerData) => void; onNext: () => void; onBack: () => void; loading: boolean }) {
  const toggle = (cat: string) => {
    const next = data.categories.includes(cat) ? data.categories.filter(c => c !== cat) : [...data.categories, cat];
    onChange({ ...data, categories: next });
  };
  return (
    <div className="glass-panel rounded-[2rem] p-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"><ChevronLeft className="w-4 h-4" />Back</button>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><User className="w-7 h-7 text-blue-600" /></div>
        <h1 className="text-xl font-bold font-display">Personalise your experience</h1>
        <p className="text-muted-foreground text-sm mt-1">Tell us what you're interested in so we can tailor your feed.</p>
      </div>

      <div className="space-y-5">
        <div>
          <Label className="text-sm font-semibold mb-2 block">Interested categories <span className="font-normal text-muted-foreground">(pick any)</span></Label>
          <div className="flex flex-wrap gap-2">
            {BUYER_CATEGORIES.map(cat => (
              <button key={cat} type="button" onClick={() => toggle(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${data.categories.includes(cat) ? "bg-primary text-primary-foreground border-primary" : "bg-white/50 border-border text-foreground hover:border-primary/50"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ship-country" className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Shipping country</Label>
          <select id="ship-country" value={data.shippingCountry} onChange={e => onChange({ ...data, shippingCountry: e.target.value })}
            className="w-full h-11 rounded-xl border border-input bg-white/50 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Select your country…</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <Button className="w-full h-12 rounded-xl text-base font-bold mt-6 gap-2" onClick={onNext} disabled={loading}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" />Create Account</>}
      </Button>
      <button onClick={onNext} disabled={loading} className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1">Skip for now</button>
    </div>
  );
}

// ── Step 3b: Seller onboarding ────────────────────────────────────────────────
function SellerOnboarding({ data, onChange, onNext, onBack, loading }: { data: SellerData; onChange: (d: SellerData) => void; onNext: () => void; onBack: () => void; loading: boolean }) {
  const [error, setError] = useState("");
  const handleNext = () => {
    if (!data.shopName.trim()) { setError("Shop name is required"); return; }
    setError("");
    onNext();
  };
  return (
    <div className="glass-panel rounded-[2rem] p-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"><ChevronLeft className="w-4 h-4" />Back</button>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Store className="w-7 h-7 text-violet-600" /></div>
        <h1 className="text-xl font-bold font-display">Set up your shop</h1>
        <p className="text-muted-foreground text-sm mt-1">You can edit these details anytime from your seller dashboard.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="shopName">Shop Name <span className="text-red-500">*</span></Label>
          <Input id="shopName" placeholder="e.g. Lagos Tech Hub" className={`bg-white/50 h-11 rounded-xl ${error ? "border-red-400" : ""}`} value={data.shopName} onChange={e => { onChange({ ...data, shopName: e.target.value }); setError(""); }} />
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bizType">Business Type</Label>
          <select id="bizType" value={data.businessType} onChange={e => onChange({ ...data, businessType: e.target.value })}
            className="w-full h-11 rounded-xl border border-input bg-white/50 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Select type…</option>
            {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shopDesc">Shop Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea id="shopDesc" className="bg-white/50 rounded-xl" rows={3} placeholder="Describe what you sell, your speciality, or unique selling points…" value={data.shopDescription} onChange={e => onChange({ ...data, shopDescription: e.target.value })} />
        </div>
      </div>

      <Button className="w-full h-12 rounded-xl text-base font-bold mt-6 gap-2" onClick={handleNext} disabled={loading}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Store className="w-4 h-4" />Create Seller Account</>}
      </Button>
    </div>
  );
}

// ── Step 3c: Affiliate onboarding ─────────────────────────────────────────────
function AffiliateOnboarding({ data, onChange, onNext, onBack, loading }: { data: AffiliateData; onChange: (d: AffiliateData) => void; onNext: () => void; onBack: () => void; loading: boolean }) {
  return (
    <div className="glass-panel rounded-[2rem] p-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"><ChevronLeft className="w-4 h-4" />Back</button>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><TrendingUp className="w-7 h-7 text-emerald-600" /></div>
        <h1 className="text-xl font-bold font-display">Set up your affiliate profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Tell us about your audience so we can match you with the best campaigns.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="website" className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Website or social link <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="website" type="url" placeholder="https://instagram.com/yourhandle" className="bg-white/50 h-11 rounded-xl" value={data.websiteUrl} onChange={e => onChange({ ...data, websiteUrl: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Your niche / audience <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea id="bio" className="bg-white/50 rounded-xl" rows={3} placeholder="e.g. I create tech review content for a young African audience…" value={data.bio} onChange={e => onChange({ ...data, bio: e.target.value })} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="paypal">PayPal email for payouts <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input id="paypal" type="email" placeholder="payments@email.com" className="bg-white/50 h-11 rounded-xl" value={data.paypalEmail} onChange={e => onChange({ ...data, paypalEmail: e.target.value })} />
          <p className="text-xs text-muted-foreground">You can also add this later from your affiliate settings.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="traffic">Primary traffic source</Label>
          <select id="traffic" value={data.trafficSource} onChange={e => onChange({ ...data, trafficSource: e.target.value })}
            className="w-full h-11 rounded-xl border border-input bg-white/50 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Select…</option>
            {TRAFFIC_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <Button className="w-full h-12 rounded-xl text-base font-bold mt-6 gap-2" onClick={onNext} disabled={loading}>
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><TrendingUp className="w-4 h-4" />Submit Application</>}
      </Button>
      <button onClick={onNext} disabled={loading} className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1">Skip for now</button>
    </div>
  );
}

// ── Activating step ───────────────────────────────────────────────────────────
function ActivatingStep({ role }: { role: SelectedRole }) {
  const msgs: Record<SelectedRole, string> = {
    BUYER: "Setting up your buyer account…",
    SELLER: "Creating your shop and account…",
    AFFILIATE: "Submitting your affiliate application…",
  };
  return (
    <div className="glass-panel rounded-[2rem] p-12 flex flex-col items-center justify-center text-center gap-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
      <h2 className="text-xl font-bold font-display">Almost there…</h2>
      <p className="text-muted-foreground text-sm">{msgs[role]}</p>
    </div>
  );
}

// ── Done: Buyer success ───────────────────────────────────────────────────────
function BuyerDoneStep({ name }: { name: string }) {
  return (
    <div className="glass-panel rounded-[2rem] p-10 text-center">
      <div className="flex justify-center mb-6"><div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center"><CheckCircle2 className="w-10 h-10 text-primary" /></div></div>
      <h1 className="text-2xl font-bold font-display mb-2">Welcome to Coastaq, {name}!</h1>
      <p className="text-muted-foreground mb-6 text-sm">Your buyer account is ready. Start exploring thousands of listings.</p>
      <div className="bg-secondary/60 rounded-2xl p-5 text-left mb-8 space-y-3">
        {["Browse thousands of listings across all categories", "Contact sellers directly via in-app messaging", "Save listings and track your order history", "Request callbacks from sellers"].map(f => (
          <div key={f} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />{f}</div>
        ))}
      </div>
      <div className="space-y-3">
        <Button className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20" onClick={() => { window.location.href = "/account"; }}>
          <LayoutDashboard className="w-5 h-5 mr-2" />Go to My Account
        </Button>
        <Button variant="outline" className="w-full h-12 rounded-xl text-base font-semibold" onClick={() => { window.location.href = "/"; }}>
          Browse Listings
        </Button>
      </div>
    </div>
  );
}

// ── Done: Affiliate success ───────────────────────────────────────────────────
function AffiliateDoneStep({ name }: { name: string }) {
  return (
    <div className="glass-panel rounded-[2rem] p-10 text-center">
      <div className="flex justify-center mb-6"><div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center"><TrendingUp className="w-10 h-10 text-emerald-600" /></div></div>
      <h1 className="text-2xl font-bold font-display mb-2">Application submitted, {name}!</h1>
      <p className="text-muted-foreground mb-5 text-sm">We'll review your application and notify you within 24 hours. In the meantime, explore the platform.</p>
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-7 text-left space-y-2">
        {["Access your affiliate dashboard to generate links", "Track clicks and earnings in real time", "Payouts via PayPal once you reach $10"].map(f => (
          <div key={f} className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{f}</div>
        ))}
      </div>
      <div className="space-y-3">
        <Button className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20" onClick={() => { window.location.href = "/affiliate"; }}>
          <TrendingUp className="w-5 h-5 mr-2" />Go to Affiliate Dashboard
        </Button>
        <Button variant="outline" className="w-full h-12 rounded-xl text-base font-semibold" onClick={() => { window.location.href = "/"; }}>
          Browse Products
        </Button>
      </div>
    </div>
  );
}

// ── Main Register component ───────────────────────────────────────────────────
export default function Register() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [step, setStep] = useState<FlowStep>("account");
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(null);
  const [sellerPayStep, setSellerPayStep] = useState<"choice" | "payment">("choice");
  const [registeredUser, setRegisteredUser] = useState<{ name: string; role: string; shopName?: string } | null>(null);

  const [accountData, setAccountData] = useState<AccountData>({ name: "", email: "", phone: "", password: "", country: "" });
  const [buyerData, setBuyerData] = useState<BuyerData>({ categories: [], shippingCountry: "" });
  const [sellerData, setSellerData] = useState<SellerData>({ shopName: "", shopDescription: "", businessType: "" });
  const [affiliateData, setAffiliateData] = useState<AffiliateData>({ websiteUrl: "", bio: "", paypalEmail: "", trafficSource: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: registerFn } = useRegister();

  const handleRegister = useCallback(async () => {
    if (!selectedRole) return;
    setIsSubmitting(true);
    setStep("activating");

    try {
      const apiRole = selectedRole === "AFFILIATE" ? "BUYER" : selectedRole;
      const body: any = { name: accountData.name, email: accountData.email, password: accountData.password, role: apiRole };
      if (selectedRole === "SELLER") {
        body.shopName = sellerData.shopName;
        body.shopDescription = sellerData.shopDescription || "";
      }

      const data = await registerFn({ data: body });
      localStorage.setItem("coastaq_token", data.token);
      qc.invalidateQueries();

      if (selectedRole === "AFFILIATE") {
        const token = data.token;
        await fetch("/api/affiliates/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            bio: affiliateData.bio || (affiliateData.trafficSource ? `Traffic source: ${affiliateData.trafficSource}` : ""),
            websiteUrl: affiliateData.websiteUrl || null,
            paypalEmail: affiliateData.paypalEmail || null,
          }),
        }).catch(() => null);
        setRegisteredUser({ name: data.user.name, role: "AFFILIATE" });
        setStep("done");
        return;
      }

      setRegisteredUser({ name: data.user.name, role: data.user.role, shopName: sellerData.shopName });

      if (selectedRole === "SELLER") {
        setStep("seller-sub");
      } else {
        setStep("done");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration failed", description: err.message || "Something went wrong. Please try again." });
      setStep("onboarding");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRole, accountData, sellerData, affiliateData, registerFn, qc, toast]);

  const showProgress = ["account", "role", "onboarding", "activating"].includes(step);

  return (
    <div className="min-h-screen flex items-center justify-center relative py-10 px-4" style={{ background: "linear-gradient(135deg, #0c2461 0%, #1a56db 55%, #1e6fd9 100%)" }}>
      {/* decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-8%] left-[-5%] w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #93c5fd, transparent)" }} />
        <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #a5f3fc, transparent)" }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <Link href="/" className="flex justify-center w-full mb-6 hover:opacity-90 transition-opacity">
          <CoastaqLogo iconSize={52} textSize={28} gap={10} textColor="#fff" />
        </Link>

        {showProgress && <ProgressBar step={step} />}

        {step === "account" && (
          <AccountStep data={accountData} onChange={setAccountData} onNext={() => setStep("role")} />
        )}

        {step === "role" && (
          <RoleStep
            selected={selectedRole}
            onSelect={setSelectedRole}
            onNext={() => setStep("onboarding")}
            onBack={() => setStep("account")}
          />
        )}

        {step === "onboarding" && selectedRole === "BUYER" && (
          <BuyerOnboarding data={buyerData} onChange={setBuyerData} onNext={handleRegister} onBack={() => setStep("role")} loading={isSubmitting} />
        )}
        {step === "onboarding" && selectedRole === "SELLER" && (
          <SellerOnboarding data={sellerData} onChange={setSellerData} onNext={handleRegister} onBack={() => setStep("role")} loading={isSubmitting} />
        )}
        {step === "onboarding" && selectedRole === "AFFILIATE" && (
          <AffiliateOnboarding data={affiliateData} onChange={setAffiliateData} onNext={handleRegister} onBack={() => setStep("role")} loading={isSubmitting} />
        )}

        {step === "activating" && selectedRole && <ActivatingStep role={selectedRole} />}

        {step === "seller-sub" && registeredUser && (
          <>
            {sellerPayStep === "choice" && (
              <SellerSubscriptionStep shopName={registeredUser.shopName} onPayNow={() => setSellerPayStep("payment")} onFreeTrial={() => { window.location.href = "/seller"; }} />
            )}
            {sellerPayStep === "payment" && (
              <PayNowStep shopName={registeredUser.shopName} onBack={() => setSellerPayStep("choice")} onSuccess={() => { window.location.href = "/seller"; }} />
            )}
          </>
        )}

        {step === "done" && registeredUser && (
          <>
            {registeredUser.role === "BUYER" && <BuyerDoneStep name={registeredUser.name} />}
            {registeredUser.role === "AFFILIATE" && <AffiliateDoneStep name={registeredUser.name} />}
          </>
        )}
      </div>
    </div>
  );
}
