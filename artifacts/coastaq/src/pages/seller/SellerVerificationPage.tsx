import { useState, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { useLocation } from "wouter";
import { format } from "date-fns";
import {
  ShieldCheck, Upload, CheckCircle2, Clock, XCircle, AlertTriangle,
  ChevronRight, Star, Loader2, ArrowRight, Lock, Zap,
} from "lucide-react";
import { SellerBadge, TrustScoreBar } from "@/components/SellerBadge";

const C = {
  bg: "#1a1040", bdr: "#281850", muted: "#7b80b5",
  blue: "#2563eb", green: "#10b981", purple: "#8b5cf6",
  yellow: "#eab308", red: "#ef4444", orange: "#f97316",
};

const STATUS_CFG: Record<string, { label: string; color: string; icon: any }> = {
  not_submitted:  { label: "Not Submitted",   color: C.muted,   icon: Clock },
  pending_review: { label: "Pending Review",  color: C.yellow,  icon: Clock },
  approved:       { label: "Approved",        color: C.green,   icon: CheckCircle2 },
  rejected:       { label: "Rejected",        color: C.red,     icon: XCircle },
  requires_update:{ label: "Requires Update", color: C.orange,  icon: AlertTriangle },
};

export default function SellerVerificationPage() {
  const [, setLocation] = useLocation();
  const [data, setData]       = useState<any>(null);
  const [score, setScore]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/verification/status").then(r => r.json()),
      fetch("/api/verification/trust-score").then(r => r.json()),
    ]).then(([d, s]) => { setData(d); setScore(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const submit = async () => {
    setSubmitting(true);
    try {
      const r = await fetch("/api/verification/submit", { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setData((prev: any) => ({ ...prev, ...d }));
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  if (loading) return (
    <SellerLayout>
      <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: C.blue }} /></div>
    </SellerLayout>
  );

  const ver = data;
  const identityStatus = STATUS_CFG[ver?.identityStatus ?? "not_submitted"];
  const businessStatus = STATUS_CFG[ver?.businessStatus ?? "not_submitted"];
  const overallStatus  = STATUS_CFG[ver?.overallStatus  ?? "not_submitted"];
  const OverallIcon = overallStatus.icon;

  const scoreColor = score?.totalScore >= 85 ? C.green : score?.totalScore >= 70 ? C.blue : score?.totalScore >= 40 ? C.yellow : C.red;

  return (
    <SellerLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Verification Center</h1>
          <p className="text-sm mt-0.5" style={{ color: C.muted }}>Build trust with buyers through seller verification</p>
        </div>
        {ver?.badgeLevel && <SellerBadge level={ver.badgeLevel} size="lg" />}
      </div>

      {/* Overall status banner */}
      {ver?.overallStatus !== "not_submitted" && (
        <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
          style={{ background: `${overallStatus.color}10`, border: `1px solid ${overallStatus.color}25` }}>
          <OverallIcon style={{ width: 18, height: 18, color: overallStatus.color, flexShrink: 0 }} />
          <div>
            <p className="font-bold text-sm" style={{ color: overallStatus.color }}>
              Verification {overallStatus.label}
            </p>
            {ver?.reviewNote && <p className="text-xs mt-0.5 text-white">{ver.reviewNote}</p>}
            {ver?.reviewedAt && <p className="text-xs mt-0.5" style={{ color: C.muted }}>Reviewed {format(new Date(ver.reviewedAt), "MMM d, yyyy")}</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: verification sections */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress steps */}
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <p className="text-white font-bold mb-4">Verification Progress</p>
            <div className="space-y-3">
              {(ver?.steps ?? []).map((step: any, idx: number) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: step.done ? C.green : step.pending ? C.yellow : "#2a1a50",
                      border: `2px solid ${step.done ? C.green : step.pending ? C.yellow : C.bdr}`,
                    }}>
                    {step.done ? <CheckCircle2 style={{ width: 14, height: 14, color: "#fff" }} />
                      : <span className="text-xs font-bold" style={{ color: step.pending ? "#fff" : C.muted }}>{idx + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: step.done ? C.green : "#fff" }}>{step.label}</p>
                    {step.optional && <p className="text-[11px]" style={{ color: C.muted }}>Optional — unlocks Enterprise badge</p>}
                  </div>
                  {step.done && <CheckCircle2 style={{ width: 14, height: 14, color: C.green }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Identity verification */}
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-bold">Identity Verification</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>Passport, National ID, or Driver's License</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ color: identityStatus.color, background: `${identityStatus.color}15` }}>
                {identityStatus.label}
              </span>
            </div>

            {/* Identity docs */}
            {ver?.documents?.filter((d: any) => d.docCategory === "identity").length > 0 ? (
              <div className="space-y-2 mb-3">
                {ver.documents.filter((d: any) => d.docCategory === "identity").map((doc: any) => {
                  const docStatus = STATUS_CFG[doc.status] ?? STATUS_CFG.not_submitted;
                  const DocIcon = docStatus.icon;
                  return (
                    <div key={doc.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#120930" }}>
                      <DocIcon style={{ width: 14, height: 14, color: docStatus.color, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{doc.fileName}</p>
                        <p className="text-[11px]" style={{ color: C.muted }}>
                          {doc.docType.replace(/_/g, " ")} · {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                        </p>
                        {doc.rejectionReason && <p className="text-[11px] mt-0.5" style={{ color: C.red }}>{doc.rejectionReason}</p>}
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ color: docStatus.color, background: `${docStatus.color}12` }}>{docStatus.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl p-4 text-center mb-3" style={{ background: "#120930" }}>
                <Lock style={{ width: 24, height: 24, color: "#2a1a50", margin: "0 auto 8px" }} />
                <p className="text-sm" style={{ color: C.muted }}>No identity documents uploaded yet</p>
              </div>
            )}

            <button onClick={() => setLocation("/seller/verification/documents")}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
              style={{ background: C.blue + "18", color: C.blue, border: `1px solid ${C.blue}25` }}>
              <Upload style={{ width: 13, height: 13 }} />
              {ver?.documents?.filter((d: any) => d.docCategory === "identity").length > 0 ? "Manage Documents" : "Upload Identity Document"}
            </button>
          </div>

          {/* Business verification */}
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-bold">Business Verification <span className="text-[11px] font-normal ml-1" style={{ color: C.muted }}>Optional</span></p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>Business registration, Tax certificate, VAT, Import/Export license</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ color: businessStatus.color, background: `${businessStatus.color}15` }}>
                {businessStatus.label}
              </span>
            </div>

            {ver?.documents?.filter((d: any) => d.docCategory === "business").length > 0 ? (
              <div className="space-y-2 mb-3">
                {ver.documents.filter((d: any) => d.docCategory === "business").map((doc: any) => {
                  const docStatus = STATUS_CFG[doc.status] ?? STATUS_CFG.not_submitted;
                  const DocIcon = docStatus.icon;
                  return (
                    <div key={doc.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#120930" }}>
                      <DocIcon style={{ width: 14, height: 14, color: docStatus.color, flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{doc.fileName}</p>
                        <p className="text-[11px]" style={{ color: C.muted }}>{doc.docType.replace(/_/g, " ")} · {format(new Date(doc.uploadedAt), "MMM d, yyyy")}</p>
                        {doc.rejectionReason && <p className="text-[11px] mt-0.5" style={{ color: C.red }}>{doc.rejectionReason}</p>}
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ color: docStatus.color, background: `${docStatus.color}12` }}>{docStatus.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm mb-3 text-center py-3" style={{ color: C.muted }}>No business documents uploaded yet</p>
            )}

            <button onClick={() => setLocation("/seller/verification/documents?category=business")}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
              style={{ background: C.purple + "15", color: C.purple, border: `1px solid ${C.purple}25` }}>
              <Upload style={{ width: 13, height: 13 }} />Upload Business Document
            </button>
          </div>

          {/* Submit button */}
          {ver?.overallStatus === "not_submitted" && ver?.documents?.some((d: any) => d.docCategory === "identity") && (
            <button onClick={submit} disabled={submitting}
              className="w-full h-12 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90 transition-all"
              style={{ background: C.green }}>
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck style={{ width: 18, height: 18 }} />Submit for Review</>}
            </button>
          )}
        </div>

        {/* Right: trust score + badge levels */}
        <div className="space-y-4">
          {/* Trust score card */}
          <div className="rounded-2xl p-5" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-bold text-sm">Trust Score</p>
              <button onClick={() => setLocation("/seller/trust-score")}
                className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: C.blue }}>
                Details <ArrowRight style={{ width: 10, height: 10 }} />
              </button>
            </div>
            <div className="text-center mb-4">
              <p className="text-5xl font-extrabold" style={{ color: scoreColor }}>{score?.totalScore ?? 0}</p>
              <p className="text-xs mt-1" style={{ color: C.muted }}>out of 100</p>
            </div>
            <TrustScoreBar score={score?.totalScore ?? 0} size="lg" />
            <div className="mt-4 space-y-2">
              {[
                { label: "Delivery",    val: score?.deliveryScore ?? 0,   max: 30 },
                { label: "Completion",  val: score?.completionScore ?? 0, max: 20 },
                { label: "Disputes",    val: score?.disputeScore ?? 0,    max: 15 },
                { label: "Refunds",     val: score?.refundScore ?? 0,     max: 10 },
                { label: "Account Age", val: score?.ageScore ?? 0,        max: 10 },
                { label: "Volume",      val: score?.volumeScore ?? 0,     max: 15 },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <span style={{ color: C.muted }}>{s.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 rounded-full" style={{ background: "#2a1a50" }}>
                      <div className="h-full rounded-full" style={{ width: `${(s.val / s.max) * 100}%`, background: C.blue }} />
                    </div>
                    <span className="text-white font-bold w-8 text-right">{s.val.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badge levels */}
          <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
            <p className="text-white font-bold text-sm mb-3">Badge Levels</p>
            {[
              { level: "basic" as const,      req: "Account created" },
              { level: "verified" as const,   req: "Identity doc approved" },
              { level: "premium" as const,    req: "Verified + score ≥60 + 10 orders" },
              { level: "enterprise" as const, req: "Business doc + score ≥80 + 50 orders" },
            ].map(b => {
              const isCurrent = ver?.badgeLevel === b.level;
              return (
                <div key={b.level} className="flex items-center gap-3 py-2.5"
                  style={{ borderBottom: `1px solid ${C.bdr}` }}>
                  <SellerBadge level={b.level} size="sm" showLabel={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: isCurrent ? C.green : "#fff" }}>
                      {b.level.charAt(0).toUpperCase() + b.level.slice(1)}
                      {isCurrent && <span className="ml-1.5" style={{ color: C.green, fontSize: 10 }}>← Current</span>}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{b.req}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations */}
          {score?.recommendations?.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap style={{ width: 13, height: 13, color: C.yellow }} />
                <p className="text-sm font-bold text-white">Improve Your Score</p>
              </div>
              {score.recommendations.map((r: string, i: number) => (
                <p key={i} className="flex items-start gap-2 text-xs mb-2" style={{ color: C.muted }}>
                  <ArrowRight style={{ width: 10, height: 10, marginTop: 3, flexShrink: 0, color: C.yellow }} />{r}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
}
