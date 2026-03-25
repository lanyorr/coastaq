import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface Section {
  id: string;
  label: string;
}

interface LegalPageProps {
  title: string;
  subtitle: string;
  effectiveDate?: string;
  sections: Section[];
  children: ReactNode;
}

export function LegalPage({ title, subtitle, effectiveDate, sections, children }: LegalPageProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border-b border-border/40">
        <div className="container mx-auto px-4 py-14 max-w-5xl">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase mb-3 px-3 py-1 bg-primary/10 rounded-full">
              Legal
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground leading-tight mb-3">
              {title}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">{subtitle}</p>
            {effectiveDate && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Effective date:</span> {effectiveDate}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content area */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex gap-10 items-start">

          {/* Sticky sidebar — desktop only */}
          <aside className="hidden lg:block w-56 shrink-0 sticky top-28">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              On this page
            </p>
            <nav className="space-y-0.5">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="w-full text-left text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Article */}
          <article className="flex-1 min-w-0 prose-legal">
            {children}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Shared section primitives ───────────────────────────────────────────────

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-28">
      <h2 className="text-xl font-display font-bold text-foreground mb-5 pb-3 border-b border-border/60 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full shrink-0" />
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function Para({ children }: { children: ReactNode }) {
  return <p className="text-muted-foreground leading-relaxed text-[15px]">{children}</p>;
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[15px] text-muted-foreground">
          <span className="w-1.5 h-1.5 bg-primary/60 rounded-full shrink-0 mt-[7px]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function InfoBox({ children, color = "blue" }: { children: ReactNode; color?: "blue" | "amber" | "green" | "red" }) {
  const colors = {
    blue: "bg-primary/5 border-primary/20 text-primary/80",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    green: "bg-green-50 border-green-200 text-green-800",
    red: "bg-red-50 border-red-200 text-red-800",
  };
  return (
    <div className={`border rounded-xl p-4 text-sm leading-relaxed ${colors[color]}`}>
      {children}
    </div>
  );
}

export function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="text-sm font-medium text-foreground w-36 shrink-0">{label}</span>
      <a href={`mailto:${value}`} className="text-sm text-primary hover:underline">
        {value}
      </a>
    </div>
  );
}
