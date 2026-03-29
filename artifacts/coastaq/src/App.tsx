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
import AdminOverview from "@/pages/admin/Overview";
import AdminUsers from "@/pages/admin/Users";
import AdminShops from "@/pages/admin/Shops";
import AdminProducts from "@/pages/admin/Products";
import AdminReports from "@/pages/admin/Reports";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminCategories from "@/pages/admin/Categories";
import BuyerDashboard from "@/pages/BuyerDashboard";
import Messages from "@/pages/Messages";
import ChatRoom from "@/pages/ChatRoom";
import TermsPage from "@/pages/legal/TermsPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import ContactPage from "@/pages/legal/ContactPage";
import RefundPage from "@/pages/legal/RefundPage";
import SellerAgreementPage from "@/pages/legal/SellerAgreementPage";
import Antiques from "@/pages/Antiques";

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
      <Route path="/admin" component={AdminOverview} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/shops" component={AdminShops} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/messages" component={Messages} />
      <Route path="/messages/:id" component={ChatRoom} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/refunds" component={RefundPage} />
      <Route path="/seller-agreement" component={SellerAgreementPage} />
      <Route path="/antiques" component={Antiques} />
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
