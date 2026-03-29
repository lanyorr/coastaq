import { Link, useLocation } from "wouter";
import { Search, User, Store, LayoutDashboard, MessageCircle, Menu, X, ExternalLink, Home } from "lucide-react";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

function CoastaqLogo() {
  return (
    <img
      src="/logo.png"
      alt="Coastaq"
      className="h-9 w-auto object-contain"
      style={{ maxWidth: 160 }}
    />
  );
}

export function Navbar() {
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: user } = useGetMe({ query: { retry: false } });
  const { mutate: logout } = useLogout();
  const queryClient = useQueryClient();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const fetch_ = () =>
      fetch("/api/messages/unread")
        .then(r => r.json())
        .then(d => setUnread(d.unread ?? 0))
        .catch(() => {});
    fetch_();
    const t = setInterval(fetch_, 15000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    if (mobileSearchOpen) setTimeout(() => mobileSearchRef.current?.focus(), 50);
  }, [mobileSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const current = new URLSearchParams(window.location.search);
      const next = new URLSearchParams();
      if (current.get("category")) next.set("category", current.get("category")!);
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

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      {/* Main bar */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0" onClick={() => setMobileOpen(false)}>
          <CoastaqLogo />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-1 ml-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-primary/8 hover:text-primary transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <a
            href="https://web.afrigocall.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-primary/8 hover:text-primary transition-colors"
          >
            Afrigocall
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
          <Link
            href="/antiques"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-primary/8 hover:text-primary transition-colors"
          >
            Antiques
          </Link>
        </nav>

        {/* Desktop search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs relative group ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="search"
            placeholder="Search listings..."
            className="w-full pl-10 bg-gray-50 border-gray-200 focus-visible:bg-white focus-visible:ring-primary/20 rounded-full transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          {/* Mobile search icon */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
            onClick={() => { setMobileSearchOpen(v => !v); setMobileOpen(false); }}
            aria-label="Search"
          >
            <Search className="h-5 w-5 text-gray-500" />
          </button>

          {!user && (
            <Button
              variant="ghost"
              className="hidden sm:flex text-primary hover:text-primary hover:bg-primary/10 rounded-full text-sm font-medium"
              onClick={() => setLocation("/auth/register?role=SELLER")}
            >
              Sell on Coastaq
            </Button>
          )}

          {user && (
            <button
              onClick={() => nav("/messages")}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Messages"
            >
              <MessageCircle className="h-5 w-5 text-gray-500 hover:text-primary transition-colors" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          )}

          {user ? (
            <>
              {/* Desktop user dropdown */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-gray-200 hover:bg-primary/5 hover:border-primary/30">
                      <User className="h-5 w-5 text-primary" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                    <DropdownMenuLabel className="font-display">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-primary/70 font-semibold capitalize">{user.role.toLowerCase()}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === "BUYER" && (
                      <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => setLocation("/buyer/dashboard")}>
                        <LayoutDashboard className="mr-2 h-4 w-4 text-primary" /> My Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => setLocation("/messages")}>
                      <MessageCircle className="mr-2 h-4 w-4 text-primary" />
                      Messages
                      {unread > 0 && (
                        <span className="ml-auto bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </DropdownMenuItem>
                    {user.role === "SELLER" && (
                      <DropdownMenuItem className="cursor-pointer rounded-xl text-primary" onClick={() => setLocation("/seller/dashboard")}>
                        <Store className="mr-2 h-4 w-4" /> Seller Dashboard
                      </DropdownMenuItem>
                    )}
                    {user.role === "ADMIN" && (
                      <DropdownMenuItem className="cursor-pointer rounded-xl" onClick={() => setLocation("/admin")}>
                        <User className="mr-2 h-4 w-4" /> Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl text-destructive focus:text-destructive"
                      onClick={handleLogout}
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => { setMobileOpen(v => !v); setMobileSearchOpen(false); }}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="hidden sm:inline-flex rounded-full text-sm font-medium text-gray-700 hover:text-primary"
                onClick={() => setLocation("/auth/login")}
              >
                Login
              </Button>
              <Button
                className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/25 text-sm px-4 font-semibold gap-1.5"
                onClick={() => setLocation("/auth/register")}
              >
                <User className="w-4 h-4" />
                Sign Up
              </Button>
              {/* Mobile hamburger for guest */}
              <button
                className="sm:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => { setMobileOpen(v => !v); setMobileSearchOpen(false); }}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3 bg-white">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={mobileSearchRef}
              type="search"
              placeholder="Search listings..."
              className="w-full pl-10 bg-gray-50 border-gray-200 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      )}

      {/* Mobile nav menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-foreground">
              <Home className="w-4 h-4 text-primary" /> Home
            </Link>
            <a href="https://web.afrigocall.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-foreground">
              Afrigocall <ExternalLink className="w-3.5 h-3.5 ml-auto text-gray-400" />
            </a>
            <Link href="/antiques" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-foreground">
              Antiques
            </Link>
            <div className="border-t border-gray-100 my-2" />
            {user ? (
              <>
                <div className="px-3 py-2 mb-1">
                  <p className="font-semibold text-foreground text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                {user.role === "BUYER" && (
                  <button onClick={() => nav("/buyer/dashboard")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-foreground w-full text-left">
                    <LayoutDashboard className="w-4 h-4 text-primary" /> My Dashboard
                  </button>
                )}
                {user.role === "SELLER" && (
                  <button onClick={() => nav("/seller/dashboard")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-primary w-full text-left">
                    <Store className="w-4 h-4" /> Seller Dashboard
                  </button>
                )}
                {user.role === "ADMIN" && (
                  <button onClick={() => nav("/admin")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-foreground w-full text-left">
                    <User className="w-4 h-4 text-primary" /> Admin Panel
                  </button>
                )}
                <button onClick={() => nav("/messages")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-foreground w-full text-left">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  Messages
                  {unread > 0 && <span className="ml-auto bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
                </button>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-sm font-medium text-destructive w-full text-left">
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <>
                <button onClick={() => nav("/auth/login")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-foreground w-full text-left">
                  Login
                </button>
                <button onClick={() => nav("/auth/register")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 text-sm font-medium text-primary w-full text-left">
                  <User className="w-4 h-4" /> Sign Up
                </button>
                <button onClick={() => nav("/auth/register?role=SELLER")} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium text-primary w-full text-left">
                  <Store className="w-4 h-4" /> Sell on Coastaq
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
