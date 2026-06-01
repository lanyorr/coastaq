import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { AffiliateLayout } from "./AffiliateLayout";
import { StatCard, StatGrid, LightTooltip } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import {
  Link2, MousePointerClick, DollarSign, ShoppingCart,
  Clock, Loader2, TrendingUp, CheckCircle2, Globe, Mail,
  FileText, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

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
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </AffiliateLayout>
    );
  }

  /* ── Not yet applied — info ── */
  if (!profile && step === "info") {
    return (
      <AffiliateLayout>
        <div className="max-w-2xl py-8">
          <div className="mb-6 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <h1 className="text-lg font-bold text-gray-900">Join Coastaq Affiliates</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Share product links and earn <span className="font-semibold text-purple-700">5% commission</span> on every referred sale, paid to your PayPal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              { icon: Link2,            label: "1. Get your link",  desc: "Unique tracking links for any product" },
              { icon: MousePointerClick, label: "2. Share it",       desc: "Post on social media, blogs, or WhatsApp" },
              { icon: DollarSign,       label: "3. Earn 5%",        desc: "Get paid for every completed sale you refer" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white p-4" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
                <div className="w-8 h-8 rounded flex items-center justify-center mb-2 bg-purple-50">
                  <Icon className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-purple-50 p-4 mb-5 rounded" style={{ border: "1px solid #e9d5ff" }}>
            <p className="text-sm font-semibold text-purple-900 mb-2">What you get:</p>
            <ul className="space-y-1.5">
              {["5% commission on every referred sale", "Real-time click & conversion tracking", "Instant PayPal payouts", "Dedicated affiliate dashboard"].map(perk => (
                <li key={perk} className="flex items-center gap-2 text-sm text-purple-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />{perk}
                </li>
              ))}
            </ul>
          </div>

          <button onClick={() => setStep("form")}
            className="px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors flex items-center gap-2">
            Apply Now <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </AffiliateLayout>
    );
  }

  /* ── Not yet applied — form ── */
  if (!profile && step === "form") {
    return (
      <AffiliateLayout>
        <div className="max-w-lg py-8">
          <button onClick={() => setStep("info")} className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-5 flex items-center gap-1">
            ← Back
          </button>
          <div className="mb-5 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <h1 className="text-lg font-bold text-gray-900">Complete Your Application</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tell us about yourself to get approved faster.</p>
          </div>

          <div className="bg-white p-5 space-y-4 mb-4" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
            {[
              { key: "bio",          type: "textarea", label: "Short bio",             icon: FileText, placeholder: "Tell us how you plan to promote Coastaq…", optional: true },
              { key: "websiteUrl",   type: "input",    label: "Website / Social link", icon: Globe,    placeholder: "https://yourblog.com",                    optional: true },
              { key: "paypalEmail",  type: "email",    label: "PayPal email",          icon: Mail,     placeholder: "paypal@example.com",                      optional: false },
            ].map(({ key, type, label, icon: Icon, placeholder, optional }) => (
              <div key={key}>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  {label}
                  {optional && <span className="text-xs text-gray-400">(optional)</span>}
                  {!optional && <span className="text-red-500">*</span>}
                </label>
                {type === "textarea" ? (
                  <textarea placeholder={placeholder} rows={3} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 resize-none outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder:text-gray-400" />
                ) : (
                  <Input type={type} placeholder={placeholder} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="border-gray-300 text-gray-900 placeholder:text-gray-400 focus-visible:ring-purple-500" />
                )}
                {key === "paypalEmail" && <p className="text-xs text-gray-400 mt-1">Commissions will be sent here.</p>}
              </div>
            ))}
          </div>

          <button onClick={applyAffiliate} disabled={applying || !form.paypalEmail}
            className="w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {applying ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : "Submit Application"}
          </button>
          <p className="text-xs text-center text-gray-400 mt-2">Applications are reviewed within 24 hours.</p>
        </div>
      </AffiliateLayout>
    );
  }

  /* ── Pending approval ── */
  if (profile && !profile.isApproved) {
    return (
      <AffiliateLayout>
        <div className="max-w-lg py-12">
          <div className="bg-amber-50 border border-amber-200 rounded p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-base font-bold text-gray-900 mb-2">Application Under Review</h1>
            <p className="text-sm text-gray-600 mb-4">We'll notify you once approved — usually within 24 hours.</p>
            {profile.paypalEmail && (
              <p className="text-xs bg-white border border-amber-200 rounded px-3 py-2 text-gray-600">
                Payouts → <span className="font-semibold">{profile.paypalEmail}</span>
              </p>
            )}
          </div>
        </div>
      </AffiliateLayout>
    );
  }

  /* ── Approved dashboard ── */
  const totalClicks = links.reduce((s, l) => s + (l.clicks ?? 0), 0);
  const totalConversions = links.reduce((s, l) => s + (l.conversions ?? 0), 0);
  const recentCommissions = commissions.slice(0, 8);
  const earned = parseFloat(profile?.totalEarnings || 0);
  const pending = parseFloat(profile?.pendingEarnings || 0);

  const linkBarData = links.slice(0, 7).map(l => ({
    name: (l.code ?? l.id?.slice(-6) ?? "Link").slice(0, 8),
    Clicks: l.clicks ?? 0,
    Conversions: l.conversions ?? 0,
  }));

  return (
    <AffiliateLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{(user?.name as string) ?? "Affiliate"} — Affiliate Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Commission: <span className="font-semibold text-purple-700">{profile?.commissionRate ?? 5}%</span>
            {profile?.paypalEmail && <span className="ml-1.5">· {profile.paypalEmail}</span>}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded font-medium bg-green-50 text-green-700 border border-green-100">Approved</span>
      </div>

      {/* KPI row */}
      <StatGrid cols={4}>
        <StatCard label="Total Earned"  value={`$${earned.toFixed(2)}`}   icon={DollarSign}        color="bg-green-100 text-green-600"  highlight />
        <StatCard label="Pending"       value={`$${pending.toFixed(2)}`}  icon={Clock}             color="bg-yellow-100 text-yellow-600" />
        <StatCard label="Total Clicks"  value={totalClicks}               icon={MousePointerClick} color="bg-blue-100 text-blue-600" />
        <StatCard label="Conversions"   value={totalConversions}          icon={ShoppingCart}      color="bg-purple-100 text-purple-600" />
      </StatGrid>

      {/* Link performance chart */}
      <div className="mt-4 bg-white p-4" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900">Link Performance</p>
          <p className="text-xs text-gray-500">Clicks vs Conversions per link</p>
        </div>
        {linkBarData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Link2 className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No links yet — generate your first link</p>
            <button onClick={() => setLocation("/affiliate/links")} className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
              Generate Link →
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={linkBarData} barCategoryGap="25%">
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<LightTooltip />} cursor={{ fill: "#f3f4f6" }} />
              <Bar dataKey="Clicks" fill="#2563eb" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Conversions" fill="#7c3aed" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent commissions table */}
      <div className="mt-4 bg-white overflow-hidden" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <p className="text-sm font-semibold text-gray-900">Recent Commissions</p>
          <button onClick={() => setLocation("/affiliate/commissions")} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            View all →
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentCommissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  No commissions yet — share your links to start earning.
                </td>
              </tr>
            ) : recentCommissions.map((c: any) => {
              const isPaid = c.status === "paid";
              return (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]">{c.productTitle ?? "Commission"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">+${parseFloat(c.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded"
                      style={{
                        background: isPaid ? "#dcfce7" : "#fef9c3",
                        color: isPaid ? "#15803d" : "#b45309",
                      }}>
                      {c.status ?? "pending"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {[
          { label: "Get Links",    href: "/affiliate/links" },
          { label: "Commissions",  href: "/affiliate/commissions" },
          { label: "Payouts",      href: "/affiliate/payouts" },
          { label: "Campaigns",    href: "/affiliate/campaigns" },
        ].map(({ label, href }) => (
          <button key={href} onClick={() => setLocation(href)}
            className="py-2.5 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded text-center">
            {label}
          </button>
        ))}
      </div>
    </AffiliateLayout>
  );
}
