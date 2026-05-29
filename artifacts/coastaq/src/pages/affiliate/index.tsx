import { useState, useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { AffiliateLayout } from "./AffiliateLayout";
import { StatCard, StatGrid } from "@/components/dashboard/StatCard";
import { useLocation } from "wouter";
import { Link2, MousePointerClick, DollarSign, ShoppingCart, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { buildRolesFromUser } from "@/lib/auth/rbac";

export default function AffiliateOverview() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useGetMe({ query: { retry: false } });
  const [profile, setProfile] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const { toast } = useToast();

  const userRoles = user ? buildRolesFromUser(user as any) : [];

  useEffect(() => {
    if (!user && !userLoading) { setLocation("/auth/login"); return; }
    if (user) loadData();
  }, [user, userLoading]);

  async function loadData() {
    setLoading(true);
    try {
      const [profileRes, linksRes] = await Promise.all([
        fetch("/api/affiliates/me").then(r => r.ok ? r.json() : null),
        fetch("/api/affiliates/me/links").then(r => r.ok ? r.json() : []),
      ]);
      setProfile(profileRes);
      setLinks(Array.isArray(linksRes) ? linksRes : []);
    } catch {}
    setLoading(false);
  }

  async function applyAffiliate() {
    setApplying(true);
    try {
      const res = await fetch("/api/affiliates/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Application failed");
      setProfile(data);
    } catch {}
    setApplying(false);
  }

  if (userLoading || loading) {
    return <AffiliateLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></AffiliateLayout>;
  }

  if (!profile) {
    return (
      <AffiliateLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="bg-purple-100 text-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"><Link2 className="w-8 h-8" /></div>
          <h1 className="text-2xl font-bold mb-3">Join Coastaq Affiliates</h1>
          <p className="text-muted-foreground mb-8">Earn commissions by sharing product links. Get paid for every sale you refer.</p>
          <div className="grid grid-cols-3 gap-4 mb-8 text-left">
            {[{ icon: Link2, label: "Share links", desc: "Generate unique links" }, { icon: MousePointerClick, label: "Track clicks", desc: "See who you reach" }, { icon: DollarSign, label: "Earn 5%", desc: "Per referred sale" }].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-card border rounded-xl p-4"><Icon className="w-5 h-5 text-purple-600 mb-2" /><p className="font-semibold text-sm">{label}</p><p className="text-xs text-muted-foreground mt-1">{desc}</p></div>
            ))}
          </div>
          <Button onClick={applyAffiliate} disabled={applying} className="w-full rounded-full bg-purple-600 hover:bg-purple-700">
            {applying ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</> : "Apply to Become an Affiliate"}
          </Button>
        </div>
      </AffiliateLayout>
    );
  }

  if (!profile.isApproved) {
    return (
      <AffiliateLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="bg-yellow-100 text-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"><Clock className="w-8 h-8" /></div>
          <h1 className="text-2xl font-bold mb-3">Application Under Review</h1>
          <p className="text-muted-foreground">Your affiliate application is pending review. You'll be notified when it's approved.</p>
        </div>
      </AffiliateLayout>
    );
  }

  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = links.reduce((s, l) => s + l.conversions, 0);

  return (
    <AffiliateLayout>
      <div className="flex items-start gap-4 mb-8">
        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shrink-0"><Link2 className="w-7 h-7" /></div>
        <div>
          <h1 className="text-2xl font-display font-bold">Affiliate Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Commission rate: <span className="font-semibold text-green-600">{profile.commissionRate}%</span></p>
        </div>
      </div>

      <StatGrid cols={4}>
        <StatCard label="Total Earned" value={`$${parseFloat(profile.totalEarnings || 0).toFixed(2)}`} icon={DollarSign} color="bg-green-100 text-green-600" />
        <StatCard label="Pending" value={`$${parseFloat(profile.pendingEarnings || 0).toFixed(2)}`} icon={Clock} color="bg-yellow-100 text-yellow-600" />
        <StatCard label="Total Clicks" value={totalClicks} icon={MousePointerClick} color="bg-blue-100 text-blue-600" />
        <StatCard label="Conversions" value={totalConversions} icon={ShoppingCart} color="bg-purple-100 text-purple-600" />
      </StatGrid>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button onClick={() => setLocation("/affiliate/links")} className="bg-purple-600 text-white rounded-2xl py-3 px-4 text-sm font-semibold hover:bg-purple-700 transition-colors">Manage Links →</button>
        <button onClick={() => setLocation("/affiliate/commissions")} className="bg-card border border-border/50 rounded-2xl py-3 px-4 text-sm font-semibold hover:bg-secondary transition-colors">View Commissions →</button>
      </div>
    </AffiliateLayout>
  );
}
