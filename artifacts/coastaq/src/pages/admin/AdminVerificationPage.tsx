import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { format } from "date-fns";
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ChevronDown, ChevronUp, Eye, FileText, User,
  Filter,
} from "lucide-react";
import { SellerBadge } from "@/components/SellerBadge";
import { useToast } from "@/hooks/use-toast";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  not_submitted:  { label: "Not Submitted",  color: "#6b7280", bg: "bg-gray-100 text-gray-600"   },
  pending_review: { label: "Pending Review", color: "#d97706", bg: "bg-amber-100 text-amber-700" },
  approved:       { label: "Approved",       color: "#059669", bg: "bg-green-100 text-green-700" },
  rejected:       { label: "Rejected",       color: "#dc2626", bg: "bg-red-100 text-red-700"     },
  requires_update:{ label: "Requires Update",color: "#ea580c", bg: "bg-orange-100 text-orange-700"},
};

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: "Passport", national_id: "National ID", drivers_license: "Driver's License",
  business_reg: "Business Registration", tax_cert: "Tax Certificate",
  vat_reg: "VAT Registration", import_export: "Import/Export License",
};

function DocViewModal({ docId, onClose }: { docId: string; onClose: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const [name, setName] = useState("");
  useEffect(() => {
    const url = `/api/verification/documents/${docId}/file`;
    setSrc(url);
  }, [docId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-background rounded-2xl border max-w-xl w-full mx-4 overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3 border-b">
          <p className="font-semibold">Document Preview</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>
        <div className="p-4">
          {src && <img src={src} alt="document" className="w-full max-h-96 object-contain rounded-xl" onError={e => { (e.target as any).style.display = "none"; }} />}
          <div className="mt-3 text-center">
            <a href={src ?? "#"} target="_blank" rel="noreferrer"
              className="text-sm text-primary font-semibold hover:underline">Open in new tab ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminVerificationPage() {
  const { toast } = useToast();
  const [queue, setQueue]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail]     = useState<Record<string, any>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [previewDocId, setPreviewDocId]   = useState<string | null>(null);
  const [actionForm, setActionForm] = useState<Record<string, { action: string; reason: string }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [shopAction, setShopAction] = useState<{ shopId: string; action: string; reason: string } | null>(null);
  const [doingShopAction, setDoingShopAction] = useState(false);

  const load = async () => {
    setLoading(true);
    const url = filter === "ALL" ? "/api/verification/admin/queue" : `/api/verification/admin/queue?status=${filter}`;
    const data = await fetch(url).then(r => r.json());
    setQueue(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const loadDetail = async (shopId: string) => {
    if (detail[shopId]) return;
    setLoadingDetail(shopId);
    const data = await fetch(`/api/verification/admin/queue/${shopId}`).then(r => r.json());
    setDetail(d => ({ ...d, [shopId]: data }));
    setLoadingDetail(null);
  };

  const toggle = (shopId: string) => {
    if (expanded === shopId) { setExpanded(null); return; }
    setExpanded(shopId);
    loadDetail(shopId);
  };

  const reviewDoc = async (docId: string, shopId: string, action: string, rejectionReason?: string) => {
    setSubmitting(docId);
    try {
      const r = await fetch(`/api/verification/admin/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: `Document ${action}d` });
      const updated = await fetch(`/api/verification/admin/queue/${shopId}`).then(r => r.json());
      setDetail(d => ({ ...d, [shopId]: updated }));
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSubmitting(null);
  };

  const doShopAction = async () => {
    if (!shopAction) return;
    setDoingShopAction(true);
    try {
      const r = await fetch(`/api/verification/admin/shops/${shopAction.shopId}/action`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: shopAction.action, reason: shopAction.reason }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: `Action: ${shopAction.action} applied` });
      setShopAction(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setDoingShopAction(false);
  };

  const FILTERS = ["ALL", "pending_review", "approved", "rejected", "not_submitted"];

  return (
    <AdminLayout>
      {previewDocId && <DocViewModal docId={previewDocId} onClose={() => setPreviewDocId(null)} />}

      {/* Shop action modal */}
      {shopAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-background rounded-2xl border max-w-md w-full mx-4 p-6">
            <p className="font-bold text-lg mb-1 capitalize">{shopAction.action} Seller</p>
            <p className="text-muted-foreground text-sm mb-4">This action will be logged in the audit trail.</p>
            <textarea value={shopAction.reason} onChange={e => setShopAction(s => s ? { ...s, reason: e.target.value } : null)}
              placeholder="Reason for this action (required)"
              className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none mb-4" rows={3} />
            <div className="flex gap-3">
              <button onClick={doShopAction} disabled={doingShopAction || !shopAction.reason}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:opacity-90">
                {doingShopAction ? "Applying…" : `Confirm ${shopAction.action}`}
              </button>
              <button onClick={() => setShopAction(null)} className="px-4 py-2.5 rounded-xl border text-sm font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Seller Verification Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and manage seller verification submissions</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold hover:bg-secondary">
          <Filter className="w-3.5 h-3.5" />Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border"}`}>
            {f === "ALL" ? "All" : STATUS_CFG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
      ) : queue.length === 0 ? (
        <div className="text-center py-16 border rounded-2xl">
          <ShieldCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold">No verifications found</p>
          <p className="text-muted-foreground text-sm mt-1">No sellers match the current filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queue.map(item => {
            const statusCfg = STATUS_CFG[item.overallStatus] ?? STATUS_CFG.not_submitted;
            const isExpanded = expanded === item.shopId;
            const shopDetail = detail[item.shopId];

            return (
              <div key={item.id} className="border rounded-2xl overflow-hidden">
                {/* Row header */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-secondary/30 transition-all" onClick={() => toggle(item.shopId)}>
                  <ShieldCheck className="w-8 h-8 text-primary/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold">{item.shop?.name ?? "—"}</p>
                      <SellerBadge level={item.badgeLevel ?? "basic"} size="sm" />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCfg.bg}`}>
                        {statusCfg.label}
                      </span>
                      {item.shop?.isSuspended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Suspended</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span><User className="w-3 h-3 inline mr-0.5" />{item.owner?.name ?? "—"} · {item.owner?.email ?? "—"}</span>
                      <span>{item.docCount} document{item.docCount !== 1 ? "s" : ""}</span>
                      {item.submittedAt && <span>Submitted {format(new Date(item.submittedAt), "MMM d, yyyy")}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t px-5 py-4 bg-secondary/10">
                    {loadingDetail === item.shopId ? (
                      <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                    ) : shopDetail ? (
                      <>
                        {/* Trust score summary */}
                        {shopDetail.trustScore && (
                          <div className="grid grid-cols-4 gap-3 mb-4">
                            {[
                              { label: "Trust Score", value: shopDetail.trustScore.totalScore },
                              { label: "Orders", value: shopDetail.trustScore.metrics?.totalOrders ?? 0 },
                              { label: "Delivery Rate", value: `${shopDetail.trustScore.metrics?.deliveryRate ?? 0}%` },
                              { label: "Dispute Rate", value: `${shopDetail.trustScore.metrics?.disputeRate ?? 0}%` },
                            ].map(m => (
                              <div key={m.label} className="rounded-xl border p-3 text-center">
                                <p className="text-xs text-muted-foreground">{m.label}</p>
                                <p className="text-lg font-bold">{m.value}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Admin actions */}
                        <div className="flex gap-2 flex-wrap mb-4">
                          {["warning", "suspend", "restore", "remove_verification"].map(act => (
                            <button key={act} onClick={() => setShopAction({ shopId: item.shopId, action: act, reason: "" })}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize hover:opacity-80 ${
                                act === "suspend" || act === "remove_verification" ? "border-red-200 text-red-600 bg-red-50" :
                                act === "restore" ? "border-green-200 text-green-600 bg-green-50" :
                                "border-amber-200 text-amber-600 bg-amber-50"
                              }`}>
                              {act.replace(/_/g, " ")}
                            </button>
                          ))}
                        </div>

                        {/* Documents */}
                        <p className="font-bold text-sm mb-3">Documents</p>
                        {shopDetail.documents?.length === 0 ? (
                          <p className="text-muted-foreground text-sm py-4 text-center">No documents submitted</p>
                        ) : (
                          <div className="space-y-3">
                            {shopDetail.documents?.map((doc: any) => {
                              const docStatus = STATUS_CFG[doc.status] ?? STATUS_CFG.not_submitted;
                              const af = actionForm[doc.id] ?? { action: "", reason: "" };
                              return (
                                <div key={doc.id} className="rounded-xl border p-4">
                                  <div className="flex items-start justify-between gap-3 mb-3">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                        <p className="font-semibold text-sm">{DOC_TYPE_LABELS[doc.docType] ?? doc.docType}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${docStatus.bg}`}>{docStatus.label}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.docCategory === "identity" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                          {doc.docCategory}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground">{doc.fileName} · {format(new Date(doc.uploadedAt), "MMM d, yyyy HH:mm")}</p>
                                      {doc.rejectionReason && <p className="text-xs text-red-600 mt-0.5">Reason: {doc.rejectionReason}</p>}
                                    </div>
                                    <button onClick={() => setPreviewDocId(doc.id)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-secondary shrink-0">
                                      <Eye className="w-3 h-3" />View
                                    </button>
                                  </div>

                                  {doc.status !== "approved" && (
                                    <div className="flex gap-2 flex-wrap items-start">
                                      <input placeholder="Rejection reason (if rejecting)"
                                        value={af.reason}
                                        onChange={e => setActionForm(prev => ({ ...prev, [doc.id]: { ...af, reason: e.target.value } }))}
                                        className="flex-1 min-w-32 rounded-lg border px-3 py-1.5 text-xs"
                                      />
                                      <button onClick={() => reviewDoc(doc.id, item.shopId, "approve")}
                                        disabled={submitting === doc.id}
                                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:opacity-90 disabled:opacity-40">
                                        {submitting === doc.id ? "…" : "✓ Approve"}
                                      </button>
                                      <button onClick={() => reviewDoc(doc.id, item.shopId, "reject", af.reason)}
                                        disabled={submitting === doc.id}
                                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:opacity-90 disabled:opacity-40">
                                        ✗ Reject
                                      </button>
                                      <button onClick={() => reviewDoc(doc.id, item.shopId, "requires_update", af.reason)}
                                        disabled={submitting === doc.id}
                                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:opacity-90 disabled:opacity-40">
                                        ↩ Update
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
