import { useGetMe, useListOrders } from "@workspace/api-client-react";
import { AccountLayout } from "./AccountLayout";
import { StatCard, StatGrid } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  ShoppingBag, MessageCircle, Heart, Package,
  ChevronRight, CheckCircle2, Truck, Clock, XCircle,
  User, ArrowUpRight, Star, Zap, Settings,
} from "lucide-react";
import { buildRolesFromUser, ROLE_LABELS } from "@/lib/auth/rbac";

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  PENDING:   { label: "Pending",   bg: "rgba(234,179,8,0.15)",  text: "#eab308",  icon: Clock },
  CONFIRMED: { label: "Confirmed", bg: "rgba(59,130,246,0.15)", text: "#60a5fa",  icon: CheckCircle2 },
  SHIPPED:   { label: "Shipped",   bg: "rgba(139,92,246,0.15)", text: "#a78bfa",  icon: Truck },
  DELIVERED: { label: "Delivered", bg: "rgba(52,211,153,0.15)", text: "#34d399",  icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", bg: "rgba(239,68,68,0.15)",  text: "#f87171",  icon: XCircle },
};

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  BUYER:     { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa" },
  SELLER:    { bg: "rgba(52,211,153,0.15)",  text: "#34d399" },
  AFFILIATE: { bg: "rgba(139,92,246,0.15)",  text: "#a78bfa" },
  ADMIN:     { bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
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

  return (
    <AccountLayout>
      {/* Profile header */}
      <div className="rounded-2xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-5" style={{ background: "#0d1d3d", border: "1px solid #173069" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-white text-xl font-bold" style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{(user as any)?.name ?? "My Account"}</h1>
            {userRoles.map(r => {
              const badge = ROLE_BADGE[r] ?? ROLE_BADGE.BUYER;
              return (
                <span key={r} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: badge.bg, color: badge.text }}>
                  {ROLE_LABELS[r as keyof typeof ROLE_LABELS]}
                </span>
              );
            })}
          </div>
          <p className="text-sm mt-0.5" style={{ color: "#8693b0" }}>{(user as any)?.email}</p>
          <div className="flex gap-4 mt-2">
            <div><span className="text-white font-bold">{orders.length}</span><span className="text-xs ml-1" style={{ color: "#64748b" }}>orders</span></div>
            <div><span className="text-white font-bold">{saved.length}</span><span className="text-xs ml-1" style={{ color: "#64748b" }}>saved</span></div>
            <div><span className="text-xs" style={{ color: "#64748b" }}>Member since {memberSince}</span></div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setLocation("/")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#3b82f6" }}>
            <ShoppingBag style={{ width: 14, height: 14 }} />Browse
          </button>
          <button onClick={() => setLocation("/account/settings")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: "rgba(255,255,255,0.07)", color: "#c8d0e0" }}>
            <Settings style={{ width: 14, height: 14 }} />Settings
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatGrid cols={4}>
        <StatCard label="Total Orders"  value={orders.length}       icon={ShoppingBag}    color="bg-blue-100 text-blue-600"
          subtext={activeOrders.length > 0 ? `${activeOrders.length} active` : "No active orders"} />
        <StatCard label="Messages"      value={convCount}           icon={MessageCircle}  color="bg-emerald-100 text-emerald-600"
          subtext={unread > 0 ? `${unread} unread` : "All read"} />
        <StatCard label="Saved Items"   value={saved.length}        icon={Heart}          color="bg-rose-100 text-rose-600" />
        <StatCard label="Active Orders" value={activeOrders.length} icon={Package}        color="bg-orange-100 text-orange-600" highlight />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: "#0d1d3d", border: "1px solid #173069" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #173069" }}>
            <p className="font-bold text-white">Recent Orders</p>
            <button onClick={() => setLocation("/account/orders")} className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#3b82f6" }}>
              View all <ChevronRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3" style={{ color: "#334155" }} />
              <p className="font-medium" style={{ color: "#64748b" }}>No orders yet</p>
              <button onClick={() => setLocation("/")} className="mt-3 text-sm font-semibold" style={{ color: "#3b82f6" }}>
                Browse listings →
              </button>
            </div>
          ) : (
            <div>
              {recentOrders.map((order: any, idx: number) => {
                const product = order.items?.[0]?.product;
                const image = product?.images?.[0];
                const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.PENDING;
                const StatusIcon = cfg.icon;
                return (
                  <div key={order.id} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: idx < recentOrders.length - 1 ? "1px solid #122040" : "none" }}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ background: "#122040" }}>
                      {image
                        ? <img src={image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package style={{ width: 16, height: 16, color: "#475569" }} /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{product?.title ?? "Order"}</p>
                      <p className="text-xs" style={{ color: "#64748b" }}>{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-bold text-sm text-white">${Number(order.total).toFixed(2)}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.text }}>
                        <StatusIcon style={{ width: 10, height: 10 }} />{cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions + role links */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: "#0d1d3d", border: "1px solid #173069" }}>
            <p className="text-white font-bold mb-3">Quick Actions</p>
            <div className="space-y-2">
              {[
                { label: "Browse Listings",  href: "/",                  color: "#3b82f6",  icon: ShoppingBag },
                { label: "My Orders",        href: "/account/orders",   color: "#10b981",  icon: Package },
                { label: "Messages",         href: "/account/messages", color: "#8b5cf6",  icon: MessageCircle },
                { label: "Saved Items",      href: "/account/saved",    color: "#ec4899",  icon: Heart },
                { label: "Account Settings", href: "/account/settings", color: "#64748b",  icon: Settings },
              ].map(({ label, href, color, icon: Icon }) => (
                <button key={href} onClick={() => setLocation(href)}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-left transition-all hover:opacity-90"
                  style={{ background: `${color}18`, color: "#c8d0e0", border: `1px solid ${color}25` }}>
                  <Icon style={{ width: 14, height: 14, color }} />
                  {label}
                  <ChevronRight style={{ width: 13, height: 13, color: "#475569", marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Upgrade prompt if only BUYER role */}
          {userRoles.length === 1 && userRoles[0] === "BUYER" && (
            <div className="rounded-2xl p-5" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <p className="font-bold text-white text-sm mb-1">Grow on Coastaq</p>
              <p className="text-xs mb-3" style={{ color: "#8693b0" }}>Become a seller or affiliate to unlock more features.</p>
              <div className="space-y-2">
                <button onClick={() => setLocation("/auth/register?role=SELLER")} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "rgba(52,211,153,0.12)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <Zap style={{ width: 13, height: 13 }} />Start Selling
                </button>
                <button onClick={() => setLocation("/affiliate")} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
                  <Star style={{ width: 13, height: 13 }} />Become an Affiliate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
