import { useState, useEffect, useCallback } from "react";
import { SellerLayout } from "./SellerLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Megaphone, Plus, Users, Loader2, X, ChevronDown, Package,
  Play, Pause, StopCircle, Pencil,
} from "lucide-react";

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  active:  { label: "Active",  cls: "bg-green-100 text-green-700" },
  paused:  { label: "Paused",  cls: "bg-yellow-100 text-yellow-700" },
  ended:   { label: "Ended",   cls: "bg-gray-100 text-gray-500" },
};

const EMPTY_FORM = {
  name: "",
  description: "",
  commissionRate: "10",
  budget: "",
  startsAt: "",
  endsAt: "",
  productIds: [] as string[],
};

type FormState = typeof EMPTY_FORM;

function BudgetBar({ spent, total }: { spent: string | null; total: string | null }) {
  if (!total) return <p className="text-xs text-muted-foreground">Unlimited budget</p>;
  const s = parseFloat(spent ?? "0");
  const t = parseFloat(total);
  const pct = t > 0 ? Math.min(100, Math.round((s / t) * 100)) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>${s.toFixed(2)} spent</span>
        <span>${(t - s).toFixed(2)} remaining</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", pct > 80 ? "bg-red-400" : "bg-green-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProductMultiSelect({
  products,
  selected,
  onChange,
}: {
  products: any[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20"
      >
        <span className="text-muted-foreground">
          {selected.length === 0
            ? "All products"
            : `${selected.length} product${selected.length !== 1 ? "s" : ""} selected`}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">No products found</p>
          ) : (
            products.map(p => (
              <label
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-secondary cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggle(p.id)}
                  className="accent-green-600"
                />
                <span className="flex-1 truncate">{p.title}</span>
                {p.price && <span className="text-muted-foreground shrink-0">${parseFloat(p.price).toFixed(2)}</span>}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerCampaignsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [cRes, shopRes] = await Promise.all([
      fetch("/api/seller/campaigns").then(r => r.ok ? r.json() : []),
      fetch("/api/shops/my").then(r => r.ok ? r.json() : null),
    ]);
    setCampaigns(Array.isArray(cRes) ? cRes : []);

    const shopId = shopRes?.id ?? null;
    if (shopId) {
      const pRes = await fetch(`/api/products?shopId=${shopId}&limit=100`)
        .then(r => r.ok ? r.json() : { products: [] })
        .catch(() => ({ products: [] }));
      setProducts(pRes.products ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(c: any) {
    setForm({
      name: c.name,
      description: c.description ?? "",
      commissionRate: String(parseFloat(c.commissionRate)),
      budget: c.budget ? String(parseFloat(c.budget)) : "",
      startsAt: c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 10) : "",
      endsAt: c.endsAt ? new Date(c.endsAt).toISOString().slice(0, 10) : "",
      productIds: c.productIds ?? [],
    });
    setEditingId(c.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function submit() {
    if (!form.name.trim()) {
      toast({ title: "Campaign name is required", variant: "destructive" }); return;
    }
    const rate = parseFloat(form.commissionRate);
    if (isNaN(rate) || rate < 1 || rate > 50) {
      toast({ title: "Commission rate must be 1–50%", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        description: form.description || null,
        commissionRate: rate,
        budget: form.budget ? parseFloat(form.budget) : null,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        productIds: form.productIds,
      };

      const url = editingId ? `/api/seller/campaigns/${editingId}` : "/api/seller/campaigns";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to save campaign", variant: "destructive" });
      } else {
        toast({ title: editingId ? "Campaign updated!" : "Campaign created!", description: data.name });
        closeForm();
        load();
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setSubmitting(false);
  }

  async function toggleStatus(id: string, current: string) {
    const next = current === "active" ? "paused" : "active";
    setToggling(id);
    try {
      const res = await fetch(`/api/seller/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: next } : c));
        toast({ title: `Campaign ${next === "active" ? "resumed" : "paused"}` });
      }
    } catch {}
    setToggling(null);
  }

  async function endCampaign(id: string) {
    if (!confirm("Are you sure you want to end this campaign? This cannot be undone.")) return;
    setToggling(id);
    try {
      const res = await fetch(`/api/seller/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: "ended" } : c));
        toast({ title: "Campaign ended" });
      }
    } catch {}
    setToggling(null);
  }

  const f = (k: keyof FormState, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <SellerLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Affiliate Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Launch campaigns to let affiliates promote your products.</p>
        </div>
        <Button
          onClick={showForm ? closeForm : openCreate}
          className="bg-green-600 hover:bg-green-700 rounded-full gap-2 shrink-0"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New Campaign"}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 mb-6">
          <h3 className="font-semibold mb-5">{editingId ? "Edit Campaign" : "Create Campaign"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Campaign Name <span className="text-red-500">*</span></label>
              <Input
                placeholder="e.g. Summer Sale 2026"
                value={form.name}
                onChange={e => f("name", e.target.value)}
                className="focus-visible:ring-green-500/20 focus-visible:border-green-400"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                rows={2}
                placeholder="What should affiliates promote and how?"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-colors"
                value={form.description}
                onChange={e => f("description", e.target.value)}
              />
            </div>

            {/* Commission rate */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Commission Rate <span className="text-muted-foreground">(1–50%)</span></label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  value={form.commissionRate}
                  onChange={e => f("commissionRate", e.target.value)}
                  className="pr-8 focus-visible:ring-green-500/20 focus-visible:border-green-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Budget <span className="text-muted-foreground font-normal">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Unlimited"
                  value={form.budget}
                  onChange={e => f("budget", e.target.value)}
                  className="pl-7 focus-visible:ring-green-500/20 focus-visible:border-green-400"
                />
              </div>
            </div>

            {/* Start / end dates */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Start Date <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input
                type="date"
                value={form.startsAt}
                onChange={e => f("startsAt", e.target.value)}
                className="focus-visible:ring-green-500/20 focus-visible:border-green-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">End Date <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input
                type="date"
                value={form.endsAt}
                onChange={e => f("endsAt", e.target.value)}
                className="focus-visible:ring-green-500/20 focus-visible:border-green-400"
              />
            </div>

            {/* Products */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Products <span className="text-muted-foreground font-normal">(leave empty for all)</span></label>
              <ProductMultiSelect
                products={products}
                selected={form.productIds}
                onChange={ids => f("productIds", ids)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={submit}
              disabled={submitting || !form.name.trim()}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editingId ? "Save Changes" : "Create Campaign"}
            </Button>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-25" />
          <p className="font-medium mb-1">No campaigns yet</p>
          <p className="text-sm">Create your first campaign to start recruiting affiliates.</p>
          <Button onClick={openCreate} className="mt-4 bg-green-600 hover:bg-green-700 rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Create Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map(c => {
            const st = STATUS_STYLES[c.status] ?? STATUS_STYLES.active;
            const isEnded = c.status === "ended";
            return (
              <div
                key={c.id}
                className={cn(
                  "bg-card border rounded-2xl p-5 flex flex-col gap-3 transition-all",
                  isEnded ? "border-border/30 opacity-70" : "border-border/50",
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{c.name}</p>
                    {c.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>
                    )}
                  </div>
                  <span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full shrink-0", st.cls)}>{st.label}</span>
                </div>

                {/* Meta chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {parseFloat(c.commissionRate).toFixed(0)}% commission
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    <Users className="w-3 h-3" /> {c.memberCount} affiliate{c.memberCount !== 1 ? "s" : ""}
                  </span>
                  {c.productIds?.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      <Package className="w-3 h-3" /> {c.productIds.length} product{c.productIds.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Budget */}
                <BudgetBar spent={c.spent ?? null} total={c.budget ?? null} />

                {/* Dates */}
                {(c.startsAt || c.endsAt) && (
                  <p className="text-xs text-muted-foreground">
                    {c.startsAt && `Start: ${new Date(c.startsAt).toLocaleDateString()}`}
                    {c.startsAt && c.endsAt && " · "}
                    {c.endsAt && `End: ${new Date(c.endsAt).toLocaleDateString()}`}
                  </p>
                )}

                {/* Actions */}
                {!isEnded && (
                  <div className="flex items-center gap-2 pt-1 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("gap-1.5 text-xs", c.status === "active" ? "border-yellow-300 text-yellow-700 hover:bg-yellow-50" : "border-green-300 text-green-700 hover:bg-green-50")}
                      disabled={toggling === c.id}
                      onClick={() => toggleStatus(c.id, c.status)}
                    >
                      {toggling === c.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : c.status === "active" ? (
                        <><Pause className="w-3.5 h-3.5" /> Pause</>
                      ) : (
                        <><Play className="w-3.5 h-3.5" /> Resume</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs border-red-200 text-red-600 hover:bg-red-50"
                      disabled={toggling === c.id}
                      onClick={() => endCampaign(c.id)}
                    >
                      <StopCircle className="w-3.5 h-3.5" /> End
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SellerLayout>
  );
}
