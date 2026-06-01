import { useState, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { useLocation } from "wouter";
import {
  TrendingUp, CheckCircle2, Loader2, ArrowRight, ShieldCheck, Zap,
  Package, Truck, AlertTriangle, RefreshCw, Info,
} from "lucide-react";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";
import { SellerBadge, TrustScoreBar } from "@/components/SellerBadge";

const C = {
  bg: "#1a1040", bdr: "#281850", muted: "#7b80b5",
  blue: "#2563eb", green: "#10b981", purple: "#8b5cf6",
  yellow: "#eab308", red: "#ef4444", orange: "#f97316",
};

const scoreColor = (n: number) => n >= 85 ? C.green : n >= 70 ? C.blue : n >= 40 ? C.yellow : C.red;
const scoreLabel = (n: number) => n >= 85 ? "Excellent" : n >= 70 ? "Good" : n >= 40 ? "Fair" : "Needs Improvement";

const SCORE_COMPONENTS = [
  { key: "deliveryScore",   label: "Delivery Success",   max: 30, desc: "Rate of successful deliveries via shipments", icon: Truck },
  { key: "completionScore", label: "Order Completion",   max: 20, desc: "Orders marked as delivered vs total",         icon: CheckCircle2 },
  { key: "disputeScore",    label: "Dispute Rate",        max: 15, desc: "Lower dispute rate = higher score",          icon: AlertTriangle },
  { key: "refundScore",     label: "Refund Rate",         max: 10, desc: "Lower refund rate = higher score",           icon: RefreshCw },
  { key: "ageScore",        label: "Account Age",         max: 10, desc: "Points grow with account maturity",          icon: ShieldCheck },
  { key: "volumeScore",     label: "Order Volume",        max: 15, desc: "Score increases with order volume (50+)",    icon: Package },
];

export default function SellerTrustScorePage() {
  const [, setLocation] = useLocation();
  const [score, setScore]     = useState<any>(null);
  const [ver, setVer]         = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      const [s, v] = await Promise.all([
        fetch("/api/verification/trust-score").then(r => r.json()),
        fetch("/api/verification/status").then(r => r.json()),
      ]);
      setScore(s); setVer(v);
    } catch {}
    setLoading(false); setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <SellerLayout>
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blue }} /></div>
    </SellerLayout>
  );

  const total = score?.totalScore ?? 0;
  const color = scoreColor(total);
  const chartData = [{ name: "Score", value: total, fill: color }];

  const METRICS = score?.metrics ?? {};

  return (
    <SellerLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Trust Score</h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>Your reputation score as a marketplace seller</p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold hover:opacity-90"
          style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
          <RefreshCw style={{ width: 13, height: 13 }} className={refreshing ? "animate-spin" : ""} />Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Score gauge */}
        <div className="rounded-2xl p-5 text-center" style={{ background: C.bg, border: `1px solid ${C.bdr}`, borderTop: `3px solid ${color}` }}>
          <p className="text-sm font-bold mb-4 text-white">Overall Trust Score</p>
          <div className="relative mx-auto" style={{ width: 180, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={chartData} startAngle={180} endAngle={-180}>
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: "#2a1a50" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-extrabold" style={{ color }}>{total}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color }}>/ 100</p>
            </div>
          </div>
          <p className="text-lg font-bold mt-2" style={{ color }}>{scoreLabel(total)}</p>
          {ver?.badgeLevel && <div className="mt-3 flex justify-center"><SellerBadge level={ver.badgeLevel} size="md" /></div>}

          <div className="mt-4 grid grid-cols-2 gap-2 text-left">
            {[
              { label: "Total Orders",    value: METRICS.totalOrders ?? 0 },
              { label: "Delivered",       value: METRICS.deliveredOrders ?? 0 },
              { label: "Delivery Rate",   value: `${METRICS.deliveryRate ?? 0}%` },
              { label: "Account Age",     value: `${METRICS.accountDays ?? 0}d` },
            ].map(m => (
              <div key={m.label} className="rounded-xl p-2.5" style={{ background: "#120930" }}>
                <p className="text-[10px]" style={{ color: C.muted }}>{m.label}</p>
                <p className="text-sm font-bold text-white">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Score breakdown */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <p className="text-white font-bold mb-4">Score Breakdown</p>
            <div className="space-y-4">
              {SCORE_COMPONENTS.map(s => {
                const val = score?.[s.key] ?? 0;
                const pct = (val / s.max) * 100;
                const barColor = pct >= 80 ? C.green : pct >= 50 ? C.blue : C.yellow;
                const Ico = s.icon;
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Ico style={{ width: 13, height: 13, color: barColor }} />
                        <p className="text-sm font-semibold text-white">{s.label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: C.muted }}>{val.toFixed(1)} / {s.max}</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: "#2a1a50" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <p className="text-[10px] mt-1" style={{ color: "#4b5090" }}>{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance metrics */}
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <p className="text-white font-bold mb-4">Performance Metrics</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Completion Rate", value: `${METRICS.completionRate ?? 0}%`, good: (METRICS.completionRate ?? 0) >= 80 },
                { label: "Dispute Rate",    value: `${METRICS.disputeRate ?? 0}%`,    good: (METRICS.disputeRate ?? 0) <= 5  },
                { label: "Refund Rate",     value: `${METRICS.refundRate ?? 0}%`,     good: (METRICS.refundRate ?? 0) <= 5   },
                { label: "Delivery Rate",   value: `${METRICS.deliveryRate ?? 0}%`,   good: (METRICS.deliveryRate ?? 0) >= 80 },
              ].map(m => (
                <div key={m.label} className="rounded-xl p-3" style={{ background: "#120930" }}>
                  <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>{m.label}</p>
                  <p className="text-xl font-extrabold" style={{ color: m.good ? C.green : C.yellow }}>{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How to improve */}
          {score?.recommendations?.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap style={{ width: 14, height: 14, color: C.yellow }} />
                <p className="text-white font-bold">Improve Your Trust Score</p>
              </div>
              {score.recommendations.map((r: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 py-2.5" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.bdr}` }}>
                  <ArrowRight style={{ width: 12, height: 12, color: C.yellow, marginTop: 3, flexShrink: 0 }} />
                  <p className="text-sm" style={{ color: C.muted }}>{r}</p>
                </div>
              ))}
            </div>
          )}

          {/* Verification CTA */}
          {ver?.identityStatus !== "approved" && (
            <div className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.2)" }}>
              <ShieldCheck style={{ width: 20, height: 20, color: C.blue, flexShrink: 0 }} />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Verify your identity to upgrade your badge</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>Verified sellers see up to 40% more sales</p>
              </div>
              <button onClick={() => setLocation("/seller/verification")}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 shrink-0"
                style={{ background: C.blue }}>Verify Now</button>
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
