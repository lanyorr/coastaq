import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface SubscriptionInfo {
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  isActive: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  subscriptionCurrentPeriodEnd: string | null;
  planPrice: number;
  message?: string;
}

async function fetchSubscriptionStatus(): Promise<SubscriptionInfo> {
  const res = await fetch("/api/subscription/status");
  if (!res.ok) throw new Error("Failed to fetch subscription status");
  return res.json();
}

async function activateSubscription(): Promise<SubscriptionInfo & { message: string }> {
  const res = await fetch("/api/subscription/activate", { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Activation failed");
  }
  return res.json();
}

async function cancelSubscription(): Promise<SubscriptionInfo & { message: string }> {
  const res = await fetch("/api/subscription/cancel", { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Cancellation failed");
  }
  return res.json();
}

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ["/api/subscription/status"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 60_000,
  });
}

export function useActivateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activateSubscription,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/subscription/status"] }),
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/subscription/status"] }),
  });
}
