import { useState, useCallback } from "react";
import { useGetMe, useListOrders } from "@workspace/api-client-react";
import { AccountLayout } from "./AccountLayout";
import { useLocation } from "wouter";
import {
  ShoppingBag, Package, Shield, CheckCircle2,
  Truck, Clock, XCircle, ThumbsUp, Flag,
} from "lucide-react";
import { OrderTimeline } from "@/pages/Checkout";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  PENDING:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700", Icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700",     Icon: CheckCircle2 },
  SHIPPED:   { label: "Shipped",   color: "bg-purple-100 text-purple-700", Icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-700",   Icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700",       Icon: XCircle },
};

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AccountOrders() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe({ query: { retry: false } });
  const { data: ordersData, isLoading, refetch } = useListOrders({ query: { enabled: !!user } });
  const orders = (ordersData as any[]) ?? [];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [escrowLoadingId, setEscrowLoadingId] = useState<string | null>(null);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  const confirmReceipt = useCallback(async (orderId: string) => {
    setEscrowLoadingId(orderId);
    try {
      const r = await fetch(`/api/escrow/${orderId}/confirm-receipt`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      toast({ title: "Receipt Confirmed", description: "Funds released to the seller." });
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setEscrowLoadingId(null);
  }, [refetch, toast]);

  const submitDispute = useCallback(async () => {
    if (!disputeOrderId || disputeReason.trim().length < 10) return;
    setEscrowLoadingId(disputeOrderId);
    try {
      const r = await fetch(`/api/escrow/${disputeOrderId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: disputeReason }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      toast({ title: "Dispute Opened", description: "Our team will review within 48 hours." });
      setDisputeOrderId(null);
      setDisputeReason("");
      refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setEscrowLoadingId(null);
  }, [disputeOrderId, disputeReason, refetch, toast]);

  return (
    <AccountLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">My Orders</h1>
        <span className="text-sm text-muted-foreground">{orders.length} total</span>
      </div>

      {/* Escrow protection banner */}
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-6">
        <div className="bg-blue-600 text-white p-2 rounded-xl shrink-0"><Shield className="w-4 h-4" /></div>
        <div>
          <p className="text-sm font-semibold text-blue-900">Buyer Protection Active</p>
          <p className="text-xs text-blue-700/80">Payments are held securely in escrow until you confirm receipt or 7 days after delivery.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border rounded-2xl p-4 animate-pulse flex gap-3">
              <div className="w-14 h-14 rounded-xl bg-secondary shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-secondary rounded w-1/2" />
                <div className="h-3 bg-secondary rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold mb-1">No orders yet</h3>
          <p className="text-sm text-muted-foreground mb-5">When you place an order, it'll appear here.</p>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setLocation("/")}>Browse listings</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const item = order.items?.[0];
            const product = item?.product;
            const image = product?.images?.[0];
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
            const StatusIcon = cfg.Icon;
            const isEscrowed = order.paymentStatus === "escrowed";
            const isDisputed = order.paymentStatus === "disputed";
            const isReleased = order.paymentStatus === "released";
            const isRefunded = order.paymentStatus === "refunded";

            return (
              <div key={order.id} className={`bg-card rounded-2xl overflow-hidden shadow-sm border ${isEscrowed ? "border-blue-200" : isDisputed ? "border-red-200" : isReleased ? "border-green-200" : "border-border/50"}`}>
                {isEscrowed && <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-semibold"><Shield className="w-3.5 h-3.5" />Payment secured in escrow</div><span className="text-[11px] text-blue-200 font-mono">#{order.id.slice(-8)}</span></div>}
                {isDisputed && <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-semibold"><Flag className="w-3.5 h-3.5" />Dispute open · Admin reviewing</div><span className="text-[11px] text-red-200 font-mono">#{order.id.slice(-8)}</span></div>}
                {isReleased && <div className="bg-green-600 text-white px-4 py-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Funds released · Order complete</div><span className="text-[11px] text-green-200 font-mono">#{order.id.slice(-8)}</span></div>}
                {isRefunded && <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" />Order refunded</div><span className="text-[11px] text-orange-200 font-mono">#{order.id.slice(-8)}</span></div>}

                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                      {image ? <img src={image} alt={product?.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10"><Package className="w-6 h-6 text-primary" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{product?.title ?? "Product"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Qty: {item?.quantity ?? 1} · {timeAgo(order.createdAt)}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />{cfg.label}
                        </span>
                        {product && <button onClick={() => setLocation(`/products/${product.id}`)} className="text-xs text-primary hover:underline font-medium">View listing</button>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary text-sm">${Number(order.total).toFixed(2)}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>

                  <OrderTimeline status={order.status} paymentStatus={order.paymentStatus ?? "pending"} />

                  {order.trackingNumber && (
                    <div className="bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5 flex items-start gap-2">
                      <Truck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-purple-800">Tracking Info</p>
                        <p className="text-xs text-purple-700 mt-0.5">{order.courierName && <span className="font-medium">{order.courierName} · </span>}<span className="font-mono">{order.trackingNumber}</span></p>
                      </div>
                    </div>
                  )}

                  {isEscrowed && disputeOrderId !== order.id && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-3">
                      <p className="text-xs text-blue-800"><strong>Received your item?</strong> Confirm receipt to release payment, or open a dispute if there's an issue.</p>
                      <div className="flex gap-2">
                        <button onClick={() => confirmReceipt(order.id)} disabled={escrowLoadingId === order.id} className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50">
                          <ThumbsUp className="w-4 h-4" />{escrowLoadingId === order.id ? "Processing…" : "Confirm Receipt"}
                        </button>
                        <button onClick={() => { setDisputeOrderId(order.id); setDisputeReason(""); }} disabled={escrowLoadingId === order.id} className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50">
                          <Flag className="w-4 h-4" />Dispute
                        </button>
                      </div>
                    </div>
                  )}

                  {isEscrowed && disputeOrderId === order.id && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-3">
                      <p className="text-sm font-semibold text-red-800">Open a Dispute</p>
                      <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={3} placeholder="Describe what went wrong…" className="w-full text-sm border border-red-200 bg-white rounded-xl px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-red-300" />
                      <div className="flex gap-2">
                        <button onClick={() => { setDisputeOrderId(null); setDisputeReason(""); }} className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-secondary font-medium">Cancel</button>
                        <button onClick={submitDispute} disabled={disputeReason.trim().length < 10 || escrowLoadingId === order.id} className="flex-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                          {escrowLoadingId === order.id ? "Submitting…" : "Submit Dispute"}
                        </button>
                      </div>
                    </div>
                  )}

                  {isDisputed && <div className="bg-red-50 border border-red-100 rounded-xl p-3"><p className="text-sm font-semibold text-red-800 mb-1">Dispute Under Review</p><p className="text-xs text-red-700">Our team is reviewing your case. Funds are frozen until resolved.</p></div>}
                  {isReleased && <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /><div><p className="text-xs font-semibold text-green-800">Order Complete</p><p className="text-xs text-green-700">Payment released to seller{order.releasedAt ? ` · ${timeAgo(order.releasedAt)}` : ""}</p></div></div>}
                  {isRefunded && <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 flex items-center gap-2"><XCircle className="w-4 h-4 text-orange-600 shrink-0" /><div><p className="text-xs font-semibold text-orange-800">Refunded</p><p className="text-xs text-orange-700">Your payment has been refunded.</p></div></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}
