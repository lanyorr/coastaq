import { useState, useEffect } from "react";
import { AccountLayout } from "./AccountLayout";
import { useLocation } from "wouter";
import { MessageCircle, Store, ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AccountMessages() {
  const [, setLocation] = useLocation();
  const [convs, setConvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/messages/conversations")
      .then(r => r.json())
      .then(d => { setConvs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalUnread = convs.reduce((a, c) => a + c.unreadCount, 0);

  return (
    <AccountLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Messages</h1>
        {totalUnread > 0 && (
          <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {totalUnread} unread
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border rounded-2xl p-4 animate-pulse flex gap-3">
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
          <h3 className="font-semibold mb-1">No messages yet</h3>
          <p className="text-sm text-muted-foreground mb-5">When you message a seller, it'll appear here.</p>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setLocation("/")}>Browse listings</Button>
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
                  {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10"><Store className="w-5 h-5 text-primary" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${isUnread ? "font-bold" : "font-semibold"}`}>{conv.otherUser?.name ?? "Seller"}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUnread && <span className="bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</span>}
                      <span className="text-[11px] text-muted-foreground">{conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : timeAgo(conv.lastMessageAt)}</span>
                    </div>
                  </div>
                  {conv.product && <p className="text-[11px] text-primary/70 truncate mt-0.5">{conv.product.title}</p>}
                  <p className={`text-xs mt-0.5 truncate ${isUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>{conv.lastMessage?.content ?? "Start a conversation"}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}
