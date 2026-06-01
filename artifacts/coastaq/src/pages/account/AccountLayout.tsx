import { useEffect, useState } from "react";
import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import {
  LayoutDashboard, ShoppingBag, MessageCircle,
  Heart, Settings, User, MapPin,
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
    { href: "/account",            label: "Overview",   icon: LayoutDashboard, exact: true, group: "Dashboard" },
    { href: "/account/orders",     label: "Orders",     icon: ShoppingBag,    group: "Shopping" },
    { href: "/account/saved",      label: "Wishlist",   icon: Heart,          group: "Shopping" },
    { href: "/account/messages",   label: "Messages",   icon: MessageCircle,  badge: unread, group: "Communication" },
    { href: "/account/addresses",  label: "Addresses",  icon: MapPin,         group: "Account" },
    { href: "/account/settings",   label: "Settings",   icon: Settings,       group: "Account" },
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
