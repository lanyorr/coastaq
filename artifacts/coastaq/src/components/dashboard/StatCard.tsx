import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtext?: string;
  trend?: { value: number; label: string };
  highlight?: boolean;
}

const COLOR_MAP: Record<string, { iconBg: string; iconColor: string; accent: string }> = {
  green:  { iconBg: "#dcfce7", iconColor: "#16a34a", accent: "#16a34a" },
  blue:   { iconBg: "#dbeafe", iconColor: "#2563eb", accent: "#2563eb" },
  purple: { iconBg: "#ede9fe", iconColor: "#7c3aed", accent: "#7c3aed" },
  orange: { iconBg: "#ffedd5", iconColor: "#ea580c", accent: "#ea580c" },
  yellow: { iconBg: "#fef9c3", iconColor: "#ca8a04", accent: "#ca8a04" },
  rose:   { iconBg: "#ffe4e6", iconColor: "#e11d48", accent: "#e11d48" },
  cyan:   { iconBg: "#cffafe", iconColor: "#0891b2", accent: "#0891b2" },
  teal:   { iconBg: "#ccfbf1", iconColor: "#0d9488", accent: "#0d9488" },
};

function parseColorKey(color: string): keyof typeof COLOR_MAP {
  if (color.includes("green") || color.includes("emerald")) return "green";
  if (color.includes("blue"))   return "blue";
  if (color.includes("purple") || color.includes("violet")) return "purple";
  if (color.includes("orange")) return "orange";
  if (color.includes("yellow") || color.includes("amber"))  return "yellow";
  if (color.includes("rose") || color.includes("red"))      return "rose";
  if (color.includes("cyan"))   return "cyan";
  if (color.includes("teal"))   return "teal";
  return "blue";
}

export function StatCard({
  label, value, icon: Icon,
  color = "bg-blue-100 text-blue-600",
  subtext, trend, highlight = false,
}: StatCardProps) {
  const key = parseColorKey(color);
  const cfg = COLOR_MAP[key];

  return (
    <div
      className="bg-white p-4 flex items-center gap-4"
      style={{
        border: highlight ? `1px solid ${cfg.accent}40` : "1px solid #e5e7eb",
        borderRadius: "4px",
        borderLeft: highlight ? `3px solid ${cfg.accent}` : "1px solid #e5e7eb",
      }}
    >
      <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded"
        style={{ background: cfg.iconBg }}>
        <Icon className="w-4 h-4" style={{ color: cfg.iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
          {trend && (
            <span className={cn(
              "flex items-center gap-0.5 text-xs font-semibold",
              trend.value >= 0 ? "text-emerald-600" : "text-red-500",
            )}>
              {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {subtext && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtext}</p>}
        {trend && <p className="text-[10px] text-gray-400 mt-0.5">{trend.label}</p>}
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
    <div className={cn("grid gap-3", colClass)}>
      {children}
    </div>
  );
}

export function LightTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded px-3 py-2 bg-white shadow-md" style={{ border: "1px solid #e5e7eb", minWidth: 100 }}>
      {label !== undefined && <p className="text-xs mb-1 text-gray-500">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-gray-900">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

/** @deprecated use LightTooltip */
export function DarkTooltip(props: any) { return <LightTooltip {...props} />; }
