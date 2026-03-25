import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProductDetails from "@/pages/ProductDetails";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import SellerDashboard from "@/pages/SellerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import BuyerDashboard from "@/pages/BuyerDashboard";

// Setup global fetch interceptor to inject Authorization header
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    const token = localStorage.getItem('coastaq_token');
    if (token) {
      config = config || {};
      // Safely merge headers — Headers instances don't spread with {...obj}
      const merged = new Headers(config.headers instanceof Headers
        ? Object.fromEntries((config.headers as Headers).entries())
        : (config.headers as Record<string, string> | undefined) ?? {});
      if (!merged.has('Authorization')) {
        merged.set('Authorization', `Bearer ${token}`);
      }
      config = { ...config, headers: merged };
    }
  }
  return originalFetch(resource, config);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/products/:id" component={ProductDetails} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/orders" component={Orders} />
      <Route path="/buyer/dashboard" component={BuyerDashboard} />
      <Route path="/seller/dashboard" component={SellerDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
