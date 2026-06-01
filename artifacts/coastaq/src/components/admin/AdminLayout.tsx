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

const ACCENT = "#2563eb";

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
        <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const SidebarContent = () => {
    let lastGroup = "";
    return (
      <nav className="flex flex-col h-full bg-white" style={{ borderRight: "1px solid #e5e7eb" }}>
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 px-4 py-3.5 hover:bg-gray-50 transition-colors shrink-0"
          style={{ borderBottom: "1px solid #e5e7eb" }}>
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 bg-blue-600">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Coastaq</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Admin Panel</p>
          </div>
        </Link>

        {/* Nav items */}
        <ul className="flex-1 py-2 px-2 overflow-y-auto">
          {NAV.map(item => {
            const showGroup = !!item.group && item.group !== lastGroup;
            if (item.group) lastGroup = item.group;
            const active = isActive(item);
            return (
              <Fragment key={item.href}>
                {showGroup && (
                  <li className="px-2 pt-4 pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
                      {item.group}
                    </p>
                  </li>
                )}
                <li>
                  <Link href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 py-2 text-sm font-medium transition-colors rounded",
                      active
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                    style={active
                      ? { borderLeft: `2px solid ${ACCENT}`, paddingLeft: "10px", paddingRight: "12px" }
                      : { borderLeft: "2px solid transparent", paddingLeft: "10px", paddingRight: "12px" }
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              </Fragment>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="px-2 pb-3 pt-2 shrink-0" style={{ borderTop: "1px solid #e5e7eb" }}>
          <Link href="/"
            className="flex items-center gap-2.5 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors rounded"
            style={{ borderLeft: "2px solid transparent", paddingLeft: "10px", paddingRight: "12px" }}>
            <Home className="w-4 h-4 shrink-0" />
            Back to Store
          </Link>
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded mt-2 bg-gray-50 border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{user.email}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 z-50" onClick={e => e.stopPropagation()}>
            <SidebarContent />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3.5 right-3 p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-56 min-w-0 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button className="p-1.5 rounded text-gray-500 hover:text-gray-700 transition-colors" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-500">
            <Link href="/" className="flex items-center gap-1 hover:text-gray-900 transition-colors">
              <Home className="w-3 h-3" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="font-medium text-gray-900">Admin</span>
            {currentItem && currentItem.href !== "/admin" && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-300" />
                <span className="font-medium text-gray-900">{currentItem.label}</span>
              </>
            )}
          </nav>
        </div>

        <main className="p-4 lg:p-6 flex-1 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
