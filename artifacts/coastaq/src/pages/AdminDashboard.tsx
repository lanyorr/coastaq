import { useAdminListSellers, useAdminGetAnalytics, useAdminApproveSeller } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import {
  Store, Users, TrendingUp, CheckCircle, Clock,
  Shield, DollarSign, AlertTriangle, Flag, Lock, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const { data: analytics } = useAdminGetAnalytics();
  const { data: sellers } = useAdminListSellers();
  const { mutate: approve } = useAdminApproveSeller();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleApprove = (id: string) => {
    approve({ id }, {
      onSuccess: () => {
        toast({ title: "Seller Approved" });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers"] });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-display font-bold mb-8">Platform Admin</h1>

        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="bg-blue-100 text-blue-600 p-4 rounded-xl"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Users</p>
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="bg-green-100 text-green-600 p-4 rounded-xl"><TrendingUp className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Platform Revenue</p>
                <p className="text-2xl font-bold">${analytics.totalRevenue?.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className="bg-orange-100 text-orange-600 p-4 rounded-xl"><Store className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Pending Sellers</p>
                <p className="text-2xl font-bold">{analytics.pendingApprovals}</p>
              </div>
            </div>
          </div>
        )}

        <Tabs defaultValue="sellers">
          <TabsList className="mb-6 bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="sellers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5">
              <Store className="w-4 h-4 mr-1.5" /> Seller Applications
            </TabsTrigger>
            <TabsTrigger value="escrow" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5">
              <Shield className="w-4 h-4 mr-1.5" /> Escrow Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-6">Seller Applications</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                    <tr>
                      <th className="px-6 py-4 rounded-l-xl">Seller Name</th>
                      <th className="px-6 py-4">Shop Name</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers?.map((seller) => (
                      <tr key={seller.id} className="border-b border-border/50 last:border-0">
                        <td className="px-6 py-4 font-medium">{seller.name} <br/><span className="text-xs text-muted-foreground">{seller.email}</span></td>
                        <td className="px-6 py-4">{seller.shop?.name || '-'}</td>
                        <td className="px-6 py-4">
                          {seller.shop?.isApproved ? (
                            <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded w-max"><CheckCircle className="w-3 h-3 mr-1"/> Approved</span>
                          ) : (
                            <span className="flex items-center text-orange-600 text-xs font-bold bg-orange-50 px-2 py-1 rounded w-max"><Clock className="w-3 h-3 mr-1"/> Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {!seller.shop?.isApproved && seller.shop && (
                            <Button size="sm" onClick={() => handleApprove(seller.id)}>Approve</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="escrow">
            <EscrowManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EscrowManagement() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("disputed");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = (status: string) => {
    setLoading(true);
    const q = status === "all" ? "" : `?status=${status}`;
    Promise.all([
      fetch("/api/escrow/admin/stats").then(r => r.json()),
      fetch(`/api/escrow/admin/orders${q}`).then(r => r.json()),
    ])
      .then(([s, o]) => {
        setStats(s);
        setOrders(Array.isArray(o) ? o : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const adminAction = async (orderId: string, action: "release" | "refund") => {
    setActionLoadingId(orderId);
    try {
      const r = await fetch(`/api/escrow/admin/${orderId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: `Admin ${action} via dashboard` }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      toast({
        title: action === "release" ? "Funds Released" : "Order Refunded",
        description: data.message,
      });
      load(filter);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setActionLoadingId(null);
  };

  const PSMAP: Record<string, { label: string; color: string }> = {
    escrowed: { label: "Escrowed",  color: "bg-blue-100 text-blue-700" },
    released: { label: "Released",  color: "bg-green-100 text-green-700" },
    refunded: { label: "Refunded",  color: "bg-orange-100 text-orange-700" },
    disputed: { label: "Disputed",  color: "bg-red-100 text-red-700" },
    pending:  { label: "Pending",   color: "bg-gray-100 text-gray-600" },
  };

  return (
    <div className="space-y-6">
      {/* Escrow stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Lock className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Held in Escrow</p>
              <p className="text-lg font-bold">${Number(stats.escrowedFunds).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.escrowedCount} orders</p>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex items-center gap-3">
            <div className="bg-green-100 text-green-600 p-3 rounded-xl"><DollarSign className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Released</p>
              <p className="text-lg font-bold">${Number(stats.releasedFunds).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{stats.releasedCount} orders</p>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex items-center gap-3">
            <div className="bg-red-100 text-red-600 p-3 rounded-xl"><Flag className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Disputes</p>
              <p className="text-lg font-bold">{stats.disputedCount}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex items-center gap-3">
            <div className="bg-purple-100 text-purple-600 p-3 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Platform Fees</p>
              <p className="text-lg font-bold">${Number(stats.commissionsEarned).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">5% per order</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs + table */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-xl font-bold">Escrow Orders</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {["disputed", "escrowed", "released", "refunded", "all"].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${filter === s ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <button
              onClick={() => load(filter)}
              className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="animate-pulse bg-secondary/50 rounded-xl h-16" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No orders with status "{filter}"
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 text-left rounded-l-xl">Order</th>
                  <th className="px-4 py-3 text-left">Buyer</th>
                  <th className="px-4 py-3 text-left">Seller</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Dispute Reason</th>
                  <th className="px-4 py-3 text-left rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const ps = PSMAP[o.paymentStatus] ?? PSMAP.pending;
                  const canAct = ["escrowed", "disputed"].includes(o.paymentStatus);
                  return (
                    <tr key={o.id} className="border-t border-border/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{o.id.slice(-8)}</td>
                      <td className="px-4 py-3 text-xs">{o.buyer?.name ?? o.userId.slice(-6)}</td>
                      <td className="px-4 py-3 text-xs">{o.seller?.name ?? (o.sellerId ? o.sellerId.slice(-6) : "—")}</td>
                      <td className="px-4 py-3 font-medium">${Number(o.total).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${ps.color}`}>
                          {ps.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {o.disputeReason ? (
                          <p className="text-xs text-red-600 truncate" title={o.disputeReason}>{o.disputeReason}</p>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canAct && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => adminAction(o.id, "release")}
                              disabled={actionLoadingId === o.id}
                              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              Release
                            </button>
                            <button
                              onClick={() => adminAction(o.id, "refund")}
                              disabled={actionLoadingId === o.id}
                              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              Refund
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
