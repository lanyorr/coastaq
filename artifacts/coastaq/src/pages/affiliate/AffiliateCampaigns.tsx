import { useState, useEffect, useCallback } from "react";
import { AffiliateLayout } from "./AffiliateLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Megaphone, Loader2, Users, Package, CheckCircle2, Mail, Check, X } from "lucide-react";

function CommissionBadge({ rate }: { rate: string | number }) {
  return (
    <span className="inline-block text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
      {parseFloat(String(rate)).toFixed(0)}% commission
    </span>
  );
}

function CampaignCard({
  campaign,
  joined,
  onJoin,
  joining,
}: {
  campaign: any;
  joined: boolean;
  onJoin?: (id: string) => void;
  joining?: boolean;
}) {
  const budget = campaign.budget ? parseFloat(campaign.budget) : null;
  const spent = parseFloat(campaign.spent ?? "0");
  const budgetPct = budget && budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : null;
  const remaining = budget ? (budget - spent).toFixed(2) : null;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{campaign.name}</p>
          {campaign.shopName && (
            <p className="text-xs text-muted-foreground mt-0.5">by {campaign.shopName}</p>
          )}
        </div>
        <CommissionBadge rate={campaign.commissionRate} />
      </div>

      {/* Description */}
      {campaign.description && (
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{campaign.description}</p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {campaign.productCount !== undefined && (
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {campaign.productCount} product{campaign.productCount !== 1 ? "s" : ""}
          </span>
        )}
        {remaining !== null && (
          <span className="flex items-center gap-1">
            <span className="text-green-600 font-medium">${remaining} remaining</span>
          </span>
        )}
        {campaign.joinedAt && (
          <span>Joined {new Date(campaign.joinedAt).toLocaleDateString()}</span>
        )}
      </div>

      {/* Budget bar */}
      {budgetPct !== null && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Budget used</span>
            <span>{budgetPct}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", budgetPct > 80 ? "bg-red-400" : "bg-purple-500")}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Action */}
      {onJoin && !joined && (
        <Button
          onClick={() => onJoin(campaign.id)}
          disabled={joining}
          className="bg-purple-600 hover:bg-purple-700 rounded-full w-full mt-auto"
          size="sm"
        >
          {joining ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Joining…</> : "Join Campaign"}
        </Button>
      )}
      {joined && (
        <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium mt-auto">
          <CheckCircle2 className="w-4 h-4" /> Joined
        </div>
      )}
    </div>
  );
}

function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  responding,
}: {
  invitation: any;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  responding: string | null;
}) {
  const budget = invitation.budget ? parseFloat(invitation.budget) : null;
  const isResponding = responding === invitation.id;

  return (
    <div className="bg-card border border-purple-200 rounded-2xl p-5 flex flex-col gap-3">
      {/* Invitation badge */}
      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 rounded-full w-fit px-2.5 py-1">
        <Mail className="w-3 h-3" />
        Invited by {invitation.shopName}
      </div>

      {/* Campaign info */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{invitation.name}</p>
          {invitation.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{invitation.description}</p>
          )}
        </div>
        <CommissionBadge rate={invitation.commissionRate} />
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {budget !== null && (
          <span className="text-green-600 font-medium">${budget.toFixed(2)} budget</span>
        )}
        <span>Invited {new Date(invitation.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Accept / Decline */}
      <div className="flex gap-2 mt-auto pt-1">
        <Button
          size="sm"
          className="flex-1 bg-purple-600 hover:bg-purple-700 gap-1.5"
          disabled={isResponding}
          onClick={() => onAccept(invitation.id)}
        >
          {isResponding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
          disabled={isResponding}
          onClick={() => onDecline(invitation.id)}
        >
          <X className="w-3.5 h-3.5" />
          Decline
        </Button>
      </div>
    </div>
  );
}

export default function AffiliateCampaigns() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"available" | "invitations" | "mine">("available");
  const [available, setAvailable] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const loadAvailable = useCallback(async (p = 1) => {
    const res = await fetch(`/api/affiliate-campaigns?page=${p}&limit=12`);
    if (res.ok) {
      const data = await res.json();
      const items = data.data ?? [];
      setAvailable(prev => p === 1 ? items : [...prev, ...items]);
      setPagination(data.pagination);
      setPage(p);
    }
  }, []);

  const loadInvitations = useCallback(async () => {
    const res = await fetch("/api/affiliates/me/invitations");
    if (res.ok) {
      const data = await res.json();
      setInvitations(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadAvailable(1),
      fetch("/api/affiliates/me/campaigns").then(r => r.ok ? r.json() : []).then(d => setMine(Array.isArray(d) ? d : [])),
      loadInvitations(),
    ]).finally(() => setLoading(false));
  }, []);

  async function joinCampaign(id: string) {
    setJoining(id);
    try {
      const res = await fetch(`/api/affiliate-campaigns/${id}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Could not join campaign", variant: "destructive" });
      } else {
        toast({ title: "Campaign joined!", description: "You can now promote this campaign." });
        const joined = available.find(c => c.id === id);
        if (joined) {
          setMine(prev => [{ ...joined, joinedAt: new Date().toISOString() }, ...prev]);
          setAvailable(prev => prev.filter(c => c.id !== id));
        }
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setJoining(null);
  }

  async function acceptInvitation(id: string) {
    setResponding(id);
    try {
      const res = await fetch(`/api/affiliates/me/invitations/${id}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Could not accept invitation", variant: "destructive" });
      } else {
        toast({ title: "Invitation accepted!", description: "You've joined the campaign." });
        const inv = invitations.find(i => i.id === id);
        if (inv) {
          setMine(prev => [{ ...inv, joinedAt: new Date().toISOString() }, ...prev]);
          setAvailable(prev => prev.filter(c => c.id !== inv.campaignId));
        }
        setInvitations(prev => prev.filter(i => i.id !== id));
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setResponding(null);
  }

  async function declineInvitation(id: string) {
    setResponding(id);
    try {
      const res = await fetch(`/api/affiliates/me/invitations/${id}/decline`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Could not decline invitation", variant: "destructive" });
      } else {
        toast({ title: "Invitation declined." });
        setInvitations(prev => prev.filter(i => i.id !== id));
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setResponding(null);
  }

  const tabs = [
    { key: "available" as const, label: "Available", count: pagination?.total ?? available.length },
    { key: "invitations" as const, label: "Invitations", count: invitations.length },
    { key: "mine" as const, label: "My Campaigns", count: mine.length },
  ];

  return (
    <AffiliateLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Campaigns</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 w-fit mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
              tab === t.key
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count > 0 && (
              <span className={cn(
                "text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1",
                tab === t.key
                  ? t.key === "invitations" ? "bg-purple-600 text-white" : "bg-purple-600 text-white"
                  : t.key === "invitations" && t.count > 0
                    ? "bg-purple-100 text-purple-700"
                    : "bg-border text-muted-foreground",
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
      ) : tab === "available" ? (
        available.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No campaigns available to join right now.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {available.map(c => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  joined={false}
                  onJoin={joinCampaign}
                  joining={joining === c.id}
                />
              ))}
            </div>
            {pagination?.hasNextPage && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => loadAvailable(page + 1)}
                  className="rounded-full"
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )
      ) : tab === "invitations" ? (
        invitations.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No pending invitations.</p>
            <p className="text-sm mt-1">When a seller invites you to a campaign, it will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {invitations.map(inv => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                onAccept={acceptInvitation}
                onDecline={declineInvitation}
                responding={responding}
              />
            ))}
          </div>
        )
      ) : (
        mine.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>You haven't joined any campaigns yet.</p>
            <button
              onClick={() => setTab("available")}
              className="mt-3 text-sm text-purple-600 hover:underline"
            >
              Browse available campaigns →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mine.map(c => (
              <CampaignCard key={c.id} campaign={c} joined={true} />
            ))}
          </div>
        )
      )}
    </AffiliateLayout>
  );
}
