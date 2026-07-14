/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';

import { apiClient } from '../../api/client.js';
import { downloadCsv } from '../../utils/csv.js';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconSliders,
} from '../../components/icons.jsx';

// Splits a bucket's real daily sales into 3 equal-length groups (thirds of
// the period) and sums each — a genuine sub-breakdown of that same bucket,
// never a fabricated extra metric. Falls back to [0,0,0] until day-level
// data has loaded.
function thirdsOf(days, from, to) {
  const inRange = (days || []).filter((d) => d.date >= from && d.date <= to);
  if (inRange.length === 0) return [0, 0, 0];
  const size = Math.ceil(inRange.length / 3);
  return [inRange.slice(0, size), inRange.slice(size, size * 2), inRange.slice(size * 2)].map(
    (group) => Math.round(group.reduce((sum, d) => sum + d.totalSales, 0) * 100) / 100
  );
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

// Steps a bucket's start date forward/back by whole granularity units —
// always anchored on a period's *start* (day 1 for month/year, never the
// last day) so month/year arithmetic can't overflow into the wrong month.
function addPeriod(dateStr, granularity, count) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (granularity === 'day') date.setUTCDate(date.getUTCDate() + count);
  else if (granularity === 'week') date.setUTCDate(date.getUTCDate() + count * 7);
  else if (granularity === 'month') date.setUTCMonth(date.getUTCMonth() + count);
  else date.setUTCFullYear(date.getUTCFullYear() + count);
  return date;
}

function bucketLabel(date, granularity) {
  if (granularity === 'year') return String(date.getUTCFullYear());
  if (granularity === 'month')
    return date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return isoDate(date).slice(5);
}

// A window of real buckets centered on `centerIndex` — real history on the
// "before" side; on the "after" side, real buckets when they exist (the
// active one isn't necessarily the most recent), otherwise honest zero-value
// placeholders for periods that simply haven't happened yet (never
// fabricated non-zero data), so the active period always lands in the
// middle instead of sliding to an edge once "today" is reached. Each point
// carries the real `report.buckets` index it came from (`realIndex`), or
// `null` for a synthesized future placeholder — callers use that to decide
// what's clickable/hoverable.
function centeredBucketWindow(buckets, centerIndex, granularity, before = 3, after = 3) {
  const result = [];
  for (let i = centerIndex - before; i <= centerIndex; i += 1) {
    if (i >= 0 && i < buckets.length) result.push({ ...buckets[i], realIndex: i });
  }
  const last = buckets[buckets.length - 1];
  for (let i = 1; i <= after; i += 1) {
    const idx = centerIndex + i;
    if (idx < buckets.length) {
      result.push({ ...buckets[idx], realIndex: idx });
    } else {
      const offset = idx - (buckets.length - 1);
      const date = addPeriod(last.from, granularity, offset);
      result.push({
        key: `future-${offset}`,
        label: bucketLabel(date, granularity),
        orderCount: 0,
        totalSales: 0,
        cost: 0,
        profit: 0,
        realIndex: null,
      });
    }
  }
  return result;
}

// Every granularity windows the timeline the same way: the current day/week/
// month/year is always centered and active, 3 real periods before it, 3
// after (real when they exist, honest zero-value placeholders once "today"
// is reached) — with prev/next paging through each granularity's fetched
// pool.
const MAIN_WINDOW_CONFIG = {
  day: { before: 3, after: 3 },
  week: { before: 3, after: 3 },
  month: { before: 3, after: 3 },
  year: { before: 3, after: 3 },
};

function minutesAgoLabel(fetchedAt, now) {
  if (!fetchedAt) return '';
  const minutes = Math.max(0, Math.round((now - fetchedAt) / 60000));
  if (minutes === 0) return 'Data updated: just now';
  return `Data updated: ${minutes} min ago`;
}

// Faithful recreation of the reference "Performance timeline" widget — one
// cluster per bucket (day/week/month/year, whichever the Sales Report picker
// is on), each split into 3 real sub-period pills, with a popup — pinned on
// whichever period is active, following the hover otherwise — showing a
// real bar+line graph (Sales/Cost bars, Profit line) centered on that
// period, plus two real actions (View Details opens the day-by-day
// drilldown; Export CSV downloads that period's breakdown).
export default function PerformanceTimeline({ report, periodLabel, onSelectPeriod }) {
  const [dayData, setDayData] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Resets the pinned selection whenever a new report comes in (granularity
  // switch, custom range, ...) — the "derive state from a prop change during
  // render" pattern React recommends in place of a setState-in-effect, so a
  // stale index from the previous granularity's bucket list never lingers.
  const [reportForActiveIndex, setReportForActiveIndex] = useState(report);
  if (report !== reportForActiveIndex) {
    setReportForActiveIndex(report);
    setActiveIndex(null);
  }

  useEffect(() => {
    if (!report) return;
    apiClient
      .get('/reports/sales-by-day', { params: { from: report.from, to: report.to } })
      .then(({ data }) => {
        setDayData(data.days);
        setFetchedAt(Date.now());
      })
      .catch(() => setDayData(null));
  }, [report]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!report) return null;

  const lastRealIndex = report.buckets.length - 1;
  const focusIndex = activeIndex ?? lastRealIndex;

  const windowConfig = MAIN_WINDOW_CONFIG[report.granularity];
  const visiblePoints = windowConfig
    ? centeredBucketWindow(
        report.buckets,
        focusIndex,
        report.granularity,
        windowConfig.before,
        windowConfig.after
      )
    : report.buckets.map((bucket, i) => ({ ...bucket, realIndex: i }));

  function goToPrevious() {
    setActiveIndex(Math.max(0, focusIndex - 1));
  }
  function goToNext() {
    setActiveIndex(Math.min(lastRealIndex, focusIndex + 1));
  }

  function exportBucket(bucket) {
    const days = (dayData || []).filter((d) => d.date >= bucket.from && d.date <= bucket.to);
    downloadCsv(
      `${bucket.label}-${bucket.from}-to-${bucket.to}.csv`,
      ['Date', 'Orders', 'Sales', 'Cost', 'Profit'],
      days.map((d) => [
        d.date,
        d.orderCount,
        d.totalSales.toFixed(2),
        d.cost.toFixed(2),
        d.profit.toFixed(2),
      ])
    );
  }

  return (
    <div className="rounded-sm border  border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div className="text-base text-gray-900 flex">
          <p>Performance timeline</p>
          <p>{periodLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{minutesAgoLabel(fetchedAt, now)}</span>
        </div>
      </div>

      <div className="mt-6  pt-40 pb-5 flex items-top  justify-center   gap-2">
        <button
          type="button"
          onClick={goToPrevious}
          disabled={focusIndex <= 0}
          className=" flex h-7 w-7 shrink-0 items-center 
          justify-center rounded-full border border-gray-200
           text-gray-400 hover:bg-gray-50 
           disabled:cursor-not-allowed disabled:opacity-30
            disabled:hover:bg-transparent mt-1"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>
        <div className="w-full ">
          <div className="flex flex-1 items-start justify-between gap-1 border border-gray-200 rounded-full bg-gray-50 px-10 py-1">
            {visiblePoints.map((point) => {
              const thirds = thirdsOf(dayData, point.from, point.to);
              const max = Math.max(1, ...thirds);
              const isRealPoint = point.realIndex != null;
              const isActive = isRealPoint && point.realIndex === focusIndex;
              const isHovered = isRealPoint && point.realIndex === hoveredIndex;
              return (
                <div
                  key={point.key}
                  className={`relative flex flex-col items-center gap-2 ${isRealPoint ? 'cursor-pointer' : 'cursor-default'} ${
                    isActive
                      ? 'z-10 -my-14 py-10 rounded-xl border border-gray-200 width-full bg-white px-3  shadow-sm'
                      : ''
                  }`}
                  onMouseEnter={() => isRealPoint && setHoveredIndex(point.realIndex)}
                  onMouseLeave={() =>
                    isRealPoint && setHoveredIndex((h) => (h === point.realIndex ? null : h))
                  }
                  onClick={() => isRealPoint && setActiveIndex(point.realIndex)}
                >
                  {/* Click pins the full two-card popup (Sales/Profit + Graph/Actions);
                    hovering any OTHER period only shows the lightweight Sales/Profit
                    preview, never the graph — matches the reference's two-popup layout. */}
                  {isActive && (
                    <ActivePopup
                      bucket={point}
                      points={centeredBucketWindow(
                        report.buckets,
                        point.realIndex,
                        report.granularity
                      )}
                      onSelectPeriod={() => onSelectPeriod(point)}
                      onExport={() => exportBucket(point)}
                    />
                  )}
                  {isHovered && !isActive && (
                    <SalesProfitCard bucket={point} onClick={() => onSelectPeriod(point)} />
                  )}
                  {/* <div className="flex items-center gap-0.5 text-[11px] bg-red-600 text-gray-400">
                  {point.orderCount}
                  <IconChevronDown className="h-3 w-3" />
                </div> */}
                  <div className="w-full ">
                    <div className="flex items-center gap-1  rounded-md border  border-gray-200 p-1">
                      {thirds.map((v, j) => (
                        <span
                          key={j}
                          className={`h-4 w-6 rounded-md ${
                            v <= 0
                              ? 'border border-gray-200 bg-white'
                              : v === max
                                ? 'bg-indigo-500'
                                : 'bg-indigo-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex flex-1  items-start justify-between gap-1  px-4 py-1">
            {visiblePoints.map((point) => {
              const isRealPoint = point.realIndex != null;
              const isActive = isRealPoint && point.realIndex === focusIndex;
              return (
                <div
                  key={point.key}
                  className={`relative  w-full  flex flex-col justify-center items-center gap-3 ${isRealPoint ? 'cursor-pointer' : 'cursor-default'} ${
                    isActive ? 'z-10 -my-1  ' : ''
                  }`}
                  // onMouseEnter={() => isRealPoint && setHoveredIndex(point.realIndex)}
                  // onMouseLeave={() =>
                  //   isRealPoint && setHoveredIndex((h) => (h === point.realIndex ? null : h))
                  // }
                  onClick={() => isRealPoint && setActiveIndex(point.realIndex)}
                >
                  <div className="flex items-center justify-center w-full text-center  gap-2 text-xs  text-gray-400">
                    {point.label}
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-indigo-500 ' : 'border border-gray-300'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={goToNext}
          disabled={focusIndex >= lastRealIndex}
          className="flex h-7 w-7 shrink-0 mt-1 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 flex justify-center items-center text-center gap-x-24 ">
        <div>
          <p className="text-xs  text-black font-bold">Total Profit</p>
          <p className="mt-1 text-2xl font-bold text-indigo-500">
            €{report.totals.profit.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-black font-bold">Total Sales</p>
          <p className="mt-1 text-2xl font-bold text-indigo-500">
            €{report.totals.totalSales.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Just the Sales/Profit rows, unstyled by position — reused as-is inside
// ActivePopup's side-by-side layout, and wrapped in its own floating box by
// SalesProfitCard for the hover-only preview below.
function SalesProfitRows({ bucket, onClick }) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <span className="block text-xs text-gray-400">Sales</span>
          <span className="block text-sm font-bold text-gray-900">
            €{bucket.totalSales.toFixed(2)}
          </span>
        </span>
        <IconChevronRight className="h-3 w-3 shrink-0 text-gray-300" />
      </button>
      <div className="border-t border-gray-100" />
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <span className="block text-xs text-gray-400">Profit</span>
          <span
            className={`block text-sm font-bold ${bucket.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            €{bucket.profit.toFixed(2)}
          </span>
        </span>
        <IconChevronRight className="h-3 w-3 shrink-0 text-gray-300" />
      </button>
    </>
  );
}

// Two separate cards, side by side, matching the reference's layout exactly
// — a bordered Sales/Profit card, and a second bordered card holding the
// graph plus the two real actions. Shown only once the period is clicked
// (see SalesProfitCard below for the lightweight hover-only preview).
function ActivePopup({ bucket, points, onSelectPeriod, onExport }) {
  return (
    <div className="absolute bottom-full left-1/2 z-20 mb-3 flex -translate-x-1/2 items-start gap-2">
      <div className="w-36 space-y-2 rounded-sm border border-gray-100 bg-white p-3 shadow-lg">
        <SalesProfitRows bucket={bucket} onClick={onSelectPeriod} />
      </div>
      <div className="w-56 rounded-sm border border-gray-100 bg-white p-3 shadow-lg">
        <ComboChart points={points} activeKey={bucket.key} />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectPeriod}
            className="flex-1 rounded-md bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-100"
          >
            View Details
          </button>
          <button
            type="button"
            onClick={onExport}
            className="flex-1 rounded-md bg-gray-50 px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}

// The lightweight preview shown on hover for any period that isn't the
// active/clicked one — just the real Sales/Profit numbers, no graph.
function SalesProfitCard({ bucket, onClick }) {
  return (
    <div className="absolute bottom-full left-1/2 z-20 mb-3 w-36 -translate-x-1/2 space-y-2 rounded-sm border border-gray-100 bg-white p-3 shadow-lg">
      <SalesProfitRows bucket={bucket} onClick={onClick} />
    </div>
  );
}

// Sales/Cost bars + a Profit line with circle markers, matching the
// reference's bar+line combo look — the centered `points` window (real
// history either side, honest zero placeholders for not-yet-happened
// periods) plotted with the active period in the middle. Hovering a column
// highlights it and shows its exact real numbers.
export function ComboChart({ points, activeKey }) {
  const [hoveredKey, setHoveredKey] = useState(null);
  const width = 220;
  const height = 70;
  const padX = 8;
  const padY = 10;
  const n = points.length;
  const slot = n > 0 ? (width - padX * 2) / n : 0;
  const barWidth = Math.min(14, slot * 0.32);
  const maxVal = Math.max(1, ...points.map((p) => Math.max(p.totalSales, p.cost)));

  function x(i) {
    return padX + i * slot + slot / 2;
  }
  function barHeight(val) {
    return Math.max(2, (val / maxVal) * (height - padY * 2));
  }
  function lineY(val) {
    const clamped = Math.max(0, Math.min(maxVal, val));
    return height - padY - (clamped / maxVal) * (height - padY * 2);
  }

  const linePoints = points.map((p, i) => `${x(i)},${lineY(p.profit)}`).join(' ');
  const hovered = points.find((p) => p.key === hoveredKey);

  return (
    <div className="relative">
      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm bg-gray-900 px-1.5 py-1 text-[10px] font-medium text-white"
          style={{ left: `${((points.indexOf(hovered) + 0.5) / n) * 100}%`, top: -4 }}
        >
          {hovered.label} · Sales €{hovered.totalSales.toFixed(2)} · Profit €
          {hovered.profit.toFixed(2)}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full overflow-visible">
        {points.map((p, i) => {
          const isHovered = p.key === hoveredKey;
          const isActive = p.key === activeKey;
          return (
            <g
              key={p.key}
              onMouseEnter={() => setHoveredKey(p.key)}
              onMouseLeave={() => setHoveredKey((h) => (h === p.key ? null : h))}
              className="cursor-default"
            >
              <rect
                x={x(i) - barWidth}
                y={height - padY - barHeight(p.totalSales)}
                width={barWidth / 2 - 1}
                height={barHeight(p.totalSales)}
                rx={1.5}
                fill={isHovered ? '#4f46e5' : '#6366f1'}
              />
              <rect
                x={x(i) - barWidth / 2 + 1}
                y={height - padY - barHeight(p.cost)}
                width={barWidth / 2 - 1}
                height={barHeight(p.cost)}
                rx={1.5}
                fill={isHovered ? '#818cf8' : '#a5b4fc'}
              />
              {isActive && (
                <rect
                  x={x(i) - slot / 2}
                  y={0}
                  width={slot}
                  height={height}
                  fill="#6366f1"
                  opacity={0.06}
                />
              )}
              <rect x={x(i) - slot / 2} y={0} width={slot} height={height} fill="transparent" />
            </g>
          );
        })}
        <polyline points={linePoints} fill="none" stroke="#10b981" strokeWidth={1.5} />
        {points.map((p, i) => (
          <circle
            key={`dot-${p.key}`}
            cx={x(i)}
            cy={lineY(p.profit)}
            r={p.key === hoveredKey ? 3.5 : 2.5}
            fill="white"
            stroke="#10b981"
            strokeWidth={1.5}
            className="pointer-events-none"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] text-gray-400">
        {points.map((p) => (
          <span key={p.key} className={p.key === activeKey ? 'font-semibold text-indigo-500' : ''}>
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
