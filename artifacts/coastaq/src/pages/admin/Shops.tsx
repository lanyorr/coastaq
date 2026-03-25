import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, PauseCircle, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Shop {
  id: string; name: string; description?: string;
  isApproved: boolean; isSuspended: boolean;
  subscriptionStatus: string; createdAt: string;
  userId: string; ownerName?: string; ownerEmail?: string;
}

const SUB_COLORS: Record<string, string> = {
  TRIAL: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export default function AdminShops() {
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status, page: String(page), limit: "20" });
    const r = await fetch(`/api/admin/shops?${params}`);
    const d = await r.json();
    setShops(d.shops ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, status, page]);

  const approve = async (shop: Shop, action: "approve" | "reject") => {
    const r = await fetch(`/api/admin/shops/${shop.id}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (r.ok) { toast({ title: action === "approve" ? "Shop approved" : "Shop rejected" }); load(); }
  };

  const toggleSuspend = async (shop: Shop) => {
    const r = await fetch(`/api/admin/shops/${shop.id}/suspend`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspend: !shop.isSuspended }),
    });
    if (r.ok) { toast({ title: shop.isSuspended ? "Shop unsuspended" : "Shop suspended" }); load(); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-display font-bold">Shops <span className="text-muted-foreground text-base font-normal">({total})</span></h1>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search shops..." className="pl-9 w-52" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="border border-input bg-background rounded-md px-3 text-sm h-10" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Shop</th>
                  <th className="px-5 py-3 text-left">Owner</th>
                  <th className="px-5 py-3 text-left">Subscription</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map(s => (
                  <tr key={s.id} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{s.description}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{s.ownerName}</p>
                      <p className="text-xs text-muted-foreground">{s.ownerEmail}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", SUB_COLORS[s.subscriptionStatus] ?? "bg-gray-100")}>
                        {s.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {s.isSuspended ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">Suspended</span>
                      ) : s.isApproved ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">Approved</span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!s.isApproved && !s.isSuspended && (
                          <>
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => approve(s, "approve")}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => approve(s, "reject")}><XCircle className="w-4 h-4 mr-1" />Reject</Button>
                          </>
                        )}
                        {s.isApproved && (
                          <Button variant="ghost" size="sm" className={s.isSuspended ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"} onClick={() => toggleSuspend(s)}>
                            {s.isSuspended ? <><PlayCircle className="w-4 h-4 mr-1" />Restore</> : <><PauseCircle className="w-4 h-4 mr-1" />Suspend</>}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {shops.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No shops found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
