import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { useGetMe } from "@workspace/api-client-react";
import {
  ArrowLeft, Send, Loader2, Store, Package2,
} from "lucide-react";

function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateGroup(date: string | Date): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

interface Msg {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

interface ConvDetail {
  id: string;
  buyerId: string;
  sellerId: string;
  otherUser: { id: string; name: string; role: string } | null;
  product: { id: string; title: string; images: string[]; price: number } | null;
}

export default function ChatRoom() {
  const [, params] = useRoute("/messages/:id");
  const [, setLocation] = useLocation();
  const convId = params?.id || "";
  const { data: user } = useGetMe();

  const [conv, setConv] = useState<ConvDetail | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval>>();

  const fetchMessages = async (silent = false) => {
    try {
      const r = await fetch(`/api/messages/conversations/${convId}`);
      if (!r.ok) return;
      const data = await r.json();
      setConv(data.conversation);
      setMessages(data.messages);
      if (!silent) setLoading(false);
    } catch {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!convId || !user) return;
    fetchMessages();
    pollingRef.current = setInterval(() => fetchMessages(true), 3000);
    return () => clearInterval(pollingRef.current);
  }, [convId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    try {
      const r = await fetch(`/api/messages/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (r.ok) {
        const msg = await r.json();
        setMessages(prev => [...prev, msg]);
      }
    } catch { /* silent */ }
    setSending(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group messages by date
  const grouped: { label: string; msgs: Msg[] }[] = [];
  for (const msg of messages) {
    const label = formatDateGroup(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last?.label === label) {
      last.msgs.push(msg);
    } else {
      grouped.push({ label, msgs: [msg] });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <Navbar />

      {/* Chat layout */}
      <div className="flex-1 container mx-auto px-4 py-4 max-w-2xl flex flex-col" style={{ height: "calc(100vh - 80px)" }}>

        {/* Header */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3 mb-3 shrink-0">
          <button
            onClick={() => setLocation("/messages")}
            className="p-1.5 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>

          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
            {conv?.product?.images?.[0] ? (
              <img src={conv.product.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Store className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {conv?.otherUser?.name ?? "..."}
            </p>
            {conv?.product && (
              <p className="text-[11px] text-primary/70 truncate flex items-center gap-1">
                <Package2 className="w-3 h-3 shrink-0" />
                {conv.product.title}
              </p>
            )}
          </div>

          {conv?.product && (
            <button
              onClick={() => setLocation(`/products/${conv.product!.id}`)}
              className="text-xs text-primary font-semibold hover:underline shrink-0"
            >
              View listing
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 pb-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="bg-primary/10 p-4 rounded-full">
                <Store className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground mt-0.5">Say hello to start the conversation</p>
              </div>
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.label}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[11px] text-muted-foreground font-medium px-2">{group.label}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {group.msgs.map((msg, i) => {
                  const isMe = msg.senderId === user.id;
                  const prevMsg = group.msgs[i - 1];
                  const showAvatar = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 mb-1 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {/* Other user avatar placeholder */}
                      {!isMe && (
                        <div className={`w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ${showAvatar ? "opacity-100" : "opacity-0"}`}>
                          <Store className="w-3.5 h-3.5 text-primary" />
                        </div>
                      )}

                      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                            isMe
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-card border border-border/50 text-foreground rounded-bl-md"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                          {formatTime(msg.createdAt)}
                          {isMe && msg.readAt && <span className="ml-1 text-primary/60">✓✓</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={sendMessage}
          className="bg-card border border-border/50 rounded-2xl p-3 flex items-end gap-2 shrink-0 mt-2"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e as any);
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 text-sm bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground leading-relaxed max-h-28 py-1.5"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
