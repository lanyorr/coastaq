import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import {
  LayoutDashboard, Link2, DollarSign, BarChart2,
  Ticket, Megaphone, Settings, TrendingUp,
} from "lucide-react";

export function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const items: SidebarItem[] = [
    { href: "/affiliate",             label: "Overview",    icon: LayoutDashboard, exact: true },

    { href: "/affiliate/analytics",   label: "Analytics",   icon: BarChart2,  group: "Performance" },
    { href: "/affiliate/commissions", label: "Commissions", icon: TrendingUp, group: "Performance" },
    { href: "/affiliate/payouts",     label: "Payouts",     icon: DollarSign, group: "Performance" },

    { href: "/affiliate/links",       label: "My Links",    icon: Link2,     group: "Marketing" },
    { href: "/affiliate/coupons",     label: "Coupons",     icon: Ticket,    group: "Marketing" },
    { href: "/affiliate/campaigns",   label: "Campaigns",   icon: Megaphone, group: "Marketing" },

    { href: "/affiliate/settings",    label: "Settings",    icon: Settings,  group: "Account" },
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
