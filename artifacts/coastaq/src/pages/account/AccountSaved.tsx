import { useState, useEffect } from "react";
import { AccountLayout } from "./AccountLayout";
import { useLocation } from "wouter";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

type SavedListing = {
  productId: string;
  title: string;
  price: number;
  shopName: string;
  image: string;
  location: string;
  savedAt: string;
};

export default function AccountSaved() {
  const [, setLocation] = useLocation();
  const [saved, setSaved] = useState<SavedListing[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("coastaq_saved");
      setSaved(raw ? JSON.parse(raw) : []);
    } catch { setSaved([]); }
  }, []);

  const remove = (productId: string) => {
    const next = saved.filter(s => s.productId !== productId);
    setSaved(next);
    localStorage.setItem("coastaq_saved", JSON.stringify(next));
  };

  return (
    <AccountLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">Saved Listings</h1>
        <span className="text-sm text-muted-foreground">{saved.length} items</span>
      </div>

      {saved.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
          <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold mb-1">No saved listings</h3>
          <p className="text-sm text-muted-foreground mb-5">Tap the heart icon on any listing to save it here.</p>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setLocation("/")}>Browse listings</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map(item => (
            <div key={item.productId} className="bg-card border border-border/50 rounded-2xl overflow-hidden group">
              <div className="aspect-video bg-secondary overflow-hidden relative">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <button
                  onClick={() => remove(item.productId)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-rose-500 hover:bg-white shadow-sm"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>
              <div className="p-4">
                <a href={`/products/${item.productId}`} className="font-semibold text-sm text-foreground hover:text-primary line-clamp-2 leading-snug">
                  {item.title}
                </a>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-primary text-sm">${Number(item.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <span className="text-xs text-muted-foreground">{item.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
