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

export interface PaypalConfig {
  paypalClientId: string | null;
  paypalConfigured: boolean;
  mode: "sandbox" | "live";
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("coastaq_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchSubscriptionStatus(): Promise<SubscriptionInfo> {
  const res = await fetch("/api/subscription/status", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch subscription status");
  return res.json();
}

async function fetchPaypalConfig(): Promise<PaypalConfig> {
  const res = await fetch("/api/subscription/config");
  if (!res.ok) throw new Error("Failed to fetch PayPal config");
  return res.json();
}

async function cancelSubscription(): Promise<SubscriptionInfo & { message: string }> {
  const res = await fetch("/api/subscription/cancel", {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || "Cancellation failed");
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

export function usePaypalConfig() {
  return useQuery({
    queryKey: ["/api/subscription/config"],
    queryFn: fetchPaypalConfig,
    staleTime: 300_000,
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/subscription/status"] }),
  });
}
