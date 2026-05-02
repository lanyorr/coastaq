import { useState, useEffect, useRef } from "react";
import {
  useGetMe, useListProducts, useGetMyShop, useUpdateMyShop,
  useCreateProduct, useDeleteProduct, useListCategories,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Store, Package, Settings, Plus, Trash2, Loader2, Home,
  ImageIcon, AlertCircle, CreditCard, MessageCircle, ChevronRight, Inbox,
  ShoppingBag, CheckCircle2, XCircle, Truck, Clock as ClockIcon, AlertTriangle,
  Pencil, Shield, TrendingUp, DollarSign, Lock,
  ExternalLink, Phone, Globe, Facebook, Instagram, Twitter, Youtube,
  MapPin, Upload, X as XIcon,
} from "lucide-react";
import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  SubscriptionPanel,
  SubscriptionExpiredBanner,
} from "@/components/subscription/SubscriptionPanel";
import { useSubscriptionStatus } from "@/hooks/use-subscription";

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SellerEarnings() {
  const [summary, setSummary] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/escrow/seller/summary").then(r => r.json()),
      fetch("/api/escrow/seller/orders").then(r => r.json()),
    ])
      .then(([s, o]) => {
        setSummary(s);
        setOrders(Array.isArray(o) ? o : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const PSMAP: Record<string, { label: string; color: string }> = {
    escrowed: { label: "In Escrow",       color: "bg-blue-100 text-blue-700" },
    released: { label: "Released",         color: "bg-green-100 text-green-700" },
    refunded: { label: "Refunded",         color: "bg-orange-100 text-orange-700" },
    disputed: { label: "Disputed",         color: "bg-red-100 text-red-700" },
    pending:  { label: "Pending Payment",  color: "bg-gray-100 text-gray-600" },
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="animate-pulse bg-secondary/50 rounded-2xl h-20" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 text-blue-600 p-3.5 rounded-xl"><Lock className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Held in Escrow</p>
            <p className="text-xl font-bold">${Number(summary?.totalEscrowed ?? 0).toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 text-green-600 p-3.5 rounded-xl"><DollarSign className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Released</p>
            <p className="text-xl font-bold">${Number(summary?.totalReleased ?? 0).toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-purple-100 text-purple-600 p-3.5 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Orders</p>
            <p className="text-xl font-bold">{summary?.orderCount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Escrow info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800">
        <Shield className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
        <div>
          <p className="font-semibold">How escrow protects your earnings</p>
          <p className="text-xs mt-1 text-blue-700/80">
            Buyer payments are held securely in escrow when orders are placed. Funds are released to you automatically 7 days after delivery,
            or immediately when the buyer confirms receipt. A 5% platform fee applies to each transaction.
          </p>
        </div>
      </div>

      {/* Order breakdown */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Earnings Breakdown</h3>
        {orders.length === 0 ? (
          <div className="text-center py-10">
            <DollarSign className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No orders with escrow payments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="text-left py-2 px-3">Order</th>
                  <th className="text-left py-2 px-3">Buyer Amount</th>
                  <th className="text-left py-2 px-3">Platform Fee</th>
                  <th className="text-left py-2 px-3">Your Share</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => {
                  const ps = PSMAP[o.paymentStatus] ?? PSMAP.pending;
                  return (
                    <tr key={o.id} className="border-t border-border/30">
                      <td className="py-3 px-3 font-mono text-xs text-muted-foreground">#{o.id.slice(-8)}</td>
                      <td className="py-3 px-3 font-medium">${Number(o.escrowAmount ?? o.total ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-3 text-muted-foreground">${Number(o.platformFee ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-3 font-semibold text-green-700">${Number(o.sellerAmount ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${ps.color}`}>
                          {ps.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SellerInbox() {
  const [, setLocation] = useLocation();
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages/conversations")
      .then(r => r.json())
      .then(d => { setConvs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg">Buyer Messages</h3>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setLocation("/messages")}>
          Open inbox
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3 p-3 rounded-xl animate-pulse">
              <div className="w-10 h-10 rounded-full bg-secondary shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-secondary rounded w-1/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : convs.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">When buyers enquire about your listings, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convs.slice(0, 8).map((conv: any) => (
            <button
              key={conv.id}
              onClick={() => setLocation(`/messages/${conv.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground/80"}`}>
                    {conv.otherUser?.name ?? "Buyer"}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 w-5 h-5 flex items-center justify-center">{conv.unreadCount}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">{conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : ""}</span>
                  </div>
                </div>
                {conv.product && (
                  <p className="text-[11px] text-primary/60 truncate">{conv.product.title}</p>
                )}
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage?.content ?? "No messages yet"}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
          {convs.length > 8 && (
            <button onClick={() => setLocation("/messages")} className="w-full text-sm text-primary font-semibold py-2 hover:underline">
              View all {convs.length} conversations →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PENDING:   { label: "Pending",   icon: <ClockIcon className="w-3.5 h-3.5" />,      className: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Confirmed", icon: <CheckCircle2 className="w-3.5 h-3.5" />,   className: "bg-blue-50 text-blue-700 border-blue-200" },
  SHIPPED:   { label: "Shipped",   icon: <Truck className="w-3.5 h-3.5" />,           className: "bg-purple-50 text-purple-700 border-purple-200" },
  DELIVERED: { label: "Delivered", icon: <CheckCircle2 className="w-3.5 h-3.5" />,   className: "bg-green-50 text-green-700 border-green-200" },
  CANCELLED: { label: "Cancelled", icon: <XCircle className="w-3.5 h-3.5" />,         className: "bg-red-50 text-red-700 border-red-200" },
};

function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { num: string; courier: string }>>({});
  const [showTrackingForm, setShowTrackingForm] = useState<string | null>(null);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    fetch("/api/orders/seller")
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const r = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error("Failed");
      toast({ title: "Order updated", description: `Status changed to ${status.toLowerCase()}.` });
      load();
    } catch {
      toast({ title: "Error", description: "Could not update order.", variant: "destructive" });
    }
    setUpdatingId(null);
  };

  const submitTracking = async (orderId: string) => {
    const t = trackingInputs[orderId];
    if (!t?.num?.trim()) {
      toast({ title: "Tracking required", description: "Please enter a tracking number.", variant: "destructive" });
      return;
    }
    setUpdatingId(orderId);
    try {
      const r = await fetch(`/api/orders/${orderId}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: t.num.trim(), courierName: t.courier.trim() || null }),
      });
      if (!r.ok) throw new Error("Failed");
      // Now mark as shipped
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SHIPPED" }),
      });
      toast({ title: "Shipped!", description: "Tracking saved and order marked as shipped." });
      setShowTrackingForm(null);
      load();
    } catch {
      toast({ title: "Error", description: "Could not update order.", variant: "destructive" });
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
        <h3 className="font-display font-semibold text-lg mb-6">Requested Orders</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-secondary/50 rounded-2xl p-4 h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg">Requested Orders</h3>
        <span className="text-sm text-muted-foreground">{orders.length} total</span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">When buyers place orders on your listings, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
            const item = order.items?.[0];
            return (
              <div
                key={order.id}
                className={`rounded-2xl overflow-hidden border ${order.paymentStatus === "escrowed" ? "border-blue-200" : order.paymentStatus === "released" ? "border-green-200" : order.paymentStatus === "disputed" ? "border-red-200" : "border-border/50"}`}
              >
                {/* Escrow status stripe */}
                {order.paymentStatus === "escrowed" && (
                  <div className="bg-blue-600 text-white px-4 py-2 flex items-center gap-2 text-xs font-semibold">
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    Payment in escrow · Awaiting buyer confirmation
                    {order.sellerAmount != null && (
                      <span className="ml-auto text-blue-200">${Number(order.sellerAmount).toFixed(2)} pending</span>
                    )}
                  </div>
                )}
                {order.paymentStatus === "released" && (
                  <div className="bg-green-600 text-white px-4 py-2 flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Funds released to you
                    {order.sellerAmount != null && (
                      <span className="ml-auto text-green-200">${Number(order.sellerAmount).toFixed(2)} earned</span>
                    )}
                  </div>
                )}
                {order.paymentStatus === "disputed" && (
                  <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-2 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Dispute open · Funds frozen while under review
                  </div>
                )}
                {order.paymentStatus === "refunded" && (
                  <div className="bg-orange-500 text-white px-4 py-2 flex items-center gap-2 text-xs font-semibold">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    Order refunded · Buyer received refund
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(-8)}</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.className}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground text-sm mt-1 truncate">
                        {item?.product?.title ?? "Unknown Product"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item?.quantity ?? 1}
                      </p>
                      {order.buyerNote && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{order.buyerNote}"</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">${Number(order.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      {order.sellerAmount != null && order.paymentStatus && order.paymentStatus !== "pending" && (
                        <p className="text-xs text-green-700 font-semibold mt-0.5">
                          You get: ${Number(order.sellerAmount).toFixed(2)}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Buyer info */}
                  {order.buyer && (
                    <div className="text-xs text-muted-foreground bg-secondary/60 rounded-xl px-3 py-2">
                      Buyer: <span className="font-medium text-foreground">{order.buyer.name}</span> · {order.buyer.email}
                    </div>
                  )}

                  {/* Tracking display */}
                  {order.trackingNumber && (
                    <div className="bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
                      <Truck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="text-purple-800 font-semibold">Tracking:</span>
                      {order.courierName && <span className="text-purple-700">{order.courierName} ·</span>}
                      <span className="text-purple-700 font-mono">{order.trackingNumber}</span>
                    </div>
                  )}

                  {/* Escrowed notice for seller */}
                  {order.paymentStatus === "escrowed" && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-800">
                      <strong>Payment secured.</strong> Funds will be released automatically 7 days after delivery, or sooner when the buyer confirms receipt.
                    </div>
                  )}

                  {/* Status actions */}
                  {order.status === "PENDING" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => updateStatus(order.id, "CONFIRMED")}
                        disabled={updatingId === order.id}
                        className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        {updatingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Confirm Order
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, "CANCELLED")}
                        disabled={updatingId === order.id}
                        className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3 h-3" /> Decline
                      </button>
                    </div>
                  )}
                  {order.status === "CONFIRMED" && showTrackingForm !== order.id && (
                    <button
                      onClick={() => setShowTrackingForm(order.id)}
                      disabled={updatingId === order.id}
                      className="w-full py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      <Truck className="w-3 h-3" /> Add Tracking & Mark Shipped
                    </button>
                  )}
                  {order.status === "CONFIRMED" && showTrackingForm === order.id && (
                    <div className="space-y-2.5 bg-purple-50 border border-purple-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-purple-800 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" /> Enter Tracking Details
                      </p>
                      <input
                        type="text"
                        placeholder="Tracking number (required)"
                        value={trackingInputs[order.id]?.num ?? ""}
                        onChange={e => setTrackingInputs(p => ({ ...p, [order.id]: { ...p[order.id], num: e.target.value, courier: p[order.id]?.courier ?? "" } }))}
                        className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <input
                        type="text"
                        placeholder="Courier / shipping company (optional)"
                        value={trackingInputs[order.id]?.courier ?? ""}
                        onChange={e => setTrackingInputs(p => ({ ...p, [order.id]: { ...p[order.id], courier: e.target.value, num: p[order.id]?.num ?? "" } }))}
                        className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-300"
                      />
                      <div className="flex gap-2 pt-0.5">
                        <button
                          onClick={() => setShowTrackingForm(null)}
                          className="flex-1 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors"
                        >Cancel</button>
                        <button
                          onClick={() => submitTracking(order.id)}
                          disabled={updatingId === order.id || !trackingInputs[order.id]?.num?.trim()}
                          className="flex-1 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1"
                        >
                          {updatingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3 h-3" />}
                          Mark Shipped
                        </button>
                      </div>
                    </div>
                  )}
                  {order.status === "SHIPPED" && (
                    <button
                      onClick={() => updateStatus(order.id, "DELIVERED")}
                      disabled={updatingId === order.id}
                      className="w-full py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {updatingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const EMPTY_PRODUCT = {
  title: "", price: "", stock: "1",
  condition: "NEW" as "NEW" | "USED" | "REFURBISHED",
  description: "", location: "", image: "",
  parentCategoryId: "", categoryId: "",
};

export default function SellerDashboard() {
  const { data: user } = useGetMe();
  const { data: shop } = useGetMyShop();
  const { data: productsData } = useListProducts({ shopId: shop?.id, limit: 100 });
  const { data: categories } = useListCategories();
  const { data: sub } = useSubscriptionStatus();
  const { mutate: updateShop, mutateAsync: updateShopAsync, isPending: updatingShop } = useUpdateMyShop();
  const { mutate: createProduct, isPending: creatingProduct } = useCreateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [activeTab, setActiveTab] = useState("products");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shop profile form state
  const [shopForm, setShopForm] = useState({
    name: "", description: "", phone: "", whatsapp: "", email: "", website: "",
    address: "", city: "", country: "", businessHours: "", accentColor: "#1d4ed8",
    facebookUrl: "", instagramUrl: "", tiktokUrl: "", twitterUrl: "", youtubeUrl: "",
    logo: "", banner: "",
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Edit product state
  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<typeof EMPTY_PRODUCT & { id: string }>(
    { ...EMPTY_PRODUCT, id: "" }
  );
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const token = localStorage.getItem("coastaq_token");
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Upload failed");
      }
      const data = await res.json() as { url: string };
      setNewProduct(p => ({ ...p, image: data.url }));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setImageUploading(false);
    }
  };

  const handleEditImageUpload = async (file: File) => {
    setEditImageUploading(true);
    try {
      const token = localStorage.getItem("coastaq_token");
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url: string };
      setEditProduct(p => ({ ...p, image: data.url }));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setEditImageUploading(false);
    }
  };

  const openEdit = (p: any) => {
    setEditProduct({
      id: p.id,
      title: p.title ?? "",
      price: String(p.price ?? ""),
      stock: String(p.stock ?? "1"),
      condition: p.condition ?? "NEW",
      description: p.description ?? "",
      location: p.location ?? "",
      image: p.images?.[0] ?? "",
      parentCategoryId: "",
      categoryId: p.categoryId ?? "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const token = localStorage.getItem("coastaq_token");
      const res = await fetch(`/api/products/${editProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: editProduct.title,
          price: parseFloat(editProduct.price),
          stock: parseInt(editProduct.stock),
          condition: editProduct.condition,
          description: editProduct.description,
          location: editProduct.location,
          images: editProduct.image ? [editProduct.image] : [],
          categoryId: editProduct.categoryId || editProduct.parentCategoryId || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Update failed");
      toast({ title: "Product updated", description: `"${editProduct.title}" has been saved.` });
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to update", description: err.message });
    } finally {
      setEditSaving(false);
    }
  };

  // Derived: subcategories for selected parent
  const parentCategories = categories ?? [];
  const selectedParent = parentCategories.find((c: any) => c.id === newProduct.parentCategoryId);
  const subcategories: any[] = selectedParent?.children ?? [];

  // Reset subcategory when parent changes
  useEffect(() => {
    setNewProduct(p => ({ ...p, categoryId: "" }));
  }, [newProduct.parentCategoryId]);

  // Sync shop data into shopForm when loaded
  useEffect(() => {
    if (shop) {
      const s = shop as any;
      setShopForm({
        name: s.name ?? "",
        description: s.description ?? "",
        phone: s.phone ?? "",
        whatsapp: s.whatsapp ?? "",
        email: s.email ?? "",
        website: s.website ?? "",
        address: s.address ?? "",
        city: s.city ?? "",
        country: s.country ?? "",
        businessHours: s.businessHours ?? "",
        accentColor: s.accentColor ?? "#1d4ed8",
        facebookUrl: s.facebookUrl ?? "",
        instagramUrl: s.instagramUrl ?? "",
        tiktokUrl: s.tiktokUrl ?? "",
        twitterUrl: s.twitterUrl ?? "",
        youtubeUrl: s.youtubeUrl ?? "",
        logo: s.logo ?? "",
        banner: s.banner ?? "",
      });
    }
  }, [shop?.id]);

  const sf = (key: keyof typeof shopForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setShopForm(p => ({ ...p, [key]: e.target.value }));

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const token = localStorage.getItem("coastaq_token");
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url: string };
      setShopForm(p => ({ ...p, logo: data.url }));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleBannerUpload = async (file: File) => {
    setBannerUploading(true);
    try {
      const token = localStorage.getItem("coastaq_token");
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url: string };
      setShopForm(p => ({ ...p, banner: data.url }));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setBannerUploading(false);
    }
  };

  const handleShopUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateShopAsync({ data: shopForm as any });
      toast({ title: "Shop updated", description: "Your profile has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/shops/my"] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save failed", description: err?.message ?? "Unknown error" });
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct(
      {
        data: {
          title: newProduct.title,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          condition: newProduct.condition,
          description: newProduct.description,
          location: newProduct.location,
          images: newProduct.image ? [newProduct.image] : [],
          categoryId: newProduct.categoryId || newProduct.parentCategoryId || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Product added!", description: `"${newProduct.title}" is now live in your shop.` });
          setIsAddOpen(false);
          setNewProduct(EMPTY_PRODUCT);
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        },
        onError: (err: any) => {
          if (err?.status === 402) {
            toast({
              variant: "destructive",
              title: "Subscription required",
              description: "Your trial or subscription has expired. Go to the Subscription tab to renew.",
            });
            setIsAddOpen(false);
            setActiveTab("subscription");
          } else {
            toast({ variant: "destructive", title: "Failed to add product", description: err.message });
          }
        },
      },
    );
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteProduct(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Product deleted" });
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          },
        },
      );
    }
  };

  if (!user || user.role !== "SELLER") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold">Seller access required</p>
          <Link href="/">
            <Button className="mt-4" variant="outline"><Home className="w-4 h-4 mr-2" />Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const products = productsData?.products ?? [];
  const subExpired = sub && !sub.isActive;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {shop?.logo ? (
              <img src={shop.logo} alt={shop.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Store className="w-8 h-8" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-display font-bold">Seller Dashboard</h1>
              <p className="text-muted-foreground">{shop?.name ?? "Your Shop"}</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="rounded-xl h-10 gap-2">
              <Home className="w-4 h-4" /> Back to Marketplace
            </Button>
          </Link>
        </div>

        {/* Shop not approved warning */}
        {shop && !shop.isApproved && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Shop pending approval</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Your shop is under review. Products won't be visible until an admin approves it.
              </p>
            </div>
          </div>
        )}

        {/* Subscription expired banner */}
        {subExpired && (
          <SubscriptionExpiredBanner onSubscribe={() => setActiveTab("subscription")} />
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Products", value: products.length },
            { label: "Total Stock", value: products.reduce((a, p) => a + p.stock, 0) },
            {
              label: "Avg Price",
              value: products.length
                ? `$${(products.reduce((a, p) => a + p.price, 0) / products.length).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-border/50 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 mb-8">
          <TabsList className="bg-secondary/50 p-1 rounded-xl flex-nowrap w-max min-w-full">
            <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 whitespace-nowrap">
              <Package className="w-4 h-4 mr-1.5" /> Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 whitespace-nowrap">
              <ShoppingBag className="w-4 h-4 mr-1.5" /> Orders
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 whitespace-nowrap">
              <MessageCircle className="w-4 h-4 mr-1.5" /> Messages
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 whitespace-nowrap">
              <CreditCard className="w-4 h-4 mr-1.5" /> Subscription
            </TabsTrigger>
            <TabsTrigger value="earnings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 whitespace-nowrap">
              <Shield className="w-4 h-4 mr-1.5" /> Earnings
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 whitespace-nowrap">
              <Settings className="w-4 h-4 mr-1.5" /> Settings
            </TabsTrigger>
          </TabsList>
          </div>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Your Inventory</h2>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md"
                      disabled={shop ? !shop.isApproved : false}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Product
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[640px] rounded-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-display">Add New Product</DialogTitle>
                    </DialogHeader>

                    {/* Subscription warning inside dialog */}
                    {subExpired && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mt-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        Your subscription has expired. The product won't be saved until you renew.
                      </div>
                    )}

                    <form onSubmit={handleAddProduct} className="space-y-5 mt-4">
                      {/* Title */}
                      <div className="space-y-2">
                        <Label>Product Title <span className="text-destructive">*</span></Label>
                        <Input
                          required
                          placeholder="e.g. Samsung Galaxy S24 Ultra 256GB"
                          value={newProduct.title}
                          onChange={e => setNewProduct({ ...newProduct, title: e.target.value })}
                        />
                      </div>

                      {/* Category selectors */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={newProduct.parentCategoryId}
                            onChange={e => setNewProduct({ ...newProduct, parentCategoryId: e.target.value, categoryId: "" })}
                          >
                            <option value="">Select category...</option>
                            {parentCategories.map((cat: any) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Subcategory</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                            value={newProduct.categoryId}
                            onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                            disabled={subcategories.length === 0}
                          >
                            <option value="">
                              {subcategories.length === 0 ? "Select category first" : "Select subcategory..."}
                            </option>
                            {subcategories.map((sub: any) => (
                              <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Price, Stock, Condition */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Price ($) <span className="text-destructive">*</span></Label>
                          <Input
                            type="number" step="0.01" min="0" required
                            placeholder="0.00"
                            value={newProduct.price}
                            onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock <span className="text-destructive">*</span></Label>
                          <Input
                            type="number" min="0" required
                            placeholder="1"
                            value={newProduct.stock}
                            onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={newProduct.condition}
                            onChange={e => setNewProduct({ ...newProduct, condition: e.target.value as any })}
                          >
                            <option value="NEW">New</option>
                            <option value="USED">Used</option>
                            <option value="REFURBISHED">Refurbished</option>
                          </select>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          placeholder="e.g. Victoria Island, Lagos"
                          value={newProduct.location}
                          onChange={e => setNewProduct({ ...newProduct, location: e.target.value })}
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-2">
                        <Label>Product Image</Label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                            e.target.value = "";
                          }}
                        />
                        {newProduct.image ? (
                          <div className="relative rounded-xl overflow-hidden bg-secondary/30 h-44 group">
                            <img
                              src={newProduct.image}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white text-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow"
                              >
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewProduct(p => ({ ...p, image: "" }))}
                                className="bg-white text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg shadow"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imageUploading}
                            className="w-full h-36 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 bg-secondary/30"
                          >
                            {imageUploading ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-sm">Uploading…</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-7 h-7" />
                                <span className="text-sm font-medium">Click to upload photo</span>
                                <span className="text-xs">JPEG, PNG, WebP up to 10MB</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          rows={3}
                          placeholder="Describe your product in detail — specifications, condition, warranty, etc."
                          value={newProduct.description}
                          onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 h-12 rounded-xl"
                          onClick={() => { setIsAddOpen(false); setNewProduct(EMPTY_PRODUCT); }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1 h-12 rounded-xl" disabled={creatingProduct}>
                          {creatingProduct ? <Loader2 className="animate-spin w-5 h-5" /> : "Add Product"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Edit Product Dialog */}
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[640px] rounded-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-display">Edit Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveEdit} className="space-y-5 mt-4">
                    <div className="space-y-2">
                      <Label>Product Title <span className="text-destructive">*</span></Label>
                      <Input
                        required
                        value={editProduct.title}
                        onChange={e => setEditProduct({ ...editProduct, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Price ($) <span className="text-destructive">*</span></Label>
                        <Input
                          type="number" step="0.01" min="0" required
                          value={editProduct.price}
                          onChange={e => setEditProduct({ ...editProduct, price: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock <span className="text-destructive">*</span></Label>
                        <Input
                          type="number" min="0" required
                          value={editProduct.stock}
                          onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Condition</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={editProduct.condition}
                          onChange={e => setEditProduct({ ...editProduct, condition: e.target.value as any })}
                        >
                          <option value="NEW">New</option>
                          <option value="USED">Used</option>
                          <option value="REFURBISHED">Refurbished</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        placeholder="e.g. Victoria Island, Lagos"
                        value={editProduct.location}
                        onChange={e => setEditProduct({ ...editProduct, location: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Product Image</Label>
                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleEditImageUpload(file);
                          e.target.value = "";
                        }}
                      />
                      {editProduct.image ? (
                        <div className="relative rounded-xl overflow-hidden bg-secondary/30 h-44 group">
                          <img src={editProduct.image} alt="Preview" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => editFileInputRef.current?.click()}
                              className="bg-white text-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditProduct(p => ({ ...p, image: "" }))}
                              className="bg-white text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg shadow"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={editImageUploading}
                          className="w-full h-36 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 bg-secondary/30"
                        >
                          {editImageUploading ? (
                            <><Loader2 className="w-6 h-6 animate-spin" /><span className="text-sm">Uploading…</span></>
                          ) : (
                            <><ImageIcon className="w-7 h-7" /><span className="text-sm font-medium">Click to upload photo</span></>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        rows={3}
                        value={editProduct.description}
                        onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 h-12 rounded-xl"
                        onClick={() => setEditOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1 h-12 rounded-xl" disabled={editSaving}>
                        {editSaving ? <Loader2 className="animate-spin w-5 h-5" /> : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Product table */}
              {products.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="font-semibold text-foreground mb-1">No products yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Add Product" to start listing items in your shop.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl w-12" />
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Condition</th>
                        <th className="px-4 py-3 rounded-r-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate" title={p.title}>
                            {p.title}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {(p as any).category?.name ?? <span className="italic">Uncategorized</span>}
                          </td>
                          <td className="px-4 py-3 text-primary font-bold">${p.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3">{p.stock}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              p.condition === "NEW" ? "bg-green-100 text-green-700"
                              : p.condition === "USED" ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                            }`}>
                              {p.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-primary hover:bg-primary hover:text-white"
                                onClick={() => openEdit(p)}
                                title="Edit product"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                                onClick={() => handleDelete(p.id, p.title)}
                                title="Delete product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <SellerOrders />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <SellerInbox />
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <SubscriptionPanel />
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <SellerEarnings />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <form onSubmit={handleShopUpdate} className="space-y-6 max-w-3xl">

              {/* Banner & Logo */}
              <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
                {/* Banner preview */}
                <div className="relative h-32 bg-secondary overflow-hidden">
                  {shopForm.banner ? (
                    <img src={shopForm.banner} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="bg-white/90 text-foreground text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white transition-colors"
                    >
                      {bannerUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {bannerUploading ? "Uploading…" : "Change Banner"}
                    </button>
                  </div>
                  {shopForm.banner && (
                    <button
                      type="button"
                      onClick={() => setShopForm(p => ({ ...p, banner: "" }))}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); e.target.value = ""; }} />
                </div>

                <div className="px-8 pb-8 pt-4 space-y-6">
                  {/* Logo row */}
                  <div className="flex items-end gap-4 -mt-10">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-background shadow-lg bg-secondary shrink-0">
                      {shopForm.logo ? (
                        <img src={shopForm.logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: shopForm.accentColor }}>
                          <Store className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {logoUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                      </button>
                      <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
                    </div>
                    <div className="flex-1 pb-1 space-y-1">
                      <p className="text-sm font-semibold text-foreground">{shopForm.name || "Your Shop"}</p>
                      {(shop as any)?.slug && (
                        <a
                          href={`/shop/${(shop as any).slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Public Storefront
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3 pb-1">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground font-medium">Accent</label>
                        <input
                          type="color"
                          value={shopForm.accentColor}
                          onChange={sf("accentColor")}
                          className="w-8 h-8 rounded-lg border border-border cursor-pointer p-0.5"
                          title="Accent color"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Basic info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-sm font-semibold">Shop Name <span className="text-red-500">*</span></Label>
                      <Input value={shopForm.name} onChange={sf("name")} required className="h-11 rounded-xl" placeholder="My Awesome Shop" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-sm font-semibold">Description</Label>
                      <Textarea value={shopForm.description} onChange={sf("description")} rows={4} className="rounded-xl resize-none" placeholder="Tell customers what your shop is about…" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
                <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm">Email</Label>
                    <Input type="email" value={shopForm.email} onChange={sf("email")} className="h-11 rounded-xl" placeholder="shop@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Website</Label>
                    <Input type="url" value={shopForm.website} onChange={sf("website")} className="h-11 rounded-xl" placeholder="https://yoursite.com" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Phone</Label>
                    <Input type="tel" value={shopForm.phone} onChange={sf("phone")} className="h-11 rounded-xl" placeholder="+1 555 000 0000" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">WhatsApp Number</Label>
                    <Input type="tel" value={shopForm.whatsapp} onChange={sf("whatsapp")} className="h-11 rounded-xl" placeholder="+1 555 000 0000" />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
                <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm">Street Address</Label>
                    <Input value={shopForm.address} onChange={sf("address")} className="h-11 rounded-xl" placeholder="123 Market Street" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">City</Label>
                    <Input value={shopForm.city} onChange={sf("city")} className="h-11 rounded-xl" placeholder="Miami" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Country</Label>
                    <Input value={shopForm.country} onChange={sf("country")} className="h-11 rounded-xl" placeholder="United States" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm">Business Hours</Label>
                    <Textarea value={shopForm.businessHours} onChange={sf("businessHours")} rows={3} className="rounded-xl resize-none text-sm" placeholder={"Mon–Fri: 9am – 6pm\nSat: 10am – 4pm\nSun: Closed"} />
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
                <h3 className="text-base font-bold text-foreground mb-5 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Social Links
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    { key: "facebookUrl" as const, label: "Facebook", icon: <Facebook className="w-4 h-4 text-[#1877f2]" />, placeholder: "https://facebook.com/yourpage" },
                    { key: "instagramUrl" as const, label: "Instagram", icon: <Instagram className="w-4 h-4 text-[#e1306c]" />, placeholder: "https://instagram.com/yourhandle" },
                    { key: "tiktokUrl" as const, label: "TikTok", icon: <span className="w-4 h-4 text-xs font-black">TT</span>, placeholder: "https://tiktok.com/@yourhandle" },
                    { key: "twitterUrl" as const, label: "X / Twitter", icon: <Twitter className="w-4 h-4" />, placeholder: "https://x.com/yourhandle" },
                    { key: "youtubeUrl" as const, label: "YouTube", icon: <Youtube className="w-4 h-4 text-[#ff0000]" />, placeholder: "https://youtube.com/@yourchannel" },
                  ].map(({ key, label, icon, placeholder }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">{icon} {label}</Label>
                      <Input type="url" value={shopForm[key]} onChange={sf(key)} className="h-11 rounded-xl text-sm" placeholder={placeholder} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Save */}
              <div className="flex gap-3">
                <Button type="submit" disabled={updatingShop} className="h-12 rounded-xl px-8 gap-2">
                  {updatingShop ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  {updatingShop ? "Saving…" : "Save Changes"}
                </Button>
                <Link href="/">
                  <Button type="button" variant="outline" className="h-12 rounded-xl px-8 gap-2">
                    <Home className="w-4 h-4" /> Back to Marketplace
                  </Button>
                </Link>
              </div>

              {/* Danger Zone */}
              <div className="bg-card border border-red-200 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Permanently delete your account, shop, all listings, orders, and messages. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  className="gap-2 rounded-xl"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete My Account
                </Button>
              </div>

            </form>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={() => { window.location.href = "/"; }}
        userName={user?.name}
      />
    </div>
  );
}
