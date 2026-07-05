import { useState } from "react";
import { formatDual } from "@/lib/currency";

const WIDTH = 720;
const HEIGHT = 220;
const PAD_X = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

// Single-series revenue-over-time: a line + area chart. No legend needed
// (the section title already names the one series) but it does get a
// hover crosshair + tooltip, per the usual "line/area always gets hover"
// rule for anything more than a bare stat tile.
export default function RevenueChart({ byDay }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const maxRevenue = Math.max(1, ...byDay.map((d) => d.revenue));
  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = byDay.length > 1 ? plotWidth / (byDay.length - 1) : 0;

  const points = byDay.map((d, i) => ({
    x: PAD_X + i * stepX,
    y: PAD_TOP + plotHeight - (d.revenue / maxRevenue) * plotHeight,
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? PAD_X} ${PAD_TOP + plotHeight} L ${PAD_X} ${PAD_TOP + plotHeight} Z`;

  // Recessive horizontal reference lines at 0%, 50%, 100% of the max.
  const gridLines = [0, 0.5, 1].map((f) => PAD_TOP + plotHeight * (1 - f));

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - x);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {gridLines.map((y, i) => (
          <line key={i} x1={PAD_X} y1={y} x2={WIDTH - PAD_X} y2={y} stroke="var(--muted-foreground)" strokeOpacity={0.2} strokeWidth={1} />
        ))}

        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-rust)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-rust)" stopOpacity={0} />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#revenueFill)" stroke="none" />
        <path d={linePath} fill="none" stroke="var(--color-rust)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hovered && (
          <line x1={hovered.x} y1={PAD_TOP} x2={hovered.x} y2={PAD_TOP + plotHeight} stroke="var(--color-rust)" strokeOpacity={0.4} strokeWidth={1} />
        )}

        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={p.x}
            cy={p.y}
            r={hoverIndex === i ? 4.5 : 3}
            fill="var(--card)"
            stroke="var(--color-rust)"
            strokeWidth={2}
          />
        ))}

        {/* Every-other date label along the baseline to avoid crowding. */}
        {points.map((p, i) =>
          i % 2 === 0 ? (
            <text key={p.date} x={p.x} y={HEIGHT - 8} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
              {p.date.slice(5)}
            </text>
          ) : null
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 -translate-x-1/2 rounded-md border border-line/40 bg-card px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: `${(hovered.x / WIDTH) * 100}%` }}
        >
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{hovered.date}</p>
          <p className="font-display font-bold text-ink">{formatDual(hovered.revenue)}</p>
        </div>
      )}
    </div>
  );
}
