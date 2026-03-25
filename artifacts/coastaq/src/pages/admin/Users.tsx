import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, ShieldBan, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface User { id: string; name: string; email: string; role: string; isBlocked: boolean; createdAt: string; }

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  SELLER: "bg-blue-100 text-blue-700",
  BUYER: "bg-green-100 text-green-700",
};

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, role, status, page: String(page), limit: "20" });
    const r = await fetch(`/api/admin/users?${params}`);
    const d = await r.json();
    setUsers(d.users ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, role, status, page]);

  const toggleBlock = async (user: User) => {
    const r = await fetch(`/api/admin/users/${user.id}/block`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ block: !user.isBlocked }),
    });
    if (r.ok) {
      toast({ title: user.isBlocked ? "User unblocked" : "User blocked" });
      load();
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-display font-bold">Users <span className="text-muted-foreground text-base font-normal">({total})</span></h1>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9 w-52" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="border border-input bg-background rounded-md px-3 text-sm h-10" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SELLER">Seller</option>
            <option value="BUYER">Buyer</option>
          </select>
          <select className="border border-input bg-background rounded-md px-3 text-sm h-10" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
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
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", ROLE_COLORS[u.role] ?? "bg-gray-100")}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.isBlocked
                        ? <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-700">Blocked</span>
                        : <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">Active</span>}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      {u.role !== "ADMIN" && (
                        <Button variant="ghost" size="sm" className={u.isBlocked ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"} onClick={() => toggleBlock(u)}>
                          {u.isBlocked ? <><ShieldCheck className="w-4 h-4 mr-1" />Unblock</> : <><ShieldBan className="w-4 h-4 mr-1" />Block</>}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No users found</td></tr>
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
