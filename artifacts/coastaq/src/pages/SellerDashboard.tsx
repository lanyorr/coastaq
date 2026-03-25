import { useState } from "react";
import { useGetMe, useListProducts, useGetMyShop, useUpdateMyShop, useCreateProduct, useDeleteProduct } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Store, Package, Settings, Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function SellerDashboard() {
  const { data: user } = useGetMe();
  const { data: shop } = useGetMyShop();
  const { data: productsData } = useListProducts({ shopId: shop?.id, limit: 100 });
  const { mutate: updateShop, isPending: updatingShop } = useUpdateMyShop();
  const { mutate: createProduct, isPending: creatingProduct } = useCreateProduct();
  const { mutate: deleteProduct } = useDeleteProduct();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    title: "", price: "", stock: "1", condition: "NEW" as any, description: "", location: "", image: ""
  });

  const handleShopUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateShop({
      data: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Shop Updated" });
        queryClient.invalidateQueries({ queryKey: ["/api/shops/my"] });
      }
    });
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct({
      data: {
        title: newProduct.title,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        condition: newProduct.condition,
        description: newProduct.description,
        location: newProduct.location,
        images: newProduct.image ? [newProduct.image] : [],
      }
    }, {
      onSuccess: () => {
        toast({ title: "Product Added!" });
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) {
      deleteProduct({ id }, {
        onSuccess: () => {
          toast({ title: "Product Deleted" });
          queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        }
      });
    }
  };

  if (!user || user.role !== "SELLER") return <div className="p-20 text-center">Unauthorized</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Seller Dashboard</h1>
            <p className="text-muted-foreground">{shop?.name || 'Your Shop'}</p>
          </div>
        </div>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="bg-secondary/50 p-1 rounded-xl mb-8">
            <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"><Package className="w-4 h-4 mr-2" /> Products</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"><Store className="w-4 h-4 mr-2" /> Orders</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6"><Settings className="w-4 h-4 mr-2" /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Your Inventory</h2>
                
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md">
                      <Plus className="w-4 h-4 mr-2" /> Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] rounded-3xl">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input required value={newProduct.title} onChange={e => setNewProduct({...newProduct, title: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Price ($)</Label>
                          <Input type="number" step="0.01" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Stock</Label>
                          <Input type="number" required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            value={newProduct.condition} 
                            onChange={e => setNewProduct({...newProduct, condition: e.target.value as any})}
                          >
                            <option value="NEW">New</option>
                            <option value="USED">Used</option>
                            <option value="REFURBISHED">Refurbished</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input placeholder="e.g. Miami, FL" value={newProduct.location} onChange={e => setNewProduct({...newProduct, location: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Image URL</Label>
                        <Input placeholder="https://..." value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                      </div>
                      <Button type="submit" className="w-full h-12" disabled={creatingProduct}>
                        {creatingProduct ? <Loader2 className="animate-spin" /> : "Create Product"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                    <tr>
                      <th className="px-6 py-4 rounded-l-xl">Product</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Stock</th>
                      <th className="px-6 py-4">Condition</th>
                      <th className="px-6 py-4 rounded-r-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData?.products?.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0">
                        <td className="px-6 py-4 font-medium text-foreground">{p.title}</td>
                        <td className="px-6 py-4 text-primary font-bold">${p.price.toFixed(2)}</td>
                        <td className="px-6 py-4">{p.stock}</td>
                        <td className="px-6 py-4"><span className="bg-secondary px-2 py-1 rounded text-xs">{p.condition}</span></td>
                        <td className="px-6 py-4 flex gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8 text-blue-500"><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    ))}
                    {(!productsData || productsData.products.length === 0) && (
                      <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No products yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
             <div className="bg-card border border-border/50 rounded-3xl p-8 text-center text-muted-foreground shadow-sm">
                <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold mb-1 text-foreground">Seller Orders</h3>
                <p>Order management for sellers is coming in the next update.</p>
             </div>
          </TabsContent>

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
                    <Textarea name="description" defaultValue={shop.description} className="rounded-xl" rows={4} />
                  </div>
                  <Button type="submit" disabled={updatingShop} className="h-12 rounded-xl px-8">
                     {updatingShop ? <Loader2 className="animate-spin" /> : "Save Changes"}
                  </Button>
                </form>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
