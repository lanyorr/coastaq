import { useEffect, useState } from "react";
import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import {
  LayoutDashboard, ShoppingBag, MessageCircle,
  Heart, Settings, User,
} from "lucide-react";

function useUnreadCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    fetch("/api/messages/conversations")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setCount(d.reduce((s: number, c: any) => s + (c.unreadCount ?? 0), 0));
      })
      .catch(() => {});
  }, []);
  return count;
}

export function AccountLayout({ children }: { children: React.ReactNode }) {
  const unread = useUnreadCount();

  const items: SidebarItem[] = [
    { href: "/account",          label: "Overview",  icon: LayoutDashboard, exact: true },
    { href: "/account/orders",   label: "Orders",    icon: ShoppingBag },
    { href: "/account/messages", label: "Messages",  icon: MessageCircle, badge: unread },
    { href: "/account/saved",    label: "Saved",     icon: Heart },
    { href: "/account/settings", label: "Settings",  icon: Settings },
  ];

  return (
    <DashboardLayout
      title="My Account"
      titleIcon={User}
      items={items}
      accentColor="bg-primary"
    >
      {children}
    </DashboardLayout>
  );
}
