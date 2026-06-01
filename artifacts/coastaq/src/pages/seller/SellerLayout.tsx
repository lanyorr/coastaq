import { useEffect, useState } from "react";
import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import {
  LayoutDashboard, Package, ShoppingBag, MessageCircle,
  DollarSign, CreditCard, Settings, Store, Megaphone,
  Upload, History, Truck, BarChart3, Flag,
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
    { href: "/seller",                label: "Overview",       icon: LayoutDashboard, exact: true },
    { href: "/seller/products",       label: "Products",       icon: Package },
    { href: "/seller/orders",         label: "Orders",         icon: ShoppingBag },
    { href: "/seller/messages",       label: "Messages",       icon: MessageCircle, badge: unread },
    { href: "/seller/earnings",       label: "Earnings",       icon: DollarSign },
    { href: "/seller/shipping",       label: "Shipping",       icon: Truck },
    { href: "/seller/shipping/rates", label: "Ship Rates",     icon: BarChart3 },
    { href: "/seller/shipping/issues",label: "Delivery Issues",icon: Flag },
    { href: "/seller/import",         label: "Bulk Import",    icon: Upload },
    { href: "/seller/import/history", label: "Import History", icon: History },
    { href: "/seller/campaigns",      label: "Campaigns",      icon: Megaphone },
    { href: "/seller/subscription",   label: "Subscription",   icon: CreditCard },
    { href: "/seller/shop",           label: "Shop Settings",  icon: Settings },
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
