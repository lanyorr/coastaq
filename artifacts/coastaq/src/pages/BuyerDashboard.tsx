import { useGetMe, useListOrders } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLocation } from "wouter";
import {
  User, MessageCircle, Heart, Store, ChevronRight,
  Search, LayoutDashboard, Inbox, ShoppingBag, Package,
  CheckCircle2, XCircle, Truck, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState, useEffect } from "react";

type SavedListing = {
  productId: string;
  title: string;
  price: number;
  shopName: string;
  image: string;
  location: string;
  savedAt: string;
};

type Conversation = {
  id: string;
  lastMessageAt: string;
  otherUser: { id: string; name: string } | null;
  lastMessage: { content: string; createdAt: string } | null;
  product: { id: string; title: string; images: string[] } | null;
  unreadCount: number;
};

function useSaved() {
  const [saved, setSaved] = useState<SavedListing[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("coastaq_saved");
      setSaved(raw ? JSON.parse(raw) : []);
    } catch { setSaved([]); }
  }, []);

  const remove = (productId: string) => {
    const next = saved.filter(s => s.productId !== productId);
    setSaved(next);
    localStorage.setItem("coastaq_saved", JSON.stringify(next));
  };
  return { saved, remove };
}

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: any }> = {
  PENDING:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700",  Icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700",      Icon: CheckCircle2 },
  SHIPPED:   { label: "Shipped",   color: "bg-purple-100 text-purple-700",  Icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-700",    Icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-600",        Icon: XCircle },
};

export default function BuyerDashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });
  const { saved, remove: removeSaved } = useSaved();
  const [tab, setTab] = useState<"messages" | "orders" | "saved">("messages");
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [convsLoading, setConvsLoading] = useState(true);

  const { data: ordersData, isLoading: ordersLoading } = useListOrders({
    query: { enabled: !!user, retry: false },
  });
  const orders = (ordersData as any[]) ?? [];

  useEffect(() => {
    if (!user) return;
    fetch("/api/messages/conversations")
      .then(r => r.json())
      .then(d => { setConvs(Array.isArray(d) ? d : []); setConvsLoading(false); })
      .catch(() => setConvsLoading(false));
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="h-48 bg-secondary/50 rounded-2xl animate-pulse" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-32 text-center">
          <h2 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h2>
          <Button onClick={() => setLocation("/auth/login")}>Log in</Button>
        </main>
      </div>
    );
  }

  const memberSince = user.createdAt
    ? format(new Date(user.createdAt as string), "MMM yyyy")
    : "Recently";

  const totalUnread = convs.reduce((a, c) => a + c.unreadCount, 0);
  const activeOrders = orders.filter((o: any) => !["DELIVERED", "CANCELLED"].includes(o.status)).length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-display font-bold text-foreground">My Dashboard</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left: Profile card ───────────────────── */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground font-medium">
                    Buyer
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground font-medium">
                    Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  Conversations
                </div>
                <span className="font-bold text-foreground">{convs.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  Orders placed
                </div>
                <span className="font-bold text-foreground">{orders.length}</span>
              </div>
              {activeOrders > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Package className="w-4 h-4 text-orange-500" />
                    Active orders
                  </div>
                  <span className="font-bold text-orange-500">{activeOrders}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Saved listings
                </div>
                <span className="font-bold text-foreground">{saved.length}</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-xl font-semibold"
              onClick={() => setLocation("/")}
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Listings
            </Button>
          </div>

          {/* ── Right: Tabs ────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Tab bar */}
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl mb-5">
              <button
                onClick={() => setTab("messages")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "messages" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  Messages
                  {totalUnread > 0 && (
                    <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setTab("orders")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "orders" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <ShoppingBag className="w-4 h-4" />
                  Orders
                  {activeOrders > 0 && (
                    <span className="bg-orange-100 text-orange-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{activeOrders}</span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setTab("saved")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "saved" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Heart className="w-4 h-4" />
                  Saved
                  {saved.length > 0 && (
                    <span className="bg-rose-100 text-rose-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{saved.length}</span>
                  )}
                </span>
              </button>
            </div>

            {/* Messages Tab */}
            {tab === "messages" && (
              <div>
                {convsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 animate-pulse flex gap-3">
                        <div className="w-12 h-12 rounded-full bg-secondary shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-secondary rounded w-1/3" />
                          <div className="h-3 bg-secondary rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : convs.length === 0 ? (
                  <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
                    <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-1">No messages yet</h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      When you message a seller about a listing, it'll appear here.
                    </p>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setLocation("/")}>
                      Browse listings
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {convs.map(conv => {
                      const img = conv.product?.images?.[0];
                      const isUnread = conv.unreadCount > 0;
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setLocation(`/messages/${conv.id}`)}
                          className="w-full bg-card border border-border/50 rounded-2xl p-4 flex items-start gap-3 hover:border-primary/30 hover:shadow-sm transition-all text-left"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
                            {img ? (
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <Store className="w-5 h-5 text-primary" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-sm truncate ${isUnread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                                {conv.otherUser?.name ?? "Seller"}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isUnread && (
                                  <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                                  </span>
                                )}
                                <span className="text-[11px] text-muted-foreground">
                                  {conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : timeAgo(conv.lastMessageAt)}
                                </span>
                              </div>
                            </div>
                            {conv.product && (
                              <p className="text-[11px] text-primary/70 truncate mt-0.5">{conv.product.title}</p>
                            )}
                            <p className={`text-xs mt-0.5 truncate ${isUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                              {conv.lastMessage?.content ?? "Start a conversation"}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {tab === "orders" && (
              <div>
                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 animate-pulse flex gap-3">
                        <div className="w-14 h-14 rounded-xl bg-secondary shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-secondary rounded w-1/2" />
                          <div className="h-3 bg-secondary rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-1">No orders yet</h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      When you place an order on a listing, it'll appear here.
                    </p>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setLocation("/")}>
                      Browse listings
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order: any) => {
                      const item = order.items?.[0];
                      const product = item?.product;
                      const image = product?.images?.[0];
                      const status = order.status as string;
                      const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
                      const StatusIcon = cfg.Icon;
                      return (
                        <div key={order.id} className="bg-card border border-border/50 rounded-2xl p-4 flex items-start gap-4">
                          {/* Product thumbnail */}
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                            {image ? (
                              <img src={image} alt={product?.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <Package className="w-6 h-6 text-primary" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">
                              {product?.title ?? "Product"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Qty: {item?.quantity ?? 1} · Ordered {timeAgo(order.createdAt)}
                            </p>
                            {order.buyerNote && (
                              <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">"{order.buyerNote}"</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                              {product && (
                                <button
                                  onClick={() => setLocation(`/products/${product.id}`)}
                                  className="text-xs text-primary hover:underline font-medium"
                                >
                                  View listing
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Total */}
                          <div className="text-right shrink-0">
                            <p className="font-bold text-primary text-sm">
                              ${Number(order.total).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Saved Listings Tab */}
            {tab === "saved" && (
              <div>
                {saved.length === 0 ? (
                  <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
                    <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-1">No saved listings</h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      Tap the heart icon on any listing to save it here.
                    </p>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setLocation("/")}>
                      Browse listings
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {saved.map(item => (
                      <div key={item.productId} className="bg-card border border-border/50 rounded-2xl overflow-hidden group">
                        <div className="aspect-video bg-secondary overflow-hidden relative">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <button
                            onClick={() => removeSaved(item.productId)}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-rose-500 hover:bg-white shadow-sm"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                        <div className="p-4">
                          <a href={`/products/${item.productId}`} className="font-semibold text-sm text-foreground hover:text-primary line-clamp-2 leading-snug">
                            {item.title}
                          </a>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-primary text-sm">${Number(item.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="text-xs text-muted-foreground">{item.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
