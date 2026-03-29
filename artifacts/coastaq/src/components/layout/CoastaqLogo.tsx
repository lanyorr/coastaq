interface CoastaqLogoProps {
  iconSize?: number;
  textSize?: number;
  gap?: number;
}

export function CoastaqLogo({ iconSize = 36, textSize = 20, gap = 10 }: CoastaqLogoProps) {
  const r = iconSize / 2;
  const cx = r;
  const cy = r;
  const arcR = iconSize * 0.285;
  const sw = iconSize * 0.075;

  const gradId = `cq-teal-${iconSize}`;

  // Counterclockwise 270° arc: starts at right (3 o'clock), sweeps CCW
  // through top (12), left (9), ends at bottom (6 o'clock)
  const startX = cx + arcR;   // 3 o'clock
  const startY = cy;
  const endX = cx;            // 6 o'clock
  const endY = cy + arcR;

  // Arrowhead at end (bottom / 6 o'clock), tangent points LEFT (CCW direction)
  const aLen = arcR * 0.48;
  const aW   = arcR * 0.30;
  // tip is at the end point; the two arms are up-right and down-right
  const tipX  = endX;
  const tipY  = endY;
  const arm1X = endX + aLen;
  const arm1Y = endY - aW;
  const arm2X = endX + aLen;
  const arm2Y = endY + aW;

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
          {/* Teal-to-blue gradient matching the reference image */}
          <linearGradient id={gradId} x1="0" y1="0" x2={iconSize} y2={iconSize} gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#38d4e8" />
            <stop offset="50%"  stopColor="#1bbcd6" />
            <stop offset="100%" stopColor="#0e9fc4" />
          </linearGradient>
        </defs>

        {/* Circle */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />

        {/* 270° counterclockwise arc: right → top → left → bottom */}
        <path
          d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 1 0 ${endX} ${endY}`}
          stroke="white"
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
        />

        {/* Arrowhead at bottom (6 o'clock), pointing left (CCW tangent) */}
        <polyline
          points={`${arm1X},${arm1Y} ${tipX},${tipY} ${arm2X},${arm2Y}`}
          stroke="white"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      <span
        style={{
          fontWeight: 700,
          fontSize: textSize,
          color: "#1a2332",
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
