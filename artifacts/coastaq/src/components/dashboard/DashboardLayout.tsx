import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import {
  Menu, X, LogOut, Home, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildRolesFromUser, ROLE_LABELS, ROLE_COLORS, getPrimaryRole, type AppRole } from "@/lib/auth/rbac";
import type { LucideIcon } from "lucide-react";

export interface SidebarItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  exact?: boolean;
}

interface DashboardLayoutProps {
  items: SidebarItem[];
  children: React.ReactNode;
  title?: string;
  titleIcon?: LucideIcon;
  accentColor?: string;
}

export function DashboardLayout({
  items,
  children,
  title,
  titleIcon: TitleIcon,
  accentColor = "bg-primary",
}: DashboardLayoutProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { data: user } = useGetMe({ query: { retry: false } });
  const [open, setOpen] = useState(false);

  const userRoles = user ? buildRolesFromUser(user as any) : [];
  const primaryRole = getPrimaryRole(userRoles);

  // Close mobile sidebar on route change
  useEffect(() => { setOpen(false); }, [location]);

  const logout = () => {
    localStorage.removeItem("coastaq_token");
    setLocation("/");
    window.location.href = "/";
  };

  const NavItems = () => (
    <ul className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
      {items.map(({ href, label, icon: Icon, badge, exact }) => {
        const active = exact ? location === href : location === href || location.startsWith(href + "/");
        return (
          <li key={href}>
            <Link href={href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? `${accentColor} text-white shadow-sm`
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1",
                    active ? "bg-white/30 text-white" : "bg-primary text-white",
                  )}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </a>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border/60">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border/50 shrink-0">
        {title && TitleIcon ? (
          <div className="flex items-center gap-2.5">
            <div className={cn("p-1.5 rounded-lg", accentColor)}>
              <TitleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-base">{title}</span>
          </div>
        ) : (
          <Link href="/">
            <a className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-primary">Coastaq</span>
            </a>
          </Link>
        )}
      </div>

      {/* User card */}
      {user && (
        <div className="px-3 py-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-secondary/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {(user.name as string)?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user.name as string}</p>
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                ROLE_COLORS[primaryRole],
              )}>
                {ROLE_LABELS[primaryRole]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <NavItems />

      {/* Footer */}
      <div className="shrink-0 px-2 pb-4 pt-2 border-t border-border/50 space-y-0.5">
        <Link href="/">
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
            <Home className="w-4 h-4 shrink-0" />
            Back to Storefront
          </a>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-64 flex flex-col">
            <SidebarContent />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-60 min-h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card sticky top-0 z-20">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          {title && (
            <span className="font-display font-bold">{title}</span>
          )}
          <Link href="/" className="ml-auto">
            <a className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
              Storefront <ChevronRight className="w-3 h-3" />
            </a>
          </Link>
        </header>

        {/* Page content — pb-16 md:pb-0 clears the mobile bottom tab bar */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
