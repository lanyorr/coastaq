import { useState, useEffect, Fragment } from "react";
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
  group?: string;
}

interface DashboardLayoutProps {
  items: SidebarItem[];
  children: React.ReactNode;
  title?: string;
  titleIcon?: LucideIcon;
  accentColor?: string;
}

const E = {
  sidebarBg:  "#ffffff",
  sidebarBdr: "#e5e7eb",
  mainBg:     "#f9fafb",
  text:       "#111827",
  textSec:    "#6b7280",
  textMuted:  "#9ca3af",
  activeBg:   "#f3f4f6",
  hoverBg:    "#f9fafb",
  accent:     "#2563eb",
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

  const currentItem = (() => {
    const exact = items.find(i => i.exact ? location === i.href : location === i.href);
    if (exact) return exact;
    const prefix = [...items]
      .filter(i => !i.exact && location.startsWith(i.href + "/"))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return prefix ?? null;
  })();

  const NavItems = () => {
    let lastGroup = "";
    return (
      <ul className="flex-1 py-2 overflow-y-auto px-2">
        {items.map(({ href, label, icon: Icon, badge, exact, group }) => {
          const showGroup = !!group && group !== lastGroup;
          if (group) lastGroup = group;
          const active = exact
            ? location === href
            : location === href || location.startsWith(href + "/");
          return (
            <Fragment key={href}>
              {showGroup && (
                <li className="px-2 pt-4 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: E.textMuted }}>
                    {group}
                  </p>
                </li>
              )}
              <li>
                <Link href={href}
                  className={cn(
                    "flex items-center gap-2.5 py-2 text-sm font-medium transition-colors rounded",
                    active
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                  style={active
                    ? { borderLeft: `2px solid ${E.accent}`, paddingLeft: "10px", paddingRight: "12px" }
                    : { borderLeft: "2px solid transparent", paddingLeft: "10px", paddingRight: "12px" }
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className={cn(
                      "text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1",
                      active ? "bg-blue-600 text-white" : "bg-red-500 text-white",
                    )}>
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              </li>
            </Fragment>
          );
        })}
      </ul>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white" style={{ borderRight: `1px solid ${E.sidebarBdr}` }}>
      {/* Brand */}
      <Link href="/" className="block px-4 py-3.5 hover:bg-gray-50 transition-colors shrink-0"
        style={{ borderBottom: `1px solid ${E.sidebarBdr}` }}>
        <div className="flex items-center gap-2.5">
          <img src="/favicon.ico" alt="" className="w-6 h-6 shrink-0" onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Coastaq</p>
            {title && <p className="text-[10px] text-gray-500 mt-0.5">{title}</p>}
          </div>
        </div>
      </Link>

      <NavItems />

      {/* Footer */}
      <div className="shrink-0 px-2 pt-2 pb-3" style={{ borderTop: `1px solid ${E.sidebarBdr}` }}>
        <Link href="/"
          className="flex items-center gap-2.5 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors rounded"
          style={{ borderLeft: "2px solid transparent", paddingLeft: "10px", paddingRight: "12px" }}>
          <Home className="w-4 h-4 shrink-0" />
          Back to Store
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors rounded mt-0.5"
          style={{ borderLeft: "2px solid transparent", paddingLeft: "10px" }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Log out
        </button>

        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded mt-2" style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold bg-blue-600">
              {(user.name as string)?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{user.name as string}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{ROLE_LABELS[primaryRole]}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-56 flex flex-col">
            <SidebarContent />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3.5 right-3 p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-56 min-h-screen">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-20 bg-white"
          style={{ borderBottom: `1px solid ${E.sidebarBdr}` }}>
          <button onClick={() => setOpen(true)} className="p-1.5 rounded text-gray-500 hover:text-gray-700 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          {title && <span className="font-semibold text-gray-900 text-sm">{title}</span>}
          <Link href="/" className="ml-auto">
            <a className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors">
              Store <ChevronRight className="w-3 h-3" />
            </a>
          </Link>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          {/* Breadcrumb */}
          {(title || currentItem) && (
            <nav className="flex items-center gap-1 mb-4 text-xs text-gray-500 select-none" aria-label="Breadcrumb">
              <Link href="/">
                <a className="flex items-center gap-1 hover:text-gray-900 transition-colors">
                  <Home className="w-3 h-3" />
                  <span className="hidden sm:inline">Home</span>
                </a>
              </Link>
              {title && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                  {currentItem ? (
                    <Link href={items[0]?.href ?? "/"}>
                      <a className="hover:text-gray-900 transition-colors">{title}</a>
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium">{title}</span>
                  )}
                </>
              )}
              {currentItem && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                  <span className="text-gray-900 font-medium truncate max-w-[160px]">{currentItem.label}</span>
                </>
              )}
            </nav>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
