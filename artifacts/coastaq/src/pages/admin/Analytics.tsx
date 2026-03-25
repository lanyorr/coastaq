import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Users, ShoppingCart, Package, DollarSign, Store, Clock } from "lucide-react";

interface AnalyticsData {
  totalUsers: number; totalSellers: number; totalProducts: number;
  totalOrders: number; totalRevenue: number; pendingApprovals: number;
  usersByRole: { role: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
  topShops: { shopName: string; revenue: number; orders: number }[];
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics").then(r => r.json()).then(setData);
  }, []);

  if (!data) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div></AdminLayout>;
  }

  const maxOrderStatus = Math.max(...(data.ordersByStatus.map(o => Number(o.count)) || [1]));
  const maxRole = Math.max(...(data.usersByRole.map(r => Number(r.count)) || [1]));

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-400", PAID: "bg-blue-400", SHIPPED: "bg-purple-400",
    DELIVERED: "bg-green-400", CANCELLED: "bg-red-400",
  };

  const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-purple-400", SELLER: "bg-blue-400", BUYER: "bg-green-400",
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: "Total Users", value: data.totalUsers, color: "text-blue-600 bg-blue-100" },
          { icon: Store, label: "Sellers", value: data.totalSellers, color: "text-purple-600 bg-purple-100" },
          { icon: Package, label: "Products", value: data.totalProducts, color: "text-orange-600 bg-orange-100" },
          { icon: ShoppingCart, label: "Orders", value: data.totalOrders, color: "text-green-600 bg-green-100" },
          { icon: DollarSign, label: "Revenue", value: `$${data.totalRevenue.toFixed(2)}`, color: "text-emerald-600 bg-emerald-100" },
          { icon: Clock, label: "Pending Approvals", value: data.pendingApprovals, color: "text-yellow-600 bg-yellow-100" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Users by Role</h2>
          <div className="space-y-3">
            {data.usersByRole.map(r => (
              <Bar key={r.role} label={r.role} value={Number(r.count)} max={maxRole} color={ROLE_COLORS[r.role] ?? "bg-gray-400"} />
            ))}
            {data.usersByRole.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {data.ordersByStatus.map(o => (
              <Bar key={o.status} label={o.status} value={Number(o.count)} max={maxOrderStatus} color={STATUS_COLORS[o.status] ?? "bg-gray-400"} />
            ))}
            {data.ordersByStatus.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold mb-4">Top Shops by Revenue</h2>
          {data.topShops.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No data</p>
          ) : (
            <div className="space-y-3">
              {data.topShops.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.shopName}</p>
                    <p className="text-xs text-muted-foreground">{s.orders} orders</p>
                  </div>
                  <p className="text-sm font-semibold text-green-600">${s.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
