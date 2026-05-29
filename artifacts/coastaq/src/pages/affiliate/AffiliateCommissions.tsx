import { useState, useEffect } from "react";
import { AffiliateLayout } from "./AffiliateLayout";
import { DollarSign } from "lucide-react";

export default function AffiliateCommissions() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/affiliates/me/commissions").then(r => r.ok ? r.json() : []).then(d => { setCommissions(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalPending = commissions.filter(c => c.status === "pending").reduce((s, c) => s + parseFloat(c.amount), 0);
  const totalPaid = commissions.filter(c => c.status === "paid").reduce((s, c) => s + parseFloat(c.amount), 0);

  return (
    <AffiliateLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Commissions</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-3">
          <div className="bg-yellow-100 text-yellow-600 p-3 rounded-xl"><DollarSign className="w-5 h-5" /></div>
          <div><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold">${totalPending.toFixed(2)}</p></div>
        </div>
        <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-3">
          <div className="bg-green-100 text-green-600 p-3 rounded-xl"><DollarSign className="w-5 h-5" /></div>
          <div><p className="text-xs text-muted-foreground">Paid</p><p className="text-xl font-bold">${totalPaid.toFixed(2)}</p></div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-card border rounded-2xl p-4 h-16 animate-pulse" />)}</div>
      ) : commissions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No commissions yet. Share your links to start earning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {commissions.map(c => (
            <div key={c.id} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm">Order #{c.orderId.slice(0, 8)}…</p>
                <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">+${parseFloat(c.amount).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{c.rate}% rate</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ml-2 ${c.status === "paid" ? "bg-green-100 text-green-700" : c.status === "approved" ? "bg-blue-100 text-blue-700" : c.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </AffiliateLayout>
  );
}
