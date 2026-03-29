interface CoastaqLogoProps {
  iconSize?: number;
  textSize?: number;
  gap?: number;
}

export function CoastaqLogo({ iconSize = 36, textSize = 20, gap = 10 }: CoastaqLogoProps) {
  const r = iconSize / 2;
  const arcR = iconSize * 0.278;
  const cx = r;
  const cy = r;

  const startX = cx + arcR;
  const startY = cy;
  const endX = cx;
  const endY = cy - arcR;

  const arrowTipX = endX + arcR * 0.38;
  const arrowTipY = endY + arcR * 0.25;
  const arrow1X = endX + arcR * 0.06;
  const arrow1Y = endY - arcR * 0.32;
  const arrow2X = endX + arcR * 0.06;
  const arrow2Y = endY + arcR * 0.5;

  const gradId = `cq-grad-${iconSize}`;

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
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* Gradient circle */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />

        {/* 270° clockwise arc: right → bottom → left → top */}
        <path
          d={`M${startX} ${startY} A${arcR} ${arcR} 0 1 1 ${endX} ${endY}`}
          stroke="white"
          strokeWidth={iconSize * 0.072}
          strokeLinecap="round"
          fill="none"
        />

        {/* Arrowhead at the end of arc, pointing in clockwise direction */}
        <path
          d={`M${arrow1X} ${arrow1Y} L${arrowTipX} ${arrowTipY} L${arrow2X} ${arrow2Y}`}
          stroke="white"
          strokeWidth={iconSize * 0.065}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      <span
        style={{
          fontWeight: 700,
          fontSize: textSize,
          color: "#0f172a",
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
