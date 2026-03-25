import { useState, useEffect, useRef } from "react";
import {
  useGetMe, useListProducts, useGetMyShop, useUpdateMyShop,
  useCreateProduct, useDeleteProduct, useListCategories,
} from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Store, Package, Settings, Plus, Trash2, Loader2, Home,
  ImageIcon, AlertCircle, CreditCard, MessageCircle, ChevronRight, Inbox,
  ShoppingBag, CheckCircle2, XCircle, Truck, Clock as ClockIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  SubscriptionPanel,
  SubscriptionExpiredBanner,
} from "@/components/subscription/SubscriptionPanel";
import { useSubscriptionStatus } from "@/hooks/use-subscription";

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SellerInbox() {
  const [, setLocation] = useLocation();
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages/conversations")
      .then(r => r.json())
      .then(d => { setConvs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg">Buyer Messages</h3>
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setLocation("/messages")}>
          Open inbox
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-3 p-3 rounded-xl animate-pulse">
              <div className="w-10 h-10 rounded-full bg-secondary shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-secondary rounded w-1/4" />
                <div className="h-3 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : convs.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">When buyers enquire about your listings, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convs.slice(0, 8).map((conv: any) => (
            <button
              key={conv.id}
              onClick={() => setLocation(`/messages/${conv.id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground/80"}`}>
                    {conv.otherUser?.name ?? "Buyer"}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 w-5 h-5 flex items-center justify-center">{conv.unreadCount}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">{conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : ""}</span>
                  </div>
                </div>
                {conv.product && (
                  <p className="text-[11px] text-primary/60 truncate">{conv.product.title}</p>
                )}
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage?.content ?? "No messages yet"}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
          {convs.length > 8 && (
            <button onClick={() => setLocation("/messages")} className="w-full text-sm text-primary font-semibold py-2 hover:underline">
              View all {convs.length} conversations →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PENDING:   { label: "Pending",   icon: <ClockIcon className="w-3.5 h-3.5" />,      className: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Confirmed", icon: <CheckCircle2 className="w-3.5 h-3.5" />,   className: "bg-blue-50 text-blue-700 border-blue-200" },
  SHIPPED:   { label: "Shipped",   icon: <Truck className="w-3.5 h-3.5" />,           className: "bg-purple-50 text-purple-700 border-purple-200" },
  DELIVERED: { label: "Delivered", icon: <CheckCircle2 className="w-3.5 h-3.5" />,   className: "bg-green-50 text-green-700 border-green-200" },
  CANCELLED: { label: "Cancelled", icon: <XCircle className="w-3.5 h-3.5" />,         className: "bg-red-50 text-red-700 border-red-200" },
};

function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    fetch("/api/orders/seller")
      .then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      const r = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error("Failed");
      toast({ title: "Order updated", description: `Status changed to ${status.toLowerCase()}.` });
      load();
    } catch {
      toast({ title: "Error", description: "Could not update order.", variant: "destructive" });
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
        <h3 className="font-display font-semibold text-lg mb-6">Requested Orders</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-secondary/50 rounded-2xl p-4 h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg">Requested Orders</h3>
        <span className="text-sm text-muted-foreground">{orders.length} total</span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">When buyers place orders on your listings, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
            const item = order.items?.[0];
            return (
              <div key={order.id} className="border border-border/50 rounded-2xl p-4 space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(-8)}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.className}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground text-sm mt-1 truncate">
                      {item?.product?.title ?? "Unknown Product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item?.quantity ?? 1} · Total: ${Number(order.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {order.buyerNote && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{order.buyerNote}"</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">${Number(order.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Buyer info */}
                {order.buyer && (
                  <div className="text-xs text-muted-foreground bg-secondary/60 rounded-xl px-3 py-2">
                    Buyer: <span className="font-medium text-foreground">{order.buyer.name}</span> · {order.buyer.email}
                  </div>
                )}

                {/* Status actions */}
                {order.status === "PENDING" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => updateStatus(order.id, "CONFIRMED")}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {updatingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Confirm Order
                    </button>
                    <button
                      onClick={() => updateStatus(order.id, "CANCELLED")}
                      disabled={updatingId === order.id}
                      className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3 h-3" /> Decline
                    </button>
                  </div>
                )}
                {order.status === "CONFIRMED" && (
                  <button
                    onClick={() => updateStatus(order.id, "SHIPPED")}
                    disabled={updatingId === order.id}
                    className="w-full py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {updatingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Truck className="w-3 h-3" />}
                    Mark as Shipped
                  </button>
                )}
                {order.status === "SHIPPED" && (
                  <button
                    onClick={() => updateStatus(order.id, "DELIVERED")}
                    disabled={updatingId === order.id}
                    className="w-full py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {updatingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Mark as Delivered
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const EMPTY_PRODUCT = {
  title: "", price: "", stock: "1",
  condition: "NEW" as "NEW" | "USED" | "REFURBISHED",
  description: "", location: "", image: "",
  parentCategoryId: "", categoryId: "",
};

export default function SellerDashboard() {
  const { data: user } = useGetMe();
  const { data: shop } = useGetMyShop();
  const { data: productsData } = useListProducts({ shopId: shop?.id, limit: 100 });
  const { data: categories } = useListCategories();
  const { data: sub } = useSubscriptionStatus();
  const { mutate: updateShop, isPending: updatingShop } = useUpdateMyShop();
  const { mutate: createProduct, isPending: creatingProduct } = useCreateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [activeTab, setActiveTab] = useState("products");
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setImageUploading(true);
    try {
      const token = localStorage.getItem("coastaq_token");
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Upload failed");
      }
      const data = await res.json() as { url: string };
      setNewProduct(p => ({ ...p, image: data.url }));
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setImageUploading(false);
    }
  };

  // Derived: subcategories for selected parent
  const parentCategories = categories ?? [];
  const selectedParent = parentCategories.find((c: any) => c.id === newProduct.parentCategoryId);
  const subcategories: any[] = selectedParent?.children ?? [];

  // Reset subcategory when parent changes
  useEffect(() => {
    setNewProduct(p => ({ ...p, categoryId: "" }));
  }, [newProduct.parentCategoryId]);

  const handleShopUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateShop(
      {
        data: {
          name: formData.get("name") as string,
          description: formData.get("description") as string,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Shop updated successfully" });
          queryClient.invalidateQueries({ queryKey: ["/api/shops/my"] });
        },
      },
    );
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct(
      {
        data: {
          title: newProduct.title,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          condition: newProduct.condition,
          description: newProduct.description,
          location: newProduct.location,
          images: newProduct.image ? [newProduct.image] : [],
          categoryId: newProduct.categoryId || newProduct.parentCategoryId || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Product added!", description: `"${newProduct.title}" is now live in your shop.` });
          setIsAddOpen(false);
          setNewProduct(EMPTY_PRODUCT);
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        },
        onError: (err: any) => {
          if (err?.status === 402) {
            toast({
              variant: "destructive",
              title: "Subscription required",
              description: "Your trial or subscription has expired. Go to the Subscription tab to renew.",
            });
            setIsAddOpen(false);
            setActiveTab("subscription");
          } else {
            toast({ variant: "destructive", title: "Failed to add product", description: err.message });
          }
        },
      },
    );
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteProduct(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Product deleted" });
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          },
        },
      );
    }
  };

  if (!user || user.role !== "SELLER") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold">Seller access required</p>
          <Link href="/">
            <Button className="mt-4" variant="outline"><Home className="w-4 h-4 mr-2" />Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const products = productsData?.products ?? [];
  const subExpired = sub && !sub.isActive;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {shop?.logo ? (
              <img src={shop.logo} alt={shop.name} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Store className="w-8 h-8" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-display font-bold">Seller Dashboard</h1>
              <p className="text-muted-foreground">{shop?.name ?? "Your Shop"}</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="rounded-xl h-10 gap-2">
              <Home className="w-4 h-4" /> Back to Marketplace
            </Button>
          </Link>
        </div>

        {/* Shop not approved warning */}
        {shop && !shop.isApproved && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Shop pending approval</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Your shop is under review. Products won't be visible until an admin approves it.
              </p>
            </div>
          </div>
        )}

        {/* Subscription expired banner */}
        {subExpired && (
          <SubscriptionExpiredBanner onSubscribe={() => setActiveTab("subscription")} />
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Products", value: products.length },
            { label: "Total Stock", value: products.reduce((a, p) => a + p.stock, 0) },
            {
              label: "Avg Price",
              value: products.length
                ? `$${(products.reduce((a, p) => a + p.price, 0) / products.length).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-border/50 rounded-2xl p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-secondary/50 p-1 rounded-xl mb-8 flex-wrap gap-1">
            <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5">
              <Package className="w-4 h-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5">
              <ShoppingBag className="w-4 h-4 mr-2" /> Orders
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5">
              <MessageCircle className="w-4 h-4 mr-2" /> Messages
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5">
              <CreditCard className="w-4 h-4 mr-2" /> Subscription
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-5">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Your Inventory</h2>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md"
                      disabled={shop ? !shop.isApproved : false}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Product
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-[640px] rounded-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-display">Add New Product</DialogTitle>
                    </DialogHeader>

                    {/* Subscription warning inside dialog */}
                    {subExpired && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mt-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        Your subscription has expired. The product won't be saved until you renew.
                      </div>
                    )}

                    <form onSubmit={handleAddProduct} className="space-y-5 mt-4">
                      {/* Title */}
                      <div className="space-y-2">
                        <Label>Product Title <span className="text-destructive">*</span></Label>
                        <Input
                          required
                          placeholder="e.g. Samsung Galaxy S24 Ultra 256GB"
                          value={newProduct.title}
                          onChange={e => setNewProduct({ ...newProduct, title: e.target.value })}
                        />
                      </div>

                      {/* Category selectors */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={newProduct.parentCategoryId}
                            onChange={e => setNewProduct({ ...newProduct, parentCategoryId: e.target.value, categoryId: "" })}
                          >
                            <option value="">Select category...</option>
                            {parentCategories.map((cat: any) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Subcategory</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                            value={newProduct.categoryId}
                            onChange={e => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                            disabled={subcategories.length === 0}
                          >
                            <option value="">
                              {subcategories.length === 0 ? "Select category first" : "Select subcategory..."}
                            </option>
                            {subcategories.map((sub: any) => (
                              <option key={sub.id} value={sub.id}>{sub.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Price, Stock, Condition */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Price ($) <span className="text-destructive">*</span></Label>
                          <Input
                            type="number" step="0.01" min="0" required
                            placeholder="0.00"
                            value={newProduct.price}
                            onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock <span className="text-destructive">*</span></Label>
                          <Input
                            type="number" min="0" required
                            placeholder="1"
                            value={newProduct.stock}
                            onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={newProduct.condition}
                            onChange={e => setNewProduct({ ...newProduct, condition: e.target.value as any })}
                          >
                            <option value="NEW">New</option>
                            <option value="USED">Used</option>
                            <option value="REFURBISHED">Refurbished</option>
                          </select>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          placeholder="e.g. Victoria Island, Lagos"
                          value={newProduct.location}
                          onChange={e => setNewProduct({ ...newProduct, location: e.target.value })}
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-2">
                        <Label>Product Image</Label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                            e.target.value = "";
                          }}
                        />
                        {newProduct.image ? (
                          <div className="relative rounded-xl overflow-hidden bg-secondary/30 h-44 group">
                            <img
                              src={newProduct.image}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-white text-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow"
                              >
                                Change
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewProduct(p => ({ ...p, image: "" }))}
                                className="bg-white text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg shadow"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imageUploading}
                            className="w-full h-36 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 bg-secondary/30"
                          >
                            {imageUploading ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-sm">Uploading…</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-7 h-7" />
                                <span className="text-sm font-medium">Click to upload photo</span>
                                <span className="text-xs">JPEG, PNG, WebP up to 10MB</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          rows={3}
                          placeholder="Describe your product in detail — specifications, condition, warranty, etc."
                          value={newProduct.description}
                          onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 h-12 rounded-xl"
                          onClick={() => { setIsAddOpen(false); setNewProduct(EMPTY_PRODUCT); }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="flex-1 h-12 rounded-xl" disabled={creatingProduct}>
                          {creatingProduct ? <Loader2 className="animate-spin w-5 h-5" /> : "Add Product"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Product table */}
              {products.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="font-semibold text-foreground mb-1">No products yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Add Product" to start listing items in your shop.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl w-12" />
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Condition</th>
                        <th className="px-4 py-3 rounded-r-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate" title={p.title}>
                            {p.title}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {(p as any).category?.name ?? <span className="italic">Uncategorized</span>}
                          </td>
                          <td className="px-4 py-3 text-primary font-bold">${p.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3">{p.stock}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              p.condition === "NEW" ? "bg-green-100 text-green-700"
                              : p.condition === "USED" ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                            }`}>
                              {p.condition}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                              onClick={() => handleDelete(p.id, p.title)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <SellerOrders />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <SellerInbox />
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <SubscriptionPanel />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm max-w-2xl">
              <h2 className="text-xl font-bold mb-6">Shop Settings</h2>
              {shop && (
                <form onSubmit={handleShopUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Shop Name</Label>
                    <Input name="name" defaultValue={shop.name} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      name="description"
                      defaultValue={shop.description ?? ""}
                      className="rounded-xl"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={updatingShop} className="h-12 rounded-xl px-8">
                      {updatingShop ? <Loader2 className="animate-spin" /> : "Save Changes"}
                    </Button>
                    <Link href="/">
                      <Button type="button" variant="outline" className="h-12 rounded-xl px-8 gap-2">
                        <Home className="w-4 h-4" /> Back to Marketplace
                      </Button>
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
