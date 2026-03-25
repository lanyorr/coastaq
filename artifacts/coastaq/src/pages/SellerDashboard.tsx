import { useState, useEffect } from "react";
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
  ImageIcon, AlertCircle, CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  SubscriptionPanel,
  SubscriptionExpiredBanner,
} from "@/components/subscription/SubscriptionPanel";
import { useSubscriptionStatus } from "@/hooks/use-subscription";

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
                ? `$${(products.reduce((a, p) => a + p.price, 0) / products.length).toFixed(2)}`
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
          <TabsList className="bg-secondary/50 p-1 rounded-xl mb-8">
            <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
              <Package className="w-4 h-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
              <CreditCard className="w-4 h-4 mr-2" /> Subscription
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
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

                      {/* Image URL + preview */}
                      <div className="space-y-2">
                        <Label>Product Image URL</Label>
                        <Input
                          type="url"
                          placeholder="https://..."
                          value={newProduct.image}
                          onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                        />
                        {newProduct.image && (
                          <div className="mt-2 relative rounded-xl overflow-hidden bg-secondary/30 h-40 flex items-center justify-center">
                            <img
                              src={newProduct.image}
                              alt="Preview"
                              className="h-full w-full object-cover"
                              onError={e => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
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
                          <td className="px-4 py-3 text-primary font-bold">${p.price.toFixed(2)}</td>
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
