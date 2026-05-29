import { useState, useEffect, useMemo } from "react";
import { AffiliateLayout } from "./AffiliateLayout";
import { StatGrid, StatCard } from "@/components/dashboard/StatCard";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  DollarSign, MousePointerClick, ShoppingCart, TrendingUp, Loader2,
} from "lucide-react";

function buildLast30Days(): { date: string; label: string }[] {
  const days: { date: string; label: string }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
    days.push({ date, label });
  }
  return days;
}

export default function AffiliateAnalytics() {
  const [links, setLinks] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/affiliates/me/links").then(r => r.ok ? r.json() : []),
      fetch("/api/affiliates/me/commissions").then(r => r.ok ? r.json() : []),
    ]).then(([l, c]) => {
      setLinks(Array.isArray(l) ? l : []);
      setCommissions(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const earningsData = useMemo(() => {
    const days = buildLast30Days();
    const byDate: Record<string, number> = {};
    commissions.forEach(c => {
      const d = new Date(c.createdAt).toISOString().slice(0, 10);
      byDate[d] = (byDate[d] || 0) + parseFloat(c.amount || "0");
    });
    return days.map(({ date, label }) => ({
      label,
      earnings: parseFloat((byDate[date] || 0).toFixed(2)),
    }));
  }, [commissions]);

  const clicksData = useMemo(() => {
    return links
      .filter(l => l.clicks > 0 || l.conversions > 0)
      .slice(0, 8)
      .map(l => ({
        code: l.code.slice(0, 8),
        clicks: l.clicks ?? 0,
        conversions: l.conversions ?? 0,
      }));
  }, [links]);

  const top5Products = useMemo(() => {
    return [...links]
      .sort((a, b) => (b.conversions ?? 0) - (a.conversions ?? 0))
      .slice(0, 5)
      .filter(l => l.productId);
  }, [links]);

  const totalClicks = links.reduce((s, l) => s + (l.clicks ?? 0), 0);
  const totalConversions = links.reduce((s, l) => s + (l.conversions ?? 0), 0);
  const totalEarnings = commissions.reduce((s, c) => s + parseFloat(c.amount || "0"), 0);
  const avgOrderValue = totalConversions > 0
    ? (totalEarnings / totalConversions).toFixed(2)
    : "0.00";
  const convRate = totalClicks > 0
    ? ((totalConversions / totalClicks) * 100).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <AffiliateLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AffiliateLayout>
    );
  }

  return (
    <AffiliateLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Analytics</h1>

      <StatGrid cols={4}>
        <StatCard label="Total Earned" value={`$${totalEarnings.toFixed(2)}`} icon={DollarSign} color="bg-green-100 text-green-600" />
        <StatCard label="Total Clicks" value={totalClicks} icon={MousePointerClick} color="bg-blue-100 text-blue-600" />
        <StatCard label="Conversions" value={totalConversions} icon={ShoppingCart} color="bg-purple-100 text-purple-600" />
        <StatCard label="Conv. Rate" value={`${convRate}%`} icon={TrendingUp} color="bg-orange-100 text-orange-600" subtext={`Avg. order $${avgOrderValue}`} />
      </StatGrid>

      {/* Earnings trend */}
      <div className="mt-8 bg-card border border-border/50 rounded-2xl p-5">
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Daily Earnings — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={earningsData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="earnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9333ea" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} width={48} />
            <Tooltip formatter={(v: any) => [`$${v}`, "Earnings"]} />
            <Area type="monotone" dataKey="earnings" stroke="#9333ea" strokeWidth={2} fill="url(#earnGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Clicks vs Conversions */}
      {clicksData.length > 0 && (
        <div className="mt-6 bg-card border border-border/50 rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">Clicks vs Conversions by Link</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clicksData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="code" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="clicks" name="Clicks" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="conversions" name="Conversions" fill="#9333ea" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top 5 Products */}
      {top5Products.length > 0 && (
        <div className="mt-6 bg-card border border-border/50 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Top 5 Products by Conversions</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium text-muted-foreground">Link Code</th>
                <th className="text-right px-5 py-2.5 font-medium text-muted-foreground">Clicks</th>
                <th className="text-right px-5 py-2.5 font-medium text-muted-foreground">Conversions</th>
                <th className="text-right px-5 py-2.5 font-medium text-muted-foreground">Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {top5Products.map((l, i) => {
                const rate = l.clicks > 0 ? ((l.conversions / l.clicks) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={l.id} className="border-t border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs">{l.code}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{l.clicks}</td>
                    <td className="px-5 py-3 text-right font-semibold text-purple-600">{l.conversions}</td>
                    <td className="px-5 py-3 text-right">{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {clicksData.length === 0 && top5Products.length === 0 && (
        <div className="mt-8 text-center py-16 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No link activity yet. Share your affiliate links to see analytics here.</p>
        </div>
      )}
    </AffiliateLayout>
  );
}
