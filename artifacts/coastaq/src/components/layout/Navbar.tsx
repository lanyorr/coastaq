import { Link, useLocation } from "wouter";
import {
  Search, User, Store, LayoutDashboard, MessageCircle,
  Menu, X, ShoppingBag, Plus, ChevronDown, ExternalLink,
  Globe, Smartphone, Heart, Package, Shield,
  TrendingUp, Link2, HelpCircle, FileText, Info, Mail,
  LogOut, Settings, DollarSign, BarChart3,
} from "lucide-react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CoastaqLogo } from "./CoastaqLogo";
import { useLocale } from "@/lib/locale/context";
import { LANGUAGES } from "@/lib/locale/translations";
import { CURRENCIES } from "@/lib/locale/currencies";
import { cn } from "@/lib/utils";
import { buildRolesFromUser, hasRole } from "@/lib/auth/rbac";

/* ── Reusable dropdown ───────────────────────────────────────────────────── */
function NavDropdown({
  label,
  icon,
  children,
}: {
  label: React.ReactNode;
  icon?: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap",
          open && "text-primary",
        )}
      >
        {icon}
        {label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-150", open ? "rotate-180 text-primary" : "text-gray-400")} />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-[200] bg-white rounded-2xl border border-gray-200 shadow-xl min-w-[220px] overflow-hidden"
          onMouseLeave={() => setOpen(false)}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/* ── Dropdown item helpers ───────────────────────────────────────────────── */
function DropItem({
  icon,
  label,
  sub,
  onClick,
  href,
  accent,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick?: () => void;
  href?: string;
  accent?: boolean;
  external?: boolean;
}) {
  const cls = cn(
    "flex items-start gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors cursor-pointer group w-full text-left",
    accent && "text-primary hover:bg-primary/5",
  );
  const inner = (
    <>
      <span className={cn("mt-0.5 shrink-0 text-gray-400 group-hover:text-primary transition-colors", accent && "text-primary")}>{icon}</span>
      <span>
        <span className="block font-medium text-gray-800">{label}</span>
        {sub && <span className="block text-xs text-gray-400 mt-0.5">{sub}</span>}
      </span>
      {external && <ExternalLink className="w-3 h-3 text-gray-300 mt-1 ml-auto shrink-0" />}
    </>
  );
  if (href && external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>;
  if (href) return <Link href={href} className={cls} onClick={onClick}>{inner}</Link>;
  return <button className={cls} onClick={onClick}>{inner}</button>;
}

function DropSep() { return <div className="border-t border-gray-100 my-1" />; }

function DropHeader({ label }: { label: string }) {
  return <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>;
}

/* ── Main Navbar ─────────────────────────────────────────────────────────── */
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
  const isSeller = hasRole(userRoles, "SELLER");
  const isAffiliate = hasRole(userRoles, "AFFILIATE");
  const isAdmin = hasRole(userRoles, "ADMIN");

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const fetch_ = () =>
      fetch("/api/messages/unread").then(r => r.json()).then(d => setUnread(d.unread ?? 0)).catch(() => {});
    fetch_();
    const timer = setInterval(fetch_, 15000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (mobileSearchOpen) setTimeout(() => mobileSearchRef.current?.focus(), 50);
  }, [mobileSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const next = new URLSearchParams();
      const cur = new URLSearchParams(window.location.search);
      if (cur.get("category")) next.set("category", cur.get("category")!);
      next.set("search", searchQuery.trim());
      setLocation(`/?${next.toString()}`);
      setMobileOpen(false);
      setMobileSearchOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("coastaq_token");
    queryClient.clear();
    logout(undefined as any);
    setLocation("/");
    setMobileOpen(false);
  };

  const nav = (path: string) => { setLocation(path); setMobileOpen(false); };

  const currentLang = LANGUAGES[lang];
  const currentCurrency = CURRENCIES[currency];

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">

      {/* ══ ROW 1: Logo + Search + Utility actions ══════════════════════════ */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4 h-[60px] flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 mr-2" onClick={() => setMobileOpen(false)}>
            <CoastaqLogo />
          </Link>

          {/* Search bar — hidden on mobile */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder={t("nav.searchPlaceholder")}
              className="w-full pl-10 h-10 bg-gray-50 border-gray-200 rounded-l-lg rounded-r-none focus-visible:ring-0 focus-visible:border-primary text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="h-10 px-5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-r-lg border border-primary transition-colors shrink-0"
            >
              {t("common.search")}
            </button>
          </form>

          {/* Utility icons (right side) */}
          <div className="flex items-center gap-0.5 ml-auto">

            {/* Mobile search icon */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              onClick={() => { setMobileSearchOpen(v => !v); setMobileOpen(false); }}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Post Free Ad */}
            <button
              onClick={() => setLocation(user ? "/seller/products" : "/auth/register?role=SELLER")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Plus className="w-3.5 h-3.5 text-orange-600" />
              </span>
              <span className="hidden lg:inline">Post Free Ad</span>
            </button>

            {/* Messages */}
            <button
              onClick={() => nav(user ? "/messages" : "/auth/login")}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors relative"
              title={t("nav.messages")}
            >
              <div className="relative">
                <MessageCircle className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
              <span className="hidden lg:block text-[10px] font-medium leading-none">Messages</span>
            </button>

            {/* Orders / Inquiry Basket */}
            <button
              onClick={() => nav(user ? "/account/orders" : "/auth/login")}
              className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
              title="Orders"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="hidden lg:block text-[10px] font-medium leading-none">Orders</span>
            </button>

            {/* User — sign-in dropdown or avatar */}
            {user ? (
              <NavDropdown
                label={
                  <span className="hidden lg:inline font-medium truncate max-w-[90px]">
                    {(user.name as string)?.split(" ")[0]}
                  </span>
                }
                icon={
                  <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
                    {(user.name as string)?.[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
                  </span>
                }
              >
                {close => (
                  <div className="py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm">{user.name as string}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email as string}</p>
                    </div>
                    <DropItem icon={<User className="w-4 h-4" />} label="My Account" href="/account" onClick={close} />
                    <DropItem icon={<Package className="w-4 h-4" />} label="My Orders" href="/account/orders" onClick={close} />
                    <DropItem icon={<MessageCircle className="w-4 h-4" />} label="Messages" href="/messages" onClick={close} />
                    <DropItem icon={<Heart className="w-4 h-4" />} label="Saved Listings" href="/account/saved" onClick={close} />
                    {isSeller && <><DropSep /><DropItem icon={<Store className="w-4 h-4" />} label="Seller Hub" href="/seller" onClick={close} accent /></>}
                    {isAffiliate && <DropItem icon={<Link2 className="w-4 h-4" />} label="Affiliate Hub" href="/affiliate" onClick={close} accent />}
                    {isAdmin && <DropItem icon={<BarChart3 className="w-4 h-4" />} label="Admin Panel" href="/admin" onClick={close} accent />}
                    <DropSep />
                    <DropItem icon={<Settings className="w-4 h-4" />} label="Settings" href="/account/settings" onClick={close} />
                    <button
                      onClick={() => { handleLogout(); close(); }}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                )}
              </NavDropdown>
            ) : (
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={() => setLocation("/auth/login")}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:block text-[10px] font-medium leading-none">Sign In</span>
                </button>
                <button
                  onClick={() => setLocation("/auth/register")}
                  className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-primary/20"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors ml-1"
              onClick={() => { setMobileOpen(v => !v); setMobileSearchOpen(false); }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ══ ROW 2: Dropdown nav bar ══════════════════════════════════════════ */}
      <div className="hidden md:block border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-10">

            {/* Left nav items with separator borders */}
            <div className="flex items-stretch divide-x divide-gray-200">

              {/* Seller dropdown */}
              <NavDropdown label="Seller" icon={<Store className="w-3.5 h-3.5" />}>
                {close => (
                  <div className="py-1">
                    <DropHeader label="Seller Tools" />
                    {isSeller ? (
                      <>
                        <DropItem icon={<LayoutDashboard className="w-4 h-4" />} label="Seller Dashboard" sub="Overview of your shop" href="/seller" onClick={close} accent />
                        <DropItem icon={<Package className="w-4 h-4" />} label="My Products" sub="Manage listings" href="/seller/products" onClick={close} />
                        <DropItem icon={<ShoppingBag className="w-4 h-4" />} label="Seller Orders" sub="Fulfill & track orders" href="/seller/orders" onClick={close} />
                        <DropItem icon={<DollarSign className="w-4 h-4" />} label="Earnings" sub="Escrow & payouts" href="/seller/earnings" onClick={close} />
                        <DropItem icon={<Settings className="w-4 h-4" />} label="Shop Settings" sub="Edit profile & branding" href="/seller/shop" onClick={close} />
                      </>
                    ) : (
                      <>
                        <DropItem icon={<Plus className="w-4 h-4" />} label="Start Selling" sub="Free to list — earn today" href="/auth/register?role=SELLER" onClick={close} accent />
                        <DropItem icon={<FileText className="w-4 h-4" />} label="Seller Agreement" href="/seller-agreement" onClick={close} />
                      </>
                    )}
                    <DropSep />
                    <DropHeader label="Resources" />
                    <DropItem icon={<Shield className="w-4 h-4" />} label="Escrow Protection" sub="How seller payouts work" href="/seller-agreement" onClick={close} />
                  </div>
                )}
              </NavDropdown>

              {/* Buyer dropdown */}
              <NavDropdown label="Buyer" icon={<ShoppingBag className="w-3.5 h-3.5" />}>
                {close => (
                  <div className="py-1">
                    <DropHeader label="My Buying" />
                    {user ? (
                      <>
                        <DropItem icon={<User className="w-4 h-4" />} label="My Account" sub="Profile & preferences" href="/account" onClick={close} />
                        <DropItem icon={<Package className="w-4 h-4" />} label="My Orders" sub="Track & manage orders" href="/account/orders" onClick={close} />
                        <DropItem icon={<Heart className="w-4 h-4" />} label="Saved Listings" sub="Items you bookmarked" href="/account/saved" onClick={close} />
                        <DropItem icon={<MessageCircle className="w-4 h-4" />} label="Messages" sub="Chat with sellers" href="/messages" onClick={close} />
                      </>
                    ) : (
                      <DropItem icon={<User className="w-4 h-4" />} label="Sign In to Buy" sub="Access your account" href="/auth/login" onClick={close} accent />
                    )}
                    <DropSep />
                    <DropHeader label="Buyer Protection" />
                    <DropItem icon={<Shield className="w-4 h-4" />} label="Escrow Guarantee" sub="100% secure payments" href="/terms" onClick={close} />
                    <DropItem icon={<FileText className="w-4 h-4" />} label="Refund Policy" href="/refunds" onClick={close} />
                  </div>
                )}
              </NavDropdown>

              {/* Affiliate dropdown */}
              <NavDropdown label="Affiliate" icon={<Link2 className="w-3.5 h-3.5" />}>
                {close => (
                  <div className="py-1">
                    <DropHeader label="Earn with Coastaq" />
                    {isAffiliate ? (
                      <>
                        <DropItem icon={<LayoutDashboard className="w-4 h-4" />} label="Affiliate Dashboard" sub="Stats & overview" href="/affiliate" onClick={close} accent />
                        <DropItem icon={<Link2 className="w-4 h-4" />} label="My Links" sub="Create & copy links" href="/affiliate/links" onClick={close} />
                        <DropItem icon={<DollarSign className="w-4 h-4" />} label="Commissions" sub="Earnings history" href="/affiliate/commissions" onClick={close} />
                      </>
                    ) : (
                      <DropItem icon={<TrendingUp className="w-4 h-4" />} label="Become an Affiliate" sub="Earn 5% on referrals" href="/affiliate" onClick={close} accent />
                    )}
                    <DropSep />
                    <DropItem icon={<Info className="w-4 h-4" />} label="How It Works" sub="Share links, earn commissions" href="/affiliate" onClick={close} />
                  </div>
                )}
              </NavDropdown>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side: Apps + Language */}
            <div className="flex items-stretch divide-x divide-gray-200">

              {/* Apps dropdown */}
              <NavDropdown label="Apps">
                {close => (
                  <div className="py-1">
                    <DropHeader label="Download" />
                    <DropItem icon={<Smartphone className="w-4 h-4" />} label="Coastaq Mobile" sub="iOS & Android app" href="/" onClick={close} />
                    <DropSep />
                    <DropHeader label="Partner Apps" />
                    <DropItem icon={<ExternalLink className="w-4 h-4" />} label="Afrigocall" sub="VoIP & communication" href="https://web.afrigocall.com" onClick={close} external />
                  </div>
                )}
              </NavDropdown>

              {/* Language + Currency dropdown */}
              <NavDropdown
                label={
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    <span>{currentLang?.flag} {(LANGUAGES[lang] as any)?.nativeName?.split(" ")[0] ?? lang.toUpperCase()}</span>
                    <span className="text-gray-300 mx-0.5">|</span>
                    <span>{currentCurrency?.symbol} {currency}</span>
                  </span>
                }
              >
                {close => (
                  <div className="py-1 w-[360px] flex">
                    {/* Language column */}
                    <div className="flex-1 border-r border-gray-100">
                      <DropHeader label="Language" />
                      <div className="max-h-52 overflow-y-auto">
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
                    {/* Currency column */}
                    <div className="flex-1">
                      <DropHeader label="Currency" />
                      <div className="max-h-52 overflow-y-auto">
                        {Object.entries(CURRENCIES).map(([code, info]) => (
                          <button
                            key={code}
                            onClick={() => { setCurrency(code); close(); }}
                            className={cn(
                              "w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                              currency === code ? "bg-primary/5 text-primary font-semibold" : "text-gray-700",
                            )}
                          >
                            <span className="w-5 text-base leading-none">{info.flag}</span>
                            <span className="font-medium text-xs w-9 shrink-0">{code}</span>
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

      {/* ══ Mobile search bar ═════════════════════════════════════════════════ */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={mobileSearchRef}
                type="search"
                placeholder={t("nav.searchPlaceholder")}
                className="w-full pl-10 bg-gray-50 border-gray-200 rounded-lg"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="px-4 h-10 bg-primary text-white rounded-lg text-sm font-semibold">{t("common.search")}</button>
          </form>
        </div>
      )}

      {/* ══ Mobile menu ═══════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white max-h-[80vh] overflow-y-auto">
          <nav className="px-4 py-3 space-y-0.5">

            {/* Role sections */}
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-2 pb-1">Seller</div>
            {isSeller ? (
              <>
                <MobileNavItem icon={<Store className="w-4 h-4" />} label="Seller Dashboard" onClick={() => nav("/seller")} />
                <MobileNavItem icon={<Package className="w-4 h-4" />} label="My Products" onClick={() => nav("/seller/products")} />
                <MobileNavItem icon={<DollarSign className="w-4 h-4" />} label="Earnings" onClick={() => nav("/seller/earnings")} />
              </>
            ) : (
              <MobileNavItem icon={<Plus className="w-4 h-4 text-orange-500" />} label="Start Selling Free" onClick={() => nav("/auth/register?role=SELLER")} accent />
            )}

            <div className="border-t border-gray-100 my-2" />
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 pb-1">Buyer</div>
            {user ? (
              <>
                <MobileNavItem icon={<User className="w-4 h-4" />} label="My Account" onClick={() => nav("/account")} />
                <MobileNavItem icon={<Package className="w-4 h-4" />} label="My Orders" onClick={() => nav("/account/orders")} />
                <MobileNavItem icon={<Heart className="w-4 h-4" />} label="Saved Listings" onClick={() => nav("/account/saved")} />
              </>
            ) : (
              <MobileNavItem icon={<User className="w-4 h-4" />} label="Sign In" onClick={() => nav("/auth/login")} />
            )}

            <div className="border-t border-gray-100 my-2" />
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 pb-1">Affiliate</div>
            <MobileNavItem icon={<Link2 className="w-4 h-4" />} label={isAffiliate ? "Affiliate Dashboard" : "Become an Affiliate"} onClick={() => nav("/affiliate")} />

            <div className="border-t border-gray-100 my-2" />
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 pb-1">Apps</div>
            <MobileNavItem icon={<Smartphone className="w-4 h-4" />} label="Coastaq Mobile" onClick={() => nav("/")} />
            <a href="https://web.afrigocall.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 w-full">
              <ExternalLink className="w-4 h-4 text-gray-400" /> Afrigocall <ExternalLink className="w-3 h-3 ml-auto text-gray-300" />
            </a>

            {user && (
              <>
                <div className="border-t border-gray-100 my-2" />
                {isAdmin && <MobileNavItem icon={<BarChart3 className="w-4 h-4" />} label="Admin Panel" onClick={() => nav("/admin")} />}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-medium text-red-600 w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </>
            )}

            {!user && (
              <>
                <div className="border-t border-gray-100 my-2" />
                <button onClick={() => nav("/auth/register")} className="w-full flex items-center justify-center gap-2 h-11 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl mt-1 transition-colors">
                  <User className="w-4 h-4" /> Create Account
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileNavItem({ icon, label, onClick, accent }: { icon: React.ReactNode; label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-colors",
        accent ? "text-primary hover:bg-primary/5" : "text-gray-700 hover:bg-gray-50",
      )}
    >
      <span className={accent ? "text-primary" : "text-gray-400"}>{icon}</span>
      {label}
    </button>
  );
}
