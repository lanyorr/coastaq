import { DashboardLayout, type SidebarItem } from "@/components/dashboard/DashboardLayout";
import { LayoutDashboard, Link2, DollarSign } from "lucide-react";

export function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const items: SidebarItem[] = [
    { href: "/affiliate",             label: "Overview",    icon: LayoutDashboard, exact: true },
    { href: "/affiliate/links",       label: "My Links",    icon: Link2 },
    { href: "/affiliate/commissions", label: "Commissions", icon: DollarSign },
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
