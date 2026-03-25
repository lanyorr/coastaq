import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  MessageCircle, Store, ShieldCheck, Handshake,
  Flag, HelpCircle, Clock, Twitter, Instagram, Facebook, Linkedin,
} from "lucide-react";

interface ContactCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: { label: string; value: string }[];
  accent?: string;
}

function ContactCard({ icon, title, description, items, accent = "text-primary bg-primary/10" }: ContactCardProps) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-display font-semibold text-foreground text-base">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-border/50">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            {item.value.includes("@") ? (
              <a href={`mailto:${item.value}`} className="text-sm font-medium text-primary hover:underline">
                {item.value}
              </a>
            ) : (
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const RESPONSE_TIMES = [
  { type: "General Support", time: "24–48 hours" },
  { type: "Seller Support", time: "24 hours" },
  { type: "Legal / Privacy", time: "3–5 business days" },
  { type: "Partnership", time: "5–7 business days" },
  { type: "Urgent Issues", time: "12 hours" },
];

const FAQ = [
  { q: "How do I create a seller account?", a: "Sign up and select 'Seller' during registration. Your shop will be reviewed within 24–48 hours." },
  { q: "When do I receive seller payouts?", a: "Standard payouts are processed weekly. Express daily payouts are available after 10 successful sales." },
  { q: "What if my item doesn't arrive?", a: "Contact the seller first through Coastaq messages, then escalate to our support team if unresolved." },
  { q: "How do I request a refund?", a: "Message the seller via Coastaq within 14 days of delivery. If they don't respond, escalate to refunds@coastaq.com." },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-b border-border/40">
        <div className="container mx-auto px-4 py-14 max-w-5xl">
          <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase mb-3 px-3 py-1 bg-primary/10 rounded-full">
            Support
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-3">
            Get in Touch
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            We're here to help. Whether you have a question, need support, or want to report a problem — reach out through the right channel below.
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl space-y-12">

        {/* Contact cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ContactCard
            icon={<MessageCircle className="w-5 h-5" />}
            title="Customer Support"
            description="For buyers and sellers needing help with accounts, transactions, technical support, or disputes."
            accent="text-primary bg-primary/10"
            items={[
              { label: "Email", value: "support@coastaq.com" },
              { label: "Response time", value: "24–48 hours" },
              { label: "Hours", value: "Mon–Fri, 9 AM – 6 PM EST" },
            ]}
          />
          <ContactCard
            icon={<Store className="w-5 h-5" />}
            title="Seller Support"
            description="For sellers needing help with shop setup, product listings, payouts, or verification."
            accent="text-green-700 bg-green-50"
            items={[
              { label: "Email", value: "sellers@coastaq.com" },
              { label: "Response time", value: "24 hours" },
              { label: "Priority", value: "Verified sellers first" },
            ]}
          />
          <ContactCard
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Legal & Privacy"
            description="For legal matters, privacy concerns, or to exercise your data rights under GDPR or CCPA."
            accent="text-blue-700 bg-blue-50"
            items={[
              { label: "Terms & Conditions", value: "legal@coastaq.com" },
              { label: "Privacy Policy", value: "privacy@coastaq.com" },
              { label: "Copyright / DMCA", value: "copyright@coastaq.com" },
            ]}
          />
          <ContactCard
            icon={<Handshake className="w-5 h-5" />}
            title="Partnerships & Business"
            description="For partnership opportunities, affiliate enquiries, media, or business development."
            accent="text-purple-700 bg-purple-50"
            items={[
              { label: "Partnerships", value: "partnerships@coastaq.com" },
              { label: "Affiliate Program", value: "affiliates@coastaq.com" },
              { label: "Press & Media", value: "press@coastaq.com" },
            ]}
          />
        </div>

        {/* Report a problem */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 shrink-0">
            <Flag className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground mb-1">Report a Problem</h3>
            <p className="text-sm text-muted-foreground mb-3">
              To report suspicious activity, fraud, prohibited items, policy violations, or security concerns, contact our secure reporting team.
            </p>
            <a href="mailto:abuse@coastaq.com" className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:underline">
              abuse@coastaq.com — All reports are confidential and investigated promptly
            </a>
          </div>
        </div>

        {/* Response time table */}
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            Response Times
          </h2>
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            {RESPONSE_TIMES.map((row, i) => (
              <div key={row.type} className={`flex items-center justify-between px-5 py-3.5 ${i < RESPONSE_TIMES.length - 1 ? "border-b border-border/40" : ""}`}>
                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {row.type}
                </div>
                <span className="text-sm text-primary font-semibold">{row.time}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Emergency support is available Saturday–Sunday, 10 AM – 4 PM EST. Closed on major holidays (responses delayed 24–48 hours).
          </p>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xl font-display font-bold text-foreground mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ.map(faq => (
              <div key={faq.q} className="bg-card border border-border/50 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground text-sm mb-1">{faq.q}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social + tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">Follow Us</h3>
            <div className="space-y-3">
              {[
                { icon: <Twitter className="w-4 h-4" />, label: "@coastaq", href: "https://twitter.com/coastaq" },
                { icon: <Instagram className="w-4 h-4" />, label: "@coastaq", href: "https://instagram.com/coastaq" },
                { icon: <Facebook className="w-4 h-4" />, label: "/coastaq", href: "https://facebook.com/coastaq" },
                { icon: <Linkedin className="w-4 h-4" />, label: "/company/coastaq", href: "https://linkedin.com/company/coastaq" },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <span className="text-primary">{s.icon}</span>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h3 className="font-display font-semibold text-foreground mb-3">Before You Contact Us</h3>
            <p className="text-sm text-muted-foreground mb-3">To help us assist you faster, please have ready:</p>
            <ul className="space-y-2">
              {[
                "Your account email address",
                "Order number (if applicable)",
                "Screenshots or photos (if relevant)",
                "Detailed description of the issue",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
