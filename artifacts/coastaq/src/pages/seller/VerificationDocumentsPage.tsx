import { useState, useEffect, useRef } from "react";
import { SellerLayout } from "./SellerLayout";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Upload, X, CheckCircle2, Clock, AlertTriangle, XCircle,
  FileText, ChevronLeft, Loader2, Eye, Trash2, ShieldCheck,
} from "lucide-react";

const C = {
  bg: "#1a1040", bdr: "#281850", muted: "#7b80b5",
  blue: "#2563eb", green: "#10b981", purple: "#8b5cf6",
  yellow: "#eab308", red: "#ef4444", orange: "#f97316",
};

const IDENTITY_DOCS = [
  { value: "passport",        label: "Passport",          desc: "Photo page of international passport" },
  { value: "national_id",     label: "National ID Card",  desc: "Front and back of government-issued ID" },
  { value: "drivers_license", label: "Driver's License",  desc: "Valid driver's license" },
];

const BUSINESS_DOCS = [
  { value: "business_reg",    label: "Business Registration Certificate", desc: "Official company registration document" },
  { value: "tax_cert",        label: "Tax Certificate",                   desc: "Current tax clearance or TIN certificate" },
  { value: "vat_reg",         label: "VAT Registration",                  desc: "VAT registration certificate" },
  { value: "import_export",   label: "Import/Export License",             desc: "Valid import/export license" },
];

const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  not_submitted:  { label: "Not Submitted",   color: C.muted,  icon: Clock },
  pending_review: { label: "Pending Review",  color: C.yellow, icon: Clock },
  approved:       { label: "Approved",        color: C.green,  icon: CheckCircle2 },
  rejected:       { label: "Rejected",        color: C.red,    icon: XCircle },
  requires_update:{ label: "Requires Update", color: C.orange, icon: AlertTriangle },
};

export default function VerificationDocumentsPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [category, setCategory]   = useState<"identity" | "business">(
    location.includes("business") ? "business" : "identity"
  );
  const [docType, setDocType]     = useState("");
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/verification/status").then(res => res.json());
    setDocuments(Array.isArray(r.documents) ? r.documents : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5 MB", variant: "destructive" });
      return;
    }
    if (!docType) {
      toast({ title: "Select document type first", variant: "destructive" });
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const fileData = ev.target?.result as string;
      try {
        const res = await fetch("/api/verification/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docType, docCategory: category, fileName: file.name, fileSize: file.size, mimeType: file.type, fileData }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        toast({ title: "Document uploaded!", description: "Submit for review when ready." });
        setDocType(""); load();
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      }
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const deleteDoc = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/verification/documents/${id}`, { method: "DELETE" });
      toast({ title: "Document removed" });
      load();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
    setDeleting(null);
  };

  const viewDoc = async (docId: string, fileName: string) => {
    const url = `/api/verification/documents/${docId}/file`;
    setPreviewFile({ name: fileName, url });
  };

  const filteredDocs = documents.filter(d => d.docCategory === category);
  const docOptions = category === "identity" ? IDENTITY_DOCS : BUSINESS_DOCS;

  return (
    <SellerLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setLocation("/seller/verification")}
          className="flex items-center gap-1.5 text-sm font-bold hover:opacity-80" style={{ color: C.muted }}>
          <ChevronLeft style={{ width: 14, height: 14 }} />Verification
        </button>
        <span style={{ color: C.bdr }}>/</span>
        <div>
          <h1 className="text-xl font-extrabold text-white">Verification Documents</h1>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>Upload securely encrypted documents for verification</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4">
        {(["identity", "business"] as const).map(cat => (
          <button key={cat} onClick={() => { setCategory(cat); setDocType(""); }}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize"
            style={{
              background: category === cat ? C.blue : C.bg,
              border: `1px solid ${category === cat ? C.blue : C.bdr}`,
              color: category === cat ? "#fff" : C.muted,
            }}>
            {cat === "identity" ? "🪪 Identity" : "🏢 Business"}
            {cat === "business" && <span className="ml-1.5 text-[10px]" style={{ color: category === "business" ? "#bfdbfe" : "#4b5090" }}>Optional</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload panel */}
        <div className="rounded-2xl p-5 space-y-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <p className="text-white font-bold">Upload Document</p>

          <div>
            <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>
              {category === "identity" ? "Identity" : "Business"} Document Type *
            </label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
              style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }}>
              <option value="">— Select document type —</option>
              {docOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {docType && (
              <p className="text-[11px] mt-1" style={{ color: C.muted }}>
                {docOptions.find(o => o.value === docType)?.desc}
              </p>
            )}
          </div>

          <div>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => { if (!docType) { toast({ title: "Select document type first", variant: "destructive" }); return; } fileRef.current?.click(); }}
              disabled={uploading}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed transition-all hover:opacity-80 disabled:opacity-40"
              style={{ borderColor: C.bdr, background: "#120930" }}>
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blue }} />
              ) : (
                <>
                  <Upload style={{ width: 28, height: 28, color: C.blue }} />
                  <p className="text-sm font-bold text-white">Click to upload file</p>
                  <p className="text-xs" style={{ color: C.muted }}>JPEG, PNG, PDF · max 5 MB</p>
                </>
              )}
            </button>
          </div>

          {/* Security note */}
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.15)" }}>
            <ShieldCheck style={{ width: 14, height: 14, color: C.blue, marginTop: 1, flexShrink: 0 }} />
            <p className="text-[11px]" style={{ color: C.muted }}>
              Documents are encrypted and only accessible to you and authorised Coastaq admins. They will never be shared with third parties.
            </p>
          </div>
        </div>

        {/* Documents list */}
        <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <p className="text-white font-bold mb-4">
            {category === "identity" ? "Identity" : "Business"} Documents
            <span className="ml-2 text-sm font-normal" style={{ color: C.muted }}>({filteredDocs.length})</span>
          </p>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: C.blue }} /></div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-10">
              <FileText style={{ width: 28, height: 28, color: "#2a1a50", margin: "0 auto 8px" }} />
              <p className="text-sm" style={{ color: C.muted }}>No {category} documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map(doc => {
                const cfg = STATUS_CFG[doc.status] ?? STATUS_CFG.not_submitted;
                const Ico = cfg.icon;
                const canDelete = doc.status === "pending_review" || doc.status === "rejected" || doc.status === "requires_update";
                return (
                  <div key={doc.id} className="rounded-xl p-3" style={{ background: "#120930", border: `1px solid ${C.bdr}` }}>
                    <div className="flex items-start gap-2">
                      <Ico style={{ width: 14, height: 14, color: cfg.color, marginTop: 2, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{doc.fileName}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                          {docOptions.find(o => o.value === doc.docType)?.label ?? doc.docType} ·{" "}
                          {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                        </p>
                        {doc.rejectionReason && (
                          <p className="text-[11px] mt-1 font-medium" style={{ color: C.red }}>
                            ⚠️ {doc.rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: `${cfg.color}15` }}>{cfg.label}</span>
                        <button onClick={() => viewDoc(doc.id, doc.fileName)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-90"
                          style={{ background: "rgba(37,99,235,0.12)", color: C.blue }}>
                          <Eye style={{ width: 12, height: 12 }} />
                        </button>
                        {canDelete && (
                          <button onClick={() => deleteDoc(doc.id)} disabled={deleting === doc.id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-90"
                            style={{ background: "rgba(239,68,68,0.12)", color: C.red }}>
                            {deleting === doc.id ? <Loader2 style={{ width: 10, height: 10 }} className="animate-spin" /> : <Trash2 style={{ width: 12, height: 12 }} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Document preview modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="relative rounded-2xl overflow-hidden max-w-xl w-full mx-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${C.bdr}` }}>
              <p className="text-white font-bold truncate text-sm">{previewFile.name}</p>
              <button onClick={() => setPreviewFile(null)} className="hover:opacity-80"><X style={{ width: 18, height: 18, color: C.muted }} /></button>
            </div>
            <div className="p-4" style={{ maxHeight: "70vh", overflow: "auto" }}>
              {previewFile.name.toLowerCase().endsWith(".pdf") ? (
                <iframe src={previewFile.url} className="w-full" style={{ height: 500, border: "none" }} />
              ) : (
                <img src={previewFile.url} alt={previewFile.name} className="w-full rounded-xl object-contain max-h-96" />
              )}
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}
