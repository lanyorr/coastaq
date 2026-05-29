import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { AffiliateLayout } from "./AffiliateLayout";
import { StatCard, StatGrid } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import {
  Link2, MousePointerClick, DollarSign, ShoppingCart,
  Clock, Loader2, TrendingUp, CheckCircle2, Globe, Mail,
  FileText, ChevronRight, ArrowUpRight, Zap, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

function MiniSparkline({ values, color = "#8b5cf6" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5" style={{ height: 32 }}>
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm"
          style={{ height: `${Math.max(10, (v / max) * 100)}%`, background: `${color}40` }} />
      ))}
    </div>
  );
}

export default function AffiliateOverview() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useGetMe({ query: { retry: false } });
  const [profile, setProfile] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
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
      const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [profileRes, linksRes, commRes] = await Promise.all([
        fetch("/api/affiliates/me", { headers: h }).then(r => r.ok ? r.json() : null),
        fetch("/api/affiliates/me/links", { headers: h }).then(r => r.ok ? r.json() : []),
        fetch("/api/affiliates/me/commissions", { headers: h }).then(r => r.ok ? r.json() : []),
      ]);
      setProfile(profileRes);
      setLinks(Array.isArray(linksRes) ? linksRes : []);
      setCommissions(Array.isArray(commRes) ? commRes : []);
    } catch {}
    setLoading(false);
  }

  async function applyAffiliate() {
    setApplying(true);
    try {
      const token = localStorage.getItem("coastaq_token");
      const res = await fetch("/api/affiliates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.affiliate) { setProfile(data.affiliate); }
        else throw new Error(data.error || "Application failed");
      } else {
        setProfile(data);
        toast({ title: "Application submitted!", description: "We'll review and notify you within 24 hours." });
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
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#8b5cf6" }} />
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
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <TrendingUp style={{ width: 28, height: 28, color: "#a78bfa" }} />
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">Join Coastaq Affiliates</h1>
              <p className="text-base max-w-md mx-auto" style={{ color: "#8693b0" }}>
                Share product links, earn <span className="font-bold" style={{ color: "#a78bfa" }}>5% commission</span> on every sale you refer. Paid directly to your PayPal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Link2, label: "Get your link", desc: "Unique tracking links for any product", color: "#3b82f6" },
                { icon: MousePointerClick, label: "Share it", desc: "Post on social media, blogs, or WhatsApp", color: "#a78bfa" },
                { icon: DollarSign, label: "Earn 5%", desc: "Get paid for every completed sale you refer", color: "#34d399" },
              ].map(({ icon: Icon, label, desc, color }, i) => (
                <div key={label} className="rounded-2xl p-5" style={{ background: "#141826", border: "1px solid #1e2538" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
                    <Icon style={{ width: 18, height: 18, color }} />
                  </div>
                  <p className="font-semibold text-white text-sm mb-1">{i + 1}. {label}</p>
                  <p className="text-xs" style={{ color: "#64748b" }}>{desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-5 mb-8" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <p className="font-semibold text-sm text-white mb-3">What you get:</p>
              <ul className="space-y-2">
                {["5% commission on every referred sale", "Real-time click & conversion tracking", "Instant PayPal payouts", "Dedicated affiliate dashboard"].map(perk => (
                  <li key={perk} className="flex items-center gap-2 text-sm" style={{ color: "#c4b5fd" }}>
                    <CheckCircle2 style={{ width: 14, height: 14, color: "#a78bfa", flexShrink: 0 }} />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={() => setStep("form")} className="w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90" style={{ background: "#7c3aed" }}>
              Apply Now <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </AffiliateLayout>
      );
    }

    return (
      <AffiliateLayout>
        <div className="max-w-lg mx-auto py-10">
          <button onClick={() => setStep("info")} className="text-sm mb-6 flex items-center gap-1 transition-colors hover:text-white" style={{ color: "#8693b0" }}>
            ← Back
          </button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <FileText style={{ width: 24, height: 24, color: "#a78bfa" }} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Complete Your Application</h1>
            <p className="text-sm" style={{ color: "#8693b0" }}>Tell us about yourself to get approved faster.</p>
          </div>

          <div className="rounded-2xl p-6 space-y-4 mb-5" style={{ background: "#141826", border: "1px solid #1e2538" }}>
            {[
              { key: "bio", type: "textarea", label: "Short bio", icon: FileText, placeholder: "Tell us how you plan to promote Coastaq…", optional: true },
              { key: "websiteUrl", type: "input", label: "Website / Social link", icon: Globe, placeholder: "https://yourblog.com or @yourhandle", optional: true },
              { key: "paypalEmail", type: "email", label: "PayPal email for payouts", icon: Mail, placeholder: "paypal@example.com", optional: false },
            ].map(({ key, type, label, icon: Icon, placeholder, optional }) => (
              <div key={key}>
                <label className="flex items-center gap-1.5 text-sm font-medium text-white mb-1.5">
                  <Icon style={{ width: 13, height: 13, color: "#8693b0" }} />
                  {label} {optional && <span className="text-xs font-normal" style={{ color: "#64748b" }}>(optional)</span>}
                  {!optional && <span className="text-red-400">*</span>}
                </label>
                {type === "textarea" ? (
                  <textarea placeholder={placeholder} rows={3} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none outline-none focus:ring-2 transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a3148", focusRing: "#7c3aed" }} />
                ) : (
                  <Input type={type} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="rounded-xl border-[#2a3148] bg-white/5 text-white placeholder:text-[#475569] focus-visible:ring-[#7c3aed]/30 focus-visible:border-[#7c3aed]/50" />
                )}
                {key === "paypalEmail" && <p className="text-xs mt-1" style={{ color: "#64748b" }}>Your commissions will be sent to this PayPal account.</p>}
              </div>
            ))}
          </div>

          <button onClick={applyAffiliate} disabled={applying || !form.paypalEmail}
            className="w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "#7c3aed" }}>
            {applying ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />Submitting…</> : "Submit Application"}
          </button>
          <p className="text-xs text-center mt-3" style={{ color: "#64748b" }}>Applications are usually reviewed within 24 hours.</p>
        </div>
      </AffiliateLayout>
    );
  }

  /* ── Pending approval ── */
  if (!profile.isApproved) {
    return (
      <AffiliateLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.25)" }}>
            <Clock style={{ width: 28, height: 28, color: "#eab308" }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Application Under Review</h1>
          <p className="text-base mb-6" style={{ color: "#8693b0" }}>We'll review and notify you — usually within 24 hours.</p>
          {profile.paypalEmail && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#fcd34d" }}>
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
  const recentLinks = links.slice(0, 5);
  const recentCommissions = commissions.slice(0, 5);

  // 7-day click sparkline (simulated from total)
  const clickBars = Array.from({ length: 7 }, (_, i) => Math.max(0, totalClicks > 0 ? Math.floor((totalClicks / 7) * (0.5 + Math.random())) : 0));

  return (
    <AffiliateLayout>
      {/* Profile header */}
      <div className="rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-5" style={{ background: "#141826", border: "1px solid #1e2538" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-white text-2xl font-bold" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
          {(user?.name as string)?.[0]?.toUpperCase() ?? "A"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{(user?.name as string) ?? "Affiliate"}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
              Approved
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "#8693b0" }}>
            Commission rate: <span className="font-semibold" style={{ color: "#a78bfa" }}>{profile.commissionRate}%</span>
            {profile.paypalEmail && <span style={{ color: "#475569" }}> · Payouts → {profile.paypalEmail}</span>}
          </p>
          <div className="flex gap-4 mt-2">
            <div><span className="text-white font-bold">{links.length}</span><span className="text-xs ml-1" style={{ color: "#64748b" }}>links</span></div>
            <div><span className="text-white font-bold">{totalClicks}</span><span className="text-xs ml-1" style={{ color: "#64748b" }}>total clicks</span></div>
            <div><span className="text-white font-bold">{totalConversions}</span><span className="text-xs ml-1" style={{ color: "#64748b" }}>conversions</span></div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setLocation("/affiliate/links")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#7c3aed" }}>
            <Link2 style={{ width: 14, height: 14 }} />Get Links
          </button>
          <button onClick={() => setLocation("/affiliate/payouts")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: "rgba(255,255,255,0.07)", color: "#c8d0e0" }}>
            <DollarSign style={{ width: 14, height: 14 }} />Payouts
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatGrid cols={4}>
        <StatCard label="Total Earned"   value={`$${parseFloat(profile.totalEarnings || 0).toFixed(2)}`}   icon={DollarSign}       color="bg-emerald-100 text-emerald-600"  highlight />
        <StatCard label="Pending"        value={`$${parseFloat(profile.pendingEarnings || 0).toFixed(2)}`} icon={Clock}            color="bg-yellow-100 text-yellow-600" />
        <StatCard label="Total Clicks"   value={totalClicks}                                                icon={MousePointerClick} color="bg-blue-100 text-blue-600" />
        <StatCard label="Conversions"    value={totalConversions}                                           icon={ShoppingCart}      color="bg-purple-100 text-purple-600" />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Click activity */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#141826", border: "1px solid #1e2538" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white font-bold">Recent Activity</p>
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Click performance (last 7 days)</p>
            </div>
            <button onClick={() => setLocation("/affiliate/analytics")} className="flex items-center gap-1 text-sm font-semibold transition-colors" style={{ color: "#a78bfa" }}>
              Analytics <ArrowUpRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {recentLinks.length === 0 ? (
            <div className="rounded-xl py-8 flex flex-col items-center" style={{ background: "rgba(139,92,246,0.05)" }}>
              <Link2 style={{ width: 28, height: 28, color: "#334155" }} className="mb-2" />
              <p className="text-sm font-medium" style={{ color: "#64748b" }}>No links yet</p>
              <button onClick={() => setLocation("/affiliate/links")} className="mt-3 text-sm font-semibold" style={{ color: "#a78bfa" }}>
                Generate your first link →
              </button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-4 gap-3 mb-3 text-xs font-semibold uppercase tracking-widest px-1" style={{ color: "#475569" }}>
                <span className="col-span-2">Link / Product</span>
                <span className="text-right">Clicks</span>
                <span className="text-right">Conv.</span>
              </div>
              {recentLinks.map((link: any, idx: number) => (
                <div key={link.id} className="grid grid-cols-4 gap-3 items-center px-1 py-2.5 rounded-xl transition-colors hover:bg-white/[0.03]"
                  style={{ borderBottom: idx < recentLinks.length - 1 ? "1px solid #1a1f30" : "none" }}>
                  <div className="col-span-2 flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.15)" }}>
                      <Link2 style={{ width: 12, height: 12, color: "#a78bfa" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{link.product?.title ?? link.code ?? "General"}</p>
                      <p className="text-[10px]" style={{ color: "#475569" }}>/{link.code}</p>
                    </div>
                  </div>
                  <span className="text-right text-sm font-bold text-white">{link.clicks ?? 0}</span>
                  <span className="text-right text-sm font-semibold" style={{ color: "#34d399" }}>{link.conversions ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#141826", border: "1px solid #1e2538" }}>
          <p className="text-white font-bold mb-1">Quick Actions</p>
          {[
            { label: "Generate Link",     href: "/affiliate/links",       color: "#7c3aed", icon: Link2 },
            { label: "View Commissions",  href: "/affiliate/commissions", color: "#3b82f6", icon: DollarSign },
            { label: "Request Payout",    href: "/affiliate/payouts",     color: "#10b981", icon: Zap },
            { label: "Manage Campaigns",  href: "/affiliate/campaigns",   color: "#f59e0b", icon: TrendingUp },
            { label: "My Coupons",        href: "/affiliate/coupons",     color: "#ec4899", icon: ExternalLink },
          ].map(({ label, href, color, icon: Icon }) => (
            <button key={href} onClick={() => setLocation(href)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all hover:opacity-90"
              style={{ background: `${color}18`, color: "#c8d0e0", border: `1px solid ${color}25` }}>
              <Icon style={{ width: 15, height: 15, color }} />
              {label}
              <ChevronRight style={{ width: 14, height: 14, color: "#475569", marginLeft: "auto" }} />
            </button>
          ))}
        </div>
      </div>

      {/* Recent commissions */}
      {recentCommissions.length > 0 && (
        <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: "#141826", border: "1px solid #1e2538" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #1e2538" }}>
            <p className="font-bold text-white">Recent Commissions</p>
            <button onClick={() => setLocation("/affiliate/commissions")} className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#a78bfa" }}>
              View all <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
          {recentCommissions.map((c: any, idx: number) => (
            <div key={c.id} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white/[0.02]"
              style={{ borderBottom: idx < recentCommissions.length - 1 ? "1px solid #1a1f30" : "none" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(52,211,153,0.1)" }}>
                <DollarSign style={{ width: 16, height: 16, color: "#34d399" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{c.productTitle ?? "Commission"}</p>
                <p className="text-xs" style={{ color: "#64748b" }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-sm" style={{ color: "#34d399" }}>+${parseFloat(c.amount || 0).toFixed(2)}</p>
                <p className="text-[10px]" style={{ color: c.status === "paid" ? "#34d399" : "#eab308" }}>{c.status ?? "pending"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AffiliateLayout>
  );
}
