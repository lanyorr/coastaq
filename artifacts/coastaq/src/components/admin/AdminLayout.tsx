import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, Store, Package, Flag,
  BarChart3, Tag, LogOut, Menu, X, ShieldCheck, Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminUser { id: string; name: string; email: string; role: string; }

const NAV = [
  { href: "/admin",           label: "Overview",   icon: LayoutDashboard },
  { href: "/admin/users",     label: "Users",      icon: Users },
  { href: "/admin/shops",     label: "Shops",      icon: Store },
  { href: "/admin/products",  label: "Products",   icon: Package },
  { href: "/admin/reports",   label: "Reports",    icon: Flag },
  { href: "/admin/analytics", label: "Analytics",  icon: BarChart3 },
  { href: "/admin/categories",label: "Categories", icon: Tag },
  { href: "/admin/shipping",  label: "Shipping",   icon: Truck },
];

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

  const logout = () => {
    localStorage.removeItem("coastaq_token");
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const Sidebar = () => (
    <nav className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border/50">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <span className="font-display font-bold text-lg">Admin Panel</span>
      </div>
      <ul className="flex-1 py-4 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? location === "/admin" : location.startsWith(href);
          return (
            <li key={href}>
              <Link href={href}>
                <a
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="px-3 pb-6 border-t border-border/50 pt-4">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm font-semibold truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border/50 bg-card shrink-0 fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border/50 z-50" onClick={e => e.stopPropagation()}>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 min-w-0">
        {/* Topbar */}
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border/50 px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-sm text-muted-foreground font-medium">
            {NAV.find(n => n.href === "/admin" ? location === "/admin" : location.startsWith(n.href))?.label ?? "Admin"}
          </span>
        </div>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
