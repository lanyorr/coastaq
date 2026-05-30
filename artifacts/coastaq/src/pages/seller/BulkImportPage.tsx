import { useState, useCallback, useRef, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { useSubscriptionStatus } from "@/hooks/use-subscription";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileText, CheckCircle2, AlertTriangle, XCircle,
  ChevronRight, ChevronLeft, Download, Loader2, Star,
  RefreshCw, Package, History, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── colour tokens ──────────────────────────────────────────────────────── */
const C = {
  bg: "#1a1040", bdr: "#281850", muted: "#7b80b5",
  blue: "#2563eb", orange: "#f97316", green: "#10b981",
  purple: "#8b5cf6", yellow: "#eab308", red: "#ef4444",
};

/* ─── CSV parser (no external deps) ─────────────────────────────────────── */
function parseCSVText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let cur = ""; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]; const n = text[i + 1];
    if (c === '"') { if (inQ && n === '"') { cur += '"'; i++; } else inQ = !inQ; }
    else if ((c === '\n' || c === '\r') && !inQ) { if (c === '\r' && n === '\n') i++; lines.push(cur); cur = ""; }
    else cur += c;
  }
  if (cur) lines.push(cur);

  const parseRow = (line: string): string[] => {
    const f: string[] = []; let field = ""; let inQq = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i]; const n = line[i + 1];
      if (c === '"') { if (inQq && n === '"') { field += '"'; i++; } else inQq = !inQq; }
      else if (c === ',' && !inQq) { f.push(field.trim()); field = ""; }
      else field += c;
    }
    f.push(field.trim()); return f;
  };

  const nonEmpty = lines.filter(l => l.trim());
  if (!nonEmpty.length) return { headers: [], rows: [] };
  const headers = parseRow(nonEmpty[0]);
  const rows = nonEmpty.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseRow(line);
    return headers.reduce<Record<string, string>>((o, h, i) => { o[h] = vals[i] ?? ""; return o; }, {});
  });
  return { headers, rows };
}

/* ─── product fields available for mapping ──────────────────────────────── */
const PRODUCT_FIELDS = [
  { key: "_ignore",     label: "— Ignore —",                    required: false },
  { key: "title",       label: "Product Name ★",                required: true  },
  { key: "description", label: "Description",                    required: false },
  { key: "price",       label: "Price ★",                       required: true  },
  { key: "stock",       label: "Stock / Qty",                    required: false },
  { key: "condition",   label: "Condition (NEW/USED/REFURBISHED)",required: false },
  { key: "category",    label: "Category Name",                  required: false },
  { key: "location",    label: "Location",                       required: false },
  { key: "images",      label: "Image URLs (comma-separated)",   required: false },
];

/* ─── auto-detect mapping from headers ──────────────────────────────────── */
const DETECT_RULES: { patterns: string[]; field: string }[] = [
  { patterns: ["title","name","product name","product_name","item name","item_name","item"],          field: "title" },
  { patterns: ["description","desc","details","about","content","body"],                               field: "description" },
  { patterns: ["price","cost","amount","rate","unit price","unit_price","selling_price"],              field: "price" },
  { patterns: ["stock","qty","quantity","inventory","units","available","count"],                      field: "stock" },
  { patterns: ["condition","state","quality","grade"],                                                 field: "condition" },
  { patterns: ["category","cat","type","product type","product_type","department"],                    field: "category" },
  { patterns: ["location","city","origin","country","warehouse"],                                      field: "location" },
  { patterns: ["image","images","image url","image_url","photo","picture","img","thumbnail"],         field: "images" },
];

function autoDetect(headers: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of headers) {
    const lo = h.toLowerCase().trim();
    let matched = false;
    for (const rule of DETECT_RULES) {
      if (rule.patterns.some(p => lo === p || lo.includes(p))) {
        out[h] = rule.field; matched = true; break;
      }
    }
    if (!matched) out[h] = "_ignore";
  }
  return out;
}

/* ─── CSV template generator ────────────────────────────────────────────── */
function downloadCSV(filename: string, rows: string[][]) {
  const content = rows.map(r => r.map(v => v.includes(",") ? `"${v}"` : v).join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const TEMPLATES = [
  {
    name: "Basic Template", file: "basic_product_template.csv",
    rows: [
      ["Product Name","Description","Price","Stock","Condition","Category","Location","Image URL"],
      ["Example Widget","A great product","29.99","100","NEW","Electronics","Lagos","https://example.com/img.jpg"],
    ],
  },
  {
    name: "Fashion Template", file: "fashion_product_template.csv",
    rows: [
      ["Product Name","Description","Price","Stock","Condition","Category","Brand","Color","Size","Location","Image URL"],
      ["Summer Dress","Floral summer dress","49.99","50","NEW","Fashion","Brand Co","Blue","M","Lagos",""],
    ],
  },
  {
    name: "Electronics Template", file: "electronics_product_template.csv",
    rows: [
      ["Product Name","Description","Price","Stock","Condition","Category","Brand","Model","Location","Image URL"],
      ["Wireless Headphones","Premium sound quality","89.99","30","NEW","Electronics","Sony","WH-1000XM4","Abuja",""],
    ],
  },
  {
    name: "Wholesale Template", file: "wholesale_product_template.csv",
    rows: [
      ["Product Name","Description","Price","Stock","Condition","Category","MOQ","Location","Image URL"],
      ["Bulk Fabric Roll","Cotton fabric roll 10m","199.99","500","NEW","Textiles","10","Kano",""],
    ],
  },
];

/* ─── types ─────────────────────────────────────────────────────────────── */
type Step = "upload" | "map" | "preview" | "import" | "report";
type ImportMode = "CREATE" | "UPDATE" | "UPSERT";

interface ParsedFile { headers: string[]; rows: Record<string, string>[]; fileName: string; }

interface ValidatedRow {
  rowIndex: number;
  rawRow: Record<string, string>;
  mapped: Record<string, string>;
  status: "READY" | "WARNING" | "ERROR";
  errors: string[];
  warnings: string[];
}

interface ValidationResult {
  rows: ValidatedRow[];
  summary: { total: number; ready: number; warnings: number; errors: number };
}

interface ImportResult {
  importId: string;
  status: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  errorRows: Array<{ rowIndex: number; errorMessage: string }>;
}

/* ─── upgrade gate ──────────────────────────────────────────────────────── */
function UpgradeGate() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.25)" }}>
        <Star style={{ width: 28, height: 28, color: C.yellow }} />
      </div>
      <h2 className="text-2xl font-extrabold text-white mb-3">Unlock CSV Bulk Import</h2>
      <p className="text-sm mb-6" style={{ color: C.muted }}>
        CSV Bulk Import is available on the <strong style={{ color: C.yellow }}>Active (Paid) Plan</strong>. Upgrade to import hundreds of products in minutes.
      </p>
      <div className="w-full rounded-2xl p-5 mb-6 text-left" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
        <p className="text-white font-bold mb-3">What you unlock:</p>
        <ul className="space-y-2">
          {[
            "CSV Bulk Import (unlimited products)",
            "Smart field auto-detection",
            "Saved field mapping profiles",
            "Create / Update / Upsert modes",
            "Validation engine with error reporting",
            "Full import history & reports",
          ].map(f => (
            <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "#c4b5fd" }}>
              <CheckCircle2 style={{ width: 14, height: 14, color: C.green, flexShrink: 0 }} />{f}
            </li>
          ))}
        </ul>
      </div>
      <button onClick={() => setLocation("/seller/subscription")}
        className="w-full h-12 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
        style={{ background: C.yellow, color: "#000" }}>
        <Zap style={{ width: 16, height: 16 }} />Upgrade to Active Plan
      </button>
    </div>
  );
}

/* ─── step indicator ────────────────────────────────────────────────────── */
function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "map",    label: "Map Fields" },
    { key: "preview",label: "Preview" },
    { key: "import", label: "Import" },
    { key: "report", label: "Report" },
  ];
  const idx = steps.findIndex(s => s.key === current);
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors")}
              style={{
                background: i <= idx ? C.blue : "transparent",
                borderColor: i <= idx ? C.blue : C.bdr,
                color: i <= idx ? "#fff" : C.muted,
              }}>
              {i < idx ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : i + 1}
            </div>
            <p className="text-[10px] mt-1 font-semibold hidden sm:block" style={{ color: i <= idx ? C.blue : C.muted }}>{s.label}</p>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-[2px] mx-1" style={{ background: i < idx ? C.blue : C.bdr }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── status badge ──────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg = {
    READY:   { label: "Ready",   color: C.green,  bg: "rgba(16,185,129,0.12)" },
    WARNING: { label: "Warning", color: C.yellow, bg: "rgba(234,179,8,0.12)"  },
    ERROR:   { label: "Error",   color: C.red,    bg: "rgba(239,68,68,0.12)"  },
  }[status] ?? { label: status, color: C.muted, bg: "transparent" };
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════════ */
export default function BulkImportPage() {
  const { data: sub, isLoading: subLoading } = useSubscriptionStatus();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const dropRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [previewFilter, setPreviewFilter] = useState<"ALL" | "READY" | "WARNING" | "ERROR">("ALL");
  const [importMode, setImportMode] = useState<ImportMode>("CREATE");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    fetch("/api/imports/categories").then(r => r.json()).then(setCategories).catch(() => {});
    fetch("/api/imports/mapping-profiles").then(r => r.json()).then(setSavedProfiles).catch(() => {});
  }, []);

  /* ── file handling ─────────────────────────────────────────────────── */
  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a .csv file", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 10 MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSVText(text);
      if (!headers.length) { toast({ title: "Empty file", description: "No data found in CSV", variant: "destructive" }); return; }
      setParsed({ headers, rows, fileName: file.name });
      setMapping(autoDetect(headers));
      setStep("map");
    };
    reader.readAsText(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0]; if (file) handleFile(file);
  }, []);

  /* ── validate ──────────────────────────────────────────────────────── */
  async function runValidation() {
    if (!parsed) return;
    setValidating(true);
    try {
      const res = await fetch("/api/imports/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed.rows, mapping }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Validation failed");
      setValidation(data);
      setStep("preview");
    } catch (err: any) {
      toast({ title: "Validation error", description: err.message, variant: "destructive" });
    }
    setValidating(false);
  }

  /* ── save profile ──────────────────────────────────────────────────── */
  async function saveProfile() {
    if (!profileName.trim()) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/imports/mapping-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName.trim(), mappings: mapping }),
      });
      const data = await res.json();
      setSavedProfiles(p => [data, ...p]);
      setProfileName("");
      toast({ title: "Profile saved!", description: `"${profileName}" saved for future imports.` });
    } catch {
      toast({ title: "Error saving profile", variant: "destructive" });
    }
    setSavingProfile(false);
  }

  /* ── execute import ────────────────────────────────────────────────── */
  async function executeImport() {
    if (!validation) return;
    setImporting(true);
    try {
      const res = await fetch("/api/imports/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validation.rows,
          fileName: parsed?.fileName ?? "import.csv",
          mode: importMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setImportResult(data);
      setStep("report");
    } catch (err: any) {
      toast({ title: "Import error", description: err.message, variant: "destructive" });
    }
    setImporting(false);
  }

  /* ── reset ─────────────────────────────────────────────────────────── */
  function reset() {
    setParsed(null); setMapping({}); setValidation(null); setImportResult(null);
    setPreviewFilter("ALL"); setImportMode("CREATE"); setStep("upload");
  }

  /* ── loading / gate ─────────────────────────────────────────────────── */
  if (subLoading) return (
    <SellerLayout>
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blue }} /></div>
    </SellerLayout>
  );

  const subStatus = (sub as any)?.status;

  return (
    <SellerLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Bulk CSV Import</h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>Import hundreds of products from a spreadsheet</p>
        </div>
        <div className="flex gap-2">
          {subStatus === "ACTIVE" && (
            <span className="text-xs px-3 py-1.5 rounded-full font-bold" style={{ background: "rgba(16,185,129,0.15)", color: C.green }}>Pro Feature ✓</span>
          )}
          <button onClick={() => setLocation("/seller/import/history")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
            <History style={{ width: 14, height: 14 }} />History
          </button>
        </div>
      </div>

      {/* Upgrade gate */}
      {subStatus !== "ACTIVE" ? <UpgradeGate /> : (
        <>
          <StepIndicator current={step} />

          {/* ════ STEP 1: UPLOAD ═════════════════════════════════════════ */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div ref={dropRef}
                className={cn("rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer")}
                style={{
                  borderColor: dragging ? C.blue : C.bdr,
                  background: dragging ? "rgba(37,99,235,0.06)" : C.bg,
                }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById("csv-file-input")?.click()}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)" }}>
                  <Upload style={{ width: 28, height: 28, color: C.blue }} />
                </div>
                <p className="text-lg font-bold text-white mb-1">Drop your CSV file here</p>
                <p className="text-sm" style={{ color: C.muted }}>or click to browse · Max 10 MB · .csv files only</p>
                <input id="csv-file-input" type="file" accept=".csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>

              {/* Templates */}
              <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
                <p className="text-white font-bold mb-3">Download Templates</p>
                <p className="text-xs mb-4" style={{ color: C.muted }}>Start with a pre-formatted template for your product type.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TEMPLATES.map(t => (
                    <button key={t.file} onClick={() => downloadCSV(t.file, t.rows)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 text-left"
                      style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)", color: "#93c5fd" }}>
                      <Download style={{ width: 13, height: 13, flexShrink: 0 }} />{t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.18)" }}>
                <p className="font-bold text-white text-sm mb-2">Import Tips</p>
                <ul className="space-y-1.5 text-xs" style={{ color: "#c4b5fd" }}>
                  <li>• <strong>Product Name</strong> and <strong>Price</strong> are required for every row</li>
                  <li>• <strong>Condition</strong> must be NEW, USED, or REFURBISHED (defaults to NEW)</li>
                  <li>• <strong>Category</strong> must match an existing category name exactly</li>
                  <li>• <strong>Image URLs</strong> can be comma-separated for multiple images</li>
                  <li>• Use <strong>UPSERT mode</strong> to update existing products by title, or create new ones</li>
                </ul>
              </div>
            </div>
          )}

          {/* ════ STEP 2: MAP FIELDS ═════════════════════════════════════ */}
          {step === "map" && parsed && (
            <div className="space-y-4">
              <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white font-bold">Field Mapping</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>
                      <FileText style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />
                      {parsed.fileName} · {parsed.rows.length} rows · {parsed.headers.length} columns
                    </p>
                  </div>
                  {savedProfiles.length > 0 && (
                    <select className="text-xs rounded-xl px-3 py-2 outline-none"
                      style={{ background: "#281850", border: `1px solid ${C.bdr}`, color: C.muted }}
                      onChange={e => {
                        const p = savedProfiles.find(p => p.id === e.target.value);
                        if (p) setMapping({ ...mapping, ...p.mappings });
                      }}>
                      <option value="">Load saved profile…</option>
                      {savedProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                </div>

                {/* Mapping table */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.bdr}` }}>
                  <div className="grid px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: C.muted, gridTemplateColumns: "1fr 140px 1fr", background: "#120930", borderBottom: `1px solid ${C.bdr}` }}>
                    <span>CSV Column</span><span>Sample Data</span><span>Maps To</span>
                  </div>
                  {parsed.headers.map((h, idx) => {
                    const sample = parsed.rows.slice(0, 3).map(r => r[h]).filter(Boolean).join(", ");
                    return (
                      <div key={h} className="grid px-4 py-3 items-center"
                        style={{ gridTemplateColumns: "1fr 140px 1fr", borderTop: idx === 0 ? "none" : `1px solid ${C.bdr}` }}>
                        <p className="text-sm font-semibold text-white">{h}</p>
                        <p className="text-xs truncate px-2" style={{ color: C.muted }}>{sample || "—"}</p>
                        <select value={mapping[h] ?? "_ignore"}
                          onChange={e => setMapping(m => ({ ...m, [h]: e.target.value }))}
                          className="rounded-xl px-3 py-2 text-sm outline-none w-full"
                          style={{ background: "#1e1550", border: `1px solid ${C.bdr}`, color: mapping[h] && mapping[h] !== "_ignore" ? "#fff" : C.muted }}>
                          {PRODUCT_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Save profile */}
                <div className="flex gap-2 mt-4">
                  <input placeholder="Save mapping as…" value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                    style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
                  <button onClick={saveProfile} disabled={savingProfile || !profileName.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
                    style={{ background: C.purple }}>
                    {savingProfile ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("upload")}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
                  <ChevronLeft style={{ width: 14, height: 14 }} />Back
                </button>
                <button onClick={runValidation} disabled={validating}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: C.blue }}>
                  {validating ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Validating…</> : <>Validate & Preview <ChevronRight style={{ width: 14, height: 14 }} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 3: PREVIEW ════════════════════════════════════════ */}
          {step === "preview" && validation && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Rows",  value: validation.summary.total,    color: C.blue   },
                  { label: "Ready",       value: validation.summary.ready,    color: C.green  },
                  { label: "Warnings",    value: validation.summary.warnings,  color: C.yellow },
                  { label: "Errors",      value: validation.summary.errors,    color: C.red    },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: C.bg, border: `1px solid ${C.bdr}`, borderTop: `3px solid ${s.color}` }}>
                    <p className="text-3xl font-extrabold text-white">{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: C.muted }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                {(["ALL", "READY", "WARNING", "ERROR"] as const).map(f => (
                  <button key={f} onClick={() => setPreviewFilter(f)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: previewFilter === f ? C.blue : C.bg,
                      border: `1px solid ${previewFilter === f ? C.blue : C.bdr}`,
                      color: previewFilter === f ? "#fff" : C.muted,
                    }}>{f}</button>
                ))}
              </div>

              {/* Preview table */}
              <div className="rounded-2xl overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
                <div className="grid px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: C.muted, background: "#120930", gridTemplateColumns: "50px 1fr 90px 70px 70px 80px" }}>
                  <span>Row</span><span>Name</span><span>Price</span><span>Stock</span><span>Cond.</span><span>Status</span>
                </div>
                {validation.rows
                  .filter(r => previewFilter === "ALL" || r.status === previewFilter)
                  .slice(0, 50)
                  .map((row, idx) => (
                    <div key={row.rowIndex}>
                      <div className="grid px-5 py-3 items-center text-sm"
                        style={{ gridTemplateColumns: "50px 1fr 90px 70px 70px 80px", borderTop: idx === 0 ? "none" : `1px solid ${C.bdr}` }}>
                        <span className="text-xs" style={{ color: C.muted }}>#{row.rowIndex}</span>
                        <span className="font-semibold text-white truncate pr-3">{row.mapped.title || <em style={{ color: C.red }}>missing</em>}</span>
                        <span className="text-white">{row.mapped.price ? `$${parseFloat(row.mapped.price.replace(/[^0-9.]/g, "") || "0").toFixed(2)}` : <em style={{ color: C.red }}>—</em>}</span>
                        <span style={{ color: C.muted }}>{row.mapped.stock || "0"}</span>
                        <span className="text-xs" style={{ color: C.muted }}>{row.mapped.condition || "NEW"}</span>
                        <StatusBadge status={row.status} />
                      </div>
                      {(row.errors.length > 0 || row.warnings.length > 0) && (
                        <div className="px-5 pb-2.5 space-y-1">
                          {row.errors.map((e, i) => (
                            <p key={i} className="text-xs flex items-center gap-1.5" style={{ color: C.red }}>
                              <XCircle style={{ width: 11, height: 11, flexShrink: 0 }} />{e}
                            </p>
                          ))}
                          {row.warnings.map((w, i) => (
                            <p key={i} className="text-xs flex items-center gap-1.5" style={{ color: C.yellow }}>
                              <AlertTriangle style={{ width: 11, height: 11, flexShrink: 0 }} />{w}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                {validation.rows.filter(r => previewFilter === "ALL" || r.status === previewFilter).length > 50 && (
                  <p className="px-5 py-3 text-xs" style={{ color: C.muted }}>Showing first 50 rows. All rows will be imported.</p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("map")}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
                  <ChevronLeft style={{ width: 14, height: 14 }} />Back
                </button>
                <button onClick={() => setStep("import")}
                  disabled={validation.summary.ready + validation.summary.warnings === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ background: C.green }}>
                  Continue to Import <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 4: IMPORT ═════════════════════════════════════════ */}
          {step === "import" && validation && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="rounded-2xl p-6" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
                <p className="text-white font-bold text-lg mb-1">Import Settings</p>
                <p className="text-xs mb-5" style={{ color: C.muted }}>
                  {validation.summary.ready + validation.summary.warnings} rows ready to import
                  {validation.summary.errors > 0 && <span style={{ color: C.red }}> ({validation.summary.errors} errors will be skipped)</span>}
                </p>

                <p className="text-sm font-bold text-white mb-3">Import Mode</p>
                <div className="space-y-2">
                  {([
                    { key: "CREATE", label: "Create New Products",  desc: "Only creates new products. Skips rows that match existing products." },
                    { key: "UPDATE", label: "Update Existing Only",  desc: "Updates products by matching title. Skips rows with no match." },
                    { key: "UPSERT", label: "Create + Update",       desc: "Creates new products OR updates existing ones by title match." },
                  ] as { key: ImportMode; label: string; desc: string }[]).map(m => (
                    <label key={m.key} className="flex items-start gap-3 rounded-xl p-4 cursor-pointer transition-all"
                      style={{ background: importMode === m.key ? "rgba(37,99,235,0.12)" : "transparent", border: `1px solid ${importMode === m.key ? C.blue : C.bdr}` }}>
                      <input type="radio" name="mode" value={m.key} checked={importMode === m.key}
                        onChange={() => setImportMode(m.key)} className="mt-0.5 accent-blue-600" />
                      <div>
                        <p className="text-sm font-bold text-white">{m.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: C.muted }}>{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("preview")}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
                  <ChevronLeft style={{ width: 14, height: 14 }} />Back
                </button>
                <button onClick={executeImport} disabled={importing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: C.green }}>
                  {importing
                    ? <><Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />Importing {validation.summary.ready + validation.summary.warnings} products…</>
                    : <><Upload style={{ width: 14, height: 14 }} />Start Import</>}
                </button>
              </div>
            </div>
          )}

          {/* ════ STEP 5: REPORT ═════════════════════════════════════════ */}
          {step === "report" && importResult && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="rounded-2xl p-8 text-center" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
                {importResult.importedRows > 0 ? (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(16,185,129,0.12)", border: "2px solid #10b981" }}>
                    <CheckCircle2 style={{ width: 28, height: 28, color: C.green }} />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(239,68,68,0.12)", border: "2px solid #ef4444" }}>
                    <XCircle style={{ width: 28, height: 28, color: C.red }} />
                  </div>
                )}
                <h2 className="text-2xl font-extrabold text-white mb-1">
                  {importResult.status === "COMPLETED" ? "Import Complete!" : importResult.status === "PARTIAL" ? "Partially Imported" : "Import Failed"}
                </h2>
                <p className="text-sm" style={{ color: C.muted }}>{parsed?.fileName}</p>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="rounded-xl p-4" style={{ background: "#120930", borderTop: `3px solid ${C.blue}` }}>
                    <p className="text-2xl font-extrabold text-white">{importResult.totalRows}</p>
                    <p className="text-xs mt-1" style={{ color: C.muted }}>Total Rows</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#120930", borderTop: `3px solid ${C.green}` }}>
                    <p className="text-2xl font-extrabold" style={{ color: C.green }}>{importResult.importedRows}</p>
                    <p className="text-xs mt-1" style={{ color: C.muted }}>Imported</p>
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "#120930", borderTop: `3px solid ${importResult.failedRows > 0 ? C.red : C.muted}` }}>
                    <p className="text-2xl font-extrabold" style={{ color: importResult.failedRows > 0 ? C.red : C.muted }}>{importResult.failedRows}</p>
                    <p className="text-xs mt-1" style={{ color: C.muted }}>Failed</p>
                  </div>
                </div>
              </div>

              {importResult.errorRows.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <p className="font-bold text-sm mb-3" style={{ color: "#fca5a5" }}>Failed Rows</p>
                  {importResult.errorRows.map(e => (
                    <div key={e.rowIndex} className="flex gap-3 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded font-bold" style={{ background: "rgba(239,68,68,0.15)", color: C.red }}>Row {e.rowIndex}</span>
                      <span className="text-xs" style={{ color: "#fca5a5" }}>{e.errorMessage}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={reset}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
                  <RefreshCw style={{ width: 14, height: 14 }} />New Import
                </button>
                <button onClick={() => setLocation("/seller/products")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: C.blue }}>
                  <Package style={{ width: 14, height: 14 }} />View Products
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </SellerLayout>
  );
}
