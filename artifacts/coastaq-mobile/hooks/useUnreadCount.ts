import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  unreadCount?: number;
}

export function useUnreadCount(): number {
  const { token } = useAuth();

  const { data } = useQuery<Conversation[]>({
    queryKey: ["conversations", "unread"],
    enabled: !!token,
    refetchInterval: 30000,
    queryFn: async () => {
      const res = await fetch(
        `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/messages/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (!data || !Array.isArray(data)) return 0;
  return data.reduce((sum: number, c: Conversation) => sum + (c.unreadCount ?? 0), 0);
}
