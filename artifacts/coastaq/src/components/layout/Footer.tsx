import { Link } from "wouter";
import { CoastaqLogo } from "@/components/layout/CoastaqLogo";
import { ShieldCheck, Facebook, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

const BUYER_LINKS = [
  { label: "Browse Products", to: "/shop" },
  { label: "My Orders", to: "/account/orders" },
  { label: "Buyer Protection", to: "/terms" },
  { label: "Request a Quote", to: "/" },
  { label: "Track Shipment", to: "/account/orders" },
];

const SELLER_LINKS = [
  { label: "Start Selling", to: "/auth/register?role=SELLER" },
  { label: "Seller Dashboard", to: "/seller" },
  { label: "Seller Agreement", to: "/seller-agreement" },
  { label: "List Products", to: "/seller/products" },
  { label: "Manage Orders", to: "/seller/orders" },
];

const AFFILIATE_LINKS = [
  { label: "Join Program", to: "/auth/register?role=AFFILIATE" },
  { label: "Affiliate Dashboard", to: "/affiliate" },
  { label: "My Links", to: "/affiliate/links" },
  { label: "Commission Rates", to: "/affiliate/commissions" },
];

const SUPPORT_LINKS = [
  { label: "Contact Us", to: "/contact" },
  { label: "Help Center", to: "/contact" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Refund Policy", to: "/refunds" },
];

const SOCIAL_LINKS = [
  { icon: <Facebook className="w-4 h-4" />, href: "#", label: "Facebook" },
  { icon: <Twitter className="w-4 h-4" />, href: "#", label: "Twitter" },
  { icon: <Instagram className="w-4 h-4" />, href: "#", label: "Instagram" },
  { icon: <Linkedin className="w-4 h-4" />, href: "#", label: "LinkedIn" },
  { icon: <Youtube className="w-4 h-4" />, href: "#", label: "YouTube" },
];

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="font-display font-semibold text-gray-900 text-sm mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map(({ label, to }) => (
          <li key={to + label}>
            <Link href={to} className="text-sm text-gray-500 hover:text-market transition-colors">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">

      {/* Trust strip */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🔒", title: "Escrow Protection", desc: "Payments held securely until delivery confirmed" },
              { icon: "✅", title: "Verified Suppliers", desc: "All sellers reviewed and approved" },
              { icon: "🚀", title: "Fast Shipping", desc: "Reliable logistics partners worldwide" },
              { icon: "💬", title: "24/7 Support", desc: "Dedicated buyer & seller support" },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/">
              <CoastaqLogo iconSize={32} textSize={18} gap={8} />
            </Link>
            <p className="text-sm text-gray-500 mt-3 max-w-xs leading-relaxed">
              Coastaq is a global B2B marketplace connecting buyers, sellers, and affiliates across Africa and beyond. Trade safely with escrow-protected payments.
            </p>
            <div className="flex items-center gap-1 mt-4">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-xs font-semibold text-green-700">Escrow-Protected Marketplace</span>
            </div>
            {/* Social */}
            <div className="flex items-center gap-2 mt-4">
              {SOCIAL_LINKS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-market hover:text-white flex items-center justify-center text-gray-500 transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="For Buyers" links={BUYER_LINKS} />
          <FooterCol title="For Sellers" links={SELLER_LINKS} />
          <FooterCol title="Affiliates" links={AFFILIATE_LINKS} />
          <FooterCol title="Support" links={SUPPORT_LINKS} />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Coastaq Marketplace Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-gray-400 hover:text-market transition-colors">Terms</Link>
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-market transition-colors">Privacy</Link>
            <Link href="/refunds" className="text-xs text-gray-400 hover:text-market transition-colors">Refunds</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-market transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
