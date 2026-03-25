import { useState } from "react";
import { Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Waves, Loader2, Store, User, CheckCircle2, LayoutDashboard, ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RegisteredUser = { role: string; name: string; shopName?: string };

export default function Register() {
  const searchParams = new URLSearchParams(window.location.search);
  const defaultRole = searchParams.get("role") === "SELLER" ? "SELLER" : "BUYER";

  const { toast } = useToast();
  const [role, setRole] = useState<"BUYER" | "SELLER">(defaultRole);
  const [registered, setRegistered] = useState<RegisteredUser | null>(null);
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

  // ── Success screen ──────────────────────────────────────────────────────────
  if (registered) {
    const isBuyer = registered.role === "BUYER";
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-background py-12">
        <img
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Background"
          className="fixed inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="relative z-10 w-full max-w-lg p-4">
          <Link href="/" className="inline-flex items-center justify-center w-full mb-6 hover:opacity-80 transition-opacity">
            <div className="bg-white/50 backdrop-blur-md p-3 rounded-2xl shadow-sm mr-3">
              <Waves className="h-8 w-8 text-primary" />
            </div>
            <span className="font-display font-bold text-4xl text-foreground">Coastaq</span>
          </Link>

          <div className="glass-panel rounded-[2rem] p-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
            </div>

            <h1 className="text-2xl font-bold font-display mb-2">
              Welcome to Coastaq, {registered.name}!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your account has been created successfully.
            </p>

            {isBuyer ? (
              <>
                <div className="bg-secondary/60 rounded-2xl p-5 text-left mb-8 space-y-3">
                  <p className="text-sm font-semibold text-foreground mb-1">As a buyer, you can:</p>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    Browse thousands of listings across all categories
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    Contact sellers directly via phone or chat
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    Save listings and track your enquiry history
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    Request callbacks from sellers
                  </div>
                </div>
                <div className="space-y-3">
                  <Button
                    className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20"
                    onClick={() => window.location.href = "/buyer/dashboard"}
                  >
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    Go to My Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl text-base font-semibold"
                    onClick={() => window.location.href = "/"}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Browse Listings
                  </Button>
                </div>
              </>
            ) : (
              <>
                {registered.shopName && (
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-8">
                    <Store className="w-4 h-4" />
                    {registered.shopName} is ready!
                  </div>
                )}
                {!registered.shopName && <div className="mb-8" />}
                <div className="space-y-3">
                  <Button
                    className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20"
                    onClick={() => window.location.href = "/seller/dashboard"}
                  >
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    Go to Seller Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl text-base font-semibold"
                    onClick={() => window.location.href = "/"}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Marketplace
                  </Button>
                </div>
              </>
            )}
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
        <Link href="/" className="inline-flex items-center justify-center w-full mb-6 hover:opacity-80 transition-opacity">
          <div className="bg-white/50 backdrop-blur-md p-3 rounded-2xl shadow-sm mr-3">
            <Waves className="h-8 w-8 text-primary" />
          </div>
          <span className="font-display font-bold text-4xl text-foreground">Coastaq</span>
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
              <Input
                required className="bg-white/50 h-12 rounded-xl"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email" required className="bg-white/50 h-12 rounded-xl"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password" required minLength={6} className="bg-white/50 h-12 rounded-xl"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {role === "SELLER" && (
              <div className="space-y-5 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-primary">Your Shop Details</h3>
                </div>
                <div className="space-y-2">
                  <Label>Shop Name</Label>
                  <Input
                    required className="bg-white/50 h-12 rounded-xl"
                    placeholder="e.g. Lagos Tech Hub"
                    value={formData.shopName}
                    onChange={e => setFormData({ ...formData, shopName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shop Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea
                    className="bg-white/50 rounded-xl"
                    rows={3}
                    placeholder="Tell buyers what you sell..."
                    value={formData.shopDescription}
                    onChange={e => setFormData({ ...formData, shopDescription: e.target.value })}
                  />
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
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
