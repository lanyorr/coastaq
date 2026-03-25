import { Waves } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-border/50 py-12 mt-20">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
          <Waves className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Coastaq
          </span>
        </div>
        <p className="text-sm text-muted-foreground text-center md:text-left">
          © {new Date().getFullYear()} Coastaq Marketplace. Crafted with the breeze in mind.
        </p>
        <div className="flex gap-4">
          <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
