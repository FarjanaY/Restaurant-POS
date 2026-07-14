import { useState } from 'react';

function truncateLabel(name) {
  return name.length > 8 ? `${name.slice(0, 7)}…` : name;
}

// Smooth quadratic curve through a list of [x,y] coords — a lightweight,
// dependency-free stand-in for a proper spline, close enough to read as a
// smooth line at this size.
function smoothPath(coords) {
  if (coords.length < 2) return '';
  let d = `M${coords[0][0]},${coords[0][1]}`;
  for (let i = 1; i < coords.length; i += 1) {
    const [x0, y0] = coords[i - 1];
    const [x1, y1] = coords[i];
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    d += ` Q${x0},${y0} ${midX},${midY}`;
  }
  const [lastX, lastY] = coords[coords.length - 1];
  d += ` L${lastX},${lastY}`;
  return d;
}

const SERIES = [
  { key: 'revenue', label: 'Revenue', color: '#6366f1', format: (v) => `€${v.toFixed(2)}` },
  { key: 'quantity', label: 'Quantity', color: '#f97316', format: (v) => `${v} sold` },
  { key: 'share', label: 'Percentage', color: '#22c55e', format: (v) => `${v}%` },
];

// Three real per-item metrics (revenue, quantity sold, share of revenue) as
// smooth lines across the top items by revenue — each normalized against its
// own max so all three read on the same plot despite different units (€,
// count, %); the hover tooltip always shows the real, un-normalized values.
// The y-axis is labeled in quantity (the units the quantity line plots
// directly against); revenue/share still render on the same plot area via
// their own normalization, readable exactly via the hover tooltip.
export default function ItemSalesChart({ items }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const points = items;
  // A fixed, wide aspect ratio — independent of item count — so the CSS
  // aspect-ratio below stretches this to fill the now-full-width card
  // without distorting the circles/lines (which `preserveAspectRatio="none"`
  // would do). More items just get a smaller slice of this same width,
  // exactly like any fixed-width chart with a varying category count.
  const width = 600;
  const height = 60;
  const padLeft = 16;
  const padRight = 8;
  const padTop = 6;
  const padBottom = 8;
  const n = points.length;
  // Data points start a few units right of the y-axis line itself — sitting
  // exactly on the axis made the first item's dots hard to tell apart from
  // the axis/tick label next to them.
  const plotStart = padLeft + 6;
  const plotWidth = width - plotStart - padRight;
  const slot = n > 1 ? plotWidth / (n - 1) : 0;

  // Fixed 0-100 quantity scale (0/20/40/60/80/100 ticks) rather than one
  // computed from the data's own max — a stable axis instead of one that
  // reshuffles its tick values every time the numbers change.
  const maxByKey = {
    revenue: Math.max(1, ...points.map((p) => p.revenue)),
    quantity: 100,
    share: 100,
  };
  const quantityTicks = [0, 20, 40, 60, 80, 100];

  function x(i) {
    return n > 1 ? plotStart + i * slot : plotStart + plotWidth / 2;
  }
  function y(value, key) {
    const ratio = value / maxByKey[key];
    return height - padBottom - ratio * (height - padTop - padBottom);
  }

  const hovered = hoveredIndex != null ? points[hoveredIndex] : null;

  if (n === 0) return null;

  return (
    <div className="relative mt-2">
      <div className="flex items-center gap-3 text-[10px] text-gray-400">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-sm border border-gray-100 bg-white px-2.5 py-1.5 shadow-lg"
          style={{
            left: `${(x(hoveredIndex) / width) * 100}%`,
            top: 14,
            // Center on middle points, but anchor from the edge instead of
            // centering for the first/last point — otherwise the tooltip
            // spills past the card and ends up covering the very point
            // you're hovering to identify.
            transform: hoveredIndex === 0 ? 'translateX(0)' : hoveredIndex === n - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
          }}
        >
          <p className="text-[10px] text-gray-400">{hovered.name}</p>
          {SERIES.map((s) => (
            <p key={s.key} className="text-[11px] font-semibold" style={{ color: s.color }}>
              {s.format(hovered[s.key])}
            </p>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-1 w-full overflow-visible"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {hoveredIndex != null && (
          <rect
            x={x(hoveredIndex) - slot / 2}
            y={0}
            width={n > 1 ? slot : plotWidth}
            height={height}
            fill="#22c55e"
            opacity={0.08}
          />
        )}

        {/* Y axis (quantity scale) + X axis lines, with quantity tick labels — no axis title text. */}
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} stroke="#e5e7eb" strokeWidth={1} />
        <line
          x1={padLeft}
          y1={height - padBottom}
          x2={width - padRight}
          y2={height - padBottom}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        {quantityTicks.map((tick) => (
          <text
            key={tick}
            x={padLeft - 3}
            y={y(tick, 'quantity') + 2.5}
            textAnchor="end"
            fontSize="6"
            fill="#9ca3af"
          >
            {tick}
          </text>
        ))}

        {SERIES.map((s) => (
          <path
            key={s.key}
            d={smoothPath(points.map((p, i) => [x(i), y(p[s.key], s.key)]))}
            fill="none"
            stroke={s.color}
            strokeWidth={1.75}
          />
        ))}
        {SERIES.map((s) =>
          points.map((p, i) => (
            <circle
              key={`${s.key}-${p.name}`}
              cx={x(i)}
              cy={y(p[s.key], s.key)}
              r={i === hoveredIndex ? 3.5 : 2.5}
              fill="white"
              stroke={s.color}
              strokeWidth={1.5}
            />
          ))
        )}
        {points.map((p, i) => (
          <rect
            key={`hit-${p.name}`}
            x={x(i) - slot / 2}
            y={0}
            width={n > 1 ? slot : plotWidth}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex((h) => (h === i ? null : h))}
            className="cursor-default"
          />
        ))}
      </svg>

      <div className="mt-1 flex justify-between pl-4 text-[9px] text-gray-400">
        {points.map((p, i) => (
          <span key={p.name} title={p.name} className={i === hoveredIndex ? 'font-semibold text-gray-600' : ''}>
            {truncateLabel(p.name)}
          </span>
        ))}
      </div>
    </div>
  );
}
