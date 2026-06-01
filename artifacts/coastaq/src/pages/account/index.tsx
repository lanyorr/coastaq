import { useGetMe, useListOrders } from "@workspace/api-client-react";
import { AccountLayout } from "./AccountLayout";
import { StatCard, StatGrid, LightTooltip } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ShoppingBag, MessageCircle, Heart, Package,
  CheckCircle2, Truck, Clock, XCircle, Zap, Star,
} from "lucide-react";
import { buildRolesFromUser, ROLE_LABELS } from "@/lib/auth/rbac";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:   { label: "Pending",   color: "#b45309", bg: "#fef9c3", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "#1d4ed8", bg: "#dbeafe", icon: CheckCircle2 },
  SHIPPED:   { label: "Shipped",   color: "#6d28d9", bg: "#ede9fe", icon: Truck },
  DELIVERED: { label: "Delivered", color: "#15803d", bg: "#dcfce7", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "#b91c1c", bg: "#fee2e2", icon: XCircle },
};

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  BUYER:     { bg: "#dbeafe", text: "#1d4ed8" },
  SELLER:    { bg: "#dcfce7", text: "#15803d" },
  AFFILIATE: { bg: "#ede9fe", text: "#6d28d9" },
  ADMIN:     { bg: "#fee2e2", text: "#b91c1c" },
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
  const recentOrders = orders.slice(0, 8);
  const memberSince = (user as any)?.createdAt ? format(new Date((user as any).createdAt), "MMM yyyy") : "Recently";
  const userRoles = user ? buildRolesFromUser(user as any) : [];

  const spendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const total = orders
      .filter((o: any) => new Date(o.createdAt).toDateString() === d.toDateString())
      .reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    return { day: DAY_ABBR[d.getDay()], Spent: parseFloat(total.toFixed(2)) };
  });

  return (
    <AccountLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{(user as any)?.name ?? "My Account"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {(user as any)?.email}
            {userRoles.map(r => {
              const b = ROLE_BADGE[r] ?? ROLE_BADGE.BUYER;
              return (
                <span key={r} className="ml-2 inline-flex text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{ background: b.bg, color: b.text }}>
                  {ROLE_LABELS[r as keyof typeof ROLE_LABELS]}
                </span>
              );
            })}
            <span className="ml-2 text-gray-400">· Member since {memberSince}</span>
          </p>
        </div>
        <button onClick={() => setLocation("/")}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded">
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

      {/* Spending chart */}
      <div className="mt-4 bg-white p-4" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Spending — Last 7 Days</p>
            <p className="text-xs text-gray-500">Daily order totals</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={spendData} barCategoryGap="35%">
            <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={38} tickFormatter={v => `$${v}`} />
            <Tooltip content={<LightTooltip />} cursor={{ fill: "#f3f4f6" }} />
            <Bar dataKey="Spent" fill="#2563eb" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent orders table */}
      <div className="mt-4 bg-white overflow-hidden" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <p className="text-sm font-semibold text-gray-900">Recent Orders</p>
          <button onClick={() => setLocation("/account/orders")} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            View all →
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                  No orders yet.{" "}
                  <button onClick={() => setLocation("/")} className="text-blue-600 hover:underline font-medium">
                    Browse listings →
                  </button>
                </td>
              </tr>
            ) : recentOrders.map((order: any) => {
              const product = order.items?.[0]?.product;
              const image = product?.images?.[0];
              const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
              const StatusIcon = cfg.icon;
              return (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded shrink-0 overflow-hidden bg-gray-100 flex items-center justify-center">
                        {image
                          ? <img src={image} alt="" className="w-full h-full object-cover" />
                          : <Package className="w-4 h-4 text-gray-400" />}
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[180px]">{product?.title ?? "Order"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      <StatusIcon className="w-3 h-3" />{cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {/* Quick actions */}
        <div className="bg-white p-4" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
          <p className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "My Orders",   href: "/account/orders",   color: "#2563eb" },
              { label: "Messages",    href: "/account/messages", color: "#16a34a" },
              { label: "Saved Items", href: "/account/saved",    color: "#e11d48" },
              { label: "Settings",    href: "/account/settings", color: "#6b7280" },
            ].map(({ label, href, color }) => (
              <button key={href} onClick={() => setLocation(href)}
                className="py-2 px-3 text-sm font-medium text-center border border-gray-200 rounded bg-white hover:bg-gray-50 transition-colors"
                style={{ color }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {userRoles.length === 1 && userRoles[0] === "BUYER" && (
          <div className="bg-white p-4" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
            <p className="text-sm font-semibold text-gray-900 mb-1">Grow on Coastaq</p>
            <p className="text-xs text-gray-500 mb-3">Become a seller or affiliate to unlock more features.</p>
            <div className="space-y-2">
              <button onClick={() => setLocation("/auth/register?role=SELLER")}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors rounded">
                <Zap className="w-4 h-4" />Start Selling
              </button>
              <button onClick={() => setLocation("/affiliate")}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors rounded">
                <Star className="w-4 h-4" />Become an Affiliate
              </button>
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
