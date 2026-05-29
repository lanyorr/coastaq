import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { AffiliateLayout } from "./AffiliateLayout";
import { StatCard, StatGrid } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import {
  Link2, MousePointerClick, DollarSign, ShoppingCart,
  Clock, Loader2, TrendingUp, CheckCircle2, Globe, Mail,
  FileText, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { buildRolesFromUser } from "@/lib/auth/rbac";

export default function AffiliateOverview() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useGetMe({ query: { retry: false } });
  const [profile, setProfile] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [step, setStep] = useState<"info" | "form">("info");
  const [form, setForm] = useState({ bio: "", websiteUrl: "", paypalEmail: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (!user && !userLoading) { setLocation("/auth/login?redirect=/affiliate"); return; }
    if (user) loadData();
  }, [user, userLoading]);

  async function loadData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("coastaq_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [profileRes, linksRes] = await Promise.all([
        fetch("/api/affiliates/me", { headers }).then(r => r.ok ? r.json() : null),
        fetch("/api/affiliates/me/links", { headers }).then(r => r.ok ? r.json() : []),
      ]);
      setProfile(profileRes);
      setLinks(Array.isArray(linksRes) ? linksRes : []);
    } catch {}
    setLoading(false);
  }

  async function applyAffiliate() {
    setApplying(true);
    try {
      const token = localStorage.getItem("coastaq_token");
      const res = await fetch("/api/affiliates/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.affiliate) {
          setProfile(data.affiliate);
        } else {
          throw new Error(data.error || "Application failed");
        }
      } else {
        setProfile(data);
        toast({ title: "Application submitted!", description: "We'll review your application and notify you." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setApplying(false);
  }

  if (userLoading || loading) {
    return (
      <AffiliateLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AffiliateLayout>
    );
  }

  /* ── Not yet applied ── */
  if (!profile) {
    if (step === "info") {
      return (
        <AffiliateLayout>
          <div className="max-w-2xl mx-auto py-10">
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-3xl font-display font-bold mb-3">Join Coastaq Affiliates</h1>
              <p className="text-muted-foreground text-base max-w-md mx-auto">
                Share product links, earn <span className="font-bold text-purple-600">5% commission</span> on every sale you refer.
                Paid directly to your PayPal.
              </p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Link2, label: "1. Get your link", desc: "Generate unique tracking links for any product", color: "bg-blue-50 text-blue-600" },
                { icon: MousePointerClick, label: "2. Share it", desc: "Post on social media, blogs, or send to friends", color: "bg-purple-50 text-purple-600" },
                { icon: DollarSign, label: "3. Earn 5%", desc: "Get paid for every completed sale you refer", color: "bg-green-50 text-green-600" },
              ].map(({ icon: Icon, label, desc, color }) => (
                <div key={label} className="bg-card border border-border/50 rounded-2xl p-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-sm mb-1">{label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Perks */}
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5 mb-8">
              <p className="font-semibold text-sm mb-3 text-purple-900">What you get:</p>
              <ul className="space-y-2">
                {[
                  "5% commission on every referred sale",
                  "Real-time click & conversion tracking",
                  "Instant PayPal payouts",
                  "Dedicated affiliate dashboard",
                ].map(perk => (
                  <li key={perk} className="flex items-center gap-2 text-sm text-purple-800">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              onClick={() => setStep("form")}
              className="w-full h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-base font-semibold"
            >
              Apply Now <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </AffiliateLayout>
      );
    }

    /* ── Application form ── */
    return (
      <AffiliateLayout>
        <div className="max-w-lg mx-auto py-10">
          <button onClick={() => setStep("info")} className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1">
            ← Back
          </button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-7 h-7 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Complete Your Application</h1>
            <p className="text-muted-foreground text-sm">Tell us a bit about yourself to get approved faster.</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-muted-foreground" /> Short bio <span className="text-muted-foreground font-normal">(optional)</span></span>
              </label>
              <textarea
                placeholder="Tell us about how you plan to promote Coastaq…"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors"
                rows={3}
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-muted-foreground" /> Website / Social link <span className="text-muted-foreground font-normal">(optional)</span></span>
              </label>
              <Input
                placeholder="https://yourblog.com or @yourhandle"
                value={form.websiteUrl}
                onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
                className="rounded-xl border-input focus-visible:ring-purple-500/20 focus-visible:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> PayPal email for payouts <span className="text-red-500">*</span></span>
              </label>
              <Input
                type="email"
                placeholder="paypal@example.com"
                value={form.paypalEmail}
                onChange={e => setForm(f => ({ ...f, paypalEmail: e.target.value }))}
                className="rounded-xl border-input focus-visible:ring-purple-500/20 focus-visible:border-purple-400"
              />
              <p className="text-xs text-muted-foreground mt-1">Your commissions will be sent to this PayPal account.</p>
            </div>
          </div>

          <Button
            onClick={applyAffiliate}
            disabled={applying || !form.paypalEmail}
            className="w-full h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-base font-semibold disabled:opacity-50"
          >
            {applying ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</>
            ) : (
              "Submit Application"
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">Applications are usually reviewed within 24 hours.</p>
        </div>
      </AffiliateLayout>
    );
  }

  /* ── Pending approval ── */
  if (!profile.isApproved) {
    return (
      <AffiliateLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Application Under Review</h1>
          <p className="text-muted-foreground mb-6">
            Your affiliate application is pending review. We'll notify you once it's approved — usually within 24 hours.
          </p>
          {profile.paypalEmail && (
            <p className="text-sm text-muted-foreground bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
              Payouts will be sent to <span className="font-semibold">{profile.paypalEmail}</span>
            </p>
          )}
        </div>
      </AffiliateLayout>
    );
  }

  /* ── Approved dashboard ── */
  const totalClicks = links.reduce((s, l) => s + (l.clicks ?? 0), 0);
  const totalConversions = links.reduce((s, l) => s + (l.conversions ?? 0), 0);

  return (
    <AffiliateLayout>
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
          <TrendingUp className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Affiliate Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Commission rate: <span className="font-semibold text-green-600">{profile.commissionRate}%</span>
            {profile.paypalEmail && (
              <span className="ml-3 text-muted-foreground">· Payouts → {profile.paypalEmail}</span>
            )}
          </p>
        </div>
      </div>

      <StatGrid cols={4}>
        <StatCard label="Total Earned" value={`$${parseFloat(profile.totalEarnings || 0).toFixed(2)}`} icon={DollarSign} color="bg-green-100 text-green-600" />
        <StatCard label="Pending" value={`$${parseFloat(profile.pendingEarnings || 0).toFixed(2)}`} icon={Clock} color="bg-yellow-100 text-yellow-600" />
        <StatCard label="Total Clicks" value={totalClicks} icon={MousePointerClick} color="bg-blue-100 text-blue-600" />
        <StatCard label="Conversions" value={totalConversions} icon={ShoppingCart} color="bg-purple-100 text-purple-600" />
      </StatGrid>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button
          onClick={() => setLocation("/affiliate/links")}
          className="flex items-center justify-between bg-purple-600 text-white rounded-2xl py-3.5 px-5 text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          Manage Links <Link2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setLocation("/affiliate/commissions")}
          className="flex items-center justify-between bg-card border border-border/50 rounded-2xl py-3.5 px-5 text-sm font-semibold hover:bg-secondary transition-colors"
        >
          View Commissions <DollarSign className="w-4 h-4" />
        </button>
      </div>
    </AffiliateLayout>
  );
}
