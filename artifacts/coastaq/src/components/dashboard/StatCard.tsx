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

const COLOR_MAP: Record<string, { icon: string; hex: string; glow: string }> = {
  green:  { icon: "text-emerald-400", hex: "#10b981", glow: "rgba(16,185,129,0.15)" },
  blue:   { icon: "text-blue-400",    hex: "#2563eb", glow: "rgba(37,99,235,0.15)"  },
  purple: { icon: "text-violet-400",  hex: "#7c3aed", glow: "rgba(124,58,237,0.15)" },
  orange: { icon: "text-orange-400",  hex: "#f97316", glow: "rgba(249,115,22,0.15)" },
  yellow: { icon: "text-yellow-400",  hex: "#eab308", glow: "rgba(234,179,8,0.15)"  },
  rose:   { icon: "text-rose-400",    hex: "#f43f5e", glow: "rgba(244,63,94,0.15)"  },
  cyan:   { icon: "text-cyan-400",    hex: "#06b6d4", glow: "rgba(6,182,212,0.15)"  },
  teal:   { icon: "text-teal-400",    hex: "#14b8a6", glow: "rgba(20,184,166,0.15)" },
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
      className="rounded-2xl p-6 flex flex-col gap-2 transition-all hover:translate-y-[-2px]"
      style={{
        background: "#1a1040",
        border: "1px solid #281850",
        borderTop: `3px solid ${cfg.hex}`,
        boxShadow: highlight ? `0 4px 32px ${cfg.glow}` : "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      {/* Icon + trend row */}
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl" style={{ background: cfg.glow }}>
          <Icon className={cn("w-5 h-5", cfg.icon)} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
            trend.value >= 0 ? "text-emerald-400" : "text-red-400",
          )} style={{ background: trend.value >= 0 ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.12)" }}>
            {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-5xl font-extrabold text-white leading-none tracking-tight mt-1">{value}</p>

      {/* Label */}
      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#7b80b5" }}>{label}</p>

      {/* Subtext */}
      {subtext && (
        <p className="text-xs font-medium" style={{ color: cfg.hex }}>{subtext}</p>
      )}
      {trend && (
        <p className="text-xs" style={{ color: "#5b6090" }}>{trend.label}</p>
      )}
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

/* Dark tooltip for recharts */
export function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: "#1a1040", border: "1px solid #281850", minWidth: 100 }}>
      {label !== undefined && <p className="text-xs mb-1.5 font-medium" style={{ color: "#7b80b5" }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.fill || p.color || "#fff" }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}
