import { useEffect, useState } from 'react';

import { apiClient } from '../../api/client.js';
import { downloadCsv } from '../../utils/csv.js';
import { IconDownload } from '../../components/icons.jsx';
import DateRangeFilterButton from '../../components/DateRangeFilterButton.jsx';
import PerformanceTimeline from './PerformanceTimeline.jsx';
import PeriodDrilldownModal from './PeriodDrilldownModal.jsx';
import ItemSalesChart from './ItemSalesChart.jsx';

const GRANULARITIES = [
  { value: 'day', label: 'Daily', unit: 'day' },
  { value: 'week', label: 'Weekly', unit: 'week' },
  { value: 'month', label: 'Monthly', unit: 'month' },
  { value: 'year', label: 'Yearly', unit: 'year' },
];

// How many periods the timeline actually shows at once — every granularity
// windows down to 7 (3 either side of the centered, active current period)
// from its fetched pool, paged via prev/next.
const VISIBLE_COUNT = { day: 7, week: 7, month: 7, year: 7 };

// One unified Sales Report — a Daily/Weekly/Monthly/Yearly picker decides how
// the same underlying orders are bucketed (via GET /reports/sales-report),
// with an optional exact-date-range override from the calendar picker.
export default function SalesReportPanel() {
  const [granularity, setGranularity] = useState('day');
  const [customRange, setCustomRange] = useState(null);
  const [report, setReport] = useState(null);
  const [itemReport, setItemReport] = useState(null);
  const [menuItems, setMenuItems] = useState(null);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // The active menu list, fetched once — used to fill in real zero-sale
  // entries on the item chart (an item with no orders this period is
  // genuinely at 0, not absent) rather than only ever showing items that
  // happened to sell.
  useEffect(() => {
    apiClient
      .get('/admin/menu-items')
      .then(({ data }) => setMenuItems(data.filter((m) => m.active)))
      .catch(() => setMenuItems([]));
  }, []);

  useEffect(() => {
    const params = { granularity };
    if (customRange) {
      params.from = customRange.from;
      params.to = customRange.to;
    }
    apiClient
      .get('/reports/sales-report', { params })
      .then(({ data }) => {
        setReport(data);
        setError(null);
        return apiClient.get('/reports/sales-by-item', {
          params: { from: data.from, to: data.to },
        });
      })
      .then(({ data }) => setItemReport(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load report'));
  }, [granularity, customRange]);

  function exportCsv() {
    if (!report) return;
    downloadCsv(
      `sales-report-${granularity}-${report.from}-to-${report.to}.csv`,
      ['Period', 'Orders', 'Sales', 'Cost', 'Profit'],
      report.buckets.map((b) => [
        b.label,
        b.orderCount,
        b.totalSales.toFixed(2),
        b.cost.toFixed(2),
        b.profit.toFixed(2),
      ])
    );
  }

  // Every active menu item appears on the chart — one that genuinely had no
  // orders this period is a real 0, not an absent bar, so it isn't just
  // silently dropped because it never showed up in itemReport.items.
  const chartItems =
    itemReport && menuItems
      ? [
          ...itemReport.items,
          ...menuItems
            .filter((m) => !itemReport.items.some((i) => i.name === m.name))
            .map((m) => ({ name: m.name, revenue: 0, quantity: 0, share: 0 })),
        ]
      : itemReport?.items;

  const displayFrom = customRange?.from ?? report?.from;
  const displayTo = customRange?.to ?? report?.to;
  const unit = GRANULARITIES.find((g) => g.value === granularity)?.unit;
  const visibleCount = VISIBLE_COUNT[granularity] ?? report?.buckets.length ?? 0;
  const periodLabel = report ? `over ${visibleCount} ${unit}${visibleCount === 1 ? '' : 's'}` : '';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Sales Analytics</h2>
          <p className="text-xs text-gray-400">
            Click a period on the timeline for a day-by-day breakdown.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
            {GRANULARITIES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGranularity(g.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  granularity === g.value
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          {/* {displayFrom && displayTo && (
            <DateRangeFilterButton
              from={displayFrom}
              to={displayTo}
              onChange={(from, to) => setCustomRange({ from, to })}
            />
          )} */}
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <IconDownload className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {report && (
        <>
          <div className="mt-4">
            <PerformanceTimeline
              report={report}
              periodLabel={periodLabel}
              onSelectPeriod={(b) => setSelectedPeriod(b)}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Item-based Sales Report</h3>
              {!chartItems || chartItems.length === 0 ? (
                <p className="mt-2 text-sm text-gray-400">No menu items to report on.</p>
              ) : (
                <ItemSalesChart items={chartItems} />
              )}
            </div>

            <div className="rounded-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Top Items</h3>
              {!itemReport || itemReport.items.length === 0 ? (
                <p className="mt-2 text-sm text-gray-400">No item sales in this window.</p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {itemReport.items.slice(0, 4).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3 text-sm">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-semibold text-indigo-600">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-gray-900">
                        {item.name}
                      </span>
                      <span className="shrink-0 font-semibold text-gray-900">
                        €{item.revenue.toFixed(2)}
                      </span>
                      <span className="w-10 shrink-0 text-right text-xs text-gray-400">
                        {item.share}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {selectedPeriod && (
        <PeriodDrilldownModal period={selectedPeriod} onClose={() => setSelectedPeriod(null)} />
      )}
    </div>
  );
}
