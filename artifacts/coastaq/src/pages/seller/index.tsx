import { useGetMe, useListProducts, useListMyShops } from "@workspace/api-client-react";
import { SellerLayout } from "./SellerLayout";
import { StatCard, StatGrid, LightTooltip } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Package, ShoppingBag, DollarSign, TrendingUp, Store, AlertCircle, Clock,
} from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/use-subscription";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  PENDING:   { color: "#b45309", bg: "#fef9c3" },
  CONFIRMED: { color: "#1d4ed8", bg: "#dbeafe" },
  SHIPPED:   { color: "#6d28d9", bg: "#ede9fe" },
  DELIVERED: { color: "#15803d", bg: "#dcfce7" },
  CANCELLED: { color: "#b91c1c", bg: "#fee2e2" },
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
  const recentOrders = sellerOrders.slice(0, 8);

  const revenueData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const total = sellerOrders
      .filter(o => new Date(o.createdAt).toDateString() === d.toDateString() && o.status !== "CANCELLED")
      .reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
    return { day: DAY_ABBR[d.getDay()], Revenue: parseFloat(total.toFixed(2)) };
  });

  return (
    <SellerLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded flex items-center justify-center bg-green-50 border border-green-100 shrink-0">
            {activeShop?.logo
              ? <img src={activeShop.logo} className="w-full h-full object-cover rounded" alt="" />
              : <Store className="w-4 h-4 text-green-700" />}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{activeShop?.name ?? "Seller Dashboard"}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {(user as any)?.email}
              {activeShop?.isApproved === false && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                  <Clock className="w-3 h-3" />Pending approval
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(sub as any)?.isActive
            ? <span className="text-xs px-2 py-1 rounded font-medium bg-green-50 text-green-700 border border-green-100">Active Plan</span>
            : subExpired && <span className="text-xs px-2 py-1 rounded font-medium bg-red-50 text-red-600 border border-red-100">Expired</span>
          }
        </div>
      </div>

      {/* Subscription expired banner */}
      {subExpired && (
        <div className="flex items-center gap-3 p-3 mb-4 bg-red-50 border border-red-200 rounded">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700 flex-1">Subscription expired — renew to keep products visible.</p>
          <button onClick={() => setLocation("/seller/subscription")}
            className="text-xs font-medium px-2.5 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
            Renew
          </button>
        </div>
      )}

      {/* KPI row */}
      <StatGrid cols={4}>
        <StatCard label="Total Revenue"    value={`$${totalRevenue.toFixed(0)}`}    icon={DollarSign}  color="bg-green-100 text-green-600"  highlight />
        <StatCard label="Total Orders"     value={sellerOrders.length}              icon={ShoppingBag} color="bg-blue-100 text-blue-600"
          subtext={pendingOrders > 0 ? `${pendingOrders} pending` : undefined} />
        <StatCard label="Products"         value={products.length}                  icon={Package}     color="bg-purple-100 text-purple-600" />
        <StatCard label="Shop Views (30d)" value={analytics?.shopViews ?? "—"}      icon={TrendingUp}  color="bg-orange-100 text-orange-600" />
      </StatGrid>

      {/* Revenue chart */}
      <div className="mt-4 bg-white p-4" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900">Revenue — Last 7 Days</p>
          <p className="text-xs text-gray-500">Daily order totals (excl. cancelled)</p>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={revenueData} barCategoryGap="35%">
            <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} width={38} tickFormatter={v => `$${v}`} />
            <Tooltip content={<LightTooltip />} cursor={{ fill: "#f3f4f6" }} />
            <Bar dataKey="Revenue" fill="#16a34a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent orders table */}
      <div className="mt-4 bg-white overflow-hidden" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <p className="text-sm font-semibold text-gray-900">Recent Orders</p>
          <button onClick={() => setLocation("/seller/orders")} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
            View all →
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product / Order</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">No orders yet.</td>
              </tr>
            ) : recentOrders.map((order: any) => {
              const item = order.items?.[0];
              const sc = STATUS_COLORS[order.status] ?? { color: "#6b7280", bg: "#f3f4f6" };
              return (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">{item?.product?.title ?? "Order"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">#{order.id.slice(-8)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">${Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex text-xs font-medium px-2 py-0.5 rounded"
                      style={{ background: sc.bg, color: sc.color }}>
                      {STATUS_LABEL[order.status] ?? order.status}
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
          { label: "Add Product",   href: "/seller/products" },
          { label: "View Orders",   href: "/seller/orders" },
          { label: "Earnings",      href: "/seller/earnings" },
          { label: "Shop Settings", href: "/seller/shop" },
        ].map(({ label, href }) => (
          <button key={href} onClick={() => setLocation(href)}
            className="py-2.5 px-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors rounded text-center">
            {label}
          </button>
        ))}
      </div>
    </SellerLayout>
  );
}
