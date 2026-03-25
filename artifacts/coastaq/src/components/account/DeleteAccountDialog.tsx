import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
  userName?: string;
}

export function DeleteAccountDialog({ open, onOpenChange, onDeleted, userName }: Props) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      toast({ variant: "destructive", title: "Password required", description: "Please enter your password to confirm." });
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast({ variant: "destructive", title: "Could not delete account", description: data.error || "Please try again." });
        setLoading(false);
        return;
      }
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      localStorage.removeItem("coastaq_token");
      localStorage.removeItem("coastaq_saved");
      localStorage.removeItem("coastaq_cart");
      onOpenChange(false);
      onDeleted();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong. Please try again." });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!loading) { onOpenChange(v); setPassword(""); } }}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-lg">Delete Account</DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            This will permanently delete {userName ? <strong>{userName}'s</strong> : "your"} account and all associated data — including your shop, listings, orders, and messages. <strong>This cannot be undone.</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="delete-password" className="text-sm font-medium">
              Enter your password to confirm
            </Label>
            <Input
              id="delete-password"
              type="password"
              placeholder="Your current password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleDelete()}
              className="h-11 rounded-xl"
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              onClick={() => { onOpenChange(false); setPassword(""); }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-11 rounded-xl gap-2"
              onClick={handleDelete}
              disabled={loading || !password}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
                : <><Trash2 className="w-4 h-4" /> Delete Account</>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
