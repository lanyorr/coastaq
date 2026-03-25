import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string; reason: string; details?: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  targetType: string; targetId: string; adminNote?: string;
  createdAt: string; reporterName?: string; reporterEmail?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-green-100 text-green-700",
  DISMISSED: "bg-gray-100 text-gray-600",
};

export default function AdminReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<{ id: string; action: "RESOLVED" | "DISMISSED" } | null>(null);
  const [note, setNote] = useState("");

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ status, page: String(page), limit: "20" });
    const r = await fetch(`/api/admin/reports?${params}`);
    const d = await r.json();
    setReports(d.reports ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [status, page]);

  const resolve = async () => {
    if (!resolving) return;
    const r = await fetch(`/api/admin/reports/${resolving.id}/resolve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: resolving.action, adminNote: note }),
    });
    if (r.ok) {
      toast({ title: resolving.action === "RESOLVED" ? "Report resolved" : "Report dismissed" });
      setResolving(null);
      setNote("");
      load();
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-display font-bold">Reports <span className="text-muted-foreground text-base font-normal">({total})</span></h1>
        <select className="border border-input bg-background rounded-md px-3 text-sm h-10" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
          <option value="">All</option>
        </select>
      </div>

      {resolving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl mx-4">
            <h3 className="font-semibold mb-3">{resolving.action === "RESOLVED" ? "Resolve Report" : "Dismiss Report"}</h3>
            <Textarea placeholder="Optional note..." value={note} onChange={e => setNote(e.target.value)} className="mb-4" rows={3} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setResolving(null); setNote(""); }}>Cancel</Button>
              <Button onClick={resolve}>{resolving.action === "RESOLVED" ? "Resolve" : "Dismiss"}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Reporter</th>
                  <th className="px-5 py-3 text-left">Target</th>
                  <th className="px-5 py-3 text-left">Reason</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{r.reporterName}</p>
                      <p className="text-xs text-muted-foreground">{r.reporterEmail}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary">{r.targetType}</span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="font-medium">{r.reason}</p>
                      {r.details && <p className="text-xs text-muted-foreground line-clamp-2">{r.details}</p>}
                      {r.adminNote && <p className="text-xs text-blue-600 mt-1">Note: {r.adminNote}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", STATUS_COLORS[r.status])}>{r.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      {r.status === "PENDING" && (
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => { setResolving({ id: r.id, action: "RESOLVED" }); setNote(""); }}>
                            <CheckCircle className="w-4 h-4 mr-1" />Resolve
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700" onClick={() => { setResolving({ id: r.id, action: "DISMISSED" }); setNote(""); }}>
                            <XCircle className="w-4 h-4 mr-1" />Dismiss
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No reports found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
