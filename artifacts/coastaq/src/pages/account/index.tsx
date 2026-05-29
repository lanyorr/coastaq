import { useGetMe, useListOrders } from "@workspace/api-client-react";
import { AccountLayout } from "./AccountLayout";
import { StatCard, StatGrid } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ShoppingBag, MessageCircle, Heart, Package,
  ChevronRight, CheckCircle2, Truck, Clock, XCircle,
  User,
} from "lucide-react";
import { buildRolesFromUser, ROLE_LABELS } from "@/lib/auth/rbac";

const STATUS_CFG: Record<string, { label: string; color: string; Icon: any }> = {
  PENDING:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700", Icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700",     Icon: CheckCircle2 },
  SHIPPED:   { label: "Shipped",   color: "bg-purple-100 text-purple-700", Icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-700",   Icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700",       Icon: XCircle },
};

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
      .then(d => {
        if (Array.isArray(d)) {
          setConvCount(d.length);
          setUnread(d.reduce((s, c) => s + (c.unreadCount ?? 0), 0));
        }
      })
      .catch(() => {});

    try {
      const raw = localStorage.getItem("coastaq_saved");
      setSaved(raw ? JSON.parse(raw) : []);
    } catch { setSaved([]); }
  }, []);

  const activeOrders = orders.filter((o: any) => !["DELIVERED", "CANCELLED"].includes(o.status));
  const recentOrders = orders.slice(0, 5);
  const memberSince = (user as any)?.createdAt ? format(new Date((user as any).createdAt), "MMM yyyy") : "Recently";
  const userRoles = user ? buildRolesFromUser(user as any) : [];

  return (
    <AccountLayout>
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">{(user as any)?.name ?? "My Account"}</h1>
          <p className="text-muted-foreground text-sm">
            {(user as any)?.email} · Member since {memberSince}
          </p>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {userRoles.map(r => (
              <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                {ROLE_LABELS[r]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatGrid cols={4}>
        <StatCard label="Orders" value={orders.length} icon={ShoppingBag} color="bg-blue-100 text-blue-600"
          subtext={activeOrders.length > 0 ? `${activeOrders.length} active` : undefined} />
        <StatCard label="Messages" value={convCount} icon={MessageCircle} color="bg-green-100 text-green-600"
          subtext={unread > 0 ? `${unread} unread` : undefined} />
        <StatCard label="Saved" value={saved.length} icon={Heart} color="bg-rose-100 text-rose-600" />
        <StatCard label="Active Orders" value={activeOrders.length} icon={Package} color="bg-orange-100 text-orange-600" />
      </StatGrid>

      {/* Recent orders */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Recent Orders</h2>
          <button onClick={() => setLocation("/account/orders")} className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-2xl p-10 text-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-semibold text-muted-foreground">No orders yet</p>
            <button onClick={() => setLocation("/")} className="mt-3 text-sm text-primary font-medium hover:underline">
              Browse listings →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order: any) => {
              const product = order.items?.[0]?.product;
              const image = product?.images?.[0];
              const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
              const StatusIcon = cfg.Icon;
              return (
                <div key={order.id} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary shrink-0">
                    {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/40" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product?.title ?? "Order"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-bold text-sm">${Number(order.total).toFixed(2)}</p>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
