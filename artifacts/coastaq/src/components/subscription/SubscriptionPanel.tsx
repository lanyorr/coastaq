import { useState } from "react";
import {
  useSubscriptionStatus,
  usePaypalConfig,
  useCancelSubscription,
} from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Zap,
  Loader2,
  RefreshCw,
  Star,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  PayPalScriptProvider,
  PayPalButtons,
  PayPalCardFieldsProvider,
  PayPalNameField,
  PayPalNumberField,
  PayPalExpiryField,
  PayPalCVVField,
  usePayPalCardFields,
  FUNDING,
} from "@paypal/react-paypal-js";

const PLAN_FEATURES = [
  "Unlimited product listings",
  "Priority placement in search",
  "Full seller analytics dashboard",
  "Custom shop branding",
  "Customer messaging",
  "Order management tools",
];

const FIELD_STYLE = {
  base: {
    color: "#0f172a",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "14px",
    padding: "0 12px",
  },
  focus: { color: "#0f172a" },
  invalid: { color: "#dc2626" },
  valid: { color: "#16a34a" },
};

const FIELD_CLASS =
  "h-10 w-full rounded-lg border border-input bg-background text-sm shadow-sm overflow-hidden";

function StatusBadge({ status, daysLeft }: { status: string; daysLeft: number }) {
  const base = "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full";
  if (status === "TRIAL")
    return (
      <span className={`${base} bg-blue-100 text-blue-700`}>
        <Clock className="w-3 h-3" />
        Free Trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
      </span>
    );
  if (status === "ACTIVE")
    return (
      <span className={`${base} bg-green-100 text-green-700`}>
        <CheckCircle2 className="w-3 h-3" />
        Active
      </span>
    );
  if (status === "EXPIRED")
    return (
      <span className={`${base} bg-red-100 text-red-700`}>
        <AlertCircle className="w-3 h-3" />
        Expired
      </span>
    );
  return (
    <span className={`${base} bg-gray-100 text-gray-600`}>
      <XCircle className="w-3 h-3" />
      Cancelled
    </span>
  );
}

async function createPaypalOrder(): Promise<string> {
  const token = localStorage.getItem("coastaq_token");
  const res = await fetch("/api/subscription/create-order", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Failed to create order");
  }
  const data = await res.json() as { orderID: string };
  return data.orderID;
}

async function capturePaypalOrder(orderID: string) {
  const token = localStorage.getItem("coastaq_token");
  const res = await fetch("/api/subscription/capture-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderID }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Could not complete payment");
  }
  return res.json();
}

function SubmitCardButton({ onProcessing }: { onProcessing: (v: boolean) => void }) {
  const { cardFieldsForm } = usePayPalCardFields();

  const handlePay = async () => {
    onProcessing(true);
    try {
      await cardFieldsForm.submit();
    } catch {
      onProcessing(false);
    }
  };

  return (
    <Button
      className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm gap-2"
      onClick={handlePay}
    >
      <CreditCard className="w-4 h-4" />
      Pay $20.00
    </Button>
  );
}

type PaymentTab = "paypal" | "card";

function PaymentSection({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<PaymentTab>("paypal");
  const [cardProcessing, setCardProcessing] = useState(false);

  const handleApprove = async (data: { orderID: string }) => {
    try {
      const result = await capturePaypalOrder(data.orderID);
      qc.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      toast({
        title: "Subscription activated!",
        description: result.message ?? "Your seller subscription is now active.",
      });
      onSuccess();
    } catch (err: any) {
      setCardProcessing(false);
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: err.message || "Could not complete payment",
      });
    }
  };

  const handleError = (err: unknown) => {
    console.error("PayPal error:", err);
    setCardProcessing(false);
    toast({
      variant: "destructive",
      title: "Payment error",
      description: "Something went wrong. Please try again.",
    });
  };

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setActiveTab("paypal")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "paypal"
              ? "bg-primary text-white"
              : "bg-background text-muted-foreground hover:bg-secondary"
          }`}
        >
          PayPal
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("card")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-border ${
            activeTab === "card"
              ? "bg-primary text-white"
              : "bg-background text-muted-foreground hover:bg-secondary"
          }`}
        >
          Debit / Credit Card
        </button>
      </div>

      {/* PayPal tab */}
      {activeTab === "paypal" && (
        <div className="rounded-xl overflow-hidden">
          <PayPalButtons
            fundingSource={FUNDING.PAYPAL}
            style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 44 }}
            createOrder={createPaypalOrder}
            onApprove={handleApprove}
            onCancel={onCancel}
            onError={handleError}
          />
        </div>
      )}

      {/* Card tab */}
      {activeTab === "card" && (
        <PayPalCardFieldsProvider
          createOrder={createPaypalOrder}
          onApprove={handleApprove}
          onError={handleError}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Name on Card
              </label>
              <div className={FIELD_CLASS}>
                <PayPalNameField style={FIELD_STYLE} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Card Number
              </label>
              <div className={FIELD_CLASS}>
                <PayPalNumberField style={FIELD_STYLE} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Expiry Date
                </label>
                <div className={FIELD_CLASS}>
                  <PayPalExpiryField style={FIELD_STYLE} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  CVV
                </label>
                <div className={FIELD_CLASS}>
                  <PayPalCVVField style={FIELD_STYLE} />
                </div>
              </div>
            </div>

            {cardProcessing ? (
              <Button disabled className="w-full h-11 rounded-xl" >
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing…
              </Button>
            ) : (
              <SubmitCardButton onProcessing={setCardProcessing} />
            )}
          </div>
        </PayPalCardFieldsProvider>
      )}
    </div>
  );
}

function SubscriptionPanelInner({
  paypalReady,
  configLoading,
}: {
  paypalReady: boolean;
  configLoading: boolean;
}) {
  const { data: sub, isLoading } = useSubscriptionStatus();
  const { mutate: cancel, isPending: cancelling } = useCancelSubscription();
  const { toast } = useToast();
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-secondary rounded w-40 mb-3" />
        <div className="h-3 bg-secondary rounded w-64" />
      </div>
    );
  }

  if (!sub) return null;

  const handleCancel = () => {
    cancel(undefined as any, {
      onSuccess: () => {
        toast({ title: "Subscription cancelled", description: "Your subscription has been cancelled." });
        setShowCancelDialog(false);
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Cancellation failed", description: err.message });
      },
    });
  };

  const nextBilling = sub.subscriptionCurrentPeriodEnd
    ? new Date(sub.subscriptionCurrentPeriodEnd).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  const trialEnd = sub.trialEndsAt
    ? new Date(sub.trialEndsAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  return (
    <>
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold">Seller Subscription</h3>
              <StatusBadge status={sub.status} daysLeft={sub.trialDaysLeft} />
            </div>
            <p className="text-sm text-muted-foreground">
              {sub.status === "TRIAL" &&
                `Your 7-day free trial${trialEnd ? ` ends on ${trialEnd}` : ""}.`}
              {sub.status === "ACTIVE" && nextBilling &&
                `Next billing on ${nextBilling}.`}
              {sub.status === "EXPIRED" &&
                "Your subscription has expired. Renew to keep listing products."}
              {sub.status === "CANCELLED" &&
                "Your subscription is cancelled. Subscribe again to start selling."}
            </p>
          </div>

          <div className="flex-shrink-0 flex gap-2">
            {(sub.status === "EXPIRED" || sub.status === "CANCELLED" || sub.status === "TRIAL") && (
              <Button
                onClick={() => setShowPayDialog(true)}
                className="bg-primary text-white rounded-xl shadow-sm gap-2 h-9 text-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                {sub.status === "TRIAL" ? "Subscribe Now" : "Renew — $20/mo"}
              </Button>
            )}
            {sub.status === "ACTIVE" && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="rounded-xl h-9 text-sm text-muted-foreground"
              >
                Cancel Plan
              </Button>
            )}
          </div>
        </div>

        {sub.status === "TRIAL" && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Trial progress</span>
              <span>{sub.trialDaysLeft} of 7 days remaining</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((7 - sub.trialDaysLeft) / 7) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Included in your plan
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {PLAN_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-sm text-foreground/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-display">
              <Star className="w-5 h-5 text-primary" />
              Upgrade to Seller Pro
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-5">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
              <p className="text-4xl font-bold text-primary">$20</p>
              <p className="text-sm text-muted-foreground mt-1">
                per month · billed monthly · cancel anytime
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {PLAN_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            {configLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : paypalReady ? (
              <PaymentSection
                onSuccess={() => setShowPayDialog(false)}
                onCancel={() => setShowPayDialog(false)}
              />
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-sm text-amber-800">
                <AlertCircle className="w-5 h-5 mx-auto mb-2 text-amber-500" />
                PayPal payment is not configured. Please add your PayPal credentials in environment settings.
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              Secured by PayPal · Cancel anytime
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Cancel Subscription?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            Cancelling will stop your ability to list new products after the current billing period
            ends. Your existing listings will remain visible to buyers.
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 h-10 rounded-xl"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-10 rounded-xl"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? <Loader2 className="animate-spin w-4 h-4" /> : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SubscriptionPanel() {
  const { data: paypalConfig, isLoading: configLoading } = usePaypalConfig();

  const paypalReady =
    !configLoading && !!paypalConfig?.paypalConfigured && !!paypalConfig.paypalClientId;

  if (!paypalReady) {
    return <SubscriptionPanelInner paypalReady={false} configLoading={configLoading} />;
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalConfig!.paypalClientId!,
        currency: "USD",
        intent: "capture",
        components: "buttons,card-fields",
      }}
    >
      <SubscriptionPanelInner paypalReady={true} configLoading={false} />
    </PayPalScriptProvider>
  );
}

export function SubscriptionExpiredBanner({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-red-800">Subscription expired</p>
        <p className="text-sm text-red-700 mt-0.5">
          Your free trial or subscription has ended. Subscribe for $20/month to continue listing
          products and managing your shop.
        </p>
      </div>
      <Button
        size="sm"
        onClick={onSubscribe}
        className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white rounded-lg"
      >
        <RefreshCw className="w-3.5 h-3.5 mr-1" /> Renew
      </Button>
    </div>
  );
}
