import { useAdminListSellers, useAdminGetAnalytics, useAdminApproveSeller } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Store, Users, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
      </div>
    </div>
  );
}
