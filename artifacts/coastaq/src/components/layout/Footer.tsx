import { Link } from "wouter";

const LINKS = [
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Refund Policy", to: "/refunds" },
  { label: "Seller Agreement", to: "/seller-agreement" },
  { label: "Contact Us", to: "/contact" },
];

export function Footer() {
  return (
    <footer className="bg-white border-t border-border/50 py-10 mt-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="opacity-60 hover:opacity-100 transition-opacity">
            <img src="/logo.png" alt="Coastaq" className="h-10 w-auto object-contain" />
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-left order-last md:order-none">
            © {new Date().getFullYear()} Coastaq Marketplace. All rights reserved.
          </p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {LINKS.map(({ label, to }) => (
              <Link
                key={to}
                href={to}
                className="text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
