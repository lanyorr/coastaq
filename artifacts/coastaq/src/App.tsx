import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
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
import AdminOverview from "@/pages/admin/Overview";
import AdminUsers from "@/pages/admin/Users";
import AdminShops from "@/pages/admin/Shops";
import AdminProducts from "@/pages/admin/Products";
import AdminReports from "@/pages/admin/Reports";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminCategories from "@/pages/admin/Categories";
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

// New modular dashboard pages
import AccountOverview from "@/pages/account/index";
import AccountOrders from "@/pages/account/AccountOrders";
import AccountMessages from "@/pages/account/AccountMessages";
import AccountSaved from "@/pages/account/AccountSaved";
import AccountSettings from "@/pages/account/AccountSettings";

import SellerOverview from "@/pages/seller/index";
import SellerProductsPage from "@/pages/seller/SellerProductsPage";
import SellerOrdersPage from "@/pages/seller/SellerOrdersPage";
import SellerMessagesPage from "@/pages/seller/SellerMessagesPage";
import SellerEarningsPage from "@/pages/seller/SellerEarningsPage";
import SellerSubscriptionPage from "@/pages/seller/SellerSubscriptionPage";
import SellerShopPage from "@/pages/seller/SellerShopPage";
import SellerCampaignsPage from "@/pages/seller/SellerCampaignsPage";
import BulkImportPage from "@/pages/seller/BulkImportPage";
import ImportHistoryPage from "@/pages/seller/ImportHistoryPage";
import AffiliateEarnPage from "@/pages/affiliate/AffiliateEarnPage";

import AffiliateOverview from "@/pages/affiliate/index";
import AffiliateLinks from "@/pages/affiliate/AffiliateLinks";
import AffiliateCommissions from "@/pages/affiliate/AffiliateCommissions";
import AffiliateAnalytics from "@/pages/affiliate/AffiliateAnalytics";
import AffiliatePayouts from "@/pages/affiliate/AffiliatePayouts";
import AffiliateCoupons from "@/pages/affiliate/AffiliateCoupons";
import AffiliateCampaigns from "@/pages/affiliate/AffiliateCampaigns";
import AffiliateSettings from "@/pages/affiliate/AffiliateSettings";

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

      {/* ── Auth pages ─────────────────────────────────────────────────────── */}
      <Route path="/auth/login">
        {() => <ProtectedRoute guestOnly component={Login} />}
      </Route>
      <Route path="/auth/register">
        {() => <ProtectedRoute guestOnly component={Register} />}
      </Route>

      {/* ── Generic dashboard redirect ──────────────────────────────────────── */}
      <Route path="/dashboard" component={DashboardRedirect} />

      {/* ── Buyer / Account routes (/account/*) ───────────────────────────── */}
      <Route path="/account">
        {() => <ProtectedRoute roles={["BUYER", "SELLER", "AFFILIATE", "ADMIN"]} component={AccountOverview} />}
      </Route>
      <Route path="/account/orders">
        {() => <ProtectedRoute roles={["BUYER", "SELLER", "AFFILIATE", "ADMIN"]} component={AccountOrders} />}
      </Route>
      <Route path="/account/messages">
        {() => <ProtectedRoute roles={["BUYER", "SELLER", "AFFILIATE", "ADMIN"]} component={AccountMessages} />}
      </Route>
      <Route path="/account/saved">
        {() => <ProtectedRoute roles={["BUYER", "SELLER", "AFFILIATE", "ADMIN"]} component={AccountSaved} />}
      </Route>
      <Route path="/account/settings">
        {() => <ProtectedRoute roles={["BUYER", "SELLER", "AFFILIATE", "ADMIN"]} component={AccountSettings} />}
      </Route>

      {/* ── Backward-compat redirects ──────────────────────────────────────── */}
      <Route path="/buyer/dashboard">{() => <Redirect to="/account" />}</Route>
      <Route path="/orders">{() => <ProtectedRoute roles={["BUYER", "SELLER", "ADMIN"]} component={Orders} />}</Route>
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/checkout/paypal/return" component={PayPalReturnPage} />

      {/* ── Seller routes (/seller/*) ──────────────────────────────────────── */}
      <Route path="/seller">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={SellerOverview} />}
      </Route>
      <Route path="/seller/products">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={SellerProductsPage} />}
      </Route>
      <Route path="/seller/orders">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={SellerOrdersPage} />}
      </Route>
      <Route path="/seller/messages">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={SellerMessagesPage} />}
      </Route>
      <Route path="/seller/earnings">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={SellerEarningsPage} />}
      </Route>
      <Route path="/seller/subscription">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={SellerSubscriptionPage} />}
      </Route>
      <Route path="/seller/shop">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={SellerShopPage} />}
      </Route>
      <Route path="/seller/campaigns">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={SellerCampaignsPage} />}
      </Route>
      <Route path="/seller/import/history">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={ImportHistoryPage} />}
      </Route>
      <Route path="/seller/import">
        {() => <ProtectedRoute roles={["SELLER", "ADMIN"]} component={BulkImportPage} />}
      </Route>
      {/* Backward-compat redirect */}
      <Route path="/seller/dashboard">{() => <Redirect to="/seller" />}</Route>

      {/* ── Affiliate routes (/affiliate/*) ───────────────────────────────── */}
      <Route path="/affiliate">
        {() => <ProtectedRoute roles={["AFFILIATE", "SELLER", "BUYER", "ADMIN"]} component={AffiliateOverview} />}
      </Route>
      <Route path="/affiliate/links">
        {() => <ProtectedRoute roles={["AFFILIATE", "SELLER", "BUYER", "ADMIN"]} component={AffiliateLinks} />}
      </Route>
      <Route path="/affiliate/commissions">
        {() => <ProtectedRoute roles={["AFFILIATE", "SELLER", "BUYER", "ADMIN"]} component={AffiliateCommissions} />}
      </Route>
      <Route path="/affiliate/analytics">
        {() => <ProtectedRoute roles={["AFFILIATE", "SELLER", "BUYER", "ADMIN"]} component={AffiliateAnalytics} />}
      </Route>
      <Route path="/affiliate/payouts">
        {() => <ProtectedRoute roles={["AFFILIATE", "SELLER", "BUYER", "ADMIN"]} component={AffiliatePayouts} />}
      </Route>
      <Route path="/affiliate/coupons">
        {() => <ProtectedRoute roles={["AFFILIATE", "SELLER", "BUYER", "ADMIN"]} component={AffiliateCoupons} />}
      </Route>
      <Route path="/affiliate/campaigns">
        {() => <ProtectedRoute roles={["AFFILIATE", "SELLER", "BUYER", "ADMIN"]} component={AffiliateCampaigns} />}
      </Route>
      <Route path="/affiliate/settings">
        {() => <ProtectedRoute roles={["AFFILIATE", "SELLER", "BUYER", "ADMIN"]} component={AffiliateSettings} />}
      </Route>
      {/* Backward-compat redirect */}
      <Route path="/affiliate/dashboard">{() => <Redirect to="/affiliate" />}</Route>
      <Route path="/affiliate/earn" component={AffiliateEarnPage} />

      {/* ── Admin routes (/admin/*) ────────────────────────────────────────── */}
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

      {/* ── Messaging ─────────────────────────────────────────────────────── */}
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
