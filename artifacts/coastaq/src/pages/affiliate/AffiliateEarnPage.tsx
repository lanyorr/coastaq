import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Link2, MousePointerClick, DollarSign, ChevronDown, ChevronRight,
  CheckCircle2, TrendingUp, Clock, Shield, Zap, BarChart2, Users,
} from "lucide-react";

/* ── Animated counter ─────────────────────────────────────────────────────── */
function AnimatedCounter({
  end,
  prefix = "",
  suffix = "",
  duration = 1800,
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}

/* ── FAQ Accordion ─────────────────────────────────────────────────────────── */
const FAQ_ITEMS = [
  {
    q: "Who can become a Coastaq affiliate?",
    a: "Anyone! Whether you're a blogger, influencer, content creator, or just someone with a social media presence, you can apply to become a Coastaq affiliate. We approve most applications within 24 hours.",
  },
  {
    q: "How much commission do I earn?",
    a: "The standard commission is 5% of the sale value for every purchase made through your affiliate link. Some seller campaigns may offer higher rates — up to 50% — for specific products or during promotional periods.",
  },
  {
    q: "When and how do I get paid?",
    a: "Commissions are credited to your affiliate balance once the order is confirmed. You can request a payout any time your balance reaches $10.00. Payments are processed within 1–3 business days via PayPal, bank transfer, or mobile money.",
  },
  {
    q: "What products can I promote?",
    a: "You can promote any listed product on Coastaq's marketplace — from electronics and fashion to services and real estate. Simply generate a unique tracking link from your affiliate dashboard.",
  },
  {
    q: "Are there any fees to join?",
    a: "Absolutely not. Joining the Coastaq affiliate program is completely free. You earn commissions when your links convert — there are no upfront costs or hidden fees.",
  },
  {
    q: "How does tracking work?",
    a: "Each affiliate gets a unique link code. When someone clicks your link and completes a purchase within 30 days, it's attributed to you. Your dashboard shows real-time clicks, conversions, and earnings.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 last:border-none">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="font-semibold text-base group-hover:text-purple-700 transition-colors">{q}</span>
        <ChevronDown className={cn("w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180 text-purple-600")} />
      </button>
      {open && (
        <p className="text-muted-foreground text-sm leading-relaxed pb-5">{a}</p>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AffiliateEarnPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-20 md:py-28"
        style={{
          background: "linear-gradient(135deg, #2d1b69 0%, #5b21b6 50%, #7c3aed 100%)",
        }}
      >
        {/* Blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
          <div className="absolute -bottom-16 right-0 w-80 h-80 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #c4b5fd, transparent)" }} />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white text-xs font-semibold rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-3.5 h-3.5" />
            Earn Real Money with Coastaq
          </span>

          <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-[1.1] mb-5 tracking-tight">
            Share Links.<br />
            <span style={{ color: "#fbbf24" }}>Earn 5% Commission.</span>
          </h1>
          <p className="text-lg text-purple-100 max-w-xl mx-auto mb-8 leading-relaxed">
            Join thousands of Coastaq affiliates who earn commissions by sharing links to the products they love. Free to join, no experience needed.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => setLocation("/affiliate")}
              className="px-8 py-3.5 rounded-full text-base font-bold text-purple-900 transition-all hover:scale-105 shadow-lg shadow-yellow-400/20"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
            >
              Apply Free — Start Earning →
            </button>
            <a
              href="#how-it-works"
              onClick={e => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}
              className="px-6 py-3.5 rounded-full text-sm font-semibold border-2 border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              See how it works
            </a>
          </div>

          {/* Trust note */}
          <div className="flex items-center justify-center gap-2 mt-8 text-purple-200 text-sm">
            <Shield className="w-4 h-4" />
            <span>Free to join · No minimum following · Payouts via PayPal</span>
          </div>
        </div>
      </section>

      {/* ── STAT COUNTERS ────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-border/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { end: 2500, suffix: "+", label: "Active Affiliates", icon: Users, color: "text-purple-600" },
              { end: 48000, prefix: "₵", label: "Total Paid Out", icon: DollarSign, color: "text-green-600" },
              { end: 150000, suffix: "+", label: "Products Available", icon: Link2, color: "text-blue-600" },
              { end: 5, suffix: "%", label: "Base Commission", icon: TrendingUp, color: "text-orange-500" },
            ].map(({ end, prefix, suffix, label, icon: Icon, color }) => (
              <div key={label} className="text-center">
                <div className={cn("text-3xl md:text-4xl font-display font-bold mb-1", color)}>
                  <AnimatedCounter end={end} prefix={prefix} suffix={suffix} />
                </div>
                <p className="text-sm text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-3">How it works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Three simple steps to start earning with Coastaq.</p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200" />

            {[
              {
                step: "1",
                icon: Link2,
                title: "Apply & Get Approved",
                desc: "Fill out a quick application — most are approved within 24 hours. No minimum following or experience required.",
                color: "bg-purple-100 text-purple-600",
                border: "border-purple-200",
              },
              {
                step: "2",
                icon: MousePointerClick,
                title: "Share Your Links",
                desc: "Generate unique tracking links for any product on Coastaq. Share them on social media, blogs, YouTube, WhatsApp — anywhere.",
                color: "bg-blue-100 text-blue-600",
                border: "border-blue-200",
              },
              {
                step: "3",
                icon: DollarSign,
                title: "Earn & Get Paid",
                desc: "Earn 5%+ on every completed purchase you refer. Request your payout any time via PayPal, bank transfer, or mobile money.",
                color: "bg-green-100 text-green-600",
                border: "border-green-200",
              },
            ].map(({ step, icon: Icon, title, desc, color, border }) => (
              <div key={step} className="relative text-center">
                <div className="flex flex-col items-center">
                  <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center mb-4 border-2 shadow-sm", color, border)}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="absolute top-0 right-4 md:right-auto md:left-14 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                    {step}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMISSION TIERS ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-20" style={{ background: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)" }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold mb-3">Commission Tiers</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Earn more as you refer more. The more you promote, the higher your rate.</p>
          </div>

          <div className="overflow-x-auto max-w-2xl mx-auto">
            <table className="w-full text-sm bg-white rounded-2xl overflow-hidden shadow-lg">
              <thead>
                <tr style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                  <th className="text-left px-6 py-3.5 text-white font-semibold">Tier</th>
                  <th className="text-center px-6 py-3.5 text-white font-semibold">Monthly Referrals</th>
                  <th className="text-center px-6 py-3.5 text-white font-semibold">Commission Rate</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { tier: "Starter", range: "0 – 9 sales", rate: "5%", highlight: false },
                  { tier: "Bronze", range: "10 – 49 sales", rate: "6%", highlight: false },
                  { tier: "Silver", range: "50 – 199 sales", rate: "7.5%", highlight: false },
                  { tier: "Gold", range: "200+ sales", rate: "10%", highlight: true },
                ].map(({ tier, range, rate, highlight }) => (
                  <tr
                    key={tier}
                    className={cn(
                      "border-t border-border/30 transition-colors",
                      highlight ? "bg-purple-50" : "hover:bg-gray-50",
                    )}
                  >
                    <td className="px-6 py-4 font-semibold">
                      {highlight && <span className="inline-flex items-center gap-1 text-purple-700">{tier} <span className="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-bold">TOP</span></span>}
                      {!highlight && tier}
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">{range}</td>
                    <td className="px-6 py-4 text-center font-bold text-purple-700">{rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">Individual seller campaigns may offer higher rates.</p>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold mb-3">Why affiliates love Coastaq</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: DollarSign, title: "Instant PayPal Payouts", desc: "No waiting 30-60 days. Request your payout any time you hit $10 — processed within 1–3 business days.", color: "bg-green-100 text-green-600" },
              { icon: BarChart2, title: "Real-time Dashboard", desc: "See every click, conversion, and commission in real time. Know exactly what's working and optimise your strategy.", color: "bg-blue-100 text-blue-600" },
              { icon: Clock, title: "30-day Cookie Window", desc: "Earn commission on any purchase your referral makes within 30 days of clicking your link — even if it's a different product.", color: "bg-purple-100 text-purple-600" },
              { icon: Shield, title: "Fraud Protection", desc: "Our built-in fraud detection ensures only genuine referrals count, keeping your commissions safe and your reputation intact.", color: "bg-orange-100 text-orange-600" },
              { icon: Zap, title: "Unlimited Links", desc: "Generate unique tracking links for every product in Coastaq's catalogue — over 150,000 listings to choose from.", color: "bg-yellow-100 text-yellow-600" },
              { icon: CheckCircle2, title: "Coupon Codes", desc: "Create exclusive discount codes for your audience. When they save, you earn — a win-win that boosts your conversion rate.", color: "bg-teal-100 text-teal-600" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-card border border-border/50 rounded-2xl p-5 flex gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about the Coastaq affiliate program.</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/50 px-6 py-2">
            {FAQ_ITEMS.map(item => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section
        className="py-16 md:py-20 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e0940 0%, #4c1d95 50%, #6d28d9 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-72 h-72 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to start earning?
          </h2>
          <p className="text-purple-200 text-lg mb-8 max-w-md mx-auto">
            Join 2,500+ affiliates already earning with Coastaq. Free to join, no experience needed.
          </p>
          <button
            onClick={() => setLocation("/affiliate")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-purple-900 transition-all hover:scale-105 shadow-2xl shadow-yellow-400/30"
            style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
          >
            Apply Now — It's Free <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-purple-300 text-xs mt-4">Most applications approved within 24 hours.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
