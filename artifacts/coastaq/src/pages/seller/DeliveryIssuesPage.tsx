import { useState, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Flag, CheckCircle2, AlertTriangle, XCircle, ChevronLeft, Loader2, ExternalLink } from "lucide-react";

const C = {
  bg: "#1a1040", bdr: "#281850", muted: "#7b80b5",
  blue: "#2563eb", green: "#10b981", purple: "#8b5cf6", red: "#ef4444", yellow: "#eab308", orange: "#f97316",
};

const ISSUE_TYPES: Record<string, { label: string; color: string }> = {
  failed_delivery:  { label: "Failed Delivery",  color: C.red    },
  returned:         { label: "Returned",          color: C.yellow },
  address_problem:  { label: "Address Problem",   color: C.orange },
  damaged:          { label: "Damaged",           color: C.purple },
  lost:             { label: "Lost",              color: C.red    },
};

const STATUSES: Record<string, { label: string; color: string; icon: any }> = {
  open:      { label: "Open",      color: C.red,    icon: Flag },
  in_review: { label: "In Review", color: C.yellow, icon: AlertTriangle },
  resolved:  { label: "Resolved",  color: C.green,  icon: CheckCircle2 },
  escalated: { label: "Escalated", color: C.orange, icon: XCircle },
};

export default function DeliveryIssuesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [issues, setIssues]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [filter, setFilter]     = useState("ALL");
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/shipping/issues").then(r => r.json());
      setIssues(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateIssue = async (id: string, status: string, res?: string) => {
    setResolving(true);
    try {
      const r = await fetch(`/api/shipping/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution: res }),
      });
      const data = await r.json();
      toast({ title: `Issue marked as ${status}` });
      setSelected(null); setResolution(""); load();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setResolving(false);
  };

  const filtered = filter === "ALL" ? issues : issues.filter(i => i.status === filter);

  return (
    <SellerLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/seller/shipping")}
            className="flex items-center gap-1.5 text-sm font-bold hover:opacity-80" style={{ color: C.muted }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />Shipping
          </button>
          <span style={{ color: C.bdr }}>/</span>
          <div>
            <h1 className="text-xl font-extrabold text-white">Delivery Issues</h1>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>Track and resolve delivery exceptions</p>
          </div>
        </div>
        {issues.filter(i => i.status === "open").length > 0 && (
          <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: C.red }}>
            {issues.filter(i => i.status === "open").length} Open
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["ALL", "open", "in_review", "resolved", "escalated"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: filter === f ? C.red : C.bg, border: `1px solid ${filter === f ? C.red : C.bdr}`, color: filter === f ? "#fff" : C.muted }}>
            {f === "ALL" ? "All Issues" : STATUSES[f]?.label ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: C.blue }} /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <Flag style={{ width: 28, height: 28, color: "#2a1a50", margin: "0 auto 10px" }} />
          <p className="text-white font-bold mb-1">No Issues Found</p>
          <p className="text-sm" style={{ color: C.muted }}>Delivery issues reported from shipment pages will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Issue list */}
          <div className="lg:col-span-1 space-y-2">
            {filtered.map(issue => {
              const typeCfg = ISSUE_TYPES[issue.issueType] ?? { label: issue.issueType, color: C.muted };
              const statusCfg = STATUSES[issue.status] ?? { label: issue.status, color: C.muted, icon: Flag };
              const StatusIcon = statusCfg.icon;
              return (
                <button key={issue.id} onClick={() => setSelected(issue)}
                  className="w-full rounded-2xl p-4 text-left transition-all hover:opacity-90"
                  style={{ background: selected?.id === issue.id ? "#211350" : C.bg, border: `1px solid ${selected?.id === issue.id ? C.purple : C.bdr}` }}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold" style={{ color: typeCfg.color }}>{typeCfg.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: statusCfg.color, background: `${statusCfg.color}15` }}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-white truncate">{issue.description}</p>
                  <p className="text-[11px] mt-1" style={{ color: "#4b5090" }}>
                    {format(new Date(issue.createdAt), "MMM d, yyyy · HH:mm")}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2 rounded-2xl" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <Flag style={{ width: 28, height: 28, color: "#2a1a50", marginBottom: 8 }} />
                <p className="text-sm" style={{ color: C.muted }}>Select an issue to view details</p>
              </div>
            ) : (() => {
              const typeCfg = ISSUE_TYPES[selected.issueType] ?? { label: selected.issueType, color: C.muted };
              const statusCfg = STATUSES[selected.status] ?? { label: selected.status, color: C.muted, icon: Flag };
              return (
                <div>
                  <div className="px-6 py-5" style={{ borderBottom: `1px solid ${C.bdr}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold" style={{ color: typeCfg.color }}>{typeCfg.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: C.muted }}>{format(new Date(selected.createdAt), "MMMM d, yyyy · HH:mm")}</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ color: statusCfg.color, background: `${statusCfg.color}15` }}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>

                  <div className="px-6 py-4 space-y-4">
                    <div>
                      <p className="text-xs font-bold mb-1" style={{ color: C.muted }}>Description</p>
                      <p className="text-sm text-white">{selected.description}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold mb-1" style={{ color: C.muted }}>Shipment</p>
                      <button onClick={() => setLocation(`/seller/shipping/${selected.shipmentId}`)}
                        className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-all"
                        style={{ color: C.blue }}>
                        View Shipment <ExternalLink style={{ width: 12, height: 12 }} />
                      </button>
                    </div>

                    {selected.resolution && (
                      <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                        <p className="text-xs font-bold mb-1" style={{ color: C.green }}>Resolution</p>
                        <p className="text-sm text-white">{selected.resolution}</p>
                        {selected.resolvedAt && <p className="text-[11px] mt-1" style={{ color: C.muted }}>{format(new Date(selected.resolvedAt), "MMM d, yyyy")}</p>}
                      </div>
                    )}

                    {selected.status !== "resolved" && (
                      <div className="space-y-3 pt-2" style={{ borderTop: `1px solid ${C.bdr}` }}>
                        <p className="text-sm font-bold text-white">Update Issue</p>
                        <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3}
                          placeholder="Resolution notes (optional)…"
                          className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"
                          style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
                        <div className="flex gap-2">
                          {selected.status === "open" && (
                            <button onClick={() => updateIssue(selected.id, "in_review")} disabled={resolving}
                              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                              style={{ background: C.yellow }}>
                              Mark In Review
                            </button>
                          )}
                          <button onClick={() => updateIssue(selected.id, "resolved", resolution)} disabled={resolving}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                            style={{ background: C.green }}>
                            {resolving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Mark Resolved"}
                          </button>
                          <button onClick={() => updateIssue(selected.id, "escalated")} disabled={resolving}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                            style={{ background: C.orange }}>
                            Escalate
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </SellerLayout>
  );
}
