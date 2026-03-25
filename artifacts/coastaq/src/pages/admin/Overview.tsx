import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Users, Store, Package, ShoppingCart, DollarSign, Flag, Clock, CheckCircle } from "lucide-react";

interface DashboardData {
  totalUsers: number; totalSellers: number; totalBuyers: number;
  pendingShops: number; totalProducts: number; totalOrders: number;
  platformRevenue: number; pendingReports: number;
  recentActions: { id: string; action: string; targetType: string; details?: string; createdAt: string; adminName?: string }[];
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    BLOCK_USER: "Blocked user", UNBLOCK_USER: "Unblocked user",
    APPROVE_SHOP: "Approved shop", REJECT_SHOP: "Rejected shop",
    SUSPEND_SHOP: "Suspended shop", UNSUSPEND_SHOP: "Unsuspended shop",
    PRODUCT_FLAGGED: "Flagged product", PRODUCT_SUSPENDED: "Suspended product",
    PRODUCT_ACTIVE: "Activated product", DELETE_PRODUCT: "Deleted product",
    RESOLVE_REPORT: "Resolved report", DISMISS_REPORT: "Dismissed report",
    CREATE_CATEGORY: "Created category", CHANGE_ROLE: "Changed user role",
  };
  return map[action] ?? action;
}

export default function AdminOverview() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard").then(r => r.json()).then(setData);
  }, []);

  if (!data) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Overview</h1>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={data.totalUsers} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Store} label="Sellers" value={data.totalSellers} color="bg-purple-100 text-purple-600" />
        <StatCard icon={Package} label="Products" value={data.totalProducts} color="bg-orange-100 text-orange-600" />
        <StatCard icon={ShoppingCart} label="Orders" value={data.totalOrders} color="bg-green-100 text-green-600" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${data.platformRevenue.toFixed(2)}`} color="bg-emerald-100 text-emerald-600" />
        <StatCard icon={Store} label="Pending Shops" value={data.pendingShops} color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={Flag} label="Reports" value={data.pendingReports} color="bg-red-100 text-red-600" />
        <StatCard icon={Users} label="Buyers" value={data.totalBuyers} color="bg-cyan-100 text-cyan-600" />
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-4">Recent Admin Activity</h2>
        {data.recentActions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No actions yet</p>
        ) : (
          <ul className="space-y-3">
            {data.recentActions.map(a => (
              <li key={a.id} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{actionLabel(a.action)}{a.details ? ` — ${a.details}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{a.adminName} · {new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
