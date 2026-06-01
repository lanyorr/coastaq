import { cn } from "@/lib/utils";

interface SellerBadgeProps {
  level: "basic" | "verified" | "premium" | "enterprise";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const BADGE_CONFIG = {
  basic:      { label: "Basic Seller",    emoji: "🏷️",  bg: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "rgba(148,163,184,0.25)" },
  verified:   { label: "Verified Seller", emoji: "✅",  bg: "rgba(37,99,235,0.12)",   color: "#2563eb", border: "rgba(37,99,235,0.25)"   },
  premium:    { label: "Premium Merchant",emoji: "⭐",  bg: "rgba(139,92,246,0.12)",  color: "#8b5cf6", border: "rgba(139,92,246,0.25)"  },
  enterprise: { label: "Enterprise Store",emoji: "💎",  bg: "rgba(245,158,11,0.12)",  color: "#f59e0b", border: "rgba(245,158,11,0.25)"  },
};

const SIZE_CONFIG = {
  sm: { px: "px-2 py-0.5", text: "text-[10px]", emoji: "text-xs" },
  md: { px: "px-2.5 py-1", text: "text-xs",     emoji: "text-sm" },
  lg: { px: "px-3 py-1.5", text: "text-sm",     emoji: "text-base" },
};

export function SellerBadge({ level = "basic", size = "md", showLabel = true, className }: SellerBadgeProps) {
  const cfg = BADGE_CONFIG[level] ?? BADGE_CONFIG.basic;
  const sz  = SIZE_CONFIG[size];

  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap", sz.px, className)}
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      <span className={sz.emoji}>{cfg.emoji}</span>
      {showLabel && <span className={sz.text}>{cfg.label}</span>}
    </span>
  );
}

export function TrustScoreBar({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const color = score >= 85 ? "#10b981" : score >= 70 ? "#2563eb" : score >= 40 ? "#eab308" : "#ef4444";
  const h = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className="w-full">
      <div className={cn("w-full rounded-full bg-white/10", h)}>
        <div className={cn("h-full rounded-full transition-all duration-500", h)}
          style={{ width: `${Math.min(score, 100)}%`, background: color }} />
      </div>
    </div>
  );
}
