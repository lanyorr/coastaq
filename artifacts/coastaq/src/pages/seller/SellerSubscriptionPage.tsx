import { SellerLayout } from "./SellerLayout";
import { SubscriptionPanel } from "@/components/subscription/SubscriptionPanel";

export default function SellerSubscriptionPage() {
  return (
    <SellerLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Subscription</h1>
      <SubscriptionPanel />
    </SellerLayout>
  );
}
