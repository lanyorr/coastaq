import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { format } from "date-fns";
import {
  AlertTriangle, Shield, TrendingDown, Loader2, ExternalLink,
  User, RefreshCw, CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SEVERITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  high:   { label: "High",   color: "#dc2626", bg: "bg-red-100 text-red-700"    },
  medium: { label: "Medium", color: "#d97706", bg: "bg-amber-100 text-amber-700"},
  low:    { label: "Low",    color: "#2563eb", bg: "bg-blue-100 text-blue-700"  },
};

const FLAG_LABELS: Record<string, string> = {
  excessive_disputes: "Excessive Disputes",
  high_refund_rate:   "High Refund Rate",
  no_deliveries:      "No Successful Deliveries",
  new_high_volume:    "New Account High Volume",
  many_reports:       "Multiple Reports",
};

export default function AdminFraudPage() {
  const { toast } = useToast();
  const [alerts, setAlerts]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<"all" | "high" | "medium">("all");
  const [actionTarget, setActionTarget] = useState<{ shopId: string; shopName: string; action: string } | null>(null);
  const [reason, setReason]   = useState("");
  const [doing, setDoing]     = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [alertsData, logsData] = await Promise.all([
        fetch("/api/verification/admin/fraud-alerts").then(r => r.json()),
        fetch("/api/verification/admin/audit-logs?limit=15").then(r => r.json()),
      ]);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setAuditLogs(Array.isArray(logsData) ? logsData : []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const doAction = async () => {
    if (!actionTarget || !reason) return;
    setDoing(true);
    try {
      const r = await fetch(`/api/verification/admin/shops/${actionTarget.shopId}/action`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionTarget.action, reason }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: `${actionTarget.action} applied to ${actionTarget.shopName}` });
      setActionTarget(null); setReason(""); load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setDoing(false);
  };

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.flags.some((f: any) => f.severity === filter));

  const highCount   = alerts.filter(a => a.flags.some((f: any) => f.severity === "high")).length;
  const mediumCount = alerts.filter(a => a.flags.some((f: any) => f.severity === "medium")).length;

  return (
    <AdminLayout>
      {/* Action modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background rounded-2xl border max-w-md w-full mx-4 p-6">
            <p className="font-bold text-lg mb-1 capitalize">{actionTarget.action} — {actionTarget.shopName}</p>
            <p className="text-muted-foreground text-sm mb-4">This action will be recorded in the audit log.</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Reason (required)" className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={doAction} disabled={doing || !reason}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 ${actionTarget.action === "suspend" ? "bg-red-600" : actionTarget.action === "warning" ? "bg-amber-500" : "bg-green-600"}`}>
                {doing ? "Applying…" : `Confirm ${actionTarget.action}`}
              </button>
              <button onClick={() => { setActionTarget(null); setReason(""); }}
                className="px-4 py-2.5 rounded-xl border text-sm font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Fraud Monitoring</h1>
          <p className="text-muted-foreground text-sm mt-1">Automated fraud detection alerts — all actions require manual review</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold hover:bg-secondary">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border p-4 text-center" style={{ borderTop: "3px solid #ef4444" }}>
          <p className="text-2xl font-extrabold text-red-600">{highCount}</p>
          <p className="text-xs text-muted-foreground mt-1">High Severity</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderTop: "3px solid #d97706" }}>
          <p className="text-2xl font-extrabold text-amber-600">{mediumCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Medium Severity</p>
        </div>
        <div className="rounded-xl border p-4 text-center" style={{ borderTop: "3px solid #6b7280" }}>
          <p className="text-2xl font-extrabold">{alerts.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Flagged</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 mb-6">
        <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          <strong>Manual review required.</strong> These are automated alerts. Do not suspend sellers based solely on flags — investigate before taking action.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {([["all", "All Alerts"], ["high", "High Severity"], ["medium", "Medium Severity"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filter === key ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="font-semibold">No fraud alerts</p>
          <p className="text-muted-foreground text-sm mt-1">No sellers currently match fraud detection rules</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(item => {
            const hasHigh = item.flags.some((f: any) => f.severity === "high");
            return (
              <div key={item.shop.id} className={`rounded-2xl border overflow-hidden ${hasHigh ? "border-red-200" : "border-amber-200"}`}>
                <div className={`px-5 py-3 flex items-center justify-between ${hasHigh ? "bg-red-50" : "bg-amber-50"}`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-5 h-5 ${hasHigh ? "text-red-500" : "text-amber-500"}`} />
                    <div>
                      <p className="font-bold text-sm">{item.shop.name}</p>
                      <p className="text-xs text-muted-foreground">Trust Score: {item.trustScore} / 100</p>
                    </div>
                    {item.shop.isSuspended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Suspended</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActionTarget({ shopId: item.shop.id, shopName: item.shop.name, action: "warning" })}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-200 text-amber-700 bg-amber-50 hover:opacity-80">
                      Issue Warning
                    </button>
                    {!item.shop.isSuspended ? (
                      <button onClick={() => setActionTarget({ shopId: item.shop.id, shopName: item.shop.name, action: "suspend" })}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-red-200 text-red-700 bg-red-50 hover:opacity-80">
                        Suspend
                      </button>
                    ) : (
                      <button onClick={() => setActionTarget({ shopId: item.shop.id, shopName: item.shop.name, action: "restore" })}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold border border-green-200 text-green-700 bg-green-50 hover:opacity-80">
                        Restore
                      </button>
                    )}
                  </div>
                </div>

                <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Flags */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Active Flags</p>
                    <div className="space-y-2">
                      {item.flags.map((flag: any, idx: number) => {
                        const sev = SEVERITY_CFG[flag.severity] ?? SEVERITY_CFG.low;
                        return (
                          <div key={idx} className="flex items-start gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${sev.bg}`}>{sev.label}</span>
                            <div>
                              <p className="text-sm font-semibold">{FLAG_LABELS[flag.type] ?? flag.type}</p>
                              <p className="text-xs text-muted-foreground">{flag.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Metrics</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Total Orders",   value: item.metrics?.totalOrders ?? 0 },
                        { label: "Dispute Rate",   value: `${item.metrics?.disputeRate ?? 0}%` },
                        { label: "Refund Rate",    value: `${item.metrics?.refundRate ?? 0}%` },
                        { label: "Delivery Rate",  value: `${item.metrics?.deliveryRate ?? 0}%` },
                        { label: "Account Age",    value: `${item.metrics?.accountDays ?? 0}d` },
                        { label: "Completion",     value: `${item.metrics?.completionRate ?? 0}%` },
                      ].map(m => (
                        <div key={m.label} className="rounded-lg border p-2">
                          <p className="text-[10px] text-muted-foreground">{m.label}</p>
                          <p className="text-sm font-bold">{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Audit log */}
      <div className="mt-8 rounded-2xl border overflow-hidden">
        <div className="px-5 py-3 border-b font-bold text-sm">Recent Audit Log</div>
        {auditLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No audit events yet</p>
        ) : (
          <div>
            {auditLogs.map((log, idx) => (
              <div key={log.id} className="px-5 py-3 text-sm flex items-start gap-3" style={{ borderTop: idx === 0 ? "none" : "1px solid hsl(var(--border))" }}>
                <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium capitalize">{log.action.replace(/_/g, " ")}</p>
                  {log.details && (() => { try { const d = JSON.parse(log.details); return d.reason ? <p className="text-xs text-muted-foreground mt-0.5">{d.reason}</p> : null; } catch { return null; } })()}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">{format(new Date(log.createdAt), "MMM d · HH:mm")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
