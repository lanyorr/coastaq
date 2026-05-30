import { useState, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  History, CheckCircle2, AlertTriangle, XCircle, Upload,
  ChevronRight, Loader2, Package,
} from "lucide-react";

const C = {
  bg: "#1a1040", bdr: "#281850", muted: "#7b80b5",
  blue: "#2563eb", green: "#10b981", yellow: "#eab308", red: "#ef4444",
  purple: "#8b5cf6",
};

const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  COMPLETED: { label: "Completed", color: C.green,  icon: CheckCircle2 },
  PARTIAL:   { label: "Partial",   color: C.yellow, icon: AlertTriangle },
  FAILED:    { label: "Failed",    color: C.red,    icon: XCircle },
};

const MODE_CFG: Record<string, { label: string; color: string }> = {
  CREATE: { label: "Create", color: C.blue   },
  UPDATE: { label: "Update", color: C.purple },
  UPSERT: { label: "Upsert", color: C.green  },
};

interface ImportRecord {
  id: string;
  fileName: string;
  status: string;
  mode: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errorSummary: string | null;
  createdAt: string;
}

interface ImportDetail extends ImportRecord {
  rows: Array<{
    id: string;
    rowIndex: number;
    status: string;
    productId: string | null;
    errorMessage: string | null;
    rowData: string;
  }>;
}

export default function ImportHistoryPage() {
  const [, setLocation] = useLocation();
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ImportDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch("/api/imports/history")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setImports(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function loadDetail(id: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/imports/${id}`);
      const data = await res.json();
      setSelected(data);
    } catch {}
    setLoadingDetail(false);
  }

  return (
    <SellerLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Import History</h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>All your past CSV imports</p>
        </div>
        <button onClick={() => setLocation("/seller/import")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: C.blue }}>
          <Upload style={{ width: 14, height: 14 }} />New Import
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blue }} />
        </div>
      ) : imports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}>
            <History style={{ width: 24, height: 24, color: C.blue }} />
          </div>
          <p className="text-white font-bold text-lg mb-2">No imports yet</p>
          <p className="text-sm mb-4" style={{ color: C.muted }}>Your CSV import history will appear here.</p>
          <button onClick={() => setLocation("/seller/import")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
            style={{ background: C.blue }}>
            <Upload style={{ width: 14, height: 14 }} />Start First Import
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Import list */}
          <div className="lg:col-span-1 space-y-2">
            {imports.map(imp => {
              const cfg = STATUS_CFG[imp.status] ?? STATUS_CFG.COMPLETED;
              const modeCfg = MODE_CFG[imp.mode] ?? { label: imp.mode, color: C.muted };
              const StatusIcon = cfg.icon;
              return (
                <button key={imp.id} onClick={() => loadDetail(imp.id)}
                  className="w-full rounded-2xl p-4 text-left transition-all hover:opacity-90"
                  style={{
                    background: selected?.id === imp.id ? "#211350" : C.bg,
                    border: `1px solid ${selected?.id === imp.id ? C.purple : C.bdr}`,
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-bold text-white truncate flex-1">{imp.fileName}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: `${cfg.color}15`, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: C.muted }}>
                    <span style={{ color: modeCfg.color, fontWeight: 700 }}>{modeCfg.label}</span>
                    <span>·</span>
                    <span style={{ color: C.green }}>{imp.importedRows} imported</span>
                    {imp.failedRows > 0 && <><span>·</span><span style={{ color: C.red }}>{imp.failedRows} failed</span></>}
                  </div>
                  <p className="text-[11px] mt-1.5" style={{ color: "#4b5090" }}>
                    {format(new Date(imp.createdAt), "MMM d, yyyy · HH:mm")}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2 rounded-2xl" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            {loadingDetail ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.blue }} />
              </div>
            ) : !selected ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <ChevronRight style={{ width: 28, height: 28, color: "#2a1a50" }} />
                <p className="text-sm mt-2" style={{ color: C.muted }}>Select an import to view details</p>
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="px-6 py-5" style={{ borderBottom: `1px solid ${C.bdr}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-bold text-base">{selected.fileName}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                        {format(new Date(selected.createdAt), "MMMM d, yyyy · HH:mm")} · Mode: <span className="font-bold" style={{ color: MODE_CFG[selected.mode]?.color ?? C.blue }}>{selected.mode}</span>
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{ background: `${STATUS_CFG[selected.status]?.color ?? C.muted}15`, color: STATUS_CFG[selected.status]?.color ?? C.muted }}>
                      {STATUS_CFG[selected.status]?.label ?? selected.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="rounded-xl p-3 text-center" style={{ background: "#120930" }}>
                      <p className="text-xl font-extrabold text-white">{selected.totalRows}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>Total</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ background: "#120930" }}>
                      <p className="text-xl font-extrabold" style={{ color: C.green }}>{selected.importedRows}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>Imported</p>
                    </div>
                    <div className="rounded-xl p-3 text-center" style={{ background: "#120930" }}>
                      <p className="text-xl font-extrabold" style={{ color: selected.failedRows > 0 ? C.red : C.muted }}>{selected.failedRows}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>Failed</p>
                    </div>
                  </div>
                </div>

                {/* Row list */}
                <div>
                  <div className="grid px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: C.muted, background: "#120930", gridTemplateColumns: "50px 1fr 80px" }}>
                    <span>Row</span><span>Product</span><span>Status</span>
                  </div>
                  {selected.rows.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm" style={{ color: C.muted }}>No row detail available.</p>
                  ) : selected.rows.map((row, idx) => {
                    let title = "—";
                    try { const d = JSON.parse(row.rowData); title = d["Product Name"] ?? d["title"] ?? d["name"] ?? Object.values(d)[0] ?? "—"; } catch {}
                    const isOk = row.status === "IMPORTED";
                    return (
                      <div key={row.id} className="grid px-6 py-3 items-center"
                        style={{ gridTemplateColumns: "50px 1fr 80px", borderTop: idx === 0 ? "none" : `1px solid ${C.bdr}` }}>
                        <span className="text-xs" style={{ color: C.muted }}>#{row.rowIndex}</span>
                        <div className="min-w-0 pr-3">
                          <p className="text-sm font-semibold text-white truncate">{title}</p>
                          {row.errorMessage && <p className="text-xs mt-0.5" style={{ color: C.red }}>{row.errorMessage}</p>}
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full text-center"
                          style={{ background: `${isOk ? C.green : C.red}15`, color: isOk ? C.green : C.red }}>
                          {row.status}
                        </span>
                      </div>
                    );
                  })}
                  {selected.rows.length === 200 && (
                    <p className="px-6 py-3 text-xs" style={{ color: C.muted }}>Showing first 200 rows.</p>
                  )}
                </div>

                <div className="px-6 py-4 flex gap-3" style={{ borderTop: `1px solid ${C.bdr}` }}>
                  <button onClick={() => setLocation("/seller/products")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: "rgba(37,99,235,0.12)", color: "#93c5fd" }}>
                    <Package style={{ width: 13, height: 13 }} />View Products
                  </button>
                  <button onClick={() => setLocation("/seller/import")}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                    style={{ background: "rgba(16,185,129,0.12)", color: C.green }}>
                    <Upload style={{ width: 13, height: 13 }} />New Import
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SellerLayout>
  );
}
