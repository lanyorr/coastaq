import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Users, Store, Package, ShoppingCart, DollarSign, Flag } from "lucide-react";

interface DashboardData {
  totalUsers: number; totalSellers: number; totalBuyers: number;
  pendingShops: number; totalProducts: number; totalOrders: number;
  platformRevenue: number; pendingReports: number;
  recentActions: { id: string; action: string; targetType: string; details?: string; createdAt: string; adminName?: string }[];
}

const ACTION_LABEL: Record<string, string> = {
  BLOCK_USER: "Blocked user", UNBLOCK_USER: "Unblocked user",
  APPROVE_SHOP: "Approved shop", REJECT_SHOP: "Rejected shop",
  SUSPEND_SHOP: "Suspended shop", UNSUSPEND_SHOP: "Unsuspended shop",
  PRODUCT_FLAGGED: "Flagged product", PRODUCT_SUSPENDED: "Suspended product",
  PRODUCT_ACTIVE: "Activated product", DELETE_PRODUCT: "Deleted product",
  RESOLVE_REPORT: "Resolved report", DISMISS_REPORT: "Dismissed report",
  CREATE_CATEGORY: "Created category", CHANGE_ROLE: "Changed user role",
};

const METRICS = [
  { key: "totalUsers",       label: "Total Users",    icon: Users,        color: "bg-blue-100 text-blue-600" },
  { key: "totalSellers",     label: "Sellers",        icon: Store,        color: "bg-purple-100 text-purple-600" },
  { key: "totalBuyers",      label: "Buyers",         icon: Users,        color: "bg-cyan-100 text-cyan-600" },
  { key: "totalProducts",    label: "Products",       icon: Package,      color: "bg-orange-100 text-orange-600" },
  { key: "totalOrders",      label: "Orders",         icon: ShoppingCart, color: "bg-green-100 text-green-600" },
  { key: "platformRevenue",  label: "Revenue",        icon: DollarSign,   color: "bg-emerald-100 text-emerald-600", prefix: "$" },
  { key: "pendingShops",     label: "Pending Shops",  icon: Store,        color: "bg-yellow-100 text-yellow-600" },
  { key: "pendingReports",   label: "Reports",        icon: Flag,         color: "bg-red-100 text-red-600" },
] as const;

const ICON_COLOR_MAP: Record<string, { iconBg: string; iconColor: string }> = {
  "bg-blue-100 text-blue-600":     { iconBg: "#dbeafe", iconColor: "#2563eb" },
  "bg-purple-100 text-purple-600": { iconBg: "#ede9fe", iconColor: "#7c3aed" },
  "bg-cyan-100 text-cyan-600":     { iconBg: "#cffafe", iconColor: "#0891b2" },
  "bg-orange-100 text-orange-600": { iconBg: "#ffedd5", iconColor: "#ea580c" },
  "bg-green-100 text-green-600":   { iconBg: "#dcfce7", iconColor: "#16a34a" },
  "bg-emerald-100 text-emerald-600": { iconBg: "#d1fae5", iconColor: "#059669" },
  "bg-yellow-100 text-yellow-600": { iconBg: "#fef9c3", iconColor: "#ca8a04" },
  "bg-red-100 text-red-600":       { iconBg: "#fee2e2", iconColor: "#dc2626" },
};

export default function AdminOverview() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard").then(r => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Marketplace Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">Platform-wide metrics and recent admin activity</p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {METRICS.map(({ key, label, icon: Icon, color, prefix }) => {
          const raw = (data as any)[key] ?? 0;
          const value = prefix ? `${prefix}${Number(raw).toFixed(2)}` : raw;
          const cfg = ICON_COLOR_MAP[color] ?? { iconBg: "#f3f4f6", iconColor: "#6b7280" };
          return (
            <div key={key} className="bg-white p-4 flex items-center gap-3"
              style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
              <div className="w-9 h-9 rounded flex items-center justify-center shrink-0"
                style={{ background: cfg.iconBg }}>
                <Icon className="w-4 h-4" style={{ color: cfg.iconColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
                <p className="text-2xl font-bold text-gray-900 leading-none mt-0.5">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          { label: "Seller Approvals", href: "/admin/sellers",      urgent: data.pendingShops > 0 },
          { label: "All Orders",       href: "/admin/orders",       urgent: false },
          { label: "Reports Queue",    href: "/admin/reports",      urgent: data.pendingReports > 0 },
          { label: "Verifications",    href: "/admin/verification", urgent: false },
        ].map(({ label, href, urgent }) => (
          <a key={href} href={href}
            className="py-2.5 px-3 text-sm font-medium text-center border rounded transition-colors"
            style={{
              background: urgent ? "#fef9c3" : "#ffffff",
              borderColor: urgent ? "#fbbf24" : "#e5e7eb",
              color: urgent ? "#92400e" : "#374151",
            }}>
            {label}{urgent && " ●"}
          </a>
        ))}
      </div>

      {/* Recent activity table */}
      <div className="bg-white overflow-hidden" style={{ border: "1px solid #e5e7eb", borderRadius: "4px" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid #e5e7eb" }}>
          <p className="text-sm font-semibold text-gray-900">Recent Admin Activity</p>
        </div>
        {data.recentActions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No actions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Admin</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Target</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActions.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{ACTION_LABEL[a.action] ?? a.action}</p>
                    {a.details && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{a.details}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 hidden sm:table-cell">{a.adminName ?? "Admin"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell capitalize">{a.targetType?.toLowerCase() ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 text-right whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
