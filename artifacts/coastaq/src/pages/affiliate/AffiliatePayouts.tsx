import { useState, useEffect } from "react";
import { AffiliateLayout } from "./AffiliateLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DollarSign, Loader2, CreditCard, AlertCircle, X,
} from "lucide-react";

const PAYOUT_METHODS = [
  { value: "paypal", label: "PayPal" },
  { value: "bank", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "crypto", label: "Crypto" },
];

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  paid:     "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

export default function AffiliatePayouts() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: "", method: "paypal" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [p, h] = await Promise.all([
      fetch("/api/affiliates/me").then(r => r.ok ? r.json() : null),
      fetch("/api/affiliates/me/payouts").then(r => r.ok ? r.json() : []),
    ]);
    setProfile(p);
    setPayouts(Array.isArray(h) ? h : []);
    setLoading(false);
  }

  async function requestPayout() {
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt < 10) {
      toast({ title: "Minimum payout is $10.00", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/affiliates/me/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, method: form.method }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Request failed", variant: "destructive" });
      } else {
        setPayouts(prev => [data, ...prev]);
        setShowForm(false);
        setForm({ amount: "", method: "paypal" });
        toast({ title: "Payout requested!", description: "We'll process it within 1–3 business days." });
        if (profile) {
          setProfile((p: any) => ({
            ...p,
            pendingEarnings: (parseFloat(p.pendingEarnings) - amt).toFixed(2),
          }));
        }
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <AffiliateLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
      </AffiliateLayout>
    );
  }

  const pendingBal = parseFloat(profile?.pendingEarnings ?? "0");
  const canRequest = profile?.isApproved && pendingBal >= 10;

  return (
    <AffiliateLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Payouts</h1>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white" />
        </div>
        <p className="text-sm font-medium text-purple-200 mb-1">Available Balance</p>
        <p className="text-4xl font-bold mb-4">${pendingBal.toFixed(2)}</p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowForm(true)}
            disabled={!canRequest}
            className="bg-white text-purple-700 hover:bg-purple-50 font-semibold rounded-full px-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Request Payout
          </Button>
          {!canRequest && pendingBal < 10 && (
            <p className="text-xs text-purple-200">Minimum $10.00 to withdraw</p>
          )}
          {!profile?.isApproved && (
            <p className="text-xs text-purple-200 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Account pending approval
            </p>
          )}
        </div>
      </div>

      {/* Request payout form (inline card) */}
      {showForm && (
        <div className="bg-card border border-border/50 rounded-2xl p-5 mb-6 relative">
          <button
            onClick={() => { setShowForm(false); setForm({ amount: "", method: "paypal" }); }}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="font-semibold mb-4">Request a Payout</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="10"
                  max={pendingBal}
                  step="0.01"
                  placeholder="10.00"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Max: ${pendingBal.toFixed(2)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Payout Method</label>
              <select
                value={form.method}
                onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                {PAYOUT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          {profile?.paypalEmail && form.method === "paypal" && (
            <p className="text-xs text-muted-foreground mb-4">
              Will be sent to: <span className="font-medium">{profile.paypalEmail}</span>
            </p>
          )}
          <div className="flex gap-3">
            <Button
              onClick={requestPayout}
              disabled={submitting || !form.amount}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : "Submit Request"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Payout history */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="font-semibold">Payout History</h2>
        </div>
        {payouts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No payout requests yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {payouts.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">${parseFloat(p.amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {PAYOUT_METHODS.find(m => m.value === p.method)?.label ?? p.method} · {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-500")}>
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AffiliateLayout>
  );
}
