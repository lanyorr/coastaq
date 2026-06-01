import { Link, useLocation } from "wouter";
import {
  Search, User, Store, LayoutDashboard, MessageCircle,
  Menu, X, ShoppingBag, Plus, ChevronDown, ExternalLink,
  Globe, Smartphone, Heart, Package, Shield,
  TrendingUp, Link2, FileText, Info,
  LogOut, Settings, DollarSign, BarChart3, Home,
  Megaphone, Tag, BadgePercent, LifeBuoy, HelpCircle,
  Bell, BellRing,
} from "lucide-react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CoastaqLogo } from "./CoastaqLogo";
import { useLocale } from "@/lib/locale/context";
import { LANGUAGES } from "@/lib/locale/translations";
import { CURRENCIES } from "@/lib/locale/currencies";
import { cn } from "@/lib/utils";
import { buildRolesFromUser, hasRole } from "@/lib/auth/rbac";

/* ─── Auth-guard helper ────────────────────────────────────────────────────── */
function useAuthNav() {
  const [, setLocation] = useLocation();
  const { data: user } = useGetMe({ query: { retry: false } });
  return (path: string, fallback = "/auth/login") => {
    setLocation(user ? path : `${fallback}?redirect=${encodeURIComponent(path)}`);
  };
}

/* ─── Hover dropdown ───────────────────────────────────────────────────────── */
function NavDropdown({
  label,
  icon,
  align = "left",
  children,
}: {
  label: React.ReactNode;
  icon?: React.ReactNode;
  align?: "left" | "right";
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const openMenu = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  }, []);

  const close = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap rounded-md",
          open
            ? "text-primary bg-primary/5"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
        )}
      >
        {icon && <span className={cn("transition-colors", open ? "text-primary" : "text-gray-400")}>{icon}</span>}
        {label}
        <ChevronDown className={cn("w-3 h-3 transition-transform duration-150", open ? "rotate-180 text-primary" : "text-gray-400")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full z-[200] bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-black/10 overflow-hidden",
            align === "right" ? "right-0" : "left-0",
          )}
          style={{ marginTop: 4 }}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

/* ─── Drop item ─────────────────────────────────────────────────────────────── */
function DropItem({
  icon,
  label,
  sub,
  onClick,
  href,
  accent,
  external,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick?: () => void;
  href?: string;
  accent?: boolean;
  external?: boolean;
  badge?: string;
}) {
  const cls = cn(
    "flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer group w-full text-left",
    accent && "hover:bg-primary/5",
  );
  const iconCls = cn(
    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
    accent
      ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
      : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700",
  );
  const inner = (
    <>
      <span className={iconCls}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className={cn("block font-medium leading-tight", accent ? "text-primary" : "text-gray-800")}>{label}</span>
        {sub && <span className="block text-xs text-gray-400 mt-0.5 leading-tight">{sub}</span>}
      </span>
      {badge && <span className="ml-auto shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600">{badge}</span>}
      {external && <ExternalLink className="w-3.5 h-3.5 text-gray-300 shrink-0 ml-1" />}
    </>
  );
  if (href && external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
  if (href) return <Link href={href} className={cls} onClick={onClick}>{inner}</Link>;
  return <button className={cls} onClick={onClick}>{inner}</button>;
}

function DropSep() { return <div className="mx-4 border-t border-gray-100 my-1" />; }
function DropHeader({ label }: { label: string }) {
  return <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>;
}

/* ─── Icon action button (top row) ─────────────────────────────────────────── */
function ActionIcon({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="hidden sm:flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors relative group"
      title={label}
    >
      <div className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium leading-none group-hover:text-primary transition-colors">{label}</span>
    </button>
  );
}

/* ─── Notification Bell ─────────────────────────────────────────────────────── */
interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
  icon?: string;
}

function NotificationBell({ user }: { user: any }) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    const load = () =>
      fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${localStorage.getItem("coastaq_token") ?? ""}` },
      }).then(r => r.json()).then(d => { if (Array.isArray(d)) setItems(d); }).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = items.filter(i => !i.read && !readIds.has(i.id)).length;

  const markAllRead = () => setReadIds(new Set(items.map(i => i.id)));

  const typeColor: Record<string, string> = {
    order: "bg-blue-100 text-blue-600",
    shipping: "bg-orange-100 text-orange-600",
    verification: "bg-purple-100 text-purple-600",
    document: "bg-yellow-100 text-yellow-700",
    message: "bg-green-100 text-green-600",
    system: "bg-gray-100 text-gray-500",
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "hidden sm:flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-colors relative group",
          open ? "text-primary bg-primary/5" : "text-gray-500 hover:text-primary hover:bg-primary/5",
        )}
        title="Notifications"
      >
        <div className="relative">
          {unread > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium leading-none group-hover:text-primary transition-colors">Alerts</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-black/10 z-[200] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-sm text-gray-900">Notifications</span>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-medium">All caught up!</p>
              <p className="text-xs text-gray-300 mt-0.5">No new notifications</p>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {items.map(item => {
                const isRead = item.read || readIds.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                        !isRead && "bg-blue-50/40",
                      )}
                      onClick={() => {
                        setReadIds(prev => new Set([...prev, item.id]));
                        setOpen(false);
                        setLocation(item.href);
                      }}
                    >
                      <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 font-medium", typeColor[item.type] ?? "bg-gray-100 text-gray-500")}>
                        {item.icon ?? "🔔"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium leading-tight truncate", isRead ? "text-gray-600" : "text-gray-900")}>
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.body}</p>
                      </div>
                      {!isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              onClick={() => { setOpen(false); setLocation("/seller/orders"); }}
              className="text-xs text-primary hover:underline font-medium w-full text-center"
            >
              View all activity →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Navbar ───────────────────────────────────────────────────────────── */
export function Navbar() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: user } = useGetMe({ query: { retry: false } });
  const { mutate: logout } = useLogout();
  const queryClient = useQueryClient();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const { t, lang, currency, setLang, setCurrency } = useLocale();

  const userRoles = user ? buildRolesFromUser(user as any) : [];
  const isSeller    = hasRole(userRoles, "SELLER");
  const isAffiliate = hasRole(userRoles, "AFFILIATE");
  const isAdmin     = hasRole(userRoles, "ADMIN");

  /* auth-guard nav */
  const authNav = (path: string) => {
    setLocation(user ? path : `/auth/login?redirect=${encodeURIComponent(path)}`);
    setMobileOpen(false);
  };

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const poll = () =>
      fetch("/api/messages/unread").then(r => r.json()).then(d => setUnread(d.unread ?? 0)).catch(() => {});
    poll();
    const t = setInterval(poll, 15000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    if (mobileSearchOpen) setTimeout(() => mobileSearchRef.current?.focus(), 60);
  }, [mobileSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const cur = new URLSearchParams(window.location.search);
    const next = new URLSearchParams();
    if (cur.get("category")) next.set("category", cur.get("category")!);
    next.set("search", searchQuery.trim());
    setLocation(`/?${next.toString()}`);
    setMobileOpen(false);
    setMobileSearchOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("coastaq_token");
    queryClient.clear();
    logout(undefined as any);
    setLocation("/");
    setMobileOpen(false);
  };

  const currentLang = LANGUAGES[lang];
  const currentCurrency = CURRENCIES[currency];

  /* ── render ───────────────────────────────────────────────────────────────── */
  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">

        {/* ══ ROW 1: Logo · Search · Actions ══════════════════════════════════ */}
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 mr-1" onClick={() => setMobileOpen(false)}>
            <CoastaqLogo />
          </Link>

          {/* Search bar — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="flex w-full rounded-full border border-gray-200 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all bg-gray-50">
              <div className="flex items-center pl-4 shrink-0">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <Input
                type="search"
                placeholder={t("nav.searchPlaceholder")}
                className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-10 pl-2"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="px-5 h-10 bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right utility actions */}
          <div className="flex items-center gap-0.5 ml-auto">

            {/* Mobile search toggle */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              onClick={() => { setMobileSearchOpen(v => !v); setMobileOpen(false); }}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Post Free Ad — desktop only */}
            <button
              onClick={() => user ? setLocation("/seller/products") : setLocation("/auth/register?role=SELLER")}
              className="hidden lg:flex items-center gap-2 mx-1 px-3 py-2 rounded-xl text-sm font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200/60 transition-colors"
            >
              <Megaphone className="w-4 h-4" />
              Post Free Ad
            </button>

            {/* Messages */}
            <ActionIcon
              icon={<MessageCircle className="w-5 h-5" />}
              label="Messages"
              badge={unread}
              onClick={() => authNav("/messages")}
            />

            {/* Orders */}
            <ActionIcon
              icon={<ShoppingBag className="w-5 h-5" />}
              label="Orders"
              onClick={() => authNav("/account/orders")}
            />

            {/* Notification bell */}
            <NotificationBell user={user} />

            {/* Sign In / User dropdown */}
            {user ? (
              <NavDropdown
                align="right"
                label={
                  <span className="hidden lg:inline font-medium max-w-[80px] truncate text-gray-700">
                    {(user.name as string)?.split(" ")[0]}
                  </span>
                }
                icon={
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(user.name as string)?.[0]?.toUpperCase() ?? "U"}
                  </span>
                }
              >
                {close => (
                  <div className="w-56 py-2">
                    <div className="px-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-3 pt-1">
                        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                          {(user.name as string)?.[0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{user.name as string}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email as string}</p>
                        </div>
                      </div>
                    </div>
                    <DropHeader label="My Account" />
                    <DropItem icon={<User className="w-4 h-4" />} label="Profile" sub="Account settings" href="/account" onClick={close} />
                    <DropItem icon={<Package className="w-4 h-4" />} label="My Orders" sub="Track purchases" href="/account/orders" onClick={close} />
                    <DropItem icon={<Heart className="w-4 h-4" />} label="Saved" sub="Bookmarked listings" href="/account/saved" onClick={close} />
                    <DropItem icon={<MessageCircle className="w-4 h-4" />} label="Messages" badge={unread > 0 ? `${unread}` : undefined} href="/messages" onClick={close} />
                    {(isSeller || isAffiliate || isAdmin) && (
                      <>
                        <DropSep />
                        <DropHeader label="Switch Workspace" />
                        <DropItem icon={<User className="w-4 h-4" />} label="Buyer Hub" sub="Orders & purchases" href="/account" onClick={close} />
                        {isSeller && <DropItem icon={<Store className="w-4 h-4" />} label="Seller Hub" sub="Products & earnings" href="/seller" onClick={close} accent />}
                        {isAffiliate && <DropItem icon={<Link2 className="w-4 h-4" />} label="Affiliate Hub" sub="Links & commissions" href="/affiliate" onClick={close} accent />}
                        {isAdmin && <DropItem icon={<BarChart3 className="w-4 h-4" />} label="Admin Panel" sub="Manage marketplace" href="/admin" onClick={close} accent />}
                      </>
                    )}
                    <DropSep />
                    <DropItem icon={<Settings className="w-4 h-4" />} label="Settings" href="/account/settings" onClick={close} />
                    <button
                      onClick={() => { handleLogout(); close(); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <LogOut className="w-4 h-4 text-red-500" />
                      </span>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                )}
              </NavDropdown>
            ) : (
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={() => setLocation("/auth/login")}
                  className="hidden sm:flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl text-gray-500 hover:text-primary hover:bg-primary/5 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="text-[10px] font-medium leading-none">Sign In</span>
                </button>
                <button
                  onClick={() => setLocation("/auth/register")}
                  className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-full transition-colors shadow-sm shadow-primary/20"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
              onClick={() => { setMobileOpen(v => !v); setMobileSearchOpen(false); }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ══ ROW 2: Category nav with dropdowns (desktop only) ══════════════ */}
        <div className="hidden md:block border-t border-gray-100 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-9">

              {/* Left: role-nav dropdowns */}
              <div className="flex items-center">

                {/* Seller */}
                <NavDropdown label="Seller" icon={<Store className="w-3.5 h-3.5" />}>
                  {close => (
                    <div className="w-64 py-2">
                      {isSeller ? (
                        <>
                          <DropHeader label="My Seller Hub" />
                          <DropItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" sub="Overview & quick actions" href="/seller" onClick={close} accent />
                          <DropItem icon={<Tag className="w-4 h-4" />} label="Products" sub="Manage listings" href="/seller/products" onClick={close} />
                          <DropItem icon={<ShoppingBag className="w-4 h-4" />} label="Orders" sub="Fulfil & track" href="/seller/orders" onClick={close} />
                          <DropItem icon={<DollarSign className="w-4 h-4" />} label="Earnings" sub="Escrow & payouts" href="/seller/earnings" onClick={close} />
                          <DropItem icon={<Settings className="w-4 h-4" />} label="Shop Settings" sub="Branding & profile" href="/seller/shop" onClick={close} />
                        </>
                      ) : (
                        <>
                          <DropHeader label="Become a Seller" />
                          <DropItem icon={<Megaphone className="w-4 h-4" />} label="Start Selling Free" sub="List products, no fees" href="/auth/register?role=SELLER" onClick={close} accent badge="Free" />
                          <DropItem icon={<FileText className="w-4 h-4" />} label="Seller Agreement" href="/seller-agreement" onClick={close} />
                        </>
                      )}
                      <DropSep />
                      <DropItem icon={<Shield className="w-4 h-4" />} label="Escrow Protection" sub="Secure seller payouts" href="/terms" onClick={close} />
                    </div>
                  )}
                </NavDropdown>

                {/* Buyer */}
                <NavDropdown label="Buyer" icon={<ShoppingBag className="w-3.5 h-3.5" />}>
                  {close => (
                    <div className="w-64 py-2">
                      {user ? (
                        <>
                          <DropHeader label="My Buying" />
                          <DropItem icon={<User className="w-4 h-4" />} label="My Account" sub="Profile & preferences" href="/account" onClick={close} accent />
                          <DropItem icon={<Package className="w-4 h-4" />} label="My Orders" sub="Track & manage" href="/account/orders" onClick={close} />
                          <DropItem icon={<Heart className="w-4 h-4" />} label="Saved Listings" sub="Bookmarked items" href="/account/saved" onClick={close} />
                          <DropItem icon={<MessageCircle className="w-4 h-4" />} label="Messages" sub="Chat with sellers" href="/messages" onClick={close} />
                        </>
                      ) : (
                        <>
                          <DropHeader label="Get Started" />
                          <DropItem icon={<User className="w-4 h-4" />} label="Sign In to Buy" sub="Access your account" href="/auth/login" onClick={close} accent />
                          <DropItem icon={<Plus className="w-4 h-4" />} label="Create Account" sub="Free buyer account" href="/auth/register" onClick={close} />
                        </>
                      )}
                      <DropSep />
                      <DropHeader label="Buyer Protection" />
                      <DropItem icon={<Shield className="w-4 h-4" />} label="Escrow Guarantee" sub="100% secure payments" href="/terms" onClick={close} />
                    </div>
                  )}
                </NavDropdown>

                {/* Affiliate */}
                <NavDropdown label="Affiliate" icon={<BadgePercent className="w-3.5 h-3.5" />}>
                  {close => (
                    <div className="w-64 py-2">
                      {isAffiliate ? (
                        <>
                          <DropHeader label="My Affiliate Hub" />
                          <DropItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" sub="Stats & overview" href="/affiliate" onClick={close} accent />
                          <DropItem icon={<Link2 className="w-4 h-4" />} label="My Links" sub="Generate & track links" href="/affiliate/links" onClick={close} />
                          <DropItem icon={<DollarSign className="w-4 h-4" />} label="Commissions" sub="Earnings history" href="/affiliate/commissions" onClick={close} />
                        </>
                      ) : (
                        <>
                          <DropHeader label="Earn with Coastaq" />
                          <DropItem icon={<TrendingUp className="w-4 h-4" />} label="Become an Affiliate" sub="Earn 5% per referral" href={user ? "/affiliate" : "/auth/register?affiliate=1"} onClick={close} accent badge="5%" />
                        </>
                      )}
                      <DropSep />
                      <DropItem icon={<Info className="w-4 h-4" />} label="How It Works" sub="Share links, earn commissions" href="/affiliate" onClick={close} />
                    </div>
                  )}
                </NavDropdown>

                {/* Divider */}
                <span className="w-px h-4 bg-gray-200 mx-1" />

                {/* Help */}
                <NavDropdown label="Help" icon={<HelpCircle className="w-3.5 h-3.5" />}>
                  {close => (
                    <div className="w-56 py-2">
                      <DropItem icon={<LifeBuoy className="w-4 h-4" />} label="Help Centre" sub="FAQs & guides" href="/help" onClick={close} />
                      <DropItem icon={<Shield className="w-4 h-4" />} label="Buyer Protection" sub="Dispute resolution" href="/terms" onClick={close} />
                      <DropItem icon={<MessageCircle className="w-4 h-4" />} label="Contact Us" sub="Get in touch" onClick={() => { close(); authNav("/messages"); }} />
                    </div>
                  )}
                </NavDropdown>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Right: Apps + Language */}
              <div className="flex items-center">

                {/* Apps */}
                <NavDropdown label="Apps" align="right">
                  {close => (
                    <div className="w-52 py-2">
                      <DropHeader label="Download" />
                      <DropItem icon={<Smartphone className="w-4 h-4" />} label="Coastaq Mobile" sub="iOS & Android" href="/" onClick={close} />
                      <DropSep />
                      <DropHeader label="Partners" />
                      <DropItem icon={<ExternalLink className="w-4 h-4" />} label="Afrigocall" sub="VoIP & calls" href="https://web.afrigocall.com" onClick={close} external />
                    </div>
                  )}
                </NavDropdown>

                {/* Language + Currency */}
                <NavDropdown
                  align="right"
                  label={
                    <span className="flex items-center gap-1.5">
                      <span>{currentLang?.flag}</span>
                      <span className="hidden xl:inline">{(LANGUAGES[lang] as any)?.nativeName?.split(" ")[0] ?? lang.toUpperCase()}</span>
                      <span className="text-gray-300">·</span>
                      <span className="font-semibold text-primary">{currentCurrency?.symbol}</span>
                    </span>
                  }
                  icon={<Globe className="w-3.5 h-3.5" />}
                >
                  {close => (
                    <div className="flex" style={{ width: 360 }}>
                      <div className="flex-1 border-r border-gray-100 py-2">
                        <DropHeader label="Language" />
                        <div className="max-h-56 overflow-y-auto">
                          {Object.entries(LANGUAGES).map(([code, info]) => (
                            <button
                              key={code}
                              onClick={() => { setLang(code); close(); }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                                lang === code ? "bg-primary/5 text-primary font-semibold" : "text-gray-700",
                              )}
                            >
                              <span className="text-base leading-none">{info.flag}</span>
                              <span className="flex-1 text-left text-xs">{info.nativeName}</span>
                              {lang === code && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 py-2">
                        <DropHeader label="Currency" />
                        <div className="max-h-56 overflow-y-auto">
                          {Object.entries(CURRENCIES).map(([code, info]) => (
                            <button
                              key={code}
                              onClick={() => { setCurrency(code); close(); }}
                              className={cn(
                                "w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                                currency === code ? "bg-primary/5 text-primary font-semibold" : "text-gray-700",
                              )}
                            >
                              <span className="text-base leading-none w-5">{info.flag}</span>
                              <span className="font-semibold text-xs w-9 shrink-0">{code}</span>
                              <span className="text-gray-400 text-xs truncate">{info.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </NavDropdown>

              </div>
            </div>
          </div>
        </div>

        {/* ══ Mobile search ═══════════════════════════════════════════════════ */}
        {mobileSearchOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-3 bg-white">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 gap-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <Input
                  ref={mobileSearchRef}
                  type="search"
                  placeholder={t("nav.searchPlaceholder")}
                  className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-10 p-0"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="h-10 px-5 bg-primary text-white rounded-full text-sm font-semibold shrink-0">Go</button>
            </form>
          </div>
        )}

        {/* ══ Mobile full menu ════════════════════════════════════════════════ */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white max-h-[75vh] overflow-y-auto">
            <nav className="px-4 py-4 space-y-0.5">

              <MSection label="Seller">
                {isSeller ? (
                  <>
                    <MItem icon={<Store className="w-4 h-4" />} label="Seller Dashboard" accent onClick={() => { setMobileOpen(false); setLocation("/seller"); }} />
                    <MItem icon={<Tag className="w-4 h-4" />} label="Products" onClick={() => { setMobileOpen(false); setLocation("/seller/products"); }} />
                    <MItem icon={<DollarSign className="w-4 h-4" />} label="Earnings" onClick={() => { setMobileOpen(false); setLocation("/seller/earnings"); }} />
                  </>
                ) : (
                  <MItem icon={<Megaphone className="w-4 h-4" />} label="Start Selling — Free" accent onClick={() => { setMobileOpen(false); setLocation("/auth/register?role=SELLER"); }} />
                )}
              </MSection>

              <MSection label="Buyer">
                {user ? (
                  <>
                    <MItem icon={<User className="w-4 h-4" />} label="My Account" onClick={() => { setMobileOpen(false); setLocation("/account"); }} />
                    <MItem icon={<Package className="w-4 h-4" />} label="My Orders" onClick={() => { setMobileOpen(false); setLocation("/account/orders"); }} />
                    <MItem icon={<Heart className="w-4 h-4" />} label="Saved Listings" onClick={() => { setMobileOpen(false); setLocation("/account/saved"); }} />
                  </>
                ) : (
                  <MItem icon={<User className="w-4 h-4" />} label="Sign In to Buy" accent onClick={() => { setMobileOpen(false); setLocation("/auth/login"); }} />
                )}
              </MSection>

              <MSection label="Affiliate">
                <MItem
                  icon={<BadgePercent className="w-4 h-4" />}
                  label={isAffiliate ? "Affiliate Dashboard" : "Become an Affiliate — 5%"}
                  accent={!isAffiliate}
                  onClick={() => { setMobileOpen(false); setLocation(isAffiliate ? "/affiliate" : (user ? "/affiliate" : "/auth/register?affiliate=1")); }}
                />
                {isAffiliate && (
                  <>
                    <MItem icon={<Link2 className="w-4 h-4" />} label="My Links" onClick={() => { setMobileOpen(false); setLocation("/affiliate/links"); }} />
                    <MItem icon={<DollarSign className="w-4 h-4" />} label="Commissions" onClick={() => { setMobileOpen(false); setLocation("/affiliate/commissions"); }} />
                  </>
                )}
              </MSection>

              <MSection label="Apps">
                <MItem icon={<Smartphone className="w-4 h-4" />} label="Coastaq Mobile App" onClick={() => setMobileOpen(false)} />
                <a
                  href="https://web.afrigocall.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700"
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </span>
                  Afrigocall
                  <ExternalLink className="w-3 h-3 ml-auto text-gray-300" />
                </a>
              </MSection>

              {user ? (
                <>
                  <div className="border-t border-gray-100 pt-3 mt-2">
                    {isAdmin && <MItem icon={<BarChart3 className="w-4 h-4" />} label="Admin Panel" onClick={() => { setMobileOpen(false); setLocation("/admin"); }} />}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-medium text-red-600 w-full text-left transition-colors"
                    >
                      <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><LogOut className="w-4 h-4 text-red-500" /></span>
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-2">
                  <button onClick={() => { setMobileOpen(false); setLocation("/auth/login"); }} className="w-full h-11 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    Sign In
                  </button>
                  <button onClick={() => { setMobileOpen(false); setLocation("/auth/register"); }} className="w-full h-11 bg-primary hover:bg-primary/90 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm shadow-primary/20">
                    Create Free Account
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ══ Mobile bottom tab bar ═════════════════════════════════════════════ */}
      <MobileTabBar user={user} unread={unread} authNav={authNav} setLocation={setLocation} />
    </>
  );
}

/* ─── Mobile section wrapper ─────────────────────────────────────────────── */
function MSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-3 pb-1">{label}</p>
      {children}
    </div>
  );
}

function MItem({
  icon,
  label,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-colors",
        accent ? "text-primary hover:bg-primary/5" : "text-gray-700 hover:bg-gray-50",
      )}
    >
      <span className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
        accent ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500",
      )}>
        {icon}
      </span>
      {label}
    </button>
  );
}

/* ─── Mobile bottom tab bar ─────────────────────────────────────────────── */
function MobileTabBar({
  user,
  unread,
  authNav,
  setLocation,
}: {
  user: any;
  unread: number;
  authNav: (path: string) => void;
  setLocation: (path: string) => void;
}) {
  const [location] = useLocation();
  const active = (path: string) => location === path || (path !== "/" && location.startsWith(path));

  const tabs = [
    { icon: Home, label: "Home", path: "/", action: () => setLocation("/") },
    { icon: Search, label: "Search", path: "/?search", action: () => setLocation("/") },
    { icon: Megaphone, label: "Post Ad", path: "/post", action: () => user ? setLocation("/seller/products") : setLocation("/auth/register?role=SELLER"), highlight: true },
    { icon: MessageCircle, label: "Messages", path: "/messages", badge: unread, action: () => authNav("/messages") },
    { icon: User, label: user ? "Account" : "Sign In", path: user ? "/account" : "/auth/login", action: () => user ? setLocation("/account") : setLocation("/auth/login") },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-center h-16">
        {tabs.map(tab => (
          <button
            key={tab.label}
            onClick={tab.action}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors",
              tab.highlight ? "" : (active(tab.path) ? "text-primary" : "text-gray-400 hover:text-gray-600"),
            )}
          >
            {tab.highlight ? (
              <span className="w-12 h-12 -mt-6 rounded-2xl bg-primary shadow-lg shadow-primary/30 flex items-center justify-center">
                <tab.icon className="w-5 h-5 text-white" />
              </span>
            ) : (
              <>
                <div className="relative">
                  <tab.icon className="w-5 h-5" />
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </div>
                <span className={cn("text-[9px] font-medium leading-none", active(tab.path) ? "text-primary" : "")}>{tab.label}</span>
                {active(tab.path) && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />}
              </>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
