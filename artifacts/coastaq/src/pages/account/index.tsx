import { useGetMe, useListOrders } from "@workspace/api-client-react";
import { AccountLayout } from "./AccountLayout";
import { StatCard, StatGrid, DarkTooltip } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ShoppingBag, MessageCircle, Heart, Package,
  CheckCircle2, Truck, Clock, XCircle, User, Zap, Star,
} from "lucide-react";
import { buildRolesFromUser, ROLE_LABELS } from "@/lib/auth/rbac";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";

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

const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING:   { label: "Pending",   color: "#eab308", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "#2563eb", icon: CheckCircle2 },
  SHIPPED:   { label: "Shipped",   color: "#8b5cf6", icon: Truck },
  DELIVERED: { label: "Delivered", color: "#10b981", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "#ef4444", icon: XCircle },
};

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  BUYER:     { bg: "rgba(37,99,235,0.15)",   text: "#60a5fa" },
  SELLER:    { bg: "rgba(16,185,129,0.15)",  text: "#34d399" },
  AFFILIATE: { bg: "rgba(124,58,237,0.15)",  text: "#a78bfa" },
  ADMIN:     { bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
};

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AccountOverview() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe({ query: { retry: false } });
  const { data: ordersData } = useListOrders({ query: { enabled: !!user } });
  const orders = (ordersData as any[]) ?? [];
  const [convCount, setConvCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/messages/conversations")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) { setConvCount(d.length); setUnread(d.reduce((s, c) => s + (c.unreadCount ?? 0), 0)); } })
      .catch(() => {});
    try { const raw = localStorage.getItem("coastaq_saved"); setSaved(raw ? JSON.parse(raw) : []); }
    catch { setSaved([]); }
  }, []);

  const activeOrders = orders.filter((o: any) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const recentOrders = orders.slice(0, 6);
  const memberSince = (user as any)?.createdAt ? format(new Date((user as any).createdAt), "MMM yyyy") : "Recently";
  const userRoles = user ? buildRolesFromUser(user as any) : [];
  const initials = ((user as any)?.name as string | undefined)?.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  /* Order status donut */
  const statusCounts: Record<string, number> = {};
  orders.forEach((o: any) => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });
  const statusPieData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: STATUS_CFG[name]?.label ?? name, value, color: STATUS_CFG[name]?.color ?? "#6b7280" }));

  /* 7-day spending bar chart */
  const spendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const total = orders
      .filter((o: any) => new Date(o.createdAt).toDateString() === d.toDateString())
      .reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    return { day: DAY_ABBR[d.getDay()], Spent: parseFloat(total.toFixed(2)) };
  });

  return (
    <AccountLayout>
      {/* Title banner */}
      <div className="rounded-2xl px-6 py-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-white text-xl font-extrabold"
          style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold text-white">{(user as any)?.name ?? "My Account"} — Dashboard</h1>
            {userRoles.map(r => {
              const b = ROLE_BADGE[r] ?? ROLE_BADGE.BUYER;
              return (
                <span key={r} className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: b.bg, color: b.text }}>
                  {ROLE_LABELS[r as keyof typeof ROLE_LABELS]}
                </span>
              );
            })}
          </div>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>
            {(user as any)?.email} · Member since {memberSince}
          </p>
        </div>
        <button onClick={() => setLocation("/")}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 self-start sm:self-auto"
          style={{ background: C.blue }}>
          Browse Store
        </button>
      </div>

      {/* KPI row */}
      <StatGrid cols={4}>
        <StatCard label="Total Orders"   value={orders.length}       icon={ShoppingBag}   color="bg-blue-100 text-blue-600"
          subtext={activeOrders.length > 0 ? `${activeOrders.length} active` : undefined} />
        <StatCard label="Messages"       value={convCount}           icon={MessageCircle} color="bg-green-100 text-green-600"
          subtext={unread > 0 ? `${unread} unread` : undefined} />
        <StatCard label="Saved Items"    value={saved.length}        icon={Heart}         color="bg-rose-100 text-rose-600" />
        <StatCard label="Active Orders"  value={activeOrders.length} icon={Package}       color="bg-orange-100 text-orange-600" highlight />
      </StatGrid>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Spending bar chart */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <p className="text-white font-bold text-base mb-1">Spending — Last 7 Days</p>
          <p className="text-xs mb-4" style={{ color: C.muted }}>Daily order totals</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={spendData} barCategoryGap="30%">
              <XAxis dataKey="day" stroke={C.muted} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke={C.muted} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => `$${v}`} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="Spent" fill={C.orange} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Order status donut */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <p className="text-white font-bold text-base mb-1">Order Status</p>
          <p className="text-xs mb-3" style={{ color: C.muted }}>Breakdown by status</p>
          {statusPieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <ShoppingBag style={{ width: 32, height: 32, color: "#2a1a50" }} />
              <p className="text-sm mt-2" style={{ color: C.muted }}>No orders yet</p>
              <button onClick={() => setLocation("/")} className="mt-2 text-sm font-bold" style={{ color: C.blue }}>
                Start shopping →
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <PieChart width={180} height={180}>
                <Pie data={statusPieData} cx={90} cy={90} innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-1">
                {statusPieData.map(d => (
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
          <button onClick={() => setLocation("/account/orders")} className="text-sm font-semibold" style={{ color: C.blue }}>
            View all →
          </button>
        </div>

        <div className="grid px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: C.muted, gridTemplateColumns: "1fr 110px 90px 110px" }}>
          <span>Product</span><span>Date</span><span className="text-right">Total</span><span className="text-right">Status</span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <ShoppingBag style={{ width: 36, height: 36, color: "#2a1a50", margin: "0 auto 8px" }} />
            <p className="text-sm" style={{ color: C.muted }}>No orders yet</p>
            <button onClick={() => setLocation("/")} className="mt-2 text-sm font-bold" style={{ color: C.blue }}>Browse listings →</button>
          </div>
        ) : recentOrders.map((order: any, idx: number) => {
          const product = order.items?.[0]?.product;
          const image = product?.images?.[0];
          const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
          const StatusIcon = cfg.icon;
          return (
            <div key={order.id} className="grid px-6 py-3.5 items-center transition-colors"
              style={{ gridTemplateColumns: "1fr 110px 90px 110px", borderTop: idx === 0 ? "none" : `1px solid ${C.bdr}` }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}>
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0" style={{ background: "#281850" }}>
                  {image
                    ? <img src={image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Package style={{ width: 14, height: 14, color: "#5b6090" }} /></div>
                  }
                </div>
                <p className="text-sm font-semibold text-white truncate">{product?.title ?? "Order"}</p>
              </div>
              <p className="text-xs" style={{ color: C.muted }}>{new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-sm font-bold text-white text-right">${Number(order.total).toFixed(2)}</p>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: `${cfg.color}18`, color: cfg.color }}>
                  <StatusIcon style={{ width: 10, height: 10 }} />{cfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom row: quick actions + upsell */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <p className="text-white font-bold mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "My Orders",    href: "/account/orders",   color: C.blue },
              { label: "Messages",     href: "/account/messages", color: C.green },
              { label: "Saved Items",  href: "/account/saved",    color: "#f43f5e" },
              { label: "Settings",     href: "/account/settings", color: C.muted },
            ].map(({ label, href, color }) => (
              <button key={href} onClick={() => setLocation(href)}
                className="py-2.5 px-3 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90"
                style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {userRoles.length === 1 && userRoles[0] === "BUYER" && (
          <div className="rounded-2xl p-5" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
            <p className="font-extrabold text-white text-sm mb-1">Grow on Coastaq</p>
            <p className="text-xs mb-4" style={{ color: C.muted }}>Become a seller or affiliate to unlock more features.</p>
            <div className="space-y-2">
              <button onClick={() => setLocation("/auth/register?role=SELLER")}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "rgba(16,185,129,0.12)", color: C.green, border: "1px solid rgba(16,185,129,0.25)" }}>
                <Zap style={{ width: 14, height: 14 }} />Start Selling
              </button>
              <button onClick={() => setLocation("/affiliate")}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)" }}>
                <Star style={{ width: 14, height: 14 }} />Become an Affiliate
              </button>
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
