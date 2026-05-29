import { useState, useRef, useEffect } from "react";
import {
  useGetMe, useListProducts, useListMyShops, useCreateProduct,
  useDeleteProduct, useListCategories,
} from "@workspace/api-client-react";
import { SellerLayout } from "./SellerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Package, Loader2, ImageIcon, Pencil, Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

const EMPTY_PRODUCT = {
  title: "", price: "", stock: "1", condition: "NEW" as const,
  description: "", location: "", image: "", parentCategoryId: "", categoryId: "",
};

export default function SellerProductsPage() {
  const [, setLocation] = useLocation();
  const { data: shops } = useListMyShops();
  const [activeShopId, setActiveShopId] = useState<string>("");
  const activeShop = (shops as any[])?.find(s => s.id === activeShopId) ?? (shops as any[])?.[0];

  const { data: productsData } = useListProducts({ shopId: activeShop?.id, limit: 100 } as any);
  const { data: categories } = useListCategories();
  const { mutate: createProduct, isPending: creatingProduct } = useCreateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<typeof EMPTY_PRODUCT & { id: string }>({ ...EMPTY_PRODUCT, id: "" });
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const products = (productsData as any)?.products ?? [];
  const parentCategories = (categories as any[]) ?? [];
  const selectedParent = parentCategories.find(c => c.id === newProduct.parentCategoryId);
  const subcategories: any[] = selectedParent?.children ?? [];

  useEffect(() => {
    if ((shops as any[])?.length && !activeShopId) setActiveShopId((shops as any[])[0].id);
  }, [shops, activeShopId]);

  useEffect(() => {
    setNewProduct(p => ({ ...p, categoryId: "" }));
  }, [newProduct.parentCategoryId]);

  const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/upload/image", { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json() as { url: string };
    return data.url;
  };

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try { const url = await uploadImage(file); setNewProduct(p => ({ ...p, image: url })); } catch (err: any) { toast({ variant: "destructive", title: "Upload failed", description: err.message }); }
    setImageUploading(false);
  };

  const handleEditImageUpload = async (file: File) => {
    setEditImageUploading(true);
    try { const url = await uploadImage(file); setEditProduct(p => ({ ...p, image: url })); } catch (err: any) { toast({ variant: "destructive", title: "Upload failed", description: err.message }); }
    setEditImageUploading(false);
  };

  const openEdit = (p: any) => {
    setEditProduct({ id: p.id, title: p.title ?? "", price: String(p.price ?? ""), stock: String(p.stock ?? "1"), condition: p.condition ?? "NEW", description: p.description ?? "", location: p.location ?? "", image: p.images?.[0] ?? "", parentCategoryId: "", categoryId: p.categoryId ?? "" });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const res = await fetch(`/api/products/${editProduct.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editProduct.title, price: parseFloat(editProduct.price), stock: parseInt(editProduct.stock), condition: editProduct.condition, description: editProduct.description, location: editProduct.location, images: editProduct.image ? [editProduct.image] : [], categoryId: editProduct.categoryId || editProduct.parentCategoryId || undefined }) });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))).error) || "Update failed");
      toast({ title: "Product updated" });
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    } catch (err: any) { toast({ variant: "destructive", title: "Failed to update", description: err.message }); }
    setEditSaving(false);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct({ data: { title: newProduct.title, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock), condition: newProduct.condition, description: newProduct.description, location: newProduct.location, images: newProduct.image ? [newProduct.image] : [], categoryId: newProduct.categoryId || newProduct.parentCategoryId || undefined } } as any, {
      onSuccess: () => { toast({ title: "Product added!" }); setIsAddOpen(false); setNewProduct(EMPTY_PRODUCT); queryClient.invalidateQueries({ queryKey: ["/api/products"] }); },
      onError: (err: any) => {
        if (err?.status === 402) { toast({ variant: "destructive", title: "Subscription required", description: "Go to Subscription to renew." }); setIsAddOpen(false); setLocation("/seller/subscription"); }
        else toast({ variant: "destructive", title: "Failed to add", description: err.message });
      },
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteProduct({ id } as any, { onSuccess: () => { toast({ title: "Product deleted" }); queryClient.invalidateQueries({ queryKey: ["/api/products"] }); } });
  };

  return (
    <SellerLayout>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} listing{products.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {(shops as any[])?.length > 1 && (
            <select value={activeShopId} onChange={e => setActiveShopId(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              {(shops as any[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 rounded-xl bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddOpen} onOpenChange={open => { setIsAddOpen(open); if (!open) setNewProduct(EMPTY_PRODUCT); }}>
        <DialogContent className="sm:max-w-[640px] rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-display">Add New Product</DialogTitle></DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-5 mt-4">
            <div className="space-y-2"><Label>Product Title <span className="text-destructive">*</span></Label><Input required value={newProduct.title} onChange={e => setNewProduct({ ...newProduct, title: e.target.value })} placeholder="e.g. Vintage Camera" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newProduct.parentCategoryId} onChange={e => setNewProduct({ ...newProduct, parentCategoryId: e.target.value })}>
                  <option value="">Select category…</option>
                  {parentCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newProduct.categoryId} onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })} disabled={subcategories.length === 0}>
                  <option value="">{subcategories.length === 0 ? "Select category first" : "Select subcategory…"}</option>
                  {subcategories.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Price ($) <span className="text-destructive">*</span></Label><Input type="number" step="0.01" min="0" required placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} /></div>
              <div className="space-y-2"><Label>Stock <span className="text-destructive">*</span></Label><Input type="number" min="0" required placeholder="1" value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} /></div>
              <div className="space-y-2"><Label>Condition</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newProduct.condition} onChange={e => setNewProduct({ ...newProduct, condition: e.target.value as any })}><option value="NEW">New</option><option value="USED">Used</option><option value="REFURBISHED">Refurbished</option></select></div>
            </div>
            <div className="space-y-2"><Label>Location</Label><Input placeholder="e.g. Victoria Island, Lagos" value={newProduct.location} onChange={e => setNewProduct({ ...newProduct, location: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Product Image</Label>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }} />
              {newProduct.image ? (
                <div className="relative rounded-xl overflow-hidden bg-secondary/30 h-44 group">
                  <img src={newProduct.image} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow">Change</button>
                    <button type="button" onClick={() => setNewProduct(p => ({ ...p, image: "" }))} className="bg-white text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg shadow">Remove</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading} className="w-full h-36 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 bg-secondary/30">
                  {imageUploading ? <><Loader2 className="w-6 h-6 animate-spin" /><span className="text-sm">Uploading…</span></> : <><ImageIcon className="w-7 h-7" /><span className="text-sm font-medium">Click to upload photo</span><span className="text-xs">JPEG, PNG, WebP up to 10MB</span></>}
                </button>
              )}
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea rows={3} placeholder="Describe your product…" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => { setIsAddOpen(false); setNewProduct(EMPTY_PRODUCT); }}>Cancel</Button>
              <Button type="submit" className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700" disabled={creatingProduct}>{creatingProduct ? <Loader2 className="animate-spin w-5 h-5" /> : "Add Product"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[640px] rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-display">Edit Product</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-5 mt-4">
            <div className="space-y-2"><Label>Product Title <span className="text-destructive">*</span></Label><Input required value={editProduct.title} onChange={e => setEditProduct({ ...editProduct, title: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Price ($) <span className="text-destructive">*</span></Label><Input type="number" step="0.01" min="0" required value={editProduct.price} onChange={e => setEditProduct({ ...editProduct, price: e.target.value })} /></div>
              <div className="space-y-2"><Label>Stock <span className="text-destructive">*</span></Label><Input type="number" min="0" required value={editProduct.stock} onChange={e => setEditProduct({ ...editProduct, stock: e.target.value })} /></div>
              <div className="space-y-2"><Label>Condition</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editProduct.condition} onChange={e => setEditProduct({ ...editProduct, condition: e.target.value as any })}><option value="NEW">New</option><option value="USED">Used</option><option value="REFURBISHED">Refurbished</option></select></div>
            </div>
            <div className="space-y-2"><Label>Location</Label><Input placeholder="e.g. Victoria Island, Lagos" value={editProduct.location} onChange={e => setEditProduct({ ...editProduct, location: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Product Image</Label>
              <input ref={editFileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleEditImageUpload(f); e.target.value = ""; }} />
              {editProduct.image ? (
                <div className="relative rounded-xl overflow-hidden bg-secondary/30 h-44 group">
                  <img src={editProduct.image} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button type="button" onClick={() => editFileInputRef.current?.click()} className="bg-white text-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow">Change</button>
                    <button type="button" onClick={() => setEditProduct(p => ({ ...p, image: "" }))} className="bg-white text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg shadow">Remove</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => editFileInputRef.current?.click()} disabled={editImageUploading} className="w-full h-36 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 bg-secondary/30">
                  {editImageUploading ? <><Loader2 className="w-6 h-6 animate-spin" /><span className="text-sm">Uploading…</span></> : <><ImageIcon className="w-7 h-7" /><span className="text-sm font-medium">Click to upload photo</span></>}
                </button>
              )}
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea rows={3} value={editProduct.description} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 h-12 rounded-xl" disabled={editSaving}>{editSaving ? <Loader2 className="animate-spin w-5 h-5" /> : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Products table */}
      {products.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-14 text-center">
          <Package className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-semibold mb-1">No products yet</p>
          <p className="text-sm text-muted-foreground mb-4">Click "Add Product" to start listing items in your shop.</p>
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 rounded-xl bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4" /> Add First Product</Button>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                <tr>
                  <th className="px-4 py-3 w-12" />
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate" title={p.title}>{p.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.category?.name ?? <span className="italic">Uncategorized</span>}</td>
                    <td className="px-4 py-3 text-primary font-bold">${p.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${p.condition === "NEW" ? "bg-green-100 text-green-700" : p.condition === "USED" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{p.condition}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 text-primary hover:bg-primary hover:text-white" onClick={() => openEdit(p)} title="Edit"><Pencil className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDelete(p.id, p.title)} title="Delete"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </SellerLayout>
  );
}
