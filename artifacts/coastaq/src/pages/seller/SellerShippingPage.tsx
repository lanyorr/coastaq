import { useState, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  Truck, Package, CheckCircle2, XCircle, Clock, AlertTriangle,
  Plus, BarChart3, Settings, Flag, Loader2, RefreshCw,
  TrendingUp, ArrowRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const C = {
  bg: "#1a1040", bdr: "#281850", muted: "#7b80b5",
  blue: "#2563eb", orange: "#f97316", green: "#10b981",
  purple: "#8b5cf6", yellow: "#eab308", red: "#ef4444",
};

const SHIPMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  label_created:    { label: "Label Created",    color: C.muted,   bg: "rgba(123,128,181,0.12)" },
  picked_up:        { label: "Picked Up",        color: C.blue,    bg: "rgba(37,99,235,0.12)"   },
  in_transit:       { label: "In Transit",       color: C.purple,  bg: "rgba(139,92,246,0.12)"  },
  out_for_delivery: { label: "Out for Delivery", color: C.orange,  bg: "rgba(249,115,22,0.12)"  },
  delivered:        { label: "Delivered",        color: C.green,   bg: "rgba(16,185,129,0.12)"  },
  failed:           { label: "Failed",           color: C.red,     bg: "rgba(239,68,68,0.12)"   },
  returned:         { label: "Returned",         color: C.yellow,  bg: "rgba(234,179,8,0.12)"   },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = SHIPMENT_STATUS[status] ?? { label: status, color: C.muted, bg: "transparent" };
  return (
    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

export default function SellerShippingPage() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<any>(null);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [recommendations, setRecommendations] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, shipmentsRes, recRes] = await Promise.all([
        fetch("/api/shipping/stats").then(r => r.json()),
        fetch(`/api/shipping/shipments?status=${filter}&limit=30`).then(r => r.json()),
        fetch("/api/shipping/recommend?weight=1&dest=NG").then(r => r.json()),
      ]);
      setStats(statsRes);
      setShipments(Array.isArray(shipmentsRes) ? shipmentsRes : []);
      setRecommendations(recRes);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [filter]);

  const STAT_CARDS = stats ? [
    { label: "Total Shipments",   value: stats.total,        color: C.blue,   icon: Package },
    { label: "In Transit",        value: stats.active,       color: C.purple, icon: Truck },
    { label: "Delivered",         value: stats.delivered,    color: C.green,  icon: CheckCircle2 },
    { label: "Failed / Returned", value: stats.failed,       color: C.red,    icon: XCircle },
    { label: "Pending Dispatch",  value: stats.pending,      color: C.yellow, icon: Clock },
    { label: "Delivery Rate",     value: `${stats.deliveryRate}%`, color: C.green, icon: TrendingUp },
  ] : [];

  const FILTERS = [
    { key: "ALL",             label: "All" },
    { key: "label_created",   label: "Pending" },
    { key: "in_transit",      label: "In Transit" },
    { key: "out_for_delivery",label: "Out for Delivery" },
    { key: "delivered",       label: "Delivered" },
    { key: "failed",          label: "Failed" },
    { key: "returned",        label: "Returned" },
  ];

  return (
    <SellerLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Shipping Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>Manage all your shipments and delivery tracking</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
            <RefreshCw style={{ width: 13, height: 13 }} />Refresh
          </button>
          <button onClick={() => setLocation("/seller/shipping/rates")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
            <Settings style={{ width: 13, height: 13 }} />Rates
          </button>
          <button onClick={() => setLocation("/seller/shipping/issues")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
            <Flag style={{ width: 13, height: 13 }} />Issues
          </button>
          <button onClick={() => setLocation("/seller/shipping/new")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: C.green }}>
            <Plus style={{ width: 13, height: 13 }} />Create Shipment
          </button>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blue }} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {STAT_CARDS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.bdr}`, borderTop: `3px solid ${s.color}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon style={{ width: 16, height: 16, color: s.color }} />
                  </div>
                  <p className="text-2xl font-extrabold text-white">{s.value}</p>
                  <p className="text-[11px] mt-1" style={{ color: C.muted }}>{s.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main table */}
            <div className="lg:col-span-3 space-y-3">
              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                {FILTERS.map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: filter === f.key ? C.blue : C.bg,
                      border: `1px solid ${filter === f.key ? C.blue : C.bdr}`,
                      color: filter === f.key ? "#fff" : C.muted,
                    }}>{f.label}</button>
                ))}
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
                {/* Table header */}
                <div className="grid px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: C.muted, background: "#120930", gridTemplateColumns: "1fr 120px 120px 100px 90px 40px" }}>
                  <span>Order / Buyer</span><span>Carrier</span><span>Tracking #</span><span>Status</span><span>Created</span><span />
                </div>

                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: C.blue }} /></div>
                ) : shipments.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Package style={{ width: 32, height: 32, marginBottom: 8, color: "#2a1a50" }} />
                    <p className="text-sm" style={{ color: C.muted }}>No shipments yet</p>
                    <button onClick={() => setLocation("/seller/shipping/new")}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white hover:opacity-90"
                      style={{ background: C.green }}>
                      <Plus style={{ width: 12, height: 12 }} />Create First Shipment
                    </button>
                  </div>
                ) : shipments.map((s, idx) => (
                  <div key={s.id} className="grid px-5 py-3.5 items-center text-sm cursor-pointer hover:bg-white/5 transition-all"
                    style={{ gridTemplateColumns: "1fr 120px 120px 100px 90px 40px", borderTop: idx === 0 ? "none" : `1px solid ${C.bdr}` }}
                    onClick={() => setLocation(`/seller/shipping/${s.id}`)}>
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-white text-xs truncate">#{s.orderId?.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: C.muted }}>{s.buyerName}</p>
                    </div>
                    <p className="text-xs font-semibold" style={{ color: "#93c5fd" }}>{s.carrier}</p>
                    <p className="text-xs font-mono truncate" style={{ color: C.muted }}>{s.trackingNumber?.slice(0, 14)}</p>
                    <StatusBadge status={s.status} />
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      {s.createdAt ? format(new Date(s.createdAt), "MMM d") : "—"}
                    </p>
                    <ArrowRight style={{ width: 14, height: 14, color: C.bdr }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations panel */}
            <div className="space-y-3">
              <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap style={{ width: 14, height: 14, color: C.yellow }} />
                  <p className="text-sm font-bold text-white">Courier Guide</p>
                </div>
                {recommendations && Object.entries(recommendations).map(([type, rec]: any) => rec && (
                  <div key={type} className="mb-3 rounded-xl p-3" style={{ background: "#120930", border: `1px solid ${C.bdr}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold capitalize" style={{ color: type === "cheapest" ? C.green : type === "fastest" ? C.blue : C.purple }}>
                        {type === "cheapest" ? "💰 Cheapest" : type === "fastest" ? "⚡ Fastest" : "⚖️ Balanced"}
                      </p>
                      <span className="text-[10px]" style={{ color: C.muted }}>{rec.eta?.label}</span>
                    </div>
                    <p className="text-sm font-bold text-white">{rec.courier?.name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{rec.reason}</p>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
                <p className="text-sm font-bold text-white mb-3">Quick Actions</p>
                {[
                  { label: "Create Shipment", icon: Plus, href: "/seller/shipping/new", color: C.green },
                  { label: "Manage Rates",    icon: Settings, href: "/seller/shipping/rates",  color: C.blue },
                  { label: "Delivery Issues", icon: Flag,    href: "/seller/shipping/issues", color: C.red },
                  { label: "Analytics",       icon: BarChart3, href: "/admin/shipping",         color: C.purple },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.href} onClick={() => setLocation(item.href)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold mb-1.5 text-left transition-all hover:opacity-90"
                      style={{ background: `${item.color}12`, border: `1px solid ${item.color}20`, color: item.color }}>
                      <Icon style={{ width: 13, height: 13 }} />{item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </SellerLayout>
  );
}
