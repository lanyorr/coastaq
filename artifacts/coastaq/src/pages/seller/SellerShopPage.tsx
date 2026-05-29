import { useState, useRef, useEffect } from "react";
import { useListMyShops, useUpdateShop } from "@workspace/api-client-react";
import { SellerLayout } from "./SellerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Store, Loader2, ImageIcon, Upload, ExternalLink,
  Phone, Globe, Facebook, Instagram, Twitter, Youtube,
  MapPin, X as XIcon, CheckCircle2, AlertTriangle, Trash2, Plus,
} from "lucide-react";
import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function SellerShopPage() {
  const { data: user } = useGetMe();
  const { data: shops, refetch: refetchShops } = useListMyShops();
  const [activeShopId, setActiveShopId] = useState<string>("");
  const activeShop = (shops as any[])?.find(s => s.id === activeShopId) ?? (shops as any[])?.[0];

  const { mutateAsync: updateShopAsync, isPending: updatingShop } = useUpdateShop();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [shopForm, setShopForm] = useState({
    name: "", slug: "", description: "", phone: "", whatsapp: "", email: "", website: "",
    address: "", city: "", country: "", businessHours: "", accentColor: "#1d4ed8",
    facebookUrl: "", instagramUrl: "", tiktokUrl: "", twitterUrl: "", youtubeUrl: "",
    logo: "", banner: "",
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [createShopOpen, setCreateShopOpen] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [creatingNewShop, setCreatingNewShop] = useState(false);

  useEffect(() => {
    if ((shops as any[])?.length && !activeShopId) setActiveShopId((shops as any[])[0].id);
  }, [shops, activeShopId]);

  useEffect(() => {
    if (activeShop) {
      const s = activeShop as any;
      setShopForm({ name: s.name ?? "", slug: s.slug ?? "", description: s.description ?? "", phone: s.phone ?? "", whatsapp: s.whatsapp ?? "", email: s.email ?? "", website: s.website ?? "", address: s.address ?? "", city: s.city ?? "", country: s.country ?? "", businessHours: s.businessHours ?? "", accentColor: s.accentColor ?? "#1d4ed8", facebookUrl: s.facebookUrl ?? "", instagramUrl: s.instagramUrl ?? "", tiktokUrl: s.tiktokUrl ?? "", twitterUrl: s.twitterUrl ?? "", youtubeUrl: s.youtubeUrl ?? "", logo: s.logo ?? "", banner: s.banner ?? "" });
    }
  }, [activeShop?.id]);

  const sf = (key: keyof typeof shopForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setShopForm(p => ({ ...p, [key]: e.target.value }));

  const uploadImg = async (file: File) => {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/upload/image", { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    return ((await res.json()) as { url: string }).url;
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try { const url = await uploadImg(file); setShopForm(p => ({ ...p, logo: url })); } catch (err: any) { toast({ variant: "destructive", title: "Upload failed", description: err.message }); }
    setLogoUploading(false);
  };

  const handleBannerUpload = async (file: File) => {
    setBannerUploading(true);
    try { const url = await uploadImg(file); setShopForm(p => ({ ...p, banner: url })); } catch (err: any) { toast({ variant: "destructive", title: "Upload failed", description: err.message }); }
    setBannerUploading(false);
  };

  const handleShopUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShop?.id) return;
    try {
      await updateShopAsync({ id: activeShop.id, data: shopForm as any });
      toast({ title: "Shop updated", description: "Your profile has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/shops/my/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shops/my"] });
    } catch (err: any) { toast({ variant: "destructive", title: "Save failed", description: err?.message ?? "Unknown error" }); }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;
    setCreatingNewShop(true);
    try {
      const res = await fetch("/api/shops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newShopName.trim() }) });
      if (!res.ok) { const err = await res.json().catch(() => ({ error: "Failed" })); throw new Error(err.error ?? "Failed"); }
      const created = await res.json() as { id: string };
      await refetchShops();
      setActiveShopId(created.id);
      setCreateShopOpen(false);
      setNewShopName("");
      toast({ title: "Shop created!", description: `"${newShopName.trim()}" is pending approval.` });
    } catch (err: any) { toast({ variant: "destructive", title: "Failed to create shop", description: err.message }); }
    setCreatingNewShop(false);
  };

  return (
    <SellerLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Shop Settings</h1>
        <div className="flex items-center gap-2">
          {(shops as any[])?.length > 1 && (
            <select value={activeShopId} onChange={e => setActiveShopId(e.target.value)} className="h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none">
              {(shops as any[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {(!(shops as any[]) || (shops as any[]).length < 3) && (
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => setCreateShopOpen(true)}>
              <Plus className="w-4 h-4" /> New Shop
            </Button>
          )}
        </div>
      </div>

      {/* Create shop inline form */}
      {createShopOpen && (
        <div className="bg-card border border-border/50 rounded-2xl p-5 mb-6">
          <p className="font-semibold mb-3">Create New Shop</p>
          <form onSubmit={handleCreateShop} className="flex gap-2">
            <Input value={newShopName} onChange={e => setNewShopName(e.target.value)} placeholder="Shop name" required className="flex-1 rounded-xl" autoFocus />
            <Button type="submit" disabled={creatingNewShop || !newShopName.trim()} className="rounded-xl gap-1.5">
              {creatingNewShop ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </Button>
            <Button type="button" variant="ghost" className="rounded-xl" onClick={() => { setCreateShopOpen(false); setNewShopName(""); }}>Cancel</Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">Each new shop requires admin approval. You can have up to 3 shops.</p>
        </div>
      )}

      <form onSubmit={handleShopUpdate} className="space-y-6">
        {/* Banner & Logo */}
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="relative h-32 bg-secondary overflow-hidden">
            {shopForm.banner ? <img src={shopForm.banner} alt="Banner" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><ImageIcon className="w-10 h-10" /></div>}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <button type="button" onClick={() => bannerInputRef.current?.click()} className="bg-white/90 text-foreground text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white">
                {bannerUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {bannerUploading ? "Uploading…" : "Change Banner"}
              </button>
            </div>
            {shopForm.banner && <button type="button" onClick={() => setShopForm(p => ({ ...p, banner: "" }))} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"><XIcon className="w-3.5 h-3.5" /></button>}
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleBannerUpload(f); e.target.value = ""; }} />
          </div>
          <div className="px-6 pb-6 pt-4 space-y-5">
            <div className="flex items-end gap-4 -mt-10">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-4 border-background shadow-lg bg-secondary shrink-0">
                {shopForm.logo ? <img src={shopForm.logo} alt="Logo" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: shopForm.accentColor }}><Store className="w-8 h-8 text-white" /></div>}
                <button type="button" onClick={() => logoInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  {logoUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }} />
              </div>
              <div className="flex-1 pb-1 space-y-1">
                <p className="text-sm font-semibold">{shopForm.name || "Your Shop"}</p>
                {(activeShop as any)?.slug && <a href={`/shop/${(activeShop as any).slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="w-3 h-3" />View Public Storefront</a>}
              </div>
              <div className="flex items-center gap-2 pb-1">
                <label className="text-xs text-muted-foreground font-medium">Accent</label>
                <input type="color" value={shopForm.accentColor} onChange={sf("accentColor")} className="w-8 h-8 rounded-lg border border-border cursor-pointer p-0.5" title="Accent color" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2 sm:col-span-2"><Label className="font-semibold">Shop Name <span className="text-red-500">*</span></Label><Input value={shopForm.name} onChange={sf("name")} required className="h-11 rounded-xl" placeholder="My Awesome Shop" /></div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-semibold">Shop URL (Slug)</Label>
                <div className="flex items-center h-11 rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                  <span className="px-3 text-sm text-muted-foreground border-r border-input bg-secondary h-full flex items-center shrink-0">coastaq.com/shop/</span>
                  <input type="text" value={shopForm.slug} onChange={e => setShopForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/--+/g, "-") }))} className="flex-1 h-full px-3 text-sm bg-transparent outline-none" placeholder="my-awesome-shop" />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2"><Label className="font-semibold">Description</Label><Textarea value={shopForm.description} onChange={sf("description")} rows={4} className="rounded-xl resize-none" placeholder="Tell customers what your shop is about…" /></div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={shopForm.email} onChange={sf("email")} className="h-11 rounded-xl" placeholder="shop@example.com" /></div>
            <div className="space-y-2"><Label>Website</Label><Input type="url" value={shopForm.website} onChange={sf("website")} className="h-11 rounded-xl" placeholder="https://yoursite.com" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={shopForm.phone} onChange={sf("phone")} className="h-11 rounded-xl" placeholder="+1 555 000 0000" /></div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input type="tel" value={shopForm.whatsapp} onChange={sf("whatsapp")} className="h-11 rounded-xl" placeholder="+1 555 000 0000" /></div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2 sm:col-span-2"><Label>Street Address</Label><Input value={shopForm.address} onChange={sf("address")} className="h-11 rounded-xl" placeholder="123 Market Street" /></div>
            <div className="space-y-2"><Label>City</Label><Input value={shopForm.city} onChange={sf("city")} className="h-11 rounded-xl" placeholder="Miami" /></div>
            <div className="space-y-2"><Label>Country</Label><Input value={shopForm.country} onChange={sf("country")} className="h-11 rounded-xl" placeholder="United States" /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Business Hours</Label><Textarea value={shopForm.businessHours} onChange={sf("businessHours")} rows={3} className="rounded-xl resize-none text-sm" placeholder={"Mon–Fri: 9am – 6pm\nSat: 10am – 4pm\nSun: Closed"} /></div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Social Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { key: "facebookUrl" as const, label: "Facebook", icon: <Facebook className="w-4 h-4 text-[#1877f2]" />, placeholder: "https://facebook.com/yourpage" },
              { key: "instagramUrl" as const, label: "Instagram", icon: <Instagram className="w-4 h-4 text-[#e1306c]" />, placeholder: "https://instagram.com/yourhandle" },
              { key: "tiktokUrl" as const, label: "TikTok", icon: <span className="w-4 h-4 text-xs font-black">TT</span>, placeholder: "https://tiktok.com/@yourhandle" },
              { key: "twitterUrl" as const, label: "X / Twitter", icon: <Twitter className="w-4 h-4" />, placeholder: "https://x.com/yourhandle" },
              { key: "youtubeUrl" as const, label: "YouTube", icon: <Youtube className="w-4 h-4 text-[#ff0000]" />, placeholder: "https://youtube.com/@yourchannel" },
            ].map(({ key, label, icon, placeholder }) => (
              <div key={key} className="space-y-2"><Label className="text-sm flex items-center gap-2">{icon} {label}</Label><Input type="url" value={shopForm[key]} onChange={sf(key)} className="h-11 rounded-xl text-sm" placeholder={placeholder} /></div>
            ))}
          </div>
        </div>

        {/* Save */}
        <Button type="submit" disabled={updatingShop} className="h-12 rounded-xl px-8 gap-2 bg-green-600 hover:bg-green-700">
          {updatingShop ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {updatingShop ? "Saving…" : "Save Changes"}
        </Button>

        {/* Danger Zone */}
        <div className="bg-card border border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-500" /><h2 className="font-semibold text-red-600">Danger Zone</h2></div>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account, shop, listings, orders, and messages. This cannot be undone.</p>
          <button type="button" onClick={() => setDeleteDialogOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-xl transition-colors">
            <Trash2 className="w-4 h-4" /> Delete My Account
          </button>
        </div>
      </form>

      <DeleteAccountDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onDeleted={() => { window.location.href = "/"; }} userName={(user as any)?.name} />
    </SellerLayout>
  );
}
