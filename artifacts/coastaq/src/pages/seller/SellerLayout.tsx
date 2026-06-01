import { useEffect, useState } from "react";
import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import {
  LayoutDashboard, Package, ShoppingBag, MessageCircle,
  DollarSign, CreditCard, Settings, Store, Megaphone,
  Upload, History, Truck, BarChart3, Flag, ShieldCheck, Star, FileText,
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
    /* ── Main ── */
    { href: "/seller",          label: "Overview",        icon: LayoutDashboard, exact: true, group: "Main" },
    { href: "/seller/products", label: "Products",        icon: Package,         group: "Main" },
    { href: "/seller/orders",   label: "Orders",          icon: ShoppingBag,     group: "Main" },
    { href: "/seller/messages", label: "Messages",        icon: MessageCircle,   badge: unread, group: "Main" },
    { href: "/seller/earnings", label: "Earnings",        icon: DollarSign,      group: "Main" },

    /* ── Shipping ── */
    { href: "/seller/shipping",        label: "Shipments",      icon: Truck,    group: "Shipping" },
    { href: "/seller/shipping/rates",  label: "Rates",          icon: BarChart3,group: "Shipping" },
    { href: "/seller/shipping/issues", label: "Delivery Issues",icon: Flag,     group: "Shipping" },

    /* ── Verification ── */
    { href: "/seller/verification",          label: "Verification", icon: ShieldCheck, group: "Trust" },
    { href: "/seller/verification/documents",label: "Documents",    icon: FileText,    group: "Trust" },
    { href: "/seller/trust-score",           label: "Trust Score",  icon: Star,        group: "Trust" },

    /* ── Tools ── */
    { href: "/seller/import",         label: "Bulk Import",    icon: Upload,   group: "Tools" },
    { href: "/seller/import/history", label: "Import History", icon: History,  group: "Tools" },
    { href: "/seller/campaigns",      label: "Campaigns",      icon: Megaphone,group: "Tools" },

    /* ── Account ── */
    { href: "/seller/subscription", label: "Subscription",  icon: CreditCard, group: "Account" },
    { href: "/seller/shop",         label: "Shop Settings", icon: Settings,   group: "Account" },
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
