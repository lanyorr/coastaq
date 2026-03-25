import { Link, useLocation } from "wouter";
import { Search, User, Store, LayoutDashboard, MessageCircle } from "lucide-react";
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
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function Navbar() {
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: user } = useGetMe({ query: { retry: false } });
  const { mutate: logout } = useLogout();
  const queryClient = useQueryClient();
  const [unread, setUnread] = useState(0);

  // Poll unread count for logged-in users
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("coastaq_token");
    queryClient.clear();
    logout(undefined as any);
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b-0">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center shrink-0">
          <img src="/logo.png" alt="Coastaq" className="h-12 w-auto object-contain" />
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="search"
            placeholder="Search listings..."
            className="w-full pl-10 bg-secondary/50 border-transparent focus-visible:bg-white focus-visible:ring-primary/20 rounded-full transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2 sm:gap-4">
          {(!user || user.role === "BUYER") && (
            <Button
              variant="ghost"
              className="hidden sm:flex text-primary hover:text-primary hover:bg-primary/10 rounded-full"
              onClick={() => setLocation("/auth/register?role=SELLER")}
            >
              Sell on Coastaq
            </Button>
          )}

          {user && (
            <button
              onClick={() => setLocation("/messages")}
              className="relative p-2 rounded-full hover:bg-secondary transition-colors"
              title="Messages"
            >
              <MessageCircle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full border-primary/20 hover:bg-primary/5">
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

                <DropdownMenuItem
                  className="cursor-pointer rounded-xl"
                  onClick={() => setLocation("/messages")}
                >
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
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex rounded-full"
                onClick={() => setLocation("/auth/login")}
              >
                Log in
              </Button>
              <Button
                className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                onClick={() => setLocation("/auth/register")}
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
