import { useEffect, useState } from "react";
import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import {
  LayoutDashboard, Package, ShoppingBag, MessageCircle,
  DollarSign, CreditCard, Settings, Store, Megaphone,
} from "lucide-react";

function useSellerUnread() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    fetch("/api/messages/conversations")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCount(d.reduce((s: number, c: any) => s + (c.unreadCount ?? 0), 0)); })
      .catch(() => {});
  }, []);
  return count;
}

export function SellerLayout({ children }: { children: React.ReactNode }) {
  const unread = useSellerUnread();

  const items: SidebarItem[] = [
    { href: "/seller",              label: "Overview",     icon: LayoutDashboard, exact: true },
    { href: "/seller/products",     label: "Products",     icon: Package },
    { href: "/seller/orders",       label: "Orders",       icon: ShoppingBag },
    { href: "/seller/messages",     label: "Messages",     icon: MessageCircle, badge: unread },
    { href: "/seller/earnings",     label: "Earnings",     icon: DollarSign },
    { href: "/seller/campaigns",    label: "Campaigns",    icon: Megaphone },
    { href: "/seller/subscription", label: "Subscription", icon: CreditCard },
    { href: "/seller/shop",         label: "Shop Settings", icon: Settings },
  ];

  return (
    <DashboardLayout
      title="Seller Hub"
      titleIcon={Store}
      items={items}
      accentColor="bg-green-600"
    >
      {children}
    </DashboardLayout>
  );
}
