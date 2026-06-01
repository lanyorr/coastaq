import { useState, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import {
  Truck, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft,
  Package, MapPin, Printer, Flag, Plus, Loader2, ExternalLink,
  Zap, RefreshCw, Circle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const C = {
  bg: "#1a1040", bdr: "#281850", muted: "#7b80b5",
  blue: "#2563eb", orange: "#f97316", green: "#10b981",
  purple: "#8b5cf6", yellow: "#eab308", red: "#ef4444",
};

const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  label_created:    { label: "Label Created",    color: C.muted,   icon: Circle },
  picked_up:        { label: "Picked Up",        color: C.blue,    icon: Package },
  in_transit:       { label: "In Transit",       color: C.purple,  icon: Truck },
  out_for_delivery: { label: "Out for Delivery", color: C.orange,  icon: Truck },
  delivered:        { label: "Delivered",        color: C.green,   icon: CheckCircle2 },
  failed:           { label: "Delivery Failed",  color: C.red,     icon: XCircle },
  returned:         { label: "Returned",         color: C.yellow,  icon: AlertTriangle },
};

const ALL_STATUSES = ["label_created","picked_up","in_transit","out_for_delivery","delivered","failed","returned"];

function printLabel(label: any) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Shipping Label — ${label.trackingNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
  .label { border: 3px solid #111; padding: 20px; max-width: 400px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 12px; }
  .carrier { font-size: 22px; font-weight: 900; }
  .method { font-size: 11px; text-transform: uppercase; border: 1px solid #111; padding: 2px 8px; border-radius: 4px; }
  .section { margin-bottom: 12px; }
  .label-sm { font-size: 10px; text-transform: uppercase; color: #666; margin-bottom: 2px; font-weight: bold; }
  .tracking { font-family: monospace; font-size: 18px; font-weight: 900; border: 2px solid #111; padding: 8px 12px; text-align: center; letter-spacing: 2px; margin: 12px 0; }
  .barcode { font-family: 'Libre Barcode 39', monospace; font-size: 36px; text-align: center; line-height: 1; margin: 4px 0; }
  .address-box { border: 1px solid #ccc; padding: 10px; border-radius: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .items { font-size: 11px; }
  .item-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px solid #eee; }
  .footer { font-size: 10px; color: #666; text-align: center; margin-top: 12px; border-top: 1px solid #ccc; padding-top: 8px; }
</style>
</head><body>
<div class="label">
  <div class="header">
    <span class="carrier">${label.carrier || "COURIER"}</span>
    <span class="method">${(label.method || "STANDARD").toUpperCase()}</span>
  </div>

  <div class="tracking">${label.trackingNumber}</div>
  <div class="barcode">*${label.trackingNumber}*</div>

  <div class="grid" style="margin-top:12px">
    <div>
      <p class="label-sm">From</p>
      <div class="address-box">
        <strong>${label.from?.name || "—"}</strong><br>
        ${label.from?.address || ""}${label.from?.address ? "<br>" : ""}
        ${label.from?.city || ""}${label.from?.country ? ", " + label.from.country : ""}<br>
        ${label.from?.phone || ""}${label.from?.email ? "<br>" + label.from.email : ""}
      </div>
    </div>
    <div>
      <p class="label-sm">To</p>
      <div class="address-box">
        <strong>${label.to?.name || "—"}</strong><br>
        ${label.to?.address || ""}${label.to?.address ? "<br>" : ""}
        ${label.to?.city || ""}${label.to?.state ? ", " + label.to.state : ""}${label.to?.zip ? " " + label.to.zip : ""}<br>
        ${label.to?.country || ""}
      </div>
    </div>
  </div>

  ${label.weight || label.dimensions ? `
  <div class="section" style="margin-top:10px">
    <div style="display:flex; gap:16px; font-size:12px">
      ${label.weight ? `<span><strong>Weight:</strong> ${label.weight}</span>` : ""}
      ${label.dimensions ? `<span><strong>Dims:</strong> ${label.dimensions}</span>` : ""}
    </div>
  </div>` : ""}

  ${label.items?.length ? `
  <div class="section">
    <p class="label-sm">Items</p>
    <div class="items">
      ${label.items.map((i: any) => `<div class="item-row"><span>${i.title}</span><span>x${i.qty}</span></div>`).join("")}
    </div>
  </div>` : ""}

  ${label.estimatedDelivery ? `<p style="font-size:11px; color:#444;"><strong>Est. Delivery:</strong> ${new Date(label.estimatedDelivery).toDateString()}</p>` : ""}

  <div class="footer">
    Order #${(label.orderId || "").slice(0, 8).toUpperCase()} · Generated ${new Date().toLocaleDateString()}
  </div>
</div>
<script>window.onload = () => { window.print(); }</script>
</body></html>`);
  win.document.close();
}

export default function ShipmentDetailPage() {
  const { id } = useParams() as { id: string };
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [shipment, setShipment] = useState<any>(null);
  const [label, setLabel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueType, setIssueType] = useState("failed_delivery");
  const [issueDesc, setIssueDesc] = useState("");
  const [recommendations, setRecommendations] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [shipRes, recRes] = await Promise.all([
        fetch(`/api/shipping/shipments/${id}`).then(r => r.json()),
        fetch("/api/shipping/recommend?weight=1&dest=NG").then(r => r.json()),
      ]);
      setShipment(shipRes);
      setRecommendations(recRes);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const loadLabel = async () => {
    const res = await fetch(`/api/shipping/shipments/${id}/label`);
    const data = await res.json();
    setLabel(data);
    printLabel(data);
  };

  const addEvent = async () => {
    if (!newStatus || !eventDesc) return;
    setUpdatingStatus(true);
    try {
      await fetch(`/api/shipping/shipments/${id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, description: eventDesc, location: eventLocation }),
      });
      toast({ title: "Tracking event added" });
      setShowEventForm(false); setNewStatus(""); setEventDesc(""); setEventLocation("");
      load();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setUpdatingStatus(false);
  };

  const reportIssue = async () => {
    if (!issueDesc) return;
    setUpdatingStatus(true);
    try {
      await fetch("/api/shipping/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentId: id, issueType, description: issueDesc }),
      });
      toast({ title: "Issue reported" });
      setShowIssueForm(false); setIssueDesc("");
      load();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setUpdatingStatus(false);
  };

  if (loading) return (
    <SellerLayout>
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blue }} /></div>
    </SellerLayout>
  );

  if (!shipment?.id) return (
    <SellerLayout>
      <div className="text-center py-20">
        <p className="text-white font-bold mb-2">Shipment not found</p>
        <button onClick={() => setLocation("/seller/shipping")} className="text-sm" style={{ color: C.blue }}>← Back to shipping</button>
      </div>
    </SellerLayout>
  );

  const statusCfg = STATUS_CFG[shipment.status] ?? STATUS_CFG.label_created;
  const StatusIcon = statusCfg.icon;

  return (
    <SellerLayout>
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setLocation("/seller/shipping")}
          className="flex items-center gap-1.5 text-sm font-bold hover:opacity-80 transition-all"
          style={{ color: C.muted }}>
          <ChevronLeft style={{ width: 14, height: 14 }} />Shipping
        </button>
        <span style={{ color: C.bdr }}>/</span>
        <p className="text-white font-bold">Shipment #{id.slice(0, 8).toUpperCase()}</p>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold ml-1" style={{ color: statusCfg.color, background: `${statusCfg.color}18` }}>
          {statusCfg.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Shipment info */}
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white font-bold text-base">{shipment.carrier}</p>
                <p className="text-xs mt-0.5 font-mono" style={{ color: C.muted }}>{shipment.trackingNumber}</p>
              </div>
              <div className="flex gap-2">
                {shipment.trackingUrl && (
                  <a href={shipment.trackingUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
                    style={{ background: "rgba(37,99,235,0.12)", color: C.blue, border: `1px solid rgba(37,99,235,0.2)` }}>
                    <ExternalLink style={{ width: 11, height: 11 }} />Track Live
                  </a>
                )}
                <button onClick={loadLabel}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
                  style={{ background: "rgba(139,92,246,0.12)", color: C.purple, border: `1px solid rgba(139,92,246,0.2)` }}>
                  <Printer style={{ width: 11, height: 11 }} />Print Label
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: "Method",     value: (shipment.method || "standard").toUpperCase() },
                { label: "Weight",     value: shipment.weight || "—" },
                { label: "Dimensions", value: shipment.dimensions || "—" },
                { label: "Cost",       value: shipment.shippingCost ? `$${parseFloat(shipment.shippingCost).toFixed(2)}` : "—" },
                { label: "Dispatched", value: shipment.dispatchedAt ? format(new Date(shipment.dispatchedAt), "MMM d, yyyy") : "—" },
                { label: "Est. Delivery", value: shipment.estimatedDelivery ? format(new Date(shipment.estimatedDelivery), "MMM d, yyyy") : "—" },
                { label: "Delivered",  value: shipment.deliveredAt ? format(new Date(shipment.deliveredAt), "MMM d, yyyy") : "—" },
                { label: "Created",    value: format(new Date(shipment.createdAt), "MMM d, yyyy") },
              ].map(f => (
                <div key={f.label} className="rounded-xl p-3" style={{ background: "#120930" }}>
                  <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: C.muted }}>{f.label}</p>
                  <p className="font-bold text-white">{f.value}</p>
                </div>
              ))}
            </div>

            {shipment.originAddress && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="rounded-xl p-3" style={{ background: "#120930" }}>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>From</p>
                  <p className="text-xs text-white">{shipment.originAddress}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "#120930" }}>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>To</p>
                  <p className="text-xs text-white">{shipment.destinationAddress}</p>
                </div>
              </div>
            )}
          </div>

          {/* Order + Buyer */}
          {shipment.order && (
            <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
              <p className="text-white font-bold mb-3">Order Details</p>
              <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                <div><p className="mb-0.5" style={{ color: C.muted }}>Buyer</p><p className="text-white font-semibold">{shipment.buyer?.name ?? "—"}</p></div>
                <div><p className="mb-0.5" style={{ color: C.muted }}>Order Total</p><p className="text-white font-semibold">${parseFloat(shipment.order.total || "0").toFixed(2)}</p></div>
                <div><p className="mb-0.5" style={{ color: C.muted }}>Ship To</p><p className="text-white font-semibold">{shipment.order.shippingName}</p></div>
                <div><p className="mb-0.5" style={{ color: C.muted }}>Location</p><p className="text-white font-semibold">{[shipment.order.shippingCity, shipment.order.shippingCountry].filter(Boolean).join(", ")}</p></div>
              </div>
              {shipment.items?.length > 0 && (
                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: C.muted }}>Items</p>
                  {shipment.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-2 text-xs" style={{ borderTop: i === 0 ? "none" : `1px solid ${C.bdr}` }}>
                      <p className="text-white font-semibold">{item.product?.title ?? item.title}</p>
                      <div className="flex gap-4 text-right" style={{ color: C.muted }}>
                        <span>x{item.qty}</span>
                        <span>${parseFloat(item.price || "0").toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tracking Timeline */}
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-bold">Tracking Timeline</p>
              <button onClick={() => setShowEventForm(v => !v)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90"
                style={{ background: "rgba(16,185,129,0.12)", color: C.green, border: `1px solid rgba(16,185,129,0.2)` }}>
                <Plus style={{ width: 11, height: 11 }} />Add Event
              </button>
            </div>

            {showEventForm && (
              <div className="rounded-xl p-4 mb-4 space-y-2" style={{ background: "#120930", border: `1px solid ${C.bdr}` }}>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }}>
                  <option value="">Select Status…</option>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s]?.label || s}</option>)}
                </select>
                <input placeholder="Description (e.g. Package scanned at Lagos hub)"
                  value={eventDesc} onChange={e => setEventDesc(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
                <input placeholder="Location (optional)"
                  value={eventLocation} onChange={e => setEventLocation(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
                <div className="flex gap-2">
                  <button onClick={addEvent} disabled={updatingStatus || !newStatus || !eventDesc}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                    style={{ background: C.green }}>
                    {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Event"}
                  </button>
                  <button onClick={() => setShowEventForm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90"
                    style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {(!shipment.events || shipment.events.length === 0) ? (
              <p className="text-sm text-center py-6" style={{ color: C.muted }}>No tracking events yet</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[13px] top-2 bottom-2 w-0.5" style={{ background: C.bdr }} />
                {[...shipment.events].reverse().map((ev: any, idx: number) => {
                  const cfg = STATUS_CFG[ev.status] ?? STATUS_CFG.label_created;
                  const Ico = cfg.icon;
                  return (
                    <div key={ev.id} className="flex gap-3 mb-4 relative">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10"
                        style={{ background: `${cfg.color}18`, border: `2px solid ${cfg.color}` }}>
                        <Ico style={{ width: 12, height: 12, color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</p>
                          <p className="text-[11px] shrink-0" style={{ color: C.muted }}>
                            {format(new Date(ev.createdAt), "MMM d · HH:mm")}
                          </p>
                        </div>
                        <p className="text-xs text-white mt-0.5">{ev.description}</p>
                        {ev.location && <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: C.muted }}><MapPin style={{ width: 9, height: 9 }} />{ev.location}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <p className="text-white font-bold mb-3">Actions</p>
            <div className="space-y-2">
              <button onClick={() => setShowEventForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left hover:opacity-90"
                style={{ background: "rgba(16,185,129,0.1)", color: C.green, border: `1px solid rgba(16,185,129,0.2)` }}>
                <Plus style={{ width: 13, height: 13 }} />Update Tracking
              </button>
              <button onClick={loadLabel}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left hover:opacity-90"
                style={{ background: "rgba(139,92,246,0.1)", color: C.purple, border: `1px solid rgba(139,92,246,0.2)` }}>
                <Printer style={{ width: 13, height: 13 }} />Print Label
              </button>
              <button onClick={() => setShowIssueForm(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left hover:opacity-90"
                style={{ background: "rgba(239,68,68,0.1)", color: C.red, border: `1px solid rgba(239,68,68,0.2)` }}>
                <Flag style={{ width: 13, height: 13 }} />Report Issue
              </button>
            </div>
          </div>

          {/* Issue form */}
          {showIssueForm && (
            <div className="rounded-2xl p-4 space-y-2" style={{ background: C.bg, border: `1px solid rgba(239,68,68,0.3)` }}>
              <p className="text-white font-bold text-sm mb-2">Report Delivery Issue</p>
              <select value={issueType} onChange={e => setIssueType(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }}>
                <option value="failed_delivery">Failed Delivery</option>
                <option value="returned">Returned to Sender</option>
                <option value="address_problem">Address Problem</option>
                <option value="damaged">Package Damaged</option>
                <option value="lost">Package Lost</option>
              </select>
              <textarea placeholder="Describe the issue…" rows={3} value={issueDesc} onChange={e => setIssueDesc(e.target.value)}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
              <button onClick={reportIssue} disabled={!issueDesc || updatingStatus}
                className="w-full py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                style={{ background: C.red }}>
                Submit Issue
              </button>
            </div>
          )}

          {/* Delivery issues */}
          {shipment.issues?.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid rgba(239,68,68,0.2)` }}>
              <p className="text-sm font-bold mb-3" style={{ color: C.red }}>Open Issues</p>
              {shipment.issues.map((issue: any) => (
                <div key={issue.id} className="rounded-xl p-3 mb-2" style={{ background: "#120930" }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold capitalize text-white">{issue.issueType.replace(/_/g, " ")}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize"
                      style={{ color: issue.status === "resolved" ? C.green : C.red, background: issue.status === "resolved" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)" }}>
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: C.muted }}>{issue.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* AI Recommendations */}
          {recommendations && (
            <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap style={{ width: 13, height: 13, color: C.yellow }} />
                <p className="text-sm font-bold text-white">Shipping Recommendations</p>
              </div>
              {Object.entries(recommendations).map(([type, rec]: any) => rec && (
                <div key={type} className="rounded-xl p-3 mb-2" style={{ background: "#120930" }}>
                  <p className="text-xs font-bold mb-0.5 capitalize" style={{ color: type === "cheapest" ? C.green : type === "fastest" ? C.blue : C.purple }}>
                    {type === "cheapest" ? "💰 Cheapest" : type === "fastest" ? "⚡ Fastest" : "⚖️ Balanced"}
                  </p>
                  <p className="text-sm font-bold text-white">{rec.courier?.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{rec.eta?.label} · {rec.estCost}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
