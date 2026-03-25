import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Flag, Ban, CheckCircle, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string; title: string; price: string; status: string;
  images: string[]; condition: string; createdAt: string;
  shopId: string; shopName?: string;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  FLAGGED: "bg-yellow-100 text-yellow-700",
  SUSPENDED: "bg-red-100 text-red-700",
};

export default function AdminProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status, page: String(page), limit: "20" });
    const r = await fetch(`/api/admin/products?${params}`);
    const d = await r.json();
    setProducts(d.products ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, status, page]);

  const setProductStatus = async (id: string, newStatus: "ACTIVE" | "FLAGGED" | "SUSPENDED") => {
    const r = await fetch(`/api/admin/products/${id}/status`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (r.ok) { toast({ title: `Product ${newStatus.toLowerCase()}` }); load(); }
  };

  const deleteProduct = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (r.ok) { toast({ title: "Product deleted" }); load(); }
    setDeleting(null);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-display font-bold">Products <span className="text-muted-foreground text-base font-normal">({total})</span></h1>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-9 w-52" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="border border-input bg-background rounded-md px-3 text-sm h-10" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="FLAGGED">Flagged</option>
            <option value="SUSPENDED">Suspended</option>
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
                  <th className="px-5 py-3 text-left">Product</th>
                  <th className="px-5 py-3 text-left">Shop</th>
                  <th className="px-5 py-3 text-left">Price</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      {p.images[0] ? (
                        <img src={p.images[0].startsWith("http") ? p.images[0] : `/api${p.images[0]}`} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-secondary" />
                      )}
                      <p className="font-medium line-clamp-2">{p.title}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{p.shopName ?? "-"}</td>
                    <td className="px-5 py-3.5 font-medium">${parseFloat(p.price).toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", STATUS_COLORS[p.status] ?? "bg-gray-100")}>{p.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status !== "ACTIVE" && (
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700" onClick={() => setProductStatus(p.id, "ACTIVE")}><CheckCircle className="w-4 h-4" /></Button>
                        )}
                        {p.status !== "FLAGGED" && (
                          <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700" onClick={() => setProductStatus(p.id, "FLAGGED")}><Flag className="w-4 h-4" /></Button>
                        )}
                        {p.status !== "SUSPENDED" && (
                          <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700" onClick={() => setProductStatus(p.id, "SUSPENDED")}><Ban className="w-4 h-4" /></Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" disabled={deleting === p.id} onClick={() => deleteProduct(p.id, p.title)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No products found</td></tr>
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
