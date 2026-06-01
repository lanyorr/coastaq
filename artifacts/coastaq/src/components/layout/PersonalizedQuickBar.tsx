import { useGetMe } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { buildRolesFromUser, hasRole } from "@/lib/auth/rbac";
import {
  Store, Package, ShoppingBag, DollarSign,
  Link2, Plus, ArrowRight, Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SellerStat { products: number; pendingOrders: number; shopName: string }
interface BuyerStat  { activeOrders: number; savedCount: number }

function useSellerStats(): SellerStat | null {
  const [stats, setStats] = useState<SellerStat | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("coastaq_token") ?? "";
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/seller/products", { headers }).then(r => r.json()).catch(() => null),
      fetch("/api/seller/orders", { headers }).then(r => r.json()).catch(() => null),
      fetch("/api/seller/shop", { headers }).then(r => r.json()).catch(() => null),
    ]).then(([prods, orders, shop]) => {
      setStats({
        products: Array.isArray(prods?.products) ? prods.products.length : Array.isArray(prods) ? prods.length : 0,
        pendingOrders: Array.isArray(orders?.orders)
          ? orders.orders.filter((o: any) => o.status === "PENDING").length
          : Array.isArray(orders) ? orders.filter((o: any) => o.status === "PENDING").length : 0,
        shopName: shop?.name ?? "My Shop",
      });
    });
  }, []);
  return stats;
}

function useBuyerStats(): BuyerStat | null {
  const [stats, setStats] = useState<BuyerStat | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("coastaq_token") ?? "";
    const headers = { Authorization: `Bearer ${token}` };
    fetch("/api/orders", { headers }).then(r => r.json()).catch(() => null).then((orders) => {
      setStats({
        activeOrders: Array.isArray(orders?.orders)
          ? orders.orders.filter((o: any) => ["PENDING","CONFIRMED"].includes(o.status)).length
          : 0,
        savedCount: 0,
      });
    });
  }, []);
  return stats;
}

function SellerBar({ user }: { user: any }) {
  const [, setLocation] = useLocation();
  const stats = useSellerStats();

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
      <div className="container mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 mr-1">
          <div className="w-6 h-6 rounded-lg bg-green-600 flex items-center justify-center shrink-0">
            <Store className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-green-900">
            {(user.name as string)?.split(" ")[0]}'s Store
          </span>
        </div>

        {stats && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-green-700 bg-white/70 rounded-full px-2.5 py-1 border border-green-200/60">
              <Package className="w-3 h-3" />
              <span><b>{stats.products}</b> products</span>
            </div>
            {stats.pendingOrders > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 rounded-full px-2.5 py-1 border border-orange-200">
                <ShoppingBag className="w-3 h-3" />
                <span><b>{stats.pendingOrders}</b> pending orders</span>
              </div>
            )}
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setLocation("/seller/products/new")}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors px-3 py-1.5 rounded-full"
          >
            <Plus className="w-3 h-3" /> Add Product
          </button>
          <button
            onClick={() => setLocation("/seller")}
            className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-900 transition-colors"
          >
            Dashboard <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BuyerBar({ user }: { user: any }) {
  const [, setLocation] = useLocation();
  const stats = useBuyerStats();

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
      <div className="container mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 mr-1">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">
              {(user.name as string)?.[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-semibold text-blue-900">
            Welcome back, {(user.name as string)?.split(" ")[0]}
          </span>
        </div>

        {stats && stats.activeOrders > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-white/70 rounded-full px-2.5 py-1 border border-blue-200/60">
            <ShoppingBag className="w-3 h-3" />
            <span><b>{stats.activeOrders}</b> active orders</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setLocation("/account/orders")}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors"
          >
            My Orders <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AffiliateBar({ user }: { user: any }) {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
      <div className="container mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 mr-1">
          <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
            <Link2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-purple-900">
            Affiliate Hub
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-white/70 rounded-full px-2.5 py-1 border border-purple-200/60">
          <Zap className="w-3 h-3" />
          <span>Earn 5% per referral</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setLocation("/affiliate/links")}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors px-3 py-1.5 rounded-full"
          >
            <Plus className="w-3 h-3" /> Generate Link
          </button>
          <button
            onClick={() => setLocation("/affiliate")}
            className="flex items-center gap-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 transition-colors"
          >
            Dashboard <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PersonalizedQuickBar() {
  const { data: user } = useGetMe({ query: { retry: false } });
  if (!user) return null;

  const roles = buildRolesFromUser(user as any);
  const isSeller    = hasRole(roles, "SELLER");
  const isAffiliate = hasRole(roles, "AFFILIATE");

  if (isSeller)    return <SellerBar user={user} />;
  if (isAffiliate) return <AffiliateBar user={user} />;
  return <BuyerBar user={user} />;
}
