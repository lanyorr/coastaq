import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLocation } from "wouter";
import {
  Link2, TrendingUp, DollarSign, MousePointerClick, ShoppingCart,
  Plus, Copy, ExternalLink, CheckCircle2, Clock, AlertCircle,
  BarChart2, Users, Loader2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { buildRolesFromUser, hasRole } from "@/lib/auth/rbac";

type AffiliateProfile = {
  id: string;
  status: "pending" | "approved" | "suspended";
  isApproved: boolean;
  commissionRate: string;
  totalEarnings: string;
  pendingEarnings: string;
  paidEarnings: string;
  paypalEmail: string | null;
};

type AffiliateLink = {
  id: string;
  code: string;
  productId: string | null;
  shopId: string | null;
  clicks: number;
  conversions: number;
  isActive: boolean;
  createdAt: string;
};

type Commission = {
  id: string;
  orderId: string;
  amount: string;
  rate: string;
  status: "pending" | "approved" | "paid" | "cancelled";
  createdAt: string;
};

export default function AffiliateDashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useGetMe({ query: { retry: false } });
  const { toast } = useToast();

  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [newLinkProductId, setNewLinkProductId] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const userRoles = user ? buildRolesFromUser(user as any) : [];
  const isAffiliate = hasRole(userRoles, "AFFILIATE");

  useEffect(() => {
    if (!user && !userLoading) { setLocation("/auth/login"); return; }
    if (user) loadData();
  }, [user, userLoading]);

  async function loadData() {
    setLoading(true);
    try {
      const [profileRes, linksRes, commissionsRes] = await Promise.all([
        fetch("/api/affiliates/me").then(r => r.ok ? r.json() : null),
        fetch("/api/affiliates/me/links").then(r => r.ok ? r.json() : []),
        fetch("/api/affiliates/me/commissions").then(r => r.ok ? r.json() : []),
      ]);
      setProfile(profileRes);
      setLinks(Array.isArray(linksRes) ? linksRes : []);
      setCommissions(Array.isArray(commissionsRes) ? commissionsRes : []);
    } catch { }
    setLoading(false);
  }

  async function applyAffiliate() {
    setApplying(true);
    try {
      const res = await fetch("/api/affiliates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Application failed", variant: "destructive" });
      } else {
        toast({ title: "Application submitted! Awaiting admin approval." });
        setProfile(data);
      }
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    setApplying(false);
  }

  async function createLink() {
    if (!newLinkProductId.trim()) return;
    setCreatingLink(true);
    try {
      const res = await fetch("/api/affiliates/me/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: newLinkProductId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to create link", variant: "destructive" });
      } else {
        setLinks(prev => [data, ...prev]);
        setNewLinkProductId("");
        toast({ title: "Affiliate link created!" });
      }
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    setCreatingLink(false);
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/api/affiliates/track/${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Not yet an affiliate — show apply screen
  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="bg-purple-100 text-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Link2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Join Coastaq Affiliates</h1>
          <p className="text-muted-foreground mb-8">
            Earn commissions by sharing product links. Get paid for every sale you refer.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8 text-left">
            {[
              { icon: Link2, label: "Share links", desc: "Generate unique links for any product" },
              { icon: MousePointerClick, label: "Track clicks", desc: "See how many people you reach" },
              { icon: DollarSign, label: "Earn 5%", desc: "Commission on every referred sale" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-card border rounded-xl p-4">
                <Icon className="w-5 h-5 text-purple-600 mb-2" />
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <Button onClick={applyAffiliate} disabled={applying} className="w-full rounded-full">
            {applying ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : "Apply to Become an Affiliate"}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Pending approval
  if (!profile.isApproved) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="bg-yellow-100 text-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Application Under Review</h1>
          <p className="text-muted-foreground">
            Your affiliate application is being reviewed. You'll be notified when it's approved.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Commission rate: <span className="font-semibold text-green-600">{profile.commissionRate}%</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Earned", value: `$${parseFloat(profile.totalEarnings).toFixed(2)}`, icon: DollarSign, color: "bg-green-100 text-green-600" },
            { label: "Pending", value: `$${parseFloat(profile.pendingEarnings).toFixed(2)}`, icon: Clock, color: "bg-yellow-100 text-yellow-600" },
            { label: "Links", value: links.length, icon: Link2, color: "bg-blue-100 text-blue-600" },
            { label: "Conversions", value: links.reduce((s, l) => s + l.conversions, 0), icon: ShoppingCart, color: "bg-purple-100 text-purple-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border rounded-2xl p-5 flex items-center gap-3 shadow-sm">
              <div className={`${color} p-3 rounded-xl shrink-0`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="links">
          <TabsList className="mb-6">
            <TabsTrigger value="links">My Links</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
          </TabsList>

          {/* Links tab */}
          <TabsContent value="links">
            <div className="bg-card border rounded-2xl p-5 mb-4">
              <h3 className="font-semibold mb-3">Create New Link</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Product ID"
                  value={newLinkProductId}
                  onChange={e => setNewLinkProductId(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={createLink} disabled={creatingLink} className="gap-2 shrink-0">
                  {creatingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </Button>
              </div>
            </div>

            {links.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Link2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No links yet. Create your first affiliate link above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {links.map(link => (
                  <div key={link.id} className="bg-card border rounded-2xl p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold text-primary truncate">
                        /api/affiliates/track/{link.code}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {link.clicks} clicks · {link.conversions} conversions
                        {link.productId && ` · Product: ${link.productId.slice(0, 8)}…`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${link.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {link.isActive ? "Active" : "Inactive"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(link.code)}
                        className="gap-1.5"
                      >
                        {copiedCode === link.code ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copiedCode === link.code ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Commissions tab */}
          <TabsContent value="commissions">
            {commissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No commissions yet. Share your links to start earning.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.map(c => (
                  <div key={c.id} className="bg-card border rounded-2xl p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Order #{c.orderId.slice(0, 8)}…</p>
                      <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">+${parseFloat(c.amount).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{c.rate}% rate</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ml-2 ${
                      c.status === "paid"     ? "bg-green-100 text-green-700" :
                      c.status === "approved" ? "bg-blue-100 text-blue-700" :
                      c.status === "pending"  ? "bg-yellow-100 text-yellow-700" :
                                                "bg-gray-100 text-gray-500"
                    }`}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
