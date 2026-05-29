import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { AccountLayout } from "./AccountLayout";
import { format } from "date-fns";
import { AlertTriangle, Trash2, User, Mail, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteAccountDialog } from "@/components/account/DeleteAccountDialog";
import { buildRolesFromUser, ROLE_LABELS, ROLE_COLORS } from "@/lib/auth/rbac";
import { cn } from "@/lib/utils";

export default function AccountSettings() {
  const { data: user } = useGetMe({ query: { retry: false } });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const memberSince = (user as any)?.createdAt
    ? format(new Date((user as any).createdAt as string), "MMMM d, yyyy")
    : "Recently";

  const userRoles = user ? buildRolesFromUser(user as any) : [];

  return (
    <AccountLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Account Settings</h1>

      {/* Profile info */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mb-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Account Details
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2.5 border-b border-border/40">
            <div className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4" /> Name</div>
            <span className="font-medium">{(user as any)?.name}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-border/40">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /> Email</div>
            <span className="font-medium">{(user as any)?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b border-border/40">
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /> Member since</div>
            <span className="font-medium">{memberSince}</span>
          </div>
          <div className="flex items-start justify-between py-2.5">
            <div className="flex items-center gap-2 text-muted-foreground"><Shield className="w-4 h-4" /> Roles</div>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {userRoles.map(r => (
                <span key={r} className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ROLE_COLORS[r])}>
                  {ROLE_LABELS[r]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-red-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-red-600">Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete your account and all associated data — orders, messages, and saved listings. This cannot be undone.
        </p>
        <button
          onClick={() => setDeleteDialogOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-xl transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete My Account
        </button>
      </div>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={() => { window.location.href = "/"; }}
        userName={(user as any)?.name}
      />
    </AccountLayout>
  );
}
