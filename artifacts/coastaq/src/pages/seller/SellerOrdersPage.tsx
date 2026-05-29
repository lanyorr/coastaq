import { useState, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, CheckCircle2, XCircle, Truck, Clock as ClockIcon,
  Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:   { label: "Pending",   className: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Confirmed", className: "bg-blue-50 text-blue-700 border-blue-200" },
  SHIPPED:   { label: "Shipped",   className: "bg-purple-50 text-purple-700 border-purple-200" },
  DELIVERED: { label: "Delivered", className: "bg-green-50 text-green-700 border-green-200" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
};

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { num: string; courier: string }>>({});
  const [showTrackingForm, setShowTrackingForm] = useState<string | null>(null);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    fetch("/api/orders/seller").then(r => r.json()).then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const r = await fetch(`/api/orders/${orderId}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!r.ok) throw new Error((await r.json()).error ?? "Failed");
      toast({ title: "Status updated" });
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUpdatingId(null);
  };

  const submitTracking = async (orderId: string) => {
    const t = trackingInputs[orderId];
    if (!t?.num) return;
    setUpdatingId(orderId);
    try {
      const r = await fetch(`/api/orders/${orderId}/tracking`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackingNumber: t.num, courierName: t.courier }) });
      if (!r.ok) throw new Error((await r.json()).error ?? "Failed");
      toast({ title: "Tracking saved" });
      setShowTrackingForm(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUpdatingId(null);
  };

  return (
    <SellerLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Orders</h1>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={load}>Refresh</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-card border rounded-2xl p-4 h-24 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="font-semibold">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">When customers place orders, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const item = order.items?.[0];
            const product = item?.product;
            const image = product?.images?.[0];
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
            const tracking = trackingInputs[order.id] ?? { num: order.trackingNumber ?? "", courier: order.courierName ?? "" };

            return (
              <div key={order.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                    {image ? <img src={image} alt={product?.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-muted-foreground/40" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product?.title ?? "Product"}</p>
                    <p className="text-xs text-muted-foreground">#{order.id.slice(-8)} · Qty: {item?.quantity ?? 1} · {new Date(order.createdAt).toLocaleDateString()}</p>
                    {order.buyerNote && <p className="text-xs italic text-muted-foreground mt-1">"{order.buyerNote}"</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs font-semibold border px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                      <span className="font-bold text-sm text-primary">${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {order.status === "PENDING" && (
                      <Button size="sm" className="rounded-xl h-8 text-xs bg-blue-600 hover:bg-blue-700" disabled={updatingId === order.id} onClick={() => updateStatus(order.id, "CONFIRMED")}>
                        {updatingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />} Confirm
                      </Button>
                    )}
                    {order.status === "CONFIRMED" && (
                      <Button size="sm" className="rounded-xl h-8 text-xs bg-purple-600 hover:bg-purple-700" disabled={updatingId === order.id} onClick={() => updateStatus(order.id, "SHIPPED")}>
                        {updatingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3 h-3 mr-1" />} Mark Shipped
                      </Button>
                    )}
                    {(order.status === "CONFIRMED" || order.status === "SHIPPED") && (
                      <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs" onClick={() => setShowTrackingForm(showTrackingForm === order.id ? null : order.id)}>
                        <Truck className="w-3 h-3 mr-1" /> Tracking {showTrackingForm === order.id ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                      </Button>
                    )}
                    {order.status === "PENDING" && (
                      <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs text-red-600 border-red-200 hover:bg-red-50" disabled={updatingId === order.id} onClick={() => updateStatus(order.id, "CANCELLED")}>
                        <XCircle className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {showTrackingForm === order.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/30 bg-secondary/20">
                    <div className="flex gap-2 pt-3">
                      <Input placeholder="Tracking number" value={tracking.num} onChange={e => setTrackingInputs(p => ({ ...p, [order.id]: { ...tracking, num: e.target.value } }))} className="flex-1 h-9 rounded-xl text-sm" />
                      <Input placeholder="Courier (optional)" value={tracking.courier} onChange={e => setTrackingInputs(p => ({ ...p, [order.id]: { ...tracking, courier: e.target.value } }))} className="flex-1 h-9 rounded-xl text-sm" />
                      <Button size="sm" className="rounded-xl h-9 text-xs" disabled={!tracking.num || updatingId === order.id} onClick={() => submitTracking(order.id)}>
                        {updatingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SellerLayout>
  );
}
