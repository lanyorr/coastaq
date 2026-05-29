import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import { LayoutDashboard, Link2, DollarSign, BarChart2, Ticket, Megaphone, Settings } from "lucide-react";

export function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const items: SidebarItem[] = [
    { href: "/affiliate",             label: "Overview",    icon: LayoutDashboard, exact: true },
    { href: "/affiliate/analytics",   label: "Analytics",   icon: BarChart2 },
    { href: "/affiliate/links",       label: "My Links",    icon: Link2 },
    { href: "/affiliate/commissions", label: "Commissions", icon: DollarSign },
    { href: "/affiliate/payouts",     label: "Payouts",     icon: DollarSign },
    { href: "/affiliate/coupons",     label: "Coupons",     icon: Ticket },
    { href: "/affiliate/campaigns",   label: "Campaigns",   icon: Megaphone },
    { href: "/affiliate/settings",    label: "Settings",    icon: Settings },
  ];

  return (
    <DashboardLayout
      title="Affiliate Hub"
      titleIcon={Link2}
      items={items}
      accentColor="bg-purple-600"
    >
      {children}
    </DashboardLayout>
  );
}
