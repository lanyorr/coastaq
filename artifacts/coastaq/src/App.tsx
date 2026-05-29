import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/lib/locale/context";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProductDetails from "@/pages/ProductDetails";
import Cart from "@/pages/Cart";
import Checkout, { PayPalReturnPage } from "@/pages/Checkout";
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
import AffiliateDashboard from "@/pages/AffiliateDashboard";
import Messages from "@/pages/Messages";
import ChatRoom from "@/pages/ChatRoom";
import TermsPage from "@/pages/legal/TermsPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import ContactPage from "@/pages/legal/ContactPage";
import RefundPage from "@/pages/legal/RefundPage";
import SellerAgreementPage from "@/pages/legal/SellerAgreementPage";
import Antiques from "@/pages/Antiques";
import Shop from "@/pages/Shop";
import ShopPage from "@/pages/ShopPage";

// Auth / RBAC
import { ProtectedRoute, DashboardRedirect } from "@/components/auth/ProtectedRoute";

// Setup global fetch interceptor to inject Authorization header
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === "string" && resource.startsWith("/api")) {
    const token = localStorage.getItem("coastaq_token");
    if (token) {
      config = config || {};
      const merged = new Headers(
        config.headers instanceof Headers
          ? Object.fromEntries((config.headers as Headers).entries())
          : (config.headers as Record<string, string> | undefined) ?? {},
      );
      if (!merged.has("Authorization")) merged.set("Authorization", `Bearer ${token}`);
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
      {/* ── Public routes ──────────────────────────────────────────────────── */}
      <Route path="/" component={Home} />
      <Route path="/products/:id" component={ProductDetails} />
      <Route path="/shop" component={Shop} />
      <Route path="/shop/:slug" component={ShopPage} />
      <Route path="/antiques" component={Antiques} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/refunds" component={RefundPage} />
      <Route path="/seller-agreement" component={SellerAgreementPage} />

      {/* ── Auth pages (guest-only: logged-in users get redirected) ────────── */}
      <Route path="/auth/login">
        {() => <ProtectedRoute guestOnly component={Login} />}
      </Route>
      <Route path="/auth/register">
        {() => <ProtectedRoute guestOnly component={Register} />}
      </Route>

      {/* ── Generic dashboard redirect (routes to role-appropriate dashboard) */}
      <Route path="/dashboard" component={DashboardRedirect} />

      {/* ── Buyer routes ───────────────────────────────────────────────────── */}
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/checkout/paypal/return" component={PayPalReturnPage} />
      <Route path="/orders">
        {() => <ProtectedRoute roles={["BUYER", "SELLER", "ADMIN"]} component={Orders} />}
      </Route>
      <Route path="/buyer/dashboard">
        {() => <ProtectedRoute roles={["BUYER", "SELLER", "ADMIN"]} component={BuyerDashboard} />}
      </Route>

      {/* ── Seller routes ──────────────────────────────────────────────────── */}
      <Route path="/seller/dashboard">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={SellerDashboard} />}
      </Route>

      {/* ── Affiliate routes ───────────────────────────────────────────────── */}
      <Route path="/affiliate/dashboard">
        {() => <ProtectedRoute roles={["AFFILIATE", "SELLER", "ADMIN"]} component={AffiliateDashboard} />}
      </Route>

      {/* ── Admin routes ───────────────────────────────────────────────────── */}
      <Route path="/admin">
        {() => <ProtectedRoute roles={["ADMIN"]} component={AdminOverview} />}
      </Route>
      <Route path="/admin/users">
        {() => <ProtectedRoute roles={["ADMIN"]} component={AdminUsers} />}
      </Route>
      <Route path="/admin/shops">
        {() => <ProtectedRoute roles={["ADMIN"]} component={AdminShops} />}
      </Route>
      <Route path="/admin/products">
        {() => <ProtectedRoute roles={["ADMIN"]} component={AdminProducts} />}
      </Route>
      <Route path="/admin/reports">
        {() => <ProtectedRoute roles={["ADMIN"]} component={AdminReports} />}
      </Route>
      <Route path="/admin/analytics">
        {() => <ProtectedRoute roles={["ADMIN"]} component={AdminAnalytics} />}
      </Route>
      <Route path="/admin/categories">
        {() => <ProtectedRoute roles={["ADMIN"]} component={AdminCategories} />}
      </Route>

      {/* ── Messaging (any authenticated user) ────────────────────────────── */}
      <Route path="/messages">
        {() => <ProtectedRoute roles={["BUYER", "SELLER", "AFFILIATE", "ADMIN"]} component={Messages} />}
      </Route>
      <Route path="/messages/:id">
        {() => <ProtectedRoute roles={["BUYER", "SELLER", "AFFILIATE", "ADMIN"]} component={ChatRoom} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <LocaleProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </LocaleProvider>
  );
}

export default App;
