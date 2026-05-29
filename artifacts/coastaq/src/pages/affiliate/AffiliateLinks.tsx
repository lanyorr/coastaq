import { useState, useEffect } from "react";
import { AffiliateLayout } from "./AffiliateLayout";
import { useToast } from "@/hooks/use-toast";
import { Link2, Plus, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AffiliateLinks() {
  const { toast } = useToast();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProductId, setNewProductId] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/affiliates/me/links").then(r => r.ok ? r.json() : []).then(d => { setLinks(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function createLink() {
    if (!newProductId.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/affiliates/me/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: newProductId.trim() }) });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error || "Failed", variant: "destructive" }); } else { setLinks(p => [data, ...p]); setNewProductId(""); toast({ title: "Link created!" }); }
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    setCreating(false);
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/api/affiliates/track/${code}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(code); setTimeout(() => setCopied(null), 2000); });
  }

  return (
    <AffiliateLayout>
      <h1 className="text-2xl font-display font-bold mb-6">My Links</h1>

      <div className="bg-card border border-border/50 rounded-2xl p-5 mb-6">
        <h3 className="font-semibold mb-3">Create New Link</h3>
        <div className="flex gap-2">
          <Input placeholder="Product ID" value={newProductId} onChange={e => setNewProductId(e.target.value)} className="flex-1" onKeyDown={e => e.key === "Enter" && createLink()} />
          <Button onClick={createLink} disabled={creating || !newProductId.trim()} className="gap-2 shrink-0 bg-purple-600 hover:bg-purple-700">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-card border rounded-2xl p-4 h-16 animate-pulse" />)}</div>
      ) : links.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Link2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No links yet. Create your first affiliate link above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map(link => (
            <div key={link.id} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold text-primary truncate">/api/affiliates/track/{link.code}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{link.clicks} clicks · {link.conversions} conversions{link.productId && ` · Product: ${link.productId.slice(0, 8)}…`}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${link.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{link.isActive ? "Active" : "Inactive"}</span>
                <Button variant="ghost" size="sm" onClick={() => copyLink(link.code)} className="gap-1.5">
                  {copied === link.code ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied === link.code ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AffiliateLayout>
  );
}
