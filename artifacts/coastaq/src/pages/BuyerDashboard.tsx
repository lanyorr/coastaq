import { useGetMe } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLocation } from "wouter";
import {
  User, Phone, MessageCircle, Heart, Store, ChevronRight,
  Search, Clock, Trash2, LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState, useEffect } from "react";

export type Enquiry = {
  productId: string;
  title: string;
  price: number;
  shopName: string;
  image: string;
  location: string;
  type: "contact" | "chat" | "callback";
  date: string;
};

export type SavedListing = {
  productId: string;
  title: string;
  price: number;
  shopName: string;
  image: string;
  location: string;
  savedAt: string;
};

function useEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("coastaq_enquiries");
      setEnquiries(raw ? JSON.parse(raw) : []);
    } catch { setEnquiries([]); }
  }, []);

  const remove = (productId: string, date: string) => {
    const next = enquiries.filter(e => !(e.productId === productId && e.date === date));
    setEnquiries(next);
    localStorage.setItem("coastaq_enquiries", JSON.stringify(next));
  };
  return { enquiries, remove };
}

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

const typeLabel: Record<Enquiry["type"], { label: string; icon: React.ReactNode; color: string }> = {
  contact: { label: "Showed contact", icon: <Phone className="w-3 h-3" />, color: "text-primary bg-primary/10" },
  chat: { label: "Started chat", icon: <MessageCircle className="w-3 h-3" />, color: "text-green-700 bg-green-50" },
  callback: { label: "Requested callback", icon: <Clock className="w-3 h-3" />, color: "text-amber-700 bg-amber-50" },
};

export default function BuyerDashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });
  const { enquiries, remove: removeEnquiry } = useEnquiries();
  const { saved, remove: removeSaved } = useSaved();
  const [tab, setTab] = useState<"enquiries" | "saved">("enquiries");

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
                  <Phone className="w-4 h-4 text-primary" />
                  Sellers contacted
                </div>
                <span className="font-bold text-foreground">{enquiries.length}</span>
              </div>
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
                onClick={() => setTab("enquiries")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "enquiries" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Enquiry History
                  {enquiries.length > 0 && (
                    <span className="ml-1 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{enquiries.length}</span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setTab("saved")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === "saved" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" />
                  Saved Listings
                  {saved.length > 0 && (
                    <span className="ml-1 bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">{saved.length}</span>
                  )}
                </span>
              </button>
            </div>

            {/* Enquiry History */}
            {tab === "enquiries" && (
              <div>
                {enquiries.length === 0 ? (
                  <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
                    <Phone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-1">No enquiries yet</h3>
                    <p className="text-sm text-muted-foreground mb-5">
                      When you contact a seller, it'll appear here.
                    </p>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setLocation("/")}>
                      Browse listings
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enquiries.slice().reverse().map((enq, i) => {
                      const meta = typeLabel[enq.type];
                      return (
                        <div key={`${enq.productId}-${enq.date}-${i}`} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 group">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary shrink-0">
                            <img src={enq.image} alt={enq.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <a href={`/products/${enq.productId}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
                              {enq.title}
                            </a>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                                {meta.icon} {meta.label}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Store className="w-3 h-3" /> {enq.shopName}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(enq.date), "MMM d, yyyy · h:mm a")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-sm text-primary">₦{Number(enq.price).toLocaleString()}</span>
                            <button
                              onClick={() => removeEnquiry(enq.productId, enq.date)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Saved Listings */}
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
                            <span className="font-bold text-primary text-sm">₦{Number(item.price).toLocaleString()}</span>
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
