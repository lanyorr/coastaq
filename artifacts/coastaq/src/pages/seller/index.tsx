import { useGetMe, useListProducts, useListMyShops } from "@workspace/api-client-react";
import { SellerLayout } from "./SellerLayout";
import { StatCard, StatGrid } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Package, ShoppingBag, DollarSign, TrendingUp,
  Store, ChevronRight, AlertCircle, Clock, ArrowUpRight,
  BarChart2, Zap,
} from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/use-subscription";

function MiniBarChart({ values, color = "#3b82f6" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 48 }}>
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all"
          style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: `${color}40` }} />
      ))}
    </div>
  );
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:   { label: "Pending",   bg: "rgba(234,179,8,0.15)",   text: "#eab308" },
  CONFIRMED: { label: "Confirmed", bg: "rgba(59,130,246,0.15)",  text: "#60a5fa" },
  SHIPPED:   { label: "Shipped",   bg: "rgba(139,92,246,0.15)",  text: "#a78bfa" },
  DELIVERED: { label: "Delivered", bg: "rgba(52,211,153,0.15)",  text: "#34d399" },
  CANCELLED: { label: "Cancelled", bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
};

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
  const completedOrders = sellerOrders.filter(o => o.status === "DELIVERED").length;
  const totalRevenue = sellerOrders.filter(o => o.status !== "CANCELLED").reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
  const recentOrders = sellerOrders.slice(0, 6);

  // Build 7-day revenue bars from orders
  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toDateString();
    return sellerOrders.filter(o => new Date(o.createdAt).toDateString() === ds && o.status !== "CANCELLED")
      .reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
  });

  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().getDay();
  const dayBars = Array.from({ length: 7 }, (_, i) => {
    const idx = ((today - 6 + i) + 7) % 7;
    return { label: DAY_LABELS[idx], v: revenueByDay[i] };
  });
  const maxBar = Math.max(...revenueByDay, 1);

  return (
    <SellerLayout>
      {/* Profile header */}
      <div className="rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-5" style={{ background: "#141826", border: "1px solid #1e2538" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-white text-2xl font-bold" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
          {activeShop?.logo
            ? <img src={activeShop.logo} alt="" className="w-full h-full object-cover rounded-2xl" />
            : <Store style={{ width: 28, height: 28 }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{activeShop?.name ?? "Seller Hub"}</h1>
            {(sub as any)?.isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>Active</span>
            )}
            {subExpired && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>Expired</span>
            )}
            {activeShop?.isApproved === false && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{ background: "rgba(234,179,8,0.15)", color: "#eab308" }}>
                <Clock style={{ width: 10, height: 10 }} />Pending
              </span>
            )}
          </div>
          <p className="text-sm mt-0.5" style={{ color: "#8693b0" }}>{(user as any)?.email}</p>
          <div className="flex gap-4 mt-2">
            <div><span className="text-white font-bold">{products.length}</span><span className="text-xs ml-1" style={{ color: "#64748b" }}>products</span></div>
            <div><span className="text-white font-bold">{completedOrders}</span><span className="text-xs ml-1" style={{ color: "#64748b" }}>completed orders</span></div>
            <div><span className="text-white font-bold">{analytics?.shopViews ?? "—"}</span><span className="text-xs ml-1" style={{ color: "#64748b" }}>shop views</span></div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button onClick={() => setLocation("/seller/products")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#10b981" }}>
            <Package style={{ width: 14, height: 14 }} />Add Product
          </button>
          <button onClick={() => setLocation("/seller/orders")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: "rgba(255,255,255,0.07)", color: "#c8d0e0" }}>
            <ShoppingBag style={{ width: 14, height: 14 }} />Orders
          </button>
        </div>
      </div>

      {/* Subscription expired banner */}
      {subExpired && (
        <div className="flex items-center gap-3 rounded-2xl p-4 mb-6" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "#f87171" }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#fca5a5" }}>Subscription expired</p>
            <p className="text-xs" style={{ color: "#f87171" }}>Renew to keep your products active and visible to buyers.</p>
          </div>
          <button onClick={() => setLocation("/seller/subscription")} className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors" style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>
            Renew →
          </button>
        </div>
      )}

      {/* Stats grid */}
      <StatGrid cols={4}>
        <StatCard label="Total Products"   value={products.length}              icon={Package}    color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Total Orders"     value={sellerOrders.length}          icon={ShoppingBag} color="bg-blue-100 text-blue-600"
          subtext={pendingOrders > 0 ? `${pendingOrders} pending` : "All clear"} />
        <StatCard label="Revenue"          value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} color="bg-purple-100 text-purple-600" highlight />
        <StatCard label="Shop Views (30d)" value={analytics?.shopViews ?? "—"}  icon={TrendingUp}  color="bg-orange-100 text-orange-600" />
      </StatGrid>

      {/* Revenue chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#141826", border: "1px solid #1e2538" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white font-bold">Revenue (Last 7 Days)</p>
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Daily order totals</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#8693b0" }}>
              <BarChart2 style={{ width: 14, height: 14, color: "#3b82f6" }} />
              7-day view
            </div>
          </div>
          {/* Bars */}
          <div className="flex items-end gap-2" style={{ height: 96 }}>
            {dayBars.map(({ label, v }, i) => {
              const isToday = i === 6;
              const pct = Math.max(4, (v / maxBar) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full rounded-t-md transition-all" style={{
                    height: `${pct}%`,
                    background: isToday ? "#3b82f6" : "rgba(59,130,246,0.3)",
                  }} />
                  <span className="text-[10px]" style={{ color: isToday ? "#93c5fd" : "#475569" }}>{label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 pt-4" style={{ borderTop: "1px solid #1e2538" }}>
            <div><p className="text-xs" style={{ color: "#64748b" }}>Total this week</p><p className="text-lg font-bold text-white">${revenueByDay.reduce((a, b) => a + b, 0).toFixed(2)}</p></div>
            <button onClick={() => setLocation("/seller/earnings")} className="flex items-center gap-1 text-sm font-semibold transition-colors" style={{ color: "#3b82f6" }}>
              Full report <ArrowUpRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "#141826", border: "1px solid #1e2538" }}>
          <p className="text-white font-bold mb-1">Quick Actions</p>
          {[
            { label: "Add New Product",   href: "/seller/products",     color: "#10b981", icon: Package },
            { label: "View Orders",        href: "/seller/orders",       color: "#3b82f6", icon: ShoppingBag },
            { label: "Earnings Report",    href: "/seller/earnings",     color: "#8b5cf6", icon: DollarSign },
            { label: "Manage Campaigns",   href: "/seller/campaigns",    color: "#f59e0b", icon: Zap },
            { label: "Shop Settings",      href: "/seller/shop",         color: "#64748b", icon: Store },
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

      {/* Recent orders */}
      <div className="mt-4 rounded-2xl overflow-hidden" style={{ background: "#141826", border: "1px solid #1e2538" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #1e2538" }}>
          <p className="font-bold text-white">Recent Orders</p>
          <button onClick={() => setLocation("/seller/orders")} className="flex items-center gap-1 text-sm font-semibold transition-colors" style={{ color: "#3b82f6" }}>
            View all <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3" style={{ color: "#334155" }} />
            <p className="font-medium" style={{ color: "#64748b" }}>No orders yet</p>
            <p className="text-sm mt-1" style={{ color: "#475569" }}>When customers order from your shop, they'll appear here.</p>
          </div>
        ) : (
          <div>
            {recentOrders.map((order: any, idx: number) => {
              const item = order.items?.[0];
              const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
              return (
                <div key={order.id} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: idx < recentOrders.length - 1 ? "1px solid #1a1f30" : "none" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.1)" }}>
                    <ShoppingBag style={{ width: 16, height: 16, color: "#3b82f6" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item?.product?.title ?? "Order"}</p>
                    <p className="text-xs" style={{ color: "#64748b" }}>#{order.id.slice(-8)} · {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-bold text-sm text-white">${Number(order.total).toFixed(2)}</p>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.text }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
