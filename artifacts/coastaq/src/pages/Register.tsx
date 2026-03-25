import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Waves, Loader2, Store, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const defaultRole = searchParams.get("role") === "SELLER" ? "SELLER" : "BUYER";
  
  const { toast } = useToast();
  const [role, setRole] = useState<"BUYER" | "SELLER">(defaultRole);
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", shopName: "", shopDescription: ""
  });
  
  const { mutate: register, isPending } = useRegister({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("coastaq_token", data.token);
        toast({ title: "Welcome to Coastaq!", description: "Account created successfully." });
        setLocation(data.user.role === "SELLER" ? "/seller/dashboard" : "/");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Registration failed", description: err.message });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ data: { ...formData, role } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-background py-12">
      <img 
        src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
        alt="Background" 
        className="fixed inset-0 w-full h-full object-cover opacity-50"
      />
      
      <div className="relative z-10 w-full max-w-lg p-4">
        <Link href="/" className="inline-flex items-center justify-center w-full mb-6 hover:opacity-80 transition-opacity">
          <div className="bg-white/50 backdrop-blur-md p-3 rounded-2xl shadow-sm mr-3">
            <Waves className="h-8 w-8 text-primary" />
          </div>
          <span className="font-display font-bold text-4xl text-foreground">Coastaq</span>
        </Link>
        
        <div className="glass-panel rounded-[2rem] p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-display text-foreground">Create an account</h1>
            <p className="text-muted-foreground mt-2">Join our coastal community</p>
          </div>

          <div className="flex gap-4 mb-8 bg-secondary/50 p-2 rounded-2xl">
            <button
              onClick={() => setRole("BUYER")}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${role === "BUYER" ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <User className="w-4 h-4" /> Buyer
            </button>
            <button
              onClick={() => setRole("SELLER")}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${role === "SELLER" ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Store className="w-4 h-4" /> Seller
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input required className="bg-white/50 h-12 rounded-xl"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" required className="bg-white/50 h-12 rounded-xl"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" required minLength={6} className="bg-white/50 h-12 rounded-xl"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>

            {role === "SELLER" && (
              <div className="space-y-5 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-4">
                <h3 className="font-bold text-primary">Shop Details</h3>
                <div className="space-y-2">
                  <Label>Shop Name</Label>
                  <Input required className="bg-white/50 h-12 rounded-xl"
                    value={formData.shopName} onChange={e => setFormData({...formData, shopName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Shop Description</Label>
                  <Textarea className="bg-white/50 rounded-xl" rows={3}
                    value={formData.shopDescription} onChange={e => setFormData({...formData, shopDescription: e.target.value})} />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20 mt-4" disabled={isPending}>
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
