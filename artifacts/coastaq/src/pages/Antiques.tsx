import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useLocation } from "wouter";
import {
  Gavel, Clock, Star, TrendingUp, Shield, ChevronRight,
  Armchair, Gem, Palette, Watch, Coins, BookOpen,
  Package, Trophy, Music, Map, Shirt, Search, Bell, Users
} from "lucide-react";

const ANTIQUE_CATEGORIES = [
  { name: "Furniture", icon: <Armchair className="w-6 h-6" />, bg: "#fef3c7", fg: "#92400e", count: "1,240+" },
  { name: "Jewelry", icon: <Gem className="w-6 h-6" />, bg: "#fdf2f8", fg: "#9d174d", count: "3,850+" },
  { name: "Art & Paintings", icon: <Palette className="w-6 h-6" />, bg: "#ede9fe", fg: "#5b21b6", count: "2,100+" },
  { name: "Clocks & Watches", icon: <Watch className="w-6 h-6" />, bg: "#dbeafe", fg: "#1e40af", count: "780+" },
  { name: "Coins & Currency", icon: <Coins className="w-6 h-6" />, bg: "#d1fae5", fg: "#065f46", count: "4,320+" },
  { name: "Books & Manuscripts", icon: <BookOpen className="w-6 h-6" />, bg: "#ffedd5", fg: "#9a3412", count: "560+" },
  { name: "Ceramics & Porcelain", icon: <Package className="w-6 h-6" />, bg: "#f0fdf4", fg: "#14532d", count: "920+" },
  { name: "Silver & Gold", icon: <Trophy className="w-6 h-6" />, bg: "#fefce8", fg: "#713f12", count: "1,670+" },
  { name: "Musical Instruments", icon: <Music className="w-6 h-6" />, bg: "#fae8ff", fg: "#701a75", count: "340+" },
  { name: "Maps & Documents", icon: <Map className="w-6 h-6" />, bg: "#e0f2fe", fg: "#0c4a6e", count: "210+" },
  { name: "Vintage Clothing", icon: <Shirt className="w-6 h-6" />, bg: "#fce7f3", fg: "#831843", count: "1,100+" },
  { name: "Collectibles", icon: <Star className="w-6 h-6" />, bg: "#f1f5f9", fg: "#334155", count: "5,900+" },
];

const SAMPLE_AUCTIONS = [
  {
    id: 1,
    title: "Victorian Mahogany Writing Desk, c.1880",
    category: "Furniture",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
    currentBid: 1200,
    bids: 14,
    endsIn: { h: 4, m: 22, s: 10 },
    condition: "Good",
    location: "Lagos, Nigeria",
    reserve: true,
  },
  {
    id: 2,
    title: "18k Gold Edwardian Diamond Brooch, 1905",
    category: "Jewelry",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop",
    currentBid: 3400,
    bids: 28,
    endsIn: { h: 1, m: 8, s: 33 },
    condition: "Excellent",
    location: "Accra, Ghana",
    reserve: false,
  },
  {
    id: 3,
    title: "Original Oil on Canvas — West African Market Scene, 1962",
    category: "Art & Paintings",
    image: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&h=400&fit=crop",
    currentBid: 850,
    bids: 7,
    endsIn: { h: 11, m: 45, s: 0 },
    condition: "Good",
    location: "Abuja, Nigeria",
    reserve: true,
  },
  {
    id: 4,
    title: "French Gilt Bronze Mantel Clock, c.1870",
    category: "Clocks & Watches",
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&h=400&fit=crop",
    currentBid: 620,
    bids: 11,
    endsIn: { h: 23, m: 0, s: 59 },
    condition: "Fair",
    location: "Nairobi, Kenya",
    reserve: false,
  },
  {
    id: 5,
    title: "Rare 1967 Fender Stratocaster — Original Sunburst",
    category: "Musical Instruments",
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&h=400&fit=crop",
    currentBid: 8750,
    bids: 43,
    endsIn: { h: 0, m: 38, s: 12 },
    condition: "Good",
    location: "Cape Town, South Africa",
    reserve: true,
  },
  {
    id: 6,
    title: "Sterling Silver Tea Service, London Hallmark 1912",
    category: "Silver & Gold",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    currentBid: 2100,
    bids: 19,
    endsIn: { h: 7, m: 14, s: 55 },
    condition: "Excellent",
    location: "Cairo, Egypt",
    reserve: false,
  },
];

function Countdown({ h, m, s: initS }: { h: number; m: number; s: number }) {
  const [secs, setSecs] = useState(h * 3600 + m * 60 + initS);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = Math.floor(secs / 3600);
  const mm = Math.floor((secs % 3600) / 60);
  const ss = secs % 60;
  const urgent = hh === 0 && mm < 60;
  return (
    <span className={`font-mono font-bold text-sm tabular-nums ${urgent ? "text-red-500" : "text-amber-700"}`}>
      {String(hh).padStart(2, "0")}:{String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
    </span>
  );
}

export default function Antiques() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredAuctions = SAMPLE_AUCTIONS.filter(a => {
    const matchCat = !activeCategory || a.category === activeCategory;
    const matchSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      <Navbar />

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #3b1f08 0%, #6b3d1a 35%, #92400e 65%, #78350f 100%)",
          minHeight: 420,
        }}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fbbf24 0%, transparent 40%)",
          }}
        />
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, #d97706 0px, #d97706 1px, transparent 1px, transparent 12px)`,
          }}
        />

        <div className="relative container mx-auto px-4 md:px-8 py-12 md:py-16 flex flex-col md:flex-row items-center gap-10">
          {/* Left: copy */}
          <div className="flex-1 flex flex-col gap-6 z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit"
              style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
              <Gavel className="w-4 h-4 text-amber-300" />
              <span className="text-amber-300 text-xs font-semibold tracking-wide uppercase">Live Bidding Platform</span>
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-[1.1] tracking-tight mb-4">
                Discover Rare<br />
                <span style={{ color: "#fbbf24" }}>Antiques &</span><br />
                Collectibles
              </h1>
              <p className="text-base text-amber-100/75 max-w-lg leading-relaxed">
                Bid on unique historical pieces from verified sellers across Africa and beyond. Furniture, jewelry, art, coins, and more — all authenticated and auctioned live.
              </p>
            </div>

            {/* Search bar */}
            <form
              onSubmit={e => { e.preventDefault(); }}
              className="flex items-center max-w-md"
            >
              <div className="flex items-center flex-1 bg-white rounded-l-full px-4 py-3 gap-3 shadow-lg">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="search"
                  placeholder="Search antiques, art, coins..."
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400 min-w-0"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="rounded-r-full px-5 py-3 text-sm font-semibold text-white shrink-0 shadow-lg"
                style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
              >
                Search
              </button>
            </form>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-1">
              {[
                { value: "18K+", label: "Items Listed" },
                { value: "4.2K+", label: "Active Bids" },
                { value: "12", label: "Categories" },
              ].map(s => (
                <div key={s.label} className="flex flex-col">
                  <span className="text-2xl font-display font-bold text-white">{s.value}</span>
                  <span className="text-xs text-amber-200/60 uppercase tracking-wide font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: feature pills */}
          <div className="hidden md:flex flex-col gap-3 shrink-0 w-72 z-10">
            {[
              { icon: <Shield className="w-5 h-5" />, title: "Authenticated Items", desc: "Every piece verified by our expert team" },
              { icon: <Gavel className="w-5 h-5" />, title: "Live Bidding", desc: "Real-time auctions with countdown timers" },
              { icon: <Bell className="w-5 h-5" />, title: "Bid Alerts", desc: "Get notified instantly when you're outbid" },
              { icon: <Users className="w-5 h-5" />, title: "Trusted Sellers", desc: "Verified antique dealers and collectors" },
            ].map(f => (
              <div
                key={f.title}
                className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-amber-300"
                  style={{ background: "rgba(251,191,36,0.15)" }}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-amber-100/55 text-xs leading-snug mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="container mx-auto px-4 md:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Browse by Category</h2>
            <p className="text-sm text-gray-500 mt-1">Explore curated collections of rare and valuable antiques</p>
          </div>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="text-sm text-amber-700 font-medium hover:underline"
            >
              Clear filter ×
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {ANTIQUE_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(isActive ? null : cat.name)}
                className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all text-center group"
                style={{
                  background: isActive ? cat.bg : "white",
                  borderColor: isActive ? cat.fg : "#e5e7eb",
                  boxShadow: isActive ? `0 0 0 3px ${cat.bg}` : "none",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: cat.bg, color: cat.fg }}
                >
                  {cat.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{cat.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{cat.count} items</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Live Auctions ── */}
      <section className="container mx-auto px-4 md:px-8 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-2xl font-display font-bold text-gray-900">Live Auctions</h2>
            </div>
            {activeCategory && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: "#fef3c7", color: "#92400e" }}>
                {activeCategory}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">{filteredAuctions.length} active</span>
        </div>

        {filteredAuctions.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <Gavel className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No auctions found for "{activeCategory || searchQuery}"</p>
            <button onClick={() => { setActiveCategory(null); setSearchQuery(""); }}
              className="mt-3 text-sm text-amber-700 font-semibold hover:underline">
              View all auctions
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAuctions.map(auction => (
              <div
                key={auction.id}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={auction.image}
                    alt={auction.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Countdown overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
                    <Clock className="w-3 h-3 text-amber-300" />
                    <Countdown {...auction.endsIn} />
                  </div>
                  {/* Category badge */}
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-semibold text-white"
                    style={{ background: "rgba(0,0,0,0.55)" }}>
                    {auction.category}
                  </div>
                  {/* Reserve met */}
                  {!auction.reserve && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{ background: "#15803d" }}>
                      Reserve Met
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1">{auction.location} · {auction.condition}</p>
                  <h3 className="font-display font-bold text-gray-900 text-sm leading-snug mb-3 line-clamp-2">{auction.title}</h3>

                  {/* Bid row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Current Bid</p>
                      <p className="text-lg font-display font-bold text-gray-900">
                        ${auction.currentBid.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-400">{auction.bids} bids</p>
                    </div>
                    <button
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                      onClick={() => alert("Bidding registration coming soon! Create your bidder account to place bids.")}
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      Bid Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-gray-100" style={{ background: "linear-gradient(180deg, #fffbf5 0%, #fef3c7 100%)" }}>
        <div className="container mx-auto px-4 md:px-8 py-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">How Bidding Works</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Join thousands of collectors bidding on rare antiques and historical pieces from Africa and around the world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", icon: <Search className="w-6 h-6" />, title: "Browse Auctions", desc: "Explore thousands of authenticated antiques across 12 categories." },
              { step: "2", icon: <Bell className="w-6 h-6" />, title: "Register & Watch", desc: "Create a free account, watchlist items, and get outbid alerts." },
              { step: "3", icon: <Gavel className="w-6 h-6" />, title: "Place Your Bid", desc: "Enter your maximum bid. The system auto-bids up to your limit." },
              { step: "4", icon: <Shield className="w-6 h-6" />, title: "Win & Receive", desc: "Pay securely through Coastaq. We handle shipping and insurance." },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-amber-700"
                    style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
                    {s.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-display font-bold text-gray-900 text-sm">{s.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed max-w-[180px]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sell CTA ── */}
      <section className="container mx-auto px-4 md:px-8 py-12">
        <div
          className="rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, #3b1f08 0%, #78350f 100%)" }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #f59e0b, transparent 60%)" }} />
          <div className="z-10">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">Have Antiques to Sell?</h2>
            <p className="text-amber-100/70 text-sm max-w-md leading-relaxed">
              List your antiques, collectibles, or inherited valuables. Reach thousands of serious collectors. No listing fee — we only take a small commission on successful sales.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0 z-10">
            <button
              onClick={() => setLocation("/auth/register?role=SELLER")}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-amber-900 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
            >
              Start Selling
            </button>
            <button
              onClick={() => setLocation("/auth/login")}
              className="px-6 py-3 rounded-xl font-semibold text-sm text-white border-2 border-white/20 hover:bg-white/10 transition-colors"
            >
              Sign In to Bid
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
