import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { MessageCircle, Search } from "lucide-react";

export default function Cart() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-32 max-w-lg text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-3">No cart needed</h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          On Coastaq, buyers contact sellers directly. Browse a listing, tap
          <strong> Show contact</strong> or <strong>Start chat</strong> to reach the seller.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button className="rounded-xl px-8" onClick={() => setLocation("/")}>
            <Search className="w-4 h-4 mr-2" />
            Browse listings
          </Button>
          <Button variant="outline" className="rounded-xl px-8" onClick={() => setLocation("/buyer/dashboard")}>
            My Dashboard
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
