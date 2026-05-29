import { useState, useEffect } from "react";
import { AffiliateLayout } from "./AffiliateLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Globe, Mail, Twitter, Instagram, FileText, User } from "lucide-react";

export default function AffiliateSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio: "",
    websiteUrl: "",
    paypalEmail: "",
    instagram: "",
    twitter: "",
  });

  useEffect(() => {
    fetch("/api/affiliates/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setForm({
            bio: d.bio ?? "",
            websiteUrl: d.websiteUrl ?? "",
            paypalEmail: d.paypalEmail ?? "",
            instagram: d.instagram ?? "",
            twitter: d.twitter ?? "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/affiliates/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.bio || null,
          websiteUrl: form.websiteUrl || null,
          paypalEmail: form.paypalEmail || null,
          instagram: form.instagram || null,
          twitter: form.twitter || null,
        }),
      });
      if (res.ok) {
        toast({ title: "Profile saved!", description: "Your affiliate profile has been updated." });
      } else {
        const data = await res.json();
        toast({ title: data.error || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <AffiliateLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
      </AffiliateLayout>
    );
  }

  return (
    <AffiliateLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-display font-bold mb-1">Profile Settings</h1>
        <p className="text-muted-foreground text-sm mb-8">Update your affiliate profile and payout details.</p>

        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-5">
          {/* Bio */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Bio
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Tell us about how you promote Coastaq…"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-colors"
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            />
          </div>

          {/* Website */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" /> Website URL
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              placeholder="https://yourblog.com"
              value={form.websiteUrl}
              onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
              className="focus-visible:ring-purple-500/20 focus-visible:border-purple-400"
            />
          </div>

          {/* PayPal email */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" /> PayPal Email for Payouts
            </label>
            <Input
              type="email"
              placeholder="paypal@example.com"
              value={form.paypalEmail}
              onChange={e => setForm(f => ({ ...f, paypalEmail: e.target.value }))}
              className="focus-visible:ring-purple-500/20 focus-visible:border-purple-400"
            />
            <p className="text-xs text-muted-foreground mt-1">Commission payouts will be sent to this PayPal account.</p>
          </div>

          {/* Social — two column on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                <Instagram className="w-3.5 h-3.5 text-muted-foreground" /> Instagram
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  placeholder="yourhandle"
                  value={form.instagram}
                  onChange={e => setForm(f => ({ ...f, instagram: e.target.value.replace(/^@/, "") }))}
                  className="pl-7 focus-visible:ring-purple-500/20 focus-visible:border-purple-400"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                <Twitter className="w-3.5 h-3.5 text-muted-foreground" /> X / Twitter
                <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  placeholder="yourhandle"
                  value={form.twitter}
                  onChange={e => setForm(f => ({ ...f, twitter: e.target.value.replace(/^@/, "") }))}
                  className="pl-7 focus-visible:ring-purple-500/20 focus-visible:border-purple-400"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              onClick={save}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 rounded-full px-6 gap-2"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
              ) : (
                <><Save className="w-4 h-4" />Save Changes</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AffiliateLayout>
  );
}
