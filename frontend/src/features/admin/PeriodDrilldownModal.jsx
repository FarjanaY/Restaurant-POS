import { useEffect, useState } from 'react';

import { apiClient } from '../../api/client.js';
import { IconX } from '../../components/icons.jsx';
import { ComboChart } from './PerformanceTimeline.jsx';

function dayLabel(dateStr, dayCount) {
  return dayCount <= 10
    ? new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', timeZone: 'UTC' })
    : dateStr.slice(5);
}

// Opened by clicking a bucket on Sales Report's timeline (day/week/month/year
// alike) — a fixed day-by-day breakdown for that exact bucket. No range
// picker in here — the only date picker lives beside the Download button on
// the main Sales Report header.
export default function PeriodDrilldownModal({ period, onClose }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get('/reports/sales-by-day', { params: { from: period.from, to: period.to } })
      .then(({ data }) => {
        setReport(data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load breakdown'));
  }, [period.from, period.to]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-sm bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {period.label} — €{period.totalSales.toFixed(2)}
            </h2>
            <p className="text-sm text-gray-500">
              Profit €{period.profit.toFixed(2)} · {period.orderCount} orders
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-4 min-w-0 rounded-sm border border-gray-100 p-4">
          {report && (
            <>
              <ComboChart
                points={report.days.map((d) => ({
                  ...d,
                  key: d.date,
                  label: dayLabel(d.date, report.days.length),
                }))}
              />
              <p className="mt-2 text-xs text-gray-400">
                {period.from} – {period.to} · {report.totals.orderCount} orders · €{report.totals.totalSales.toFixed(2)}
              </p>
            </>
          )}
        </div>

        {report && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <SalesDetailStat label="Sales" value={`€${report.totals.totalSales.toFixed(2)}`} />
            <SalesDetailStat label="Cost" value={`€${report.totals.cost.toFixed(2)}`} />
            <SalesDetailStat
              label="Profit"
              value={`€${report.totals.profit.toFixed(2)}`}
              tone={report.totals.profit >= 0 ? 'positive' : 'negative'}
            />
            <SalesDetailStat label="Orders" value={report.totals.orderCount} />
            <SalesDetailStat
              label="Avg order value"
              value={`€${(report.totals.orderCount > 0 ? report.totals.totalSales / report.totals.orderCount : 0).toFixed(2)}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SalesDetailStat({ label, value, tone }) {
  return (
    <div className="rounded-sm border border-gray-100 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p
        className={`mt-1 text-sm font-bold ${
          tone === 'positive' ? 'text-emerald-600' : tone === 'negative' ? 'text-rose-600' : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
