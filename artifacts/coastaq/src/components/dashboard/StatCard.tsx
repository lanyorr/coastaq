import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  color?: string;
  subtext?: string;
  trend?: { value: number; label: string };
  prefix?: string;
  highlight?: boolean;
}

const COLOR_MAP: Record<string, { icon: string; glow: string; border: string }> = {
  green:  { icon: "text-emerald-400", glow: "rgba(52,211,153,0.12)", border: "#34d399" },
  blue:   { icon: "text-blue-400",    glow: "rgba(96,165,250,0.12)", border: "#60a5fa" },
  purple: { icon: "text-violet-400",  glow: "rgba(167,139,250,0.12)", border: "#a78bfa" },
  orange: { icon: "text-orange-400",  glow: "rgba(251,146,60,0.12)",  border: "#fb923c" },
  yellow: { icon: "text-yellow-400",  glow: "rgba(250,204,21,0.12)",  border: "#facc15" },
  rose:   { icon: "text-rose-400",    glow: "rgba(251,113,133,0.12)", border: "#fb7185" },
  cyan:   { icon: "text-cyan-400",    glow: "rgba(34,211,238,0.12)",  border: "#22d3ee" },
  teal:   { icon: "text-teal-400",    glow: "rgba(45,212,191,0.12)",  border: "#2dd4bf" },
};

function parseColorKey(color: string): keyof typeof COLOR_MAP {
  if (color.includes("green"))  return "green";
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
      className="relative rounded-2xl p-5 flex flex-col gap-3 overflow-hidden transition-all hover:translate-y-[-1px]"
      style={{
        background: highlight ? `linear-gradient(135deg, ${cfg.glow.replace("0.12", "0.25")}, rgba(9,20,37,0.9))` : "#0d1d3d",
        border: `1px solid #173069`,
        boxShadow: highlight ? `0 0 0 1px ${cfg.border}30, 0 4px 24px ${cfg.glow}` : "0 1px 3px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="p-2.5 rounded-xl"
          style={{ background: cfg.glow }}
        >
          <Icon className={cn("w-5 h-5", cfg.icon)} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg",
            trend.value >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#64748b]">{label}</p>
        <p className="text-[28px] font-bold text-white mt-0.5 leading-none tracking-tight">{value}</p>
        {subtext && (
          <p className="text-xs text-[#64748b] mt-1.5 font-medium">{subtext}</p>
        )}
        {trend && (
          <p className="text-xs text-[#64748b] mt-1">{trend.label}</p>
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
