import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtext?: string;
  trend?: { value: number; label: string };
}

export function StatCard({ label, value, icon: Icon, color = "bg-primary/10 text-primary", subtext, trend }: StatCardProps) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("p-3 rounded-xl shrink-0", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
        {trend && (
          <p className={cn("text-xs font-semibold mt-1", trend.value >= 0 ? "text-green-600" : "text-red-500")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}

interface StatGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
}

export function StatGrid({ children, cols = 4 }: StatGridProps) {
  const colClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[cols];
  return (
    <div className={cn("grid gap-4", colClass)}>
      {children}
    </div>
  );
}
