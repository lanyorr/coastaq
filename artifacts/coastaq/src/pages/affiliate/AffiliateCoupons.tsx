import { useState, useEffect } from "react";
import { AffiliateLayout } from "./AffiliateLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Ticket, Copy, CheckCircle2, Plus, Loader2, X } from "lucide-react";

export default function AffiliateCoupons() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", discountPct: "10", maxUses: "" });

  useEffect(() => {
    fetch("/api/affiliates/me/coupons")
      .then(r => r.ok ? r.json() : [])
      .then(d => { setCoupons(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function createCoupon() {
    const pct = parseInt(form.discountPct, 10);
    if (isNaN(pct) || pct < 5 || pct > 30) {
      toast({ title: "Discount must be between 5% and 30%", variant: "destructive" }); return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/affiliates/me/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim() || undefined,
          discountPct: pct,
          maxUses: form.maxUses ? parseInt(form.maxUses, 10) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to create coupon", variant: "destructive" });
      } else {
        setCoupons(prev => [data, ...prev]);
        setForm({ code: "", discountPct: "10", maxUses: "" });
        setShowForm(false);
        toast({ title: "Coupon created!", description: `Code: ${data.code}` });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setCreating(false);
  }

  async function toggleCoupon(id: string, current: boolean) {
    setToggling(id);
    try {
      const res = await fetch(`/api/affiliates/me/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c));
      }
    } catch {}
    setToggling(null);
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/shop?coupon=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
      toast({ title: "Link copied!", description: url });
    });
  }

  const usagePct = (c: any) =>
    c.maxUses ? Math.min(100, Math.round((c.uses / c.maxUses) * 100)) : null;

  return (
    <AffiliateLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Coupon Codes</h1>
        <Button
          onClick={() => setShowForm(v => !v)}
          className="bg-purple-600 hover:bg-purple-700 rounded-full gap-2"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New Coupon"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border border-border/50 rounded-2xl p-5 mb-6">
          <h3 className="font-semibold mb-4">Create Coupon</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Code <span className="text-muted-foreground font-normal">(auto if blank)</span></label>
              <Input
                placeholder="e.g. SAVE20"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Discount % <span className="text-muted-foreground">(5–30)</span></label>
              <div className="relative">
                <Input
                  type="number"
                  min="5"
                  max="30"
                  value={form.discountPct}
                  onChange={e => setForm(f => ({ ...f, discountPct: e.target.value }))}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Max Uses <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input
                type="number"
                min="1"
                placeholder="Unlimited"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
              />
            </div>
          </div>
          <Button
            onClick={createCoupon}
            disabled={creating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {creating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating…</> : "Create Coupon"}
          </Button>
        </div>
      )}

      {/* Coupon grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-card border rounded-2xl h-36 animate-pulse" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="mb-4">No coupons yet. Create your first coupon code above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map(c => {
            const pct = usagePct(c);
            return (
              <div
                key={c.id}
                className={cn(
                  "bg-card border rounded-2xl p-5 transition-all",
                  c.isActive ? "border-border/50" : "border-border/30 opacity-60",
                )}
              >
                {/* Code + discount */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-xl font-bold tracking-widest text-primary">{c.code}</p>
                    <span className="inline-block mt-1 text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {c.discountPct}% off
                    </span>
                  </div>
                  <button
                    onClick={() => toggleCoupon(c.id, c.isActive)}
                    disabled={toggling === c.id}
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full transition-colors",
                      c.isActive
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                    )}
                  >
                    {toggling === c.id ? "…" : c.isActive ? "Active" : "Inactive"}
                  </button>
                </div>

                {/* Usage bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{c.uses} uses</span>
                    <span>{c.maxUses ? `max ${c.maxUses}` : "unlimited"}</span>
                  </div>
                  {pct !== null && (
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Copy button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                  onClick={() => copyLink(c.code)}
                >
                  {copied === c.code ? (
                    <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Copied!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy Share Link</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </AffiliateLayout>
  );
}
