import { Link, useLocation } from "wouter";
import {
  Search, User, Store, LayoutDashboard, MessageCircle,
  Menu, X, ShoppingCart, ChevronDown, ChevronRight,
  ShieldCheck, Percent, HelpCircle,
} from "lucide-react";
import { useGetMe, useLogout, useListCategories } from "@workspace/api-client-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CoastaqLogo } from "./CoastaqLogo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useLocale } from "@/lib/locale/context";
import { tCat } from "@/lib/locale/categoryTranslations";

const SEARCH_TYPES = ["Products", "Suppliers", "Categories"];

const SEC_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Secure Trade", href: "/", icon: <ShieldCheck className="w-3 h-3" /> },
  { label: "Buyer Center", href: "/account" },
  { label: "Seller Center", href: "/seller" },
  { label: "Affiliates", href: "/affiliate", icon: <Percent className="w-3 h-3" /> },
  { label: "Deals", href: "/shop" },
  { label: "Help", href: "/contact", icon: <HelpCircle className="w-3 h-3" /> },
];

export function Navbar() {
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("Products");
  const [searchTypeOpen, setSearchTypeOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const { data: user } = useGetMe({ query: { retry: false } });
  const { mutate: logout } = useLogout();
  const queryClient = useQueryClient();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const { t, lang } = useLocale();
  const { data: categories } = useListCategories();
  const searchTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const fetch_ = () =>
      fetch("/api/messages/unread")
        .then(r => r.json())
        .then(d => setUnread(d.unread ?? 0))
        .catch(() => {});
    fetch_();
    const timer = setInterval(fetch_, 15000);
    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (mobileSearchOpen) setTimeout(() => mobileSearchRef.current?.focus(), 50);
  }, [mobileSearchOpen]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchTypeRef.current && !searchTypeRef.current.contains(e.target as Node)) {
        setSearchTypeOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const next = new URLSearchParams();
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

  const getDashboardPath = () => {
    if (!user) return "/auth/login";
    if (user.role === "SELLER") return "/seller";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "AFFILIATE") return "/affiliate";
    return "/account";
  };

  return (
    <header className="sticky top-0 z-50 w-full">

      {/* ── Row 1: Top strip ── */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="container mx-auto px-4 h-8 flex items-center justify-between">
          <span className="hidden md:block text-xs text-gray-500 font-medium">
            Global B2B Marketplace — Africa &amp; Beyond
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <LocaleSwitcher />
            {!user && (
              <>
                <span className="text-gray-300 text-xs">|</span>
                <button
                  onClick={() => setLocation("/auth/login")}
                  className="text-xs text-gray-600 hover:text-market font-medium transition-colors"
                >
                  Sign In
                </button>
                <span className="text-gray-300 text-xs">|</span>
                <button
                  onClick={() => setLocation("/auth/register")}
                  className="text-xs text-gray-600 hover:text-market font-medium transition-colors"
                >
                  Join Free
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Main nav ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3 md:gap-4">

          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center" onClick={() => setMobileOpen(false)}>
            <CoastaqLogo iconSize={32} textSize={18} />
          </Link>

          {/* Desktop search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 h-10 rounded border-2 border-market overflow-visible relative">
            {/* Type selector */}
            <div ref={searchTypeRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSearchTypeOpen(v => !v)}
                className="flex items-center gap-1 px-3 h-full bg-gray-100 text-xs font-medium text-gray-700 border-r border-gray-300 whitespace-nowrap hover:bg-gray-200 transition-colors"
              >
                {searchType}
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>
              {searchTypeOpen && (
                <div className="absolute top-full left-0 mt-0 bg-white border border-gray-200 shadow-lg z-50 min-w-[130px]">
                  {SEARCH_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setSearchType(type); setSearchTypeOpen(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-gray-700"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Input */}
            <input
              type="search"
              placeholder={t("nav.searchPlaceholder")}
              className="flex-1 px-3 text-sm outline-none bg-white text-gray-800 placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* Submit */}
            <button
              type="submit"
              className="mkt-btn px-5 font-semibold text-sm flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {/* Right icons */}
          <div className="flex items-center gap-0.5 ml-auto md:ml-0">

            {/* Mobile search toggle */}
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              onClick={() => { setMobileSearchOpen(v => !v); setMobileOpen(false); }}
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </button>

            {/* Messages */}
            {user && (
              <button
                onClick={() => nav("/messages")}
                className="relative flex flex-col items-center justify-center px-2 py-1 h-12 hover:bg-gray-50 rounded transition-colors min-w-[48px]"
                title={t("nav.messages")}
              >
                <MessageCircle className="h-5 w-5 text-gray-600" />
                <span className="text-[10px] text-gray-500 leading-none mt-0.5 hidden sm:block">Messages</span>
                {unread > 0 && (
                  <span className="absolute top-1 right-1 bg-market text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
            )}

            {/* Cart */}
            <button
              onClick={() => nav("/cart")}
              className="flex flex-col items-center justify-center px-2 py-1 h-12 hover:bg-gray-50 rounded transition-colors min-w-[48px]"
              title="Cart"
            >
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              <span className="text-[10px] text-gray-500 leading-none mt-0.5 hidden sm:block">Cart</span>
            </button>

            {/* Account */}
            {user ? (
              <>
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex flex-col items-center justify-center px-2 py-1 h-12 hover:bg-gray-50 rounded transition-colors min-w-[52px]">
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {user.name?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <span className="text-[10px] text-gray-500 leading-none mt-0.5 truncate max-w-[60px]">
                          {user.name?.split(" ")[0] ?? "Account"}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1">
                      <DropdownMenuLabel>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-semibold">{user.name}</p>
                          <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                          <span className="text-[10px] font-bold uppercase text-primary/80 tracking-wide">{user.role}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => nav(getDashboardPath())} className="cursor-pointer text-sm gap-2">
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        {t("nav.dashboard")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => nav("/messages")} className="cursor-pointer text-sm gap-2">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        {t("nav.messages")}
                        {unread > 0 && (
                          <span className="ml-auto bg-market text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </DropdownMenuItem>
                      {user.role === "SELLER" && (
                        <DropdownMenuItem onClick={() => nav("/seller")} className="cursor-pointer text-sm gap-2">
                          <Store className="w-4 h-4 text-green-600" />
                          {t("nav.sellerDashboard")}
                        </DropdownMenuItem>
                      )}
                      {user.role === "ADMIN" && (
                        <DropdownMenuItem onClick={() => nav("/admin")} className="cursor-pointer text-sm gap-2">
                          <User className="w-4 h-4" />
                          {t("nav.adminPanel")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-sm text-destructive focus:text-destructive gap-2">
                        {t("nav.logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile hamburger */}
                <button
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => { setMobileOpen(v => !v); setMobileSearchOpen(false); }}
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setLocation("/auth/login")}
                  className="hidden md:flex flex-col items-center justify-center px-2 py-1 h-12 hover:bg-gray-50 rounded transition-colors min-w-[52px]"
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-[10px] text-gray-500 leading-none mt-0.5">Sign In</span>
                </button>
                <button
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={() => { setMobileOpen(v => !v); setMobileSearchOpen(false); }}
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 3: Secondary nav ── */}
      <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 h-10 flex items-stretch">

          {/* All Categories dropdown */}
          <div
            className="relative h-full shrink-0"
            onMouseEnter={() => setCatsOpen(true)}
            onMouseLeave={() => setCatsOpen(false)}
          >
            <button className="flex items-center gap-2 h-full px-4 bg-market text-white text-sm font-semibold hover:bg-red-700 transition-colors">
              <Menu className="w-4 h-4" />
              All Categories
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            {catsOpen && categories && categories.length > 0 && (
              <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-xl z-50 w-56 py-1">
                <button
                  onClick={() => { setLocation("/"); setCatsOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 border-b border-gray-100"
                >
                  All Products
                </button>
                {categories.slice(0, 16).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setLocation(`/?category=${cat.id}`); setCatsOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 hover:text-market text-gray-700 flex items-center justify-between group"
                  >
                    <span>{tCat(cat.name, lang)}</span>
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-market" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Nav links */}
          {SEC_LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-1.5 px-4 h-full text-sm text-gray-700 hover:text-market font-medium transition-colors whitespace-nowrap border-r border-gray-100 last:border-r-0"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Mobile search bar ── */}
      {mobileSearchOpen && (
        <div className="md:hidden border-b border-gray-200 px-4 py-3 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              ref={mobileSearchRef}
              type="search"
              placeholder={t("nav.searchPlaceholder")}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-market"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="mkt-btn px-4 py-2 rounded text-sm font-semibold">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <nav className="px-4 py-3 flex flex-col gap-0.5">
            {/* Category links */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pt-2 pb-1">Browse</p>
            <Link href="/shop" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-800">
              All Products
            </Link>
            <Link href="/antiques" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-800">
              Antiques
            </Link>

            <div className="border-t border-gray-100 my-1" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pt-1 pb-1">Centers</p>
            <button onClick={() => nav("/account")} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-800 w-full text-left">
              Buyer Center
            </button>
            <button onClick={() => nav("/seller")} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-800 w-full text-left">
              Seller Center
            </button>
            <button onClick={() => nav("/affiliate")} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-800 w-full text-left">
              Affiliate Center
            </button>

            <div className="border-t border-gray-100 my-1" />

            {user ? (
              <>
                <div className="px-3 py-2">
                  <p className="font-semibold text-sm text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wide">{user.role}</span>
                </div>
                <button onClick={() => nav(getDashboardPath())} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-800 w-full text-left">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  {t("nav.dashboard")}
                </button>
                <button onClick={() => nav("/messages")} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-800 w-full text-left">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  {t("nav.messages")}
                  {unread > 0 && (
                    <span className="ml-auto bg-market text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </button>
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-red-50 text-sm font-medium text-destructive w-full text-left mt-1">
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => nav("/auth/login")} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-800 w-full text-left">
                  {t("nav.login")}
                </button>
                <button onClick={() => nav("/auth/register")} className="flex items-center gap-3 px-3 py-2.5 rounded bg-primary/5 text-sm font-semibold text-primary w-full text-left">
                  <User className="w-4 h-4" />
                  {t("nav.signup")}
                </button>
                <button onClick={() => nav("/auth/register?role=SELLER")} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-gray-50 text-sm font-medium text-gray-800 w-full text-left">
                  <Store className="w-4 h-4 text-green-600" />
                  Start Selling
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
