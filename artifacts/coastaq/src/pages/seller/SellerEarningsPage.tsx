import { useState, useEffect } from "react";
import { SellerLayout } from "./SellerLayout";
import { DollarSign, Lock, TrendingUp, Shield } from "lucide-react";
import { StatCard, StatGrid } from "@/components/dashboard/StatCard";

const PSMAP: Record<string, { label: string; color: string }> = {
  escrowed: { label: "In Escrow",      color: "bg-blue-100 text-blue-700" },
  released: { label: "Released",       color: "bg-green-100 text-green-700" },
  refunded: { label: "Refunded",       color: "bg-orange-100 text-orange-700" },
  disputed: { label: "Disputed",       color: "bg-red-100 text-red-700" },
  pending:  { label: "Pending",        color: "bg-gray-100 text-gray-600" },
};

export default function SellerEarningsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/escrow/seller/summary").then(r => r.json()),
      fetch("/api/escrow/seller/orders").then(r => r.json()),
    ])
      .then(([s, o]) => { setSummary(s); setOrders(Array.isArray(o) ? o : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <SellerLayout><div className="space-y-4">{[1,2,3].map(i => <div key={i} className="animate-pulse bg-secondary/50 rounded-2xl h-20" />)}</div></SellerLayout>;
  }

  return (
    <SellerLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Earnings</h1>

      <StatGrid cols={3}>
        <StatCard label="Held in Escrow" value={`$${Number(summary?.totalEscrowed ?? 0).toFixed(2)}`} icon={Lock} color="bg-blue-100 text-blue-600" />
        <StatCard label="Total Released" value={`$${Number(summary?.totalReleased ?? 0).toFixed(2)}`} icon={DollarSign} color="bg-green-100 text-green-600" />
        <StatCard label="Total Orders" value={summary?.orderCount ?? 0} icon={TrendingUp} color="bg-purple-100 text-purple-600" />
      </StatGrid>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-6 text-sm text-blue-800">
        <Shield className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
        <div>
          <p className="font-semibold">How escrow protects your earnings</p>
          <p className="text-xs mt-1 text-blue-700/80">Buyer payments are held securely in escrow. Funds are released automatically 7 days after delivery, or immediately when the buyer confirms receipt. A 5% platform fee applies.</p>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mt-6">
        <h3 className="font-semibold text-lg mb-4">Earnings Breakdown</h3>
        {orders.length === 0 ? (
          <div className="text-center py-10">
            <DollarSign className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No orders with escrow payments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="text-left py-2 px-3">Order</th>
                  <th className="text-left py-2 px-3">Buyer Amount</th>
                  <th className="text-left py-2 px-3">Platform Fee</th>
                  <th className="text-left py-2 px-3">Your Share</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => {
                  const ps = PSMAP[o.paymentStatus] ?? PSMAP.pending;
                  return (
                    <tr key={o.id} className="border-t border-border/30">
                      <td className="py-3 px-3 font-mono text-xs text-muted-foreground">#{o.id.slice(-8)}</td>
                      <td className="py-3 px-3 font-medium">${Number(o.escrowAmount ?? o.total ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-3 text-muted-foreground">${Number(o.platformFee ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-3 font-semibold text-green-700">${Number(o.sellerAmount ?? 0).toFixed(2)}</td>
                      <td className="py-3 px-3"><span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${ps.color}`}>{ps.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SellerLayout>
  );
}
