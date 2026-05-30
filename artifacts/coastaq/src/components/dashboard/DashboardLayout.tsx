import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Menu, X, LogOut, Home, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildRolesFromUser, ROLE_LABELS, getPrimaryRole } from "@/lib/auth/rbac";
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

/* ── colour tokens ── */
const S = {
  sidebarBg:   "#0c0520",
  sidebarBdr:  "#221648",
  mainBg:      "#12082a",
  cardBg:      "#1a1040",
  cardBdr:     "#281850",
  mutedTxt:    "#7b80b5",
  hoverBg:     "rgba(255,255,255,0.05)",
} as const;

export function DashboardLayout({
  items,
  children,
  title,
  titleIcon: TitleIcon,
  accentColor = "bg-blue-600",
}: DashboardLayoutProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { data: user } = useGetMe({ query: { retry: false } });
  const [open, setOpen] = useState(false);

  const userRoles = user ? buildRolesFromUser(user as any) : [];
  const primaryRole = getPrimaryRole(userRoles);

  useEffect(() => { setOpen(false); }, [location]);

  const logout = () => {
    localStorage.removeItem("coastaq_token");
    window.location.href = "/";
  };

  const NavItems = () => (
    <ul className="flex-1 py-3 space-y-0.5 px-3 overflow-y-auto">
      {items.map(({ href, label, icon: Icon, badge, exact }) => {
        const active = exact ? location === href : location === href || location.startsWith(href + "/");
        return (
          <li key={href}>
            <Link href={href}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? `${accentColor} text-white shadow-lg shadow-black/30`
                  : `hover:text-white transition-colors`,
              )}
              style={active ? {} : { color: S.mutedTxt }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = S.hoverBg; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className={cn(
                    "text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1",
                    active ? "bg-white/25 text-white" : "bg-red-500 text-white",
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
    <div className="flex flex-col h-full" style={{ background: S.sidebarBg, borderRight: `1px solid ${S.sidebarBdr}` }}>
      {/* Brand */}
      <div className="px-5 py-5 shrink-0" style={{ borderBottom: `1px solid ${S.sidebarBdr}` }}>
        <div className="flex items-center gap-3">
          {TitleIcon && (
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", accentColor)}>
              <TitleIcon style={{ width: 18, height: 18, color: "white" }} />
            </div>
          )}
          <div>
            <p className="text-white text-sm font-bold leading-tight">{title}</p>
            <p className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: S.mutedTxt }}>Coastaq</p>
          </div>
        </div>
      </div>

      <NavItems />

      {/* Footer */}
      <div className="shrink-0 px-3 pt-2 pb-4" style={{ borderTop: `1px solid ${S.sidebarBdr}` }}>
        <Link href="/">
          <a className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: S.mutedTxt }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = S.hoverBg; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = S.mutedTxt; }}>
            <Home className="w-4 h-4 shrink-0" />
            Back to Store
          </a>
        </Link>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-0.5"
          style={{ color: S.mutedTxt }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = S.mutedTxt; }}>
          <LogOut className="w-4 h-4 shrink-0" />
          Log out
        </button>

        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mt-1" style={{ background: S.hoverBg }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
              {(user.name as string)?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">{user.name as string}</p>
              <p className="text-[10px] mt-0.5" style={{ color: S.mutedTxt }}>{ROLE_LABELS[primaryRole]}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: S.mainBg }}>
      <aside className="hidden lg:flex w-60 shrink-0 flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-64 flex flex-col">
            <SidebarContent />
            <button onClick={() => setOpen(false)}
              className="absolute top-3.5 right-3 p-1.5 rounded-lg transition-colors"
              style={{ color: S.mutedTxt }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:ml-60 min-h-screen">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-20"
          style={{ background: S.sidebarBg, borderBottom: `1px solid ${S.sidebarBdr}` }}>
          <button onClick={() => setOpen(true)} className="p-2 rounded-xl transition-colors" style={{ color: S.mutedTxt }}>
            <Menu className="w-5 h-5" />
          </button>
          {title && <span className="font-bold text-white text-sm">{title}</span>}
          <Link href="/" className="ml-auto">
            <a className="text-xs flex items-center gap-1 transition-colors" style={{ color: S.mutedTxt }}>
              Store <ChevronRight className="w-3 h-3" />
            </a>
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
