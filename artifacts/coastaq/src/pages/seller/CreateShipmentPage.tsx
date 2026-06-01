import { useState, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Truck, ChevronLeft, Loader2, Package, Zap } from "lucide-react";
import { format } from "date-fns";

const C = {
  bg: "#1a1040", bdr: "#281850", muted: "#7b80b5",
  blue: "#2563eb", green: "#10b981", purple: "#8b5cf6", yellow: "#eab308",
};

export default function CreateShipmentPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [orders, setOrders]       = useState<any[]>([]);
  const [couriers, setCouriers]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eta, setEta]             = useState<any>(null);
  const [form, setForm] = useState({
    orderId: "", carrier: "", trackingNumber: "", trackingUrl: "",
    estimatedDelivery: "", weight: "", dimensions: "",
    method: "standard", shippingCost: "0", notes: "",
    originAddress: "", courierId: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/orders/seller").then(r => r.json()),
      fetch("/api/shipping/couriers").then(r => r.json()),
    ]).then(([ordersData, couriersData]) => {
      // Only show CONFIRMED orders without a shipment (or PENDING)
      const eligible = (Array.isArray(ordersData) ? ordersData : []).filter(
        (o: any) => o.status === "CONFIRMED" || o.status === "PENDING"
      );
      setOrders(eligible);
      setCouriers(Array.isArray(couriersData) ? couriersData : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const selectedOrder = orders.find(o => o.id === form.orderId);

  useEffect(() => {
    if (!selectedOrder) return;
    const destCountry = selectedOrder.shippingCountry || "NG";
    fetch(`/api/shipping/eta?origin=NG&dest=${destCountry}&method=${form.method}`)
      .then(r => r.json()).then(setEta).catch(() => {});
  }, [form.orderId, form.method]);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const onCourierChange = (courierId: string) => {
    const c = couriers.find(c => c.id === courierId);
    set("courierId", courierId);
    if (c) set("carrier", c.name);
  };

  const submit = async () => {
    if (!form.orderId || !form.carrier || !form.trackingNumber) {
      toast({ title: "Order, carrier and tracking number are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/shipping/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          destinationAddress: selectedOrder
            ? [selectedOrder.shippingAddress, selectedOrder.shippingCity, selectedOrder.shippingCountry].filter(Boolean).join(", ")
            : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create shipment");
      toast({ title: "Shipment created!", description: "Order status updated to SHIPPED." });
      setLocation(`/seller/shipping/${data.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) return (
    <SellerLayout>
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blue }} /></div>
    </SellerLayout>
  );

  return (
    <SellerLayout>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setLocation("/seller/shipping")}
          className="flex items-center gap-1.5 text-sm font-bold hover:opacity-80 transition-all"
          style={{ color: C.muted }}>
          <ChevronLeft style={{ width: 14, height: 14 }} />Shipping
        </button>
        <span style={{ color: C.bdr }}>/</span>
        <p className="text-white font-bold">Create Shipment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-4xl">
        <div className="lg:col-span-2 space-y-4">
          {/* Order selection */}
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <p className="text-white font-bold mb-3">Select Order</p>
            {orders.length === 0 ? (
              <div className="text-center py-6">
                <Package style={{ width: 28, height: 28, color: "#2a1a50", margin: "0 auto 8px" }} />
                <p className="text-sm" style={{ color: C.muted }}>No eligible orders. Orders must be CONFIRMED before shipping.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {orders.map(o => (
                  <label key={o.id} className="flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all"
                    style={{ background: form.orderId === o.id ? "rgba(37,99,235,0.12)" : "#120930", border: `1px solid ${form.orderId === o.id ? C.blue : C.bdr}` }}>
                    <input type="radio" name="orderId" value={o.id} checked={form.orderId === o.id}
                      onChange={() => set("orderId", o.id)} className="mt-0.5 accent-blue-600" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-white">#{o.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs font-bold" style={{ color: C.green }}>${parseFloat(o.total || "0").toFixed(2)}</p>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                        {o.shippingName} — {[o.shippingCity, o.shippingCountry].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#4b5090" }}>
                        {o.items?.length} item(s) · {o.status} · {format(new Date(o.createdAt), "MMM d")}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Carrier info */}
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <p className="text-white font-bold mb-3">Carrier & Tracking</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Select Courier</label>
                <select value={form.courierId} onChange={e => onCourierChange(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }}>
                  <option value="">— Choose courier or type manually —</option>
                  {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Carrier Name *</label>
                  <input value={form.carrier} onChange={e => set("carrier", e.target.value)} placeholder="e.g. DHL"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                    style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Tracking Number *</label>
                  <input value={form.trackingNumber} onChange={e => set("trackingNumber", e.target.value)} placeholder="e.g. 1234567890"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                    style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Tracking URL (optional)</label>
                <input value={form.trackingUrl} onChange={e => set("trackingUrl", e.target.value)} placeholder="https://..."
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
              </div>
            </div>
          </div>

          {/* Shipping details */}
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <p className="text-white font-bold mb-3">Shipment Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Method</label>
                <select value={form.method} onChange={e => set("method", e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }}>
                  <option value="economy">Economy</option>
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Shipping Cost ($)</label>
                <input value={form.shippingCost} onChange={e => set("shippingCost", e.target.value)} placeholder="0.00" type="number" min="0" step="0.01"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Weight (kg)</label>
                <input value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="e.g. 1.5"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Dimensions (cm)</label>
                <input value={form.dimensions} onChange={e => set("dimensions", e.target.value)} placeholder="e.g. 30×20×15"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Est. Delivery Date</label>
                <input value={form.estimatedDelivery} onChange={e => set("estimatedDelivery", e.target.value)} type="date"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}`, colorScheme: "dark" }} />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Origin Address</label>
                <input value={form.originAddress} onChange={e => set("originAddress", e.target.value)} placeholder="Sender address"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Notes (internal)</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Any internal notes about this shipment…"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
            </div>
          </div>

          <button onClick={submit} disabled={submitting || !form.orderId || !form.carrier || !form.trackingNumber}
            className="w-full h-12 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90 transition-all"
            style={{ background: C.green }}>
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Truck style={{ width: 18, height: 18 }} />Create Shipment &amp; Mark as Shipped</>}
          </button>
        </div>

        {/* ETA + recommendation sidebar */}
        <div className="space-y-3">
          {eta && (
            <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
              <p className="text-sm font-bold text-white mb-3">Estimated Delivery</p>
              <div className="rounded-xl p-4 text-center" style={{ background: "#120930" }}>
                <p className="text-3xl font-extrabold" style={{ color: C.purple }}>{eta.label}</p>
                <p className="text-xs mt-1" style={{ color: C.muted }}>Based on {form.method} shipping to {selectedOrder?.shippingCountry || "destination"}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap style={{ width: 13, height: 13, color: C.yellow }} />
              <p className="text-sm font-bold text-white">Tip</p>
            </div>
            <p className="text-xs" style={{ color: C.muted }}>
              Creating a shipment will automatically mark the order as <strong style={{ color: C.purple }}>SHIPPED</strong> and update the buyer's tracking info. The buyer will be able to see the tracking number.
            </p>
          </div>

          {couriers.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
              <p className="text-sm font-bold text-white mb-3">Available Couriers</p>
              {couriers.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2.5 text-xs"
                  style={{ borderBottom: `1px solid ${C.bdr}` }}>
                  <p className="font-semibold text-white">{c.name}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{ background: "rgba(139,92,246,0.12)", color: C.purple }}>{c.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
