import { useState } from "react";
import { CoastaqLogo } from "@/components/layout/CoastaqLogo";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: login, isPending } = useLogin({
    mutation: {
      onSuccess: (data: any) => {
        localStorage.setItem("coastaq_token", data.token);
        // Invalidate all queries so Navbar & pages pick up the new auth state
        queryClient.invalidateQueries();
        toast({ title: "Welcome back!", description: "Successfully logged in." });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: err.message || "Invalid credentials.",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ data: { email, password } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0c2461 0%, #1a56db 55%, #1e6fd9 100%)" }}>

      <div className="relative z-10 w-full max-w-md p-4">
        <Link href="/" className="flex justify-center w-full mb-8 hover:opacity-90 transition-opacity">
          <CoastaqLogo iconSize={56} textSize={30} gap={12} textColor="#fff" />
        </Link>

        <div className="glass-panel rounded-[2rem] p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-display text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                className="bg-white/50 h-12 rounded-xl"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-primary hover:underline font-medium">Forgot password?</a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="bg-white/50 h-12 rounded-xl pr-12"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-primary font-bold hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
