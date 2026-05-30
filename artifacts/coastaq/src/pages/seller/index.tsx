import { useGetMe, useListProducts, useListMyShops } from "@workspace/api-client-react";
import { SellerLayout } from "./SellerLayout";
import { StatCard, StatGrid, DarkTooltip } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Package, ShoppingBag, DollarSign, TrendingUp, Store, AlertCircle, Clock,
} from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/use-subscription";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend,
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

const STATUS_COLORS: Record<string, string> = {
  PENDING: C.yellow, CONFIRMED: C.blue, SHIPPED: C.purple,
  DELIVERED: C.green, CANCELLED: C.red,
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", SHIPPED: "Shipped",
  DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SellerOverview() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe({ query: { retry: false } });
  const { data: shops } = useListMyShops();
  const activeShop = (shops as any[])?.[0];
  const { data: productsData } = useListProducts({ shopId: activeShop?.id, limit: 100 });
  const { data: sub } = useSubscriptionStatus();
  const [sellerOrders, setSellerOrders] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const products = (productsData as any)?.products ?? [];
  const subExpired = sub && !(sub as any).isActive;

  useEffect(() => {
    fetch("/api/orders/seller").then(r => r.json()).then(d => setSellerOrders(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/analytics/seller").then(r => r.json()).then(setAnalytics).catch(() => {});
  }, []);

  const pendingOrders = sellerOrders.filter(o => o.status === "PENDING").length;
  const totalRevenue = sellerOrders.filter(o => o.status !== "CANCELLED").reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
  const recentOrders = sellerOrders.slice(0, 6);

  /* 7-day revenue bars */
  const revenueData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const total = sellerOrders
      .filter(o => new Date(o.createdAt).toDateString() === d.toDateString() && o.status !== "CANCELLED")
      .reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    return { day: DAY_ABBR[d.getDay()], Revenue: parseFloat(total.toFixed(2)) };
  });

  /* Order status donut */
  const statusCounts: Record<string, number> = {};
  sellerOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });
  const statusData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: STATUS_LABEL[name] ?? name, value, color: STATUS_COLORS[name] ?? "#6b7280" }));

  return (
    <SellerLayout>
      {/* Title banner */}
      <div className="rounded-2xl px-6 py-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
          {activeShop?.logo
            ? <img src={activeShop.logo} className="w-full h-full object-cover rounded-xl" alt="" />
            : <Store style={{ width: 22, height: 22, color: "#fff" }} />}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-white leading-tight">
            {activeShop?.name ?? "Seller"} — Sales Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>
            {(user as any)?.email}
            {activeShop?.isApproved === false && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: C.yellow }}>
                <Clock style={{ width: 11, height: 11 }} />Pending approval
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {(sub as any)?.isActive
            ? <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(16,185,129,0.15)", color: C.green }}>Active Plan</span>
            : subExpired && <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(239,68,68,0.15)", color: C.red }}>Expired</span>
          }
        </div>
      </div>

      {/* Subscription expired */}
      {subExpired && (
        <div className="flex items-center gap-3 rounded-2xl p-4 mb-5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertCircle style={{ width: 18, height: 18, color: C.red, flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#fca5a5" }}>Subscription expired — renew to keep products visible.</p>
          </div>
          <button onClick={() => setLocation("/seller/subscription")} className="text-xs font-bold px-3 py-1.5 rounded-xl" style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>Renew →</button>
        </div>
      )}

      {/* KPI row */}
      <StatGrid cols={4}>
        <StatCard label="Total Revenue"  value={`$${totalRevenue.toFixed(0)}`} icon={DollarSign} color="bg-green-100 text-green-600"  highlight />
        <StatCard label="Total Orders"   value={sellerOrders.length}           icon={ShoppingBag} color="bg-blue-100 text-blue-600"
          subtext={pendingOrders > 0 ? `${pendingOrders} pending` : undefined} />
        <StatCard label="Products"       value={products.length}               icon={Package}    color="bg-purple-100 text-purple-600" />
        <StatCard label="Shop Views (30d)" value={analytics?.shopViews ?? "—"} icon={TrendingUp}  color="bg-orange-100 text-orange-600" />
      </StatGrid>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Revenue bar chart */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <p className="text-white font-bold text-base mb-1">Revenue — Last 7 Days</p>
          <p className="text-xs mb-4" style={{ color: C.muted }}>Daily order totals (excl. cancelled)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} barCategoryGap="30%">
              <XAxis dataKey="day" stroke={C.muted} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${v}`} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="Revenue" fill={C.blue} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order status donut */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <p className="text-white font-bold text-base mb-1">Order Status</p>
          <p className="text-xs mb-3" style={{ color: C.muted }}>Breakdown by status</p>
          {statusData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <ShoppingBag style={{ width: 32, height: 32, color: "#2a1a50" }} />
              <p className="text-sm mt-2" style={{ color: C.muted }}>No orders yet</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <PieChart width={180} height={180}>
                <Pie data={statusData} cx={90} cy={90} innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-1">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                    <span className="text-xs" style={{ color: C.muted }}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent orders table */}
      <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.bdr}` }}>
          <p className="font-bold text-white">Recent Orders</p>
          <button onClick={() => setLocation("/seller/orders")} className="text-sm font-semibold" style={{ color: C.blue }}>
            View all →
          </button>
        </div>

        {/* Header row */}
        <div className="grid px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.muted, gridTemplateColumns: "1fr 120px 90px 100px" }}>
          <span>Product / Order</span><span>Date</span><span className="text-right">Total</span><span className="text-right">Status</span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShoppingBag style={{ width: 36, height: 36, color: "#2a1a50", margin: "0 auto 8px" }} />
            <p className="text-sm" style={{ color: C.muted }}>No orders yet</p>
          </div>
        ) : recentOrders.map((order: any, idx: number) => {
          const item = order.items?.[0];
          const color = STATUS_COLORS[order.status] ?? C.muted;
          const label = STATUS_LABEL[order.status] ?? order.status;
          return (
            <div key={order.id} className="grid px-6 py-3.5 items-center transition-colors"
              style={{
                gridTemplateColumns: "1fr 120px 90px 100px",
                borderTop: idx === 0 ? "none" : `1px solid ${C.bdr}`,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
              <div className="min-w-0 pr-4">
                <p className="text-sm font-semibold text-white truncate">{item?.product?.title ?? "Order"}</p>
                <p className="text-xs" style={{ color: C.muted }}>#{order.id.slice(-8)}</p>
              </div>
              <p className="text-xs" style={{ color: C.muted }}>{new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-sm font-bold text-white text-right">${Number(order.total).toFixed(2)}</p>
              <div className="text-right">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}18`, color }}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: "Add Product",    href: "/seller/products",     color: C.green },
          { label: "View Orders",    href: "/seller/orders",       color: C.blue },
          { label: "Earnings",       href: "/seller/earnings",     color: C.purple },
          { label: "Shop Settings",  href: "/seller/shop",         color: C.orange },
        ].map(({ label, href, color }) => (
          <button key={href} onClick={() => setLocation(href)}
            className="py-3 px-4 rounded-2xl text-sm font-bold text-white text-center transition-all hover:opacity-90"
            style={{ background: `${color}22`, border: `1px solid ${color}40`, color }}>
            {label}
          </button>
        ))}
      </div>
    </SellerLayout>
  );
}
