import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { apiClient } from '../api/client.js';
import { categoryEmoji } from '../features/menu/categoryEmoji.js';
import TopBar from '../components/TopBar.jsx';
import {
  IconWallet,
  IconReceipt,
  IconCheckCircle,
  IconXCircle,
  IconBarChart,
  IconArrowUpRight,
  IconTrendUp,
} from '../components/icons.jsx';

function weekdayLabel(dateStr) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // Fixed at 7 days — only used here for the KPI cards' "vs yesterday" deltas
  // (trend[length-2]), which never need more than yesterday's slot. The
  // Revenue chart manages its own range independently (see RevenueChart).
  useEffect(() => {
    apiClient
      .get('/reports/dashboard-summary', { params: { trendDays: 7 } })
      .then(({ data }) => setSummary(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard'));
  }, []);

  // The only "vs previous period" comparisons shown anywhere on this page —
  // real, computed from yesterday's slot in the trend, never a placeholder stat.
  const yesterday = summary?.trend?.[summary.trend.length - 2];
  const revenueDelta =
    summary && yesterday && yesterday.totalSales > 0
      ? Math.round(((summary.today.totalSales - yesterday.totalSales) / yesterday.totalSales) * 100)
      : null;
  const orderCountDelta =
    summary && yesterday && yesterday.orderCount > 0
      ? Math.round(((summary.today.orderCount - yesterday.orderCount) / yesterday.orderCount) * 100)
      : null;
  const completedDelta =
    summary && summary.statusBreakdownYesterday.completed > 0
      ? Math.round(
          ((summary.statusBreakdown.completed - summary.statusBreakdownYesterday.completed) /
            summary.statusBreakdownYesterday.completed) *
            100
        )
      : null;
  const canceledDelta =
    summary && summary.statusBreakdownYesterday.voided > 0
      ? Math.round(
          ((summary.statusBreakdown.voided - summary.statusBreakdownYesterday.voided) /
            summary.statusBreakdownYesterday.voided) *
            100
        )
      : null;

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400">Today's snapshot, {summary?.date}</p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}
        {!summary && !error && <p className="mt-6 text-sm text-gray-400">Loading…</p>}

        {summary && (
          <>
            {/* One unified 5-column grid so POS Overview can genuinely span two
                rows on the right (starting level with the KPI cards and ending
                level with Popular Categories) — the 4 KPI cards only get 4 of
                those 5 columns, which is what makes them narrower than before.
                Grid auto-placement (plain DOM order) handles the rest: once POS
                Overview reserves column 5 for two rows, Revenue/Team/Categories
                fill columns 1-4 on row 2, and Popular Menu naturally lands in
                column 5 on row 3, beside Sales Breakdown + Order Activity. */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1.7143fr]">
              <KpiCard
                highlight
                icon={IconReceipt}
                label="Order Summary"
                value={summary.today.orderCount}
                delta={orderCountDelta}
                to="/orders"
              />
              <KpiCard
                icon={IconCheckCircle}
                label="Completed Orders"
                value={summary.statusBreakdown.completed}
                accent="bg-emerald-50 text-emerald-600"
                delta={completedDelta}
                to="/orders?status=completed"
              />
              <KpiCard
                icon={IconXCircle}
                label="Canceled Order"
                value={summary.statusBreakdown.voided}
                accent="bg-rose-50 text-rose-600"
                delta={canceledDelta}
                to="/orders?status=voided"
              />
              <KpiCard
                icon={IconWallet}
                label="Total Revenue"
                value={`€${summary.today.totalSales.toFixed(2)}`}
                accent="bg-amber-50 text-amber-600"
                delta={revenueDelta}
                to="/orders?status=paid"
              />
              {/* POS Overview + Popular Menu now share this column as one
                  spanning flex block, split 60/40 of its total height, instead
                  of each card's height being whatever its own grid row happens
                  to need. */}
              <div className="flex flex-col gap-4 xl:row-span-3">
                <div className="flex-3">
                  <PosOverview
                    today={summary.today}
                    tenderBreakdown={summary.tenderBreakdown}
                    delta={revenueDelta}
                  />
                </div>
                <div className="flex-2">
                  <PopularMenu item={summary.topItems[0]} />
                </div>
              </div>

              <div className="rounded-sm border border-gray-100 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-2">
                <div className="flex items-center gap-2">
                  <IconBarChart className="h-4 w-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Revenue</h2>
                </div>
                <RevenueChart />
              </div>

              <div className="flex flex-col gap-4 sm:col-span-2 xl:col-span-2">
                <StaffOverview
                  active={summary.totalEmployees}
                  inactive={summary.inactiveEmployees}
                />
                <PopularCategories
                  categories={summary.topCategories}
                  totalSales={summary.today.totalSales}
                />
              </div>

              <div className="sm:col-span-2 xl:col-span-1">
                <SalesBreakdown />
              </div>
              {/* Same card slot/size that used to hold Order Activity, then
                  Customer Map — content swapped again, now to a Popular Items
                  row (today's real top sellers, same data as the single-item
                  Popular Menu card elsewhere on this page). */}
              <div className="sm:col-span-2 xl:col-span-3">
                <PopularItems items={summary.topItems} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent, highlight, delta, to }) {
  const hasDelta = delta !== null && delta !== undefined;

  if (highlight) {
    return (
      <Link
        to={to}
        className="block rounded-sm bg-indigo-500 p-4 text-white shadow-sm transition hover:bg-indigo-600"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <p className="text-sm font-medium text-indigo-100">{label}</p>
        </div>
        <p className="mt-3 text-2xl font-bold">{value}</p>
        {hasDelta && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-xs font-semibold text-white">
            <IconTrendUp className={`h-3 w-3 ${delta < 0 ? 'rotate-180' : ''}`} />
            {delta >= 0 ? '+' : ''}
            {delta}% vs yesterday
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className="block rounded-sm border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      {hasDelta && (
        <span
          className={`mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
            delta >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          <IconTrendUp className={`h-3 w-3 ${delta < 0 ? 'rotate-180' : ''}`} />
          {delta >= 0 ? '+' : ''}
          {delta}% vs yesterday
        </span>
      )}
    </Link>
  );
}

function Donut({ segments, size = 112, strokeWidth = 11, centerLabel, centerValue }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  // Each arc's dash length and its starting offset (the sum of every prior
  // segment's dash) — computed with no mutable running total, since React's
  // stricter render-purity rules disallow reassigning a captured variable
  // anywhere in a component's render body, not just inside JSX-producing callbacks.
  const dashes = segments.map((seg) => (seg.value / total) * circumference);
  const arcs = segments.map((seg, i) => ({
    ...seg,
    dash: dashes[i],
    offset: dashes.slice(0, i).reduce((sum, d) => sum + d, 0),
  }));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {arcs.map((seg) => (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={-seg.offset}
            >
              <title>
                {seg.label}: {Math.round((seg.value / total) * 100)}%
              </title>
            </circle>
          ))}
        </g>
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-gray-900">{centerValue}</span>
          <span className="text-[10px] text-gray-400">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}

// A semicircle gauge — same pure-functional arc math as Donut, just over a
// 180° sweep (left to right along the top) instead of a full circle. Drawn as
// a full-size circle rotated so its first half traces that top arc, then
// cropped to just that half's height so it doesn't reserve a full circle's
// worth of vertical space for a shape that's only ever half-visible.
function HalfDonut({ segments, size = 150, strokeWidth = 13 }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const halfCircumference = circumference / 2;
  const cx = size / 2;
  const cy = size / 2;

  const dashes = segments.map((seg) => (seg.value / total) * halfCircumference);
  const arcs = segments.map((seg, i) => ({
    ...seg,
    dash: dashes[i],
    offset: dashes.slice(0, i).reduce((sum, d) => sum + d, 0),
  }));

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: size, height: size / 2 + strokeWidth / 2 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute left-0 top-0"
      >
        <g transform={`rotate(180 ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            strokeDasharray={`${halfCircumference} ${halfCircumference}`}
            strokeLinecap="round"
          />
          {arcs.map((seg) => (
            <circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={-seg.offset}
              strokeLinecap="round"
            >
              <title>
                {seg.label}: {seg.value}
              </title>
            </circle>
          ))}
        </g>
      </svg>
    </div>
  );
}

function PosOverview({ today, tenderBreakdown, delta }) {
  const entries = Object.entries(tenderBreakdown);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  const cashShare = total > 0 ? Math.round(((tenderBreakdown.cash || 0) / total) * 100) : 0;
  const hasDelta = delta !== null && delta !== undefined;

  return (
    <div className="flex h-full flex-col rounded-sm border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">POS Overview</h2>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-2xl font-bold text-gray-900">€{today.totalSales.toFixed(2)}</p>
        {hasDelta && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
              delta >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            <IconTrendUp className={`h-3 w-3 ${delta < 0 ? 'rotate-180' : ''}`} />
            {delta >= 0 ? '+' : ''}
            {delta}%
          </span>
        )}
      </div>
      <p className="flex items-center gap-1 text-xs text-gray-400">
        Total Sales <IconArrowUpRight className="h-3 w-3" />
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
        <div>
          <p className="text-[11px] text-gray-400">Total Bills</p>
          <p className="text-sm font-semibold text-gray-900">{today.orderCount}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">Avg Value</p>
          <p className="text-sm font-semibold text-gray-900">€{today.avgOrderValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-400">Peak Hour</p>
          <p className="text-sm font-semibold text-gray-900">{today.peakHour}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <p className="text-xs font-medium text-gray-500">Payment Method</p>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No payments recorded yet.</p>
        ) : (
          <div className="mt-2 flex items-center flex-col gap-4">
            <Donut
              segments={[
                { label: 'Cash', value: tenderBreakdown.cash || 0, color: '#6366f1' },
                { label: 'Card', value: tenderBreakdown.card || 0, color: '#10b981' },
              ]}
              centerValue={`${cashShare}%`}
              centerLabel="Cash"
            />
            <div
              className="space-y-1.5 text-xs flex 
            justify-between w-full items-center px-5"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Cash €
                {(tenderBreakdown.cash || 0).toFixed(2)}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" /> Card €
                {(tenderBreakdown.card || 0).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Absorbs whatever extra height the row-span-2 grid placement grants
          this card, so the button below sits near the bottom of the spanned
          area (roughly level with Popular Categories) instead of right after
          Payment Method regardless of how tall the card actually is. */}
      <div className="flex-1" />

      <Link
        to="/orders"
        className="mt-4 flex w-full items-center justify-center rounded-full bg-indigo-500 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
      >
        View Details
      </Link>
    </div>
  );
}

// Reference design shows a 3-way shift breakdown (on duty / on leave /
// absent), but this app has no shift/attendance tracking — only a staff
// member's active/inactive flag, shown here as Present/Absent. Matching the
// visual (half-donut gauge, top-right arrow, dot-legend rows) with the 2 real
// categories we actually have, rather than inventing a third status with no
// data behind it.
function StaffOverview({ active, inactive }) {
  const total = active + inactive;
  return (
    <div className="h-45 px-10 rounded-sm border border-gray-100 bg-white py-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Team Overview</h2>
        <IconArrowUpRight className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex justify-between items-center">
          <div className="mt-3 flex flex-col items-center">
            <p className="mt-1 pb-2 text-xs text-gray-400">Total Employees — {total}</p>
            <div className="mt-1 w-full space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#4f39f6]" />
                <span className="text-gray-600">Present</span>
                <span className="ml-auto font-semibold text-gray-900">{active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#10b981]" />
                <span className="text-gray-600">On Duty</span>
                <span className="ml-auto font-semibold text-gray-900">{active}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-300" />
                <span className="text-gray-600">Absent</span>
                <span className="ml-auto font-semibold text-gray-900">{inactive}</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <HalfDonut
            segments={[
              { label: 'Present', value: active, color: '#4f39f6' },
              { label: 'On Duty', value: active, color: '#10b981' },
              { label: 'Absent', value: inactive, color: '#e2e8f0' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function PopularCategories({ categories, totalSales }) {
  return (
    <div className="h-47.5 rounded-sm border border-gray-100 bg-white p-3 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Popular Categories</h2>
      {categories.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">No sales yet today.</p>
      ) : (
        <div className="mt-1 grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="relative flex h-30 w-full items-center justify-center overflow-hidden rounded-sm bg-gray-50 text-2xl"
            >
              {cat.imageUrl ? (
                <img
                  src={cat.imageUrl}
                  alt=""
                  className="h-full w-full object-cover aspect-video"
                />
              ) : (
                categoryEmoji(cat.name)
              )}
              <div className="absolute bottom-1.5 left-1.5 flex max-w-[calc(100%-12px)] items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <p className="truncate text-[10px] font-medium text-white">{cat.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {categories.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {categories.map((cat) => {
            const share = totalSales > 0 ? Math.round((cat.revenue / totalSales) * 100) : 0;
            return (
              <p key={cat.name} className="text-center text-xs font-semibold text-indigo-500">
                {share}%
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PopularMenu({ item }) {
  if (!item) {
    return (
      <div className="flex h-full flex-col rounded-sm border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Popular Menu</h2>
        <p className="mt-3 text-sm text-gray-400">No items sold yet today.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt="" className="h-56 w-full shrink-0 object-cover" />
      ) : (
        <div className="flex h-38.5 w-full shrink-0 items-center justify-center bg-gray-50 text-4xl">
          {categoryEmoji(item.name)}
        </div>
      )}
      <div className="flex flex-1 flex-col justify-center p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Popular Menu
        </h2>
        <p className="mt-1 text-sm font-semibold text-gray-900">{item.name}</p>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{item.quantity} orders today</span>
          <span className="text-sm font-bold text-indigo-500">€{item.revenue.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// Test/placeholder values, per explicit request — "Delivery" isn't a real
// order type in this POS yet (only dine_in/takeaway exist), so this card
// shows fixed sample percentages matching the reference design rather than a
// real computed split. Swap this out once delivery orders are a real concept.
const SALES_BREAKDOWN_TEST_DATA = [
  { label: 'Dine-in', pct: 40, color: 'bg-indigo-500' },
  { label: 'Delivery', pct: 35, color: 'bg-blue-400' },
];

function SalesBreakdown() {
  return (
    <div className="flex h-full flex-col rounded-sm border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Sales Breakdown</h2>
      <div className="mt-4 flex justify-between text-sm">
        {SALES_BREAKDOWN_TEST_DATA.map((seg) => (
          <div key={seg.label}>
            <p className="font-semibold text-gray-900">{seg.pct}%</p>
            <p className="text-xs text-gray-400">{seg.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-gray-100">
        {SALES_BREAKDOWN_TEST_DATA.map((seg) => (
          <div key={seg.label} className={seg.color} style={{ width: `${seg.pct}%` }} />
        ))}
      </div>
    </div>
  );
}

function PopularItems({ items }) {
  return (
    <div className="rounded-sm border border-gray-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Popular Items</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">No sales yet today.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.slice(0, 4).map((item) => (
            <div key={item.name} className="overflow-hidden rounded-lg border border-gray-100">
              <div className="flex h-20 w-full items-center justify-center bg-gray-50 text-3xl">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  categoryEmoji(item.name)
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium text-gray-900">{item.name}</p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-gray-400">{item.quantity} sold</span>
                  <span className="font-semibold text-indigo-500">€{item.revenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Smooth-through-points path using quadratic "T" shorthand — a lightweight
// curve without pulling in a charting library for a two-line comparison.
function smoothPathD(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x} ${last.y}`;
  return d;
}

const REVENUE_RANGE_OPTIONS = [
  { value: 'yesterday', label: 'Yesterday', shortLabel: 'Yesterday' },
  { value: '7', label: 'Last 7 days', shortLabel: '7D' },
  { value: '30', label: 'Last 30 days', shortLabel: '30D' },
  { value: '90', label: 'Last 90 days', shortLabel: '90D' },
];

function yesterdayDateString() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Two real lines, not a fabricated "cost" metric: this period's revenue vs the
// prior equal-length period, both computed server-side from the same closed
// orders — a genuine period-over-period comparison. Manages its own date
// range independently of the rest of the Dashboard (including "Yesterday" —
// a 7-day window ending yesterday instead of today), so switching ranges here
// never affects the KPI cards above.
function RevenueChart() {
  const [range, setRange] = useState('7');
  const [chartData, setChartData] = useState(null);
  const [chartError, setChartError] = useState(null);

  useEffect(() => {
    const params =
      range === 'yesterday'
        ? { trendDays: 7, date: yesterdayDateString() }
        : { trendDays: Number(range) };
    apiClient
      .get('/reports/dashboard-summary', { params })
      .then(({ data }) => setChartData({ trend: data.trend, previousTrend: data.previousTrend }))
      .catch((err) => setChartError(err.response?.data?.message || 'Could not load revenue trend'));
  }, [range]);

  const rangeSelect = (
    <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
      {REVENUE_RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setRange(opt.value)}
          title={opt.label}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
            range === opt.value ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {opt.shortLabel}
        </button>
      ))}
    </div>
  );

  if (chartError) {
    return (
      <div className="mt-4">
        <div className="flex justify-end">{rangeSelect}</div>
        <p className="mt-4 text-sm text-red-600">{chartError}</p>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="mt-4">
        <div className="flex justify-end">{rangeSelect}</div>
        <p className="mt-8 text-center text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  return (
    <RevenueChartBody
      trend={chartData.trend}
      previousTrend={chartData.previousTrend}
      rangeSelect={rangeSelect}
    />
  );
}

function RevenueChartBody({ trend, previousTrend, rangeSelect }) {
  const width = 640;
  const height = 220;
  const padX = 12;
  const padY = 30;
  const max = Math.max(
    1,
    ...trend.map((d) => d.totalSales),
    ...previousTrend.map((d) => d.totalSales),
    ...trend.map((d) => d.cost)
  );

  function toPoints(series, valueOf) {
    return series.map((day, i) => ({
      x: series.length > 1 ? padX + (i / (series.length - 1)) * (width - padX * 2) : width / 2,
      y: padY + (1 - valueOf(day) / max) * (height - padY * 2),
      day,
    }));
  }

  const currentPoints = toPoints(trend, (d) => d.totalSales);
  const previousPoints = toPoints(previousTrend, (d) => d.totalSales);
  const costPoints = toPoints(trend, (d) => d.cost);
  const peakIndex = trend.reduce(
    (best, d, i) => (d.totalSales > trend[best].totalSales ? i : best),
    0
  );
  const peakPoint = currentPoints[peakIndex];

  const labelStep = Math.max(1, Math.ceil(trend.length / 7));
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // Real, computed from the same admin-entered cost feeding the chart — never
  // a fabricated margin.
  const totalRevenue = trend.reduce((sum, d) => sum + d.totalSales, 0);
  const totalCost = trend.reduce((sum, d) => sum + d.cost, 0);
  const profit = totalRevenue - totalCost;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-500" /> This period
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Previous period
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> Cost
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500">
          Profit ({trend.length}d):{' '}
          <span className={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            €{profit.toFixed(2)}
          </span>
        </span>
        {rangeSelect}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-56 w-full overflow-visible">
        {gridLines.map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={padY + f * (height - padY * 2)}
            y2={padY + f * (height - padY * 2)}
            stroke="#f1f5f9"
            strokeWidth={1}
          />
        ))}
        <path
          d={smoothPathD(previousPoints)}
          fill="none"
          stroke="#fbbf24"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="5 4"
        />
        <path
          d={smoothPathD(costPoints)}
          fill="none"
          stroke="#f43f5e"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="1 4"
        />
        <path
          d={smoothPathD(currentPoints)}
          fill="none"
          stroke="#6366f1"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {currentPoints.map((p) => (
          <circle key={p.day.date} cx={p.x} cy={p.y} r={3} fill="#6366f1">
            <title>
              {p.day.date}: €{p.day.totalSales.toFixed(2)} revenue · €{p.day.cost.toFixed(2)} cost ·{' '}
              {p.day.orderCount} order(s)
            </title>
          </circle>
        ))}
        {peakPoint && (
          <g>
            <rect
              x={peakPoint.x - 30}
              y={peakPoint.y - 28}
              width={60}
              height={20}
              rx={6}
              fill="#111827"
            />
            <text
              x={peakPoint.x}
              y={peakPoint.y - 14}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="#fff"
            >
              €{peakPoint.day.totalSales.toFixed(0)}
            </text>
          </g>
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-gray-400">
        {trend.map((day, i) =>
          i % labelStep === 0 || i === trend.length - 1 ? (
            <span key={day.date}>
              {trend.length <= 7 ? weekdayLabel(day.date) : day.date.slice(5)}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}
