import { useGetMe, useListProducts, useListMyShops } from "@workspace/api-client-react";
import { SellerLayout } from "./SellerLayout";
import { StatCard, StatGrid } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  Package, ShoppingBag, DollarSign, TrendingUp,
  Store, ChevronRight, AlertCircle, Clock,
} from "lucide-react";
import { useSubscriptionStatus } from "@/hooks/use-subscription";

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
  const recentOrders = sellerOrders.slice(0, 5);

  return (
    <SellerLayout>
      {/* Shop header */}
      <div className="flex items-start gap-4 mb-8">
        {activeShop?.logo ? (
          <img src={activeShop.logo} alt={activeShop.name} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
            <Store className="w-7 h-7" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-display font-bold">{activeShop?.name ?? "Seller Hub"}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {(user as any)?.email}
            {activeShop?.isApproved === false && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                <Clock className="w-3 h-3" /> Pending approval
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Subscription expired warning */}
      {subExpired && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Subscription expired</p>
            <p className="text-xs text-red-600">Renew to keep your products active and visible.</p>
          </div>
          <button onClick={() => setLocation("/seller/subscription")} className="text-xs font-semibold text-red-600 bg-red-100 px-3 py-1.5 rounded-xl hover:bg-red-200 transition-colors">
            Renew →
          </button>
        </div>
      )}

      {/* Stats */}
      <StatGrid cols={4}>
        <StatCard label="Total Products" value={products.length} icon={Package} color="bg-green-100 text-green-600" />
        <StatCard label="Total Orders" value={sellerOrders.length} icon={ShoppingBag} color="bg-blue-100 text-blue-600"
          subtext={pendingOrders > 0 ? `${pendingOrders} pending` : undefined} />
        <StatCard label="Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} color="bg-purple-100 text-purple-600" />
        <StatCard label="Shop Views (30d)" value={analytics?.shopViews ?? "—"} icon={TrendingUp} color="bg-orange-100 text-orange-600" />
      </StatGrid>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { label: "Add Product", href: "/seller/products", color: "bg-green-600 text-white" },
          { label: "View Orders", href: "/seller/orders", color: "bg-blue-600 text-white" },
          { label: "Earnings", href: "/seller/earnings", color: "bg-purple-600 text-white" },
          { label: "Shop Settings", href: "/seller/shop", color: "bg-gray-700 text-white" },
        ].map(({ label, href, color }) => (
          <button key={href} onClick={() => setLocation(href)} className={`${color} rounded-2xl py-3 px-4 text-sm font-semibold text-center hover:opacity-90 transition-opacity`}>
            {label}
          </button>
        ))}
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Recent Orders</h2>
          <button onClick={() => setLocation("/seller/orders")} className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-2xl p-10 text-center text-muted-foreground">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No orders yet</p>
            <p className="text-sm mt-1">When customers order from your shop, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order: any) => {
              const item = order.items?.[0];
              const statusColors: Record<string, string> = {
                PENDING: "bg-yellow-100 text-yellow-700",
                CONFIRMED: "bg-blue-100 text-blue-700",
                SHIPPED: "bg-purple-100 text-purple-700",
                DELIVERED: "bg-green-100 text-green-700",
                CANCELLED: "bg-red-100 text-red-700",
              };
              return (
                <div key={order.id} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item?.product?.title ?? "Order"}</p>
                    <p className="text-xs text-muted-foreground">#{order.id.slice(-8)} · {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-bold text-sm">${Number(order.total).toFixed(2)}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status] ?? statusColors.PENDING}`}>{order.status}</span>
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
