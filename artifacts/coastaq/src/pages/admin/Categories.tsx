import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface Category { id: string; name: string; parentId?: string | null; }

export default function AdminCategories() {
  const { toast } = useToast();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/categories");
      if (!r.ok) { setLoading(false); return; }
      const d = await r.json();
      setCats(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const r = await fetch("/api/admin/categories", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (r.ok) { toast({ title: "Category created" }); setNewName(""); load(); }
    setAdding(false);
  };

  const save = async (id: string) => {
    if (!editName.trim()) return;
    const r = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (r.ok) { toast({ title: "Category updated" }); setEditing(null); load(); }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const r = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const d = await r.json();
      toast({ title: d.error ?? "Cannot delete", variant: "destructive" });
    } else {
      toast({ title: "Category deleted" });
      load();
    }
  };

  const topLevel = cats.filter(c => !c.parentId);
  const children = (parentId: string) => cats.filter(c => c.parentId === parentId);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Categories</h1>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm mb-6">
        <h2 className="font-semibold mb-3">Add New Category</h2>
        <div className="flex gap-2">
          <Input placeholder="Category name..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} className="max-w-xs" />
          <Button onClick={add} disabled={adding || !newName.trim()}>
            <Plus className="w-4 h-4 mr-1" />Add
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
        ) : topLevel.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No categories yet</p>
        ) : (
          <ul className="divide-y divide-border/50">
            {topLevel.map(cat => (
              <li key={cat.id}>
                <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                  {editing === cat.id ? (
                    <>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && save(cat.id)} className="flex-1 max-w-xs h-8" autoFocus />
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-green-600" onClick={() => save(cat.id)}><Check className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium">{cat.name}</span>
                      <span className="text-xs text-muted-foreground">{children(cat.id).length} sub-categories</span>
                      <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setEditing(cat.id); setEditName(cat.name); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600" onClick={() => remove(cat.id, cat.name)}><Trash2 className="w-4 h-4" /></Button>
                    </>
                  )}
                </div>
                {children(cat.id).map(child => (
                  <div key={child.id} className="flex items-center gap-3 px-5 py-3 pl-12 bg-secondary/10 border-t border-border/30 hover:bg-secondary/20 transition-colors">
                    {editing === child.id ? (
                      <>
                        <Input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && save(child.id)} className="flex-1 max-w-xs h-8" autoFocus />
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-green-600" onClick={() => save(child.id)}><Check className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-muted-foreground">↳ {child.name}</span>
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => { setEditing(child.id); setEditName(child.name); }}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600" onClick={() => remove(child.id, child.name)}><Trash2 className="w-4 h-4" /></Button>
                      </>
                    )}
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
