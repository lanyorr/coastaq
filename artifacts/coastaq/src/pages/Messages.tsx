import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useGetMe } from "@workspace/api-client-react";
import { MessageCircle, Store, ChevronRight, Loader2, Inbox } from "lucide-react";

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

interface Conversation {
  id: string;
  productId: string | null;
  buyerId: string;
  sellerId: string;
  lastMessageAt: string;
  otherUser: { id: string; name: string; role: string } | null;
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
  product: { id: string; title: string; images: string[] } | null;
  unreadCount: number;
}

export default function Messages() {
  const { data: user, isLoading: userLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch("/api/messages/conversations")
      .then(r => r.json())
      .then(data => { setConvs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  if (userLoading || (!user && userLoading)) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary/30">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary/30">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <p className="text-foreground font-semibold text-lg">Please log in to view your messages</p>
            <button
              onClick={() => setLocation("/auth/login")}
              className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Log in
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/10 p-2.5 rounded-xl">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground">
              {user.role === "SELLER" ? "Enquiries from buyers" : "Your conversations with sellers"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border/50 rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-secondary rounded w-1/3" />
                    <div className="h-3 bg-secondary rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : convs.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-semibold text-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              {user.role === "BUYER"
                ? "When you message a seller about a listing, it will appear here."
                : "When buyers enquire about your listings, they'll appear here."}
            </p>
            {user.role === "BUYER" && (
              <button
                onClick={() => setLocation("/")}
                className="mt-5 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Browse listings
              </button>
            )}
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
                  {/* Avatar / product thumb */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
                    {img ? (
                      <img src={img} alt={conv.product?.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm leading-tight truncate ${isUnread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                        {conv.otherUser?.name ?? "Unknown"}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
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
      </main>
      <Footer />
    </div>
  );
}
