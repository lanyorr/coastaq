interface CoastaqLogoProps {
  iconSize?: number;
  textSize?: number;
  gap?: number;
  textColor?: string;
}

export function CoastaqLogo({ iconSize = 36, textSize = 20, gap = 10, textColor = "#1a2332" }: CoastaqLogoProps) {
  const r = iconSize / 2;
  const cx = r;
  const cy = r;
  const arcR = iconSize * 0.22;
  const sw = iconSize * 0.155;

  const gradId = `cq-teal-${iconSize}`;

  // "C" facing south-west: gap between 6 o'clock and 9 o'clock (SW quadrant)
  // Arc goes from 6 o'clock (bottom) → right → top → 9 o'clock (left), CCW, 270°
  const startX = cx;           // 6 o'clock
  const startY = cy + arcR;
  const endX = cx - arcR;     // 9 o'clock
  const endY = cy;
  // sweep-flag=0 (CCW in SVG), large-arc=1 → goes via right+top = 270° arc

  return (
    <div style={{ display: "flex", alignItems: "center", gap, background: "transparent" }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox={`0 0 ${iconSize} ${iconSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2={iconSize} y2={iconSize} gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#38d4e8" />
            <stop offset="50%"  stopColor="#1bbcd6" />
            <stop offset="100%" stopColor="#0e9fc4" />
          </linearGradient>
        </defs>

        {/* Teal gradient circle */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />

        {/* White C — 270° arc, opening at SW, clean rounded ends, no arrowhead */}
        <path
          d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 1 0 ${endX} ${endY}`}
          stroke="white"
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      <span
        style={{
          fontWeight: 700,
          fontSize: textSize,
          color: textColor,
          letterSpacing: "-0.3px",
          fontFamily: "inherit",
          lineHeight: 1,
          background: "transparent",
        }}
      >
        Coastaq
      </span>
    </div>
  );
}
