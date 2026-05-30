import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { AffiliateLayout } from "./AffiliateLayout";
import { StatCard, StatGrid, DarkTooltip } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import {
  Link2, MousePointerClick, DollarSign, ShoppingCart,
  Clock, Loader2, TrendingUp, CheckCircle2, Globe, Mail,
  FileText, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";

const C = {
  bg:  "#1a1040",
  bdr: "#281850",
  muted: "#7b80b5",
  blue: "#2563eb",
  orange: "#f97316",
  green: "#10b981",
  purple: "#8b5cf6",
  yellow: "#eab308",
  red: "#ef4444",
};

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
        if (res.status === 409 && data.affiliate) setProfile(data.affiliate);
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
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.purple }} />
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
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
                <TrendingUp style={{ width: 28, height: 28, color: "#a78bfa" }} />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-3">Join Coastaq Affiliates</h1>
              <p className="text-base max-w-md mx-auto" style={{ color: C.muted }}>
                Share product links, earn <span className="font-bold" style={{ color: "#a78bfa" }}>5% commission</span> on every sale you refer. Paid directly to your PayPal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Link2, label: "Get your link", desc: "Unique tracking links for any product", color: C.blue },
                { icon: MousePointerClick, label: "Share it", desc: "Post on social media, blogs, or WhatsApp", color: C.purple },
                { icon: DollarSign, label: "Earn 5%", desc: "Get paid for every completed sale you refer", color: C.green },
              ].map(({ icon: Icon, label, desc, color }, i) => (
                <div key={label} className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}`, borderTop: `3px solid ${color}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
                    <Icon style={{ width: 18, height: 18, color }} />
                  </div>
                  <p className="font-bold text-white text-sm mb-1">{i + 1}. {label}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-5 mb-8" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <p className="font-bold text-white text-sm mb-3">What you get:</p>
              <ul className="space-y-2">
                {["5% commission on every referred sale", "Real-time click & conversion tracking", "Instant PayPal payouts", "Dedicated affiliate dashboard"].map(perk => (
                  <li key={perk} className="flex items-center gap-2 text-sm" style={{ color: "#c4b5fd" }}>
                    <CheckCircle2 style={{ width: 14, height: 14, color: "#a78bfa", flexShrink: 0 }} />{perk}
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={() => setStep("form")}
              className="w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: "#7c3aed" }}>
              Apply Now <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </AffiliateLayout>
      );
    }

    return (
      <AffiliateLayout>
        <div className="max-w-lg mx-auto py-10">
          <button onClick={() => setStep("info")} className="text-sm mb-6 flex items-center gap-1 transition-colors hover:text-white" style={{ color: C.muted }}>← Back</button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.25)" }}>
              <FileText style={{ width: 24, height: 24, color: "#a78bfa" }} />
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-1">Complete Your Application</h1>
            <p className="text-sm" style={{ color: C.muted }}>Tell us about yourself to get approved faster.</p>
          </div>

          <div className="rounded-2xl p-6 space-y-4 mb-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            {[
              { key: "bio", type: "textarea", label: "Short bio", icon: FileText, placeholder: "Tell us how you plan to promote Coastaq…", optional: true },
              { key: "websiteUrl", type: "input", label: "Website / Social link", icon: Globe, placeholder: "https://yourblog.com", optional: true },
              { key: "paypalEmail", type: "email", label: "PayPal email for payouts", icon: Mail, placeholder: "paypal@example.com", optional: false },
            ].map(({ key, type, label, icon: Icon, placeholder, optional }) => (
              <div key={key}>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-white mb-1.5">
                  <Icon style={{ width: 13, height: 13, color: C.muted }} />
                  {label} {optional && <span className="text-xs font-normal" style={{ color: C.muted }}>(optional)</span>}
                  {!optional && <span style={{ color: C.red }}>*</span>}
                </label>
                {type === "textarea" ? (
                  <textarea placeholder={placeholder} rows={3} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full rounded-xl px-4 py-3 text-sm text-white resize-none outline-none focus:ring-2 transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${C.bdr}` }} />
                ) : (
                  <Input type={type} placeholder={placeholder} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="rounded-xl border-[#281850] bg-white/5 text-white placeholder:text-[#5b6090] focus-visible:ring-[#7c3aed]/30" />
                )}
                {key === "paypalEmail" && <p className="text-xs mt-1" style={{ color: C.muted }}>Commissions will be sent here.</p>}
              </div>
            ))}
          </div>

          <button onClick={applyAffiliate} disabled={applying || !form.paypalEmail}
            className="w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "#7c3aed" }}>
            {applying ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />Submitting…</> : "Submit Application"}
          </button>
          <p className="text-xs text-center mt-3" style={{ color: C.muted }}>Applications are reviewed within 24 hours.</p>
        </div>
      </AffiliateLayout>
    );
  }

  /* ── Pending ── */
  if (!profile.isApproved) {
    return (
      <AffiliateLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.25)" }}>
            <Clock style={{ width: 28, height: 28, color: C.yellow }} />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-3">Application Under Review</h1>
          <p className="text-base mb-6" style={{ color: C.muted }}>We'll notify you once approved — usually within 24 hours.</p>
          {profile.paypalEmail && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#fcd34d" }}>
              Payouts → <span className="font-bold">{profile.paypalEmail}</span>
            </p>
          )}
        </div>
      </AffiliateLayout>
    );
  }

  /* ── Approved dashboard ── */
  const totalClicks = links.reduce((s, l) => s + (l.clicks ?? 0), 0);
  const totalConversions = links.reduce((s, l) => s + (l.conversions ?? 0), 0);
  const recentCommissions = commissions.slice(0, 6);

  /* Link performance bar chart */
  const linkBarData = links.slice(0, 7).map(l => ({
    name: (l.code ?? l.id?.slice(-6) ?? "Link").slice(0, 8),
    Clicks: l.clicks ?? 0,
    Conversions: l.conversions ?? 0,
  }));

  /* Earnings breakdown donut */
  const earned = parseFloat(profile.totalEarnings || 0);
  const pending = parseFloat(profile.pendingEarnings || 0);
  const earningsData = [
    { name: "Paid Out", value: parseFloat((earned - pending).toFixed(2)), color: C.green },
    { name: "Pending", value: pending, color: C.yellow },
  ].filter(d => d.value > 0);

  return (
    <AffiliateLayout>
      {/* Title banner */}
      <div className="rounded-2xl px-6 py-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white text-xl font-extrabold"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
          {(user?.name as string)?.[0]?.toUpperCase() ?? "A"}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-white">{(user?.name as string) ?? "Affiliate"} — Affiliate Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>
            Commission: <span className="font-bold" style={{ color: "#a78bfa" }}>{profile.commissionRate}%</span>
            {profile.paypalEmail && <span style={{ color: "#5b6090" }}> · {profile.paypalEmail}</span>}
          </p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full font-bold self-start sm:self-auto"
          style={{ background: "rgba(16,185,129,0.15)", color: C.green }}>Approved</span>
      </div>

      {/* KPI row */}
      <StatGrid cols={4}>
        <StatCard label="Total Earned"   value={`$${earned.toFixed(2)}`}          icon={DollarSign}        color="bg-green-100 text-green-600"  highlight />
        <StatCard label="Pending"        value={`$${pending.toFixed(2)}`}          icon={Clock}             color="bg-yellow-100 text-yellow-600" />
        <StatCard label="Total Clicks"   value={totalClicks}                        icon={MousePointerClick} color="bg-blue-100 text-blue-600" />
        <StatCard label="Conversions"    value={totalConversions}                   icon={ShoppingCart}      color="bg-purple-100 text-purple-600" />
      </StatGrid>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Link performance bar chart */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <p className="text-white font-bold text-base mb-1">Link Performance</p>
          <p className="text-xs mb-4" style={{ color: C.muted }}>Clicks vs Conversions per link</p>
          {linkBarData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Link2 style={{ width: 32, height: 32, color: "#2a1a50" }} />
              <p className="text-sm mt-2" style={{ color: C.muted }}>No links yet — generate your first link</p>
              <button onClick={() => setLocation("/affiliate/links")} className="mt-3 text-sm font-bold" style={{ color: C.purple }}>
                Generate Link →
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={linkBarData} barCategoryGap="25%">
                <XAxis dataKey="name" stroke={C.muted} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="Clicks" fill={C.blue} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Conversions" fill={C.orange} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Earnings donut */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <p className="text-white font-bold text-base mb-1">Earnings</p>
          <p className="text-xs mb-3" style={{ color: C.muted }}>Paid vs Pending</p>
          {earningsData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <DollarSign style={{ width: 32, height: 32, color: "#2a1a50" }} />
              <p className="text-sm mt-2" style={{ color: C.muted }}>No earnings yet</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <PieChart width={180} height={180}>
                <Pie data={earningsData} cx={90} cy={90} innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={4}>
                  {earningsData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-1">
                {earningsData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                    <span className="text-xs" style={{ color: C.muted }}>{d.name} ${d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent commissions table */}
      <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.bdr}` }}>
          <p className="font-bold text-white">Recent Commissions</p>
          <button onClick={() => setLocation("/affiliate/commissions")} className="text-sm font-semibold" style={{ color: C.purple }}>
            View all →
          </button>
        </div>

        <div className="grid px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.muted, gridTemplateColumns: "1fr 110px 90px 90px" }}>
          <span>Product</span><span>Date</span><span className="text-right">Amount</span><span className="text-right">Status</span>
        </div>

        {recentCommissions.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <DollarSign style={{ width: 32, height: 32, color: "#2a1a50", margin: "0 auto 8px" }} />
            <p className="text-sm" style={{ color: C.muted }}>No commissions yet — share your links to start earning</p>
          </div>
        ) : recentCommissions.map((c: any, idx: number) => {
          const isPaid = c.status === "paid";
          return (
            <div key={c.id} className="grid px-6 py-3.5 items-center transition-colors"
              style={{ gridTemplateColumns: "1fr 110px 90px 90px", borderTop: idx === 0 ? "none" : `1px solid ${C.bdr}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
              <p className="text-sm font-semibold text-white truncate pr-4">{c.productTitle ?? "Commission"}</p>
              <p className="text-xs" style={{ color: C.muted }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</p>
              <p className="text-sm font-bold text-right" style={{ color: C.green }}>+${parseFloat(c.amount || 0).toFixed(2)}</p>
              <div className="text-right">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: isPaid ? "rgba(16,185,129,0.15)" : "rgba(234,179,8,0.15)", color: isPaid ? C.green : C.yellow }}>
                  {c.status ?? "pending"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: "Get Links",       href: "/affiliate/links",       color: C.purple },
          { label: "Commissions",     href: "/affiliate/commissions", color: C.blue },
          { label: "Payouts",         href: "/affiliate/payouts",     color: C.green },
          { label: "Campaigns",       href: "/affiliate/campaigns",   color: C.orange },
        ].map(({ label, href, color }) => (
          <button key={href} onClick={() => setLocation(href)}
            className="py-3 px-4 rounded-2xl text-sm font-bold text-center transition-all hover:opacity-90"
            style={{ background: `${color}22`, border: `1px solid ${color}40`, color }}>
            {label}
          </button>
        ))}
      </div>
    </AffiliateLayout>
  );
}
