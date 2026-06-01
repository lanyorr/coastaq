import { useState, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronLeft, Loader2, Settings, Check, X } from "lucide-react";
import { useLocation } from "wouter";

const C = {
  bg: "#1a1040", bdr: "#281850", muted: "#7b80b5",
  blue: "#2563eb", green: "#10b981", purple: "#8b5cf6", red: "#ef4444", yellow: "#eab308",
};

const RATE_TYPES = [
  { key: "flat",      label: "Flat Rate",         desc: "Fixed price regardless of weight or quantity" },
  { key: "weight",    label: "Weight-based",       desc: "Base rate + per kg charge" },
  { key: "per_item",  label: "Per Item",           desc: "Base rate + charge per item" },
];

const emptyForm = {
  name: "", courierId: "", rateType: "flat", baseRate: "0", perKgRate: "", freeShippingThreshold: "",
  countries: "", estimatedDaysMin: "3", estimatedDaysMax: "7",
};

export default function ShippingRatesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rates, setRates]       = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ ...emptyForm });
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [ratesData, couriersData] = await Promise.all([
      fetch("/api/shipping/rates").then(r => r.json()),
      fetch("/api/shipping/couriers").then(r => r.json()),
    ]);
    setRates(Array.isArray(ratesData) ? ratesData : []);
    setCouriers(Array.isArray(couriersData) ? couriersData : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.baseRate) {
      toast({ title: "Name and base rate required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          courierId: form.courierId || null,
          estimatedDaysMin: parseInt(form.estimatedDaysMin),
          estimatedDaysMax: parseInt(form.estimatedDaysMax),
          countries: form.countries ? form.countries.split(",").map(s => s.trim().toUpperCase()) : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Rate saved!" });
      setShowForm(false); setForm({ ...emptyForm }); load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const deleteRate = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/shipping/rates/${id}`, { method: "DELETE" });
    toast({ title: "Rate deleted" });
    load();
    setDeletingId(null);
  };

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
            <h1 className="text-xl font-extrabold text-white">Shipping Rates</h1>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>Configure rate rules for your shop</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90"
          style={{ background: C.green }}>
          <Plus style={{ width: 13, height: 13 }} />Add Rate
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: C.bg, border: `1px solid ${C.blue}40` }}>
          <p className="text-white font-bold mb-4">New Shipping Rate</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Rate Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder='e.g. "Standard Domestic" or "Express International"'
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Courier (optional)</label>
              <select value={form.courierId} onChange={e => set("courierId", e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }}>
                <option value="">Any Courier</option>
                {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Rate Type</label>
              <select value={form.rateType} onChange={e => set("rateType", e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }}>
                {RATE_TYPES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              <p className="text-[11px] mt-1" style={{ color: C.muted }}>{RATE_TYPES.find(r => r.key === form.rateType)?.desc}</p>
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Base Rate ($) *</label>
              <input value={form.baseRate} onChange={e => set("baseRate", e.target.value)} placeholder="0.00" type="number" min="0" step="0.01"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
            </div>

            {form.rateType !== "flat" && (
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>
                  {form.rateType === "weight" ? "Per kg Rate ($)" : "Per Item Rate ($)"}
                </label>
                <input value={form.perKgRate} onChange={e => set("perKgRate", e.target.value)} placeholder="0.00" type="number" min="0" step="0.01"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
              </div>
            )}

            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Free Shipping Threshold ($)</label>
              <input value={form.freeShippingThreshold} onChange={e => set("freeShippingThreshold", e.target.value)} placeholder="e.g. 100 (free above this)"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Country Codes (comma-sep, blank = all)</label>
              <input value={form.countries} onChange={e => set("countries", e.target.value)} placeholder="e.g. NG, GH, KE"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
            </div>

            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Est. Days (min)</label>
              <input value={form.estimatedDaysMin} onChange={e => set("estimatedDaysMin", e.target.value)} type="number" min="1"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
            </div>
            <div>
              <label className="text-xs font-bold mb-1.5 block" style={{ color: C.muted }}>Est. Days (max)</label>
              <input value={form.estimatedDaysMax} onChange={e => set("estimatedDaysMax", e.target.value)} type="number" min="1"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "#1e1550", border: `1px solid ${C.bdr}` }} />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
              style={{ background: C.green }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check style={{ width: 14, height: 14 }} />Save Rate</>}
            </button>
            <button onClick={() => { setShowForm(false); setForm({ ...emptyForm }); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90"
              style={{ background: C.bg, border: `1px solid ${C.bdr}`, color: C.muted }}>
              <X style={{ width: 14, height: 14 }} />Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: C.blue }} /></div>
      ) : rates.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <Settings style={{ width: 32, height: 32, color: "#2a1a50", margin: "0 auto 12px" }} />
          <p className="text-white font-bold mb-2">No Shipping Rates Yet</p>
          <p className="text-sm mb-4" style={{ color: C.muted }}>Add rates to show shipping costs during checkout and streamline your dispatch process.</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
            style={{ background: C.green }}>
            <Plus style={{ width: 13, height: 13 }} />Create First Rate
          </button>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: C.bg, border: `1px solid ${C.bdr}` }}>
          <div className="grid px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: C.muted, background: "#120930", gridTemplateColumns: "1fr 100px 120px 90px 90px 80px 60px" }}>
            <span>Name</span><span>Type</span><span>Courier</span><span>Base Rate</span><span>Per Unit</span><span>Free ≥</span><span />
          </div>
          {rates.map((r, idx) => (
            <div key={r.id} className="grid px-5 py-3.5 items-center text-sm"
              style={{ gridTemplateColumns: "1fr 100px 120px 90px 90px 80px 60px", borderTop: idx === 0 ? "none" : `1px solid ${C.bdr}` }}>
              <div>
                <p className="font-semibold text-white">{r.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                  {r.estimatedDaysMin}–{r.estimatedDaysMax} days
                  {r.countries ? ` · ${JSON.parse(r.countries).join(", ")}` : " · All countries"}
                </p>
              </div>
              <span className="text-xs capitalize" style={{ color: C.purple }}>{r.rateType}</span>
              <span className="text-xs" style={{ color: "#93c5fd" }}>{r.courier?.name || "Any"}</span>
              <span className="text-xs font-bold text-white">${parseFloat(r.baseRate || "0").toFixed(2)}</span>
              <span className="text-xs" style={{ color: C.muted }}>{r.perKgRate ? `$${parseFloat(r.perKgRate).toFixed(2)}` : "—"}</span>
              <span className="text-xs" style={{ color: C.green }}>{r.freeShippingThreshold ? `$${r.freeShippingThreshold}` : "—"}</span>
              <button onClick={() => deleteRate(r.id)} disabled={deletingId === r.id}
                className="flex items-center justify-center w-7 h-7 rounded-lg hover:opacity-90 transition-all"
                style={{ background: "rgba(239,68,68,0.12)", color: C.red }}>
                {deletingId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 style={{ width: 12, height: 12 }} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </SellerLayout>
  );
}
