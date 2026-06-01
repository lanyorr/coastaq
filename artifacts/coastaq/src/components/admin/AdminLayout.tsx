import { Link, useLocation } from "wouter";
import { useEffect, useState, Fragment } from "react";
import {
  LayoutDashboard, Users, Store, Package, Flag,
  BarChart3, Tag, LogOut, Menu, ShieldCheck, Truck, AlertTriangle,
  Home, ChevronRight, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminUser { id: string; name: string; email: string; role: string; }

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
  exact?: boolean;
}

const NAV: NavItem[] = [
  { href: "/admin",            label: "Overview",      icon: LayoutDashboard, exact: true },

  { href: "/admin/users",      label: "Users",         icon: Users,           group: "Marketplace" },
  { href: "/admin/shops",      label: "Shops",         icon: Store,           group: "Marketplace" },
  { href: "/admin/products",   label: "Products",      icon: Package,         group: "Marketplace" },
  { href: "/admin/categories", label: "Categories",    icon: Tag,             group: "Marketplace" },

  { href: "/admin/reports",    label: "Reports",       icon: Flag,            group: "Analytics" },
  { href: "/admin/analytics",  label: "Analytics",     icon: BarChart3,       group: "Analytics" },

  { href: "/admin/shipping",   label: "Shipping",      icon: Truck,           group: "Operations" },

  { href: "/admin/verification", label: "Verification",  icon: ShieldCheck,   group: "Trust & Safety" },
  { href: "/admin/fraud",        label: "Fraud Monitor", icon: AlertTriangle, group: "Trust & Safety" },
];

const S = {
  bg:      "#f8f9fc",
  sidebarBg: "white",
  sidebarBdr: "#e5e7eb",
  mutedTxt: "#9ca3af",
  dimTxt:  "#d1d5db",
} as const;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (!d?.id || d.role !== "ADMIN") navigate("/");
        else setUser(d);
      })
      .catch(() => navigate("/"));
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  const logout = () => {
    localStorage.removeItem("coastaq_token");
    navigate("/");
  };

  const isActive = (item: NavItem) =>
    item.exact ? location === item.href : location.startsWith(item.href);

  const currentItem = NAV.find(isActive);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const SidebarContent = () => {
    let lastGroup = "";
    return (
      <nav className="flex flex-col h-full" style={{ background: S.sidebarBg }}>
        {/* Brand — links to homepage */}
        <Link href="/">
          <a
            className="flex items-center gap-3 px-5 py-4 border-b hover:bg-gray-50 transition-colors"
            style={{ borderColor: S.sidebarBdr }}
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">Admin Panel</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest">Coastaq</p>
            </div>
          </a>
        </Link>

        {/* Nav items with section labels */}
        <ul className="flex-1 py-2 px-3 overflow-y-auto space-y-0.5">
          {/* Overview always first, no group */}
          {(() => {
            const overview = NAV.find(n => !n.group);
            if (!overview) return null;
            const active = isActive(overview);
            return (
              <li key={overview.href}>
                <Link href={overview.href}>
                  <a
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-white shadow-sm shadow-primary/30"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                    )}
                  >
                    <overview.icon className="w-4 h-4" />
                    {overview.label}
                  </a>
                </Link>
              </li>
            );
          })()}

          {/* Grouped items */}
          {NAV.filter(n => n.group).map(item => {
            const showGroup = item.group !== lastGroup;
            if (item.group) lastGroup = item.group;
            const active = isActive(item);
            return (
              <Fragment key={item.href}>
                {showGroup && (
                  <li className="px-3 pt-3.5 pb-0.5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-300">
                      {item.group}
                    </p>
                  </li>
                )}
                <li>
                  <Link href={item.href}>
                    <a
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-white shadow-sm shadow-primary/30"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </a>
                  </Link>
                </li>
              </Fragment>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="px-3 pb-4 pt-2" style={{ borderTop: `1px solid ${S.sidebarBdr}` }}>
          <Link href="/">
            <a className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
              <Home className="w-4 h-4" />
              Back to Store
            </a>
          </Link>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mt-1 bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen flex" style={{ background: S.bg }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r bg-white shrink-0 fixed inset-y-0 left-0 z-30" style={{ borderColor: S.sidebarBdr }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r z-50" style={{ borderColor: S.sidebarBdr }} onClick={e => e.stopPropagation()}>
            <SidebarContent />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3.5 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 min-w-0 flex flex-col">
        {/* Topbar */}
        <div
          className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b px-4 py-3 flex items-center gap-3"
          style={{ borderColor: S.sidebarBdr }}
        >
          <Button variant="ghost" size="icon" className="lg:hidden -ml-1" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/">
              <a className="flex items-center gap-1 hover:text-gray-600 transition-colors">
                <Home className="w-3 h-3" />
                <span className="hidden sm:inline">Home</span>
              </a>
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            {currentItem ? (
              <>
                <Link href="/admin">
                  <a className="hover:text-gray-600 transition-colors">Admin</a>
                </Link>
                {currentItem.href !== "/admin" && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="font-semibold text-gray-700">{currentItem.label}</span>
                  </>
                )}
              </>
            ) : (
              <span className="font-semibold text-gray-700">Admin</span>
            )}
          </nav>
        </div>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
