import { useEffect, useState } from 'react';

import { apiClient } from '../../api/client.js';
import { downloadCsv } from '../../utils/csv.js';
import { IconDownload } from '../../components/icons.jsx';

const GRANULARITIES = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

// A plain tabular Sales Report — the same real bucketed totals the Sales
// Analytics timeline uses (GET /reports/sales-report), just laid out as one
// row per period instead of a chart, for a quick scannable/export-first view.
export default function SalesReportTablePanel() {
  const [granularity, setGranularity] = useState('day');
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get('/reports/sales-report', { params: { granularity } })
      .then(({ data }) => {
        setReport(data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load report'));
  }, [granularity]);

  function exportCsv() {
    if (!report) return;
    downloadCsv(
      `sales-report-${granularity}-${report.from}-to-${report.to}.csv`,
      ['Period', 'Orders', 'Sales', 'Cost', 'Profit'],
      report.buckets.map((b) => [b.label, b.orderCount, b.totalSales.toFixed(2), b.cost.toFixed(2), b.profit.toFixed(2)])
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Sales Report</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
            {GRANULARITIES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGranularity(g.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  granularity === g.value ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <IconDownload className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {report && (
        <div className="mt-4 overflow-x-auto rounded-sm border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-400">
                <th className="px-4 py-2.5 font-medium">Period</th>
                <th className="px-4 py-2.5 font-medium">Orders</th>
                <th className="px-4 py-2.5 font-medium">Sales</th>
                <th className="px-4 py-2.5 font-medium">Cost</th>
                <th className="px-4 py-2.5 font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {report.buckets.map((b) => (
                <tr key={b.key} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{b.label}</td>
                  <td className="px-4 py-2.5 text-gray-600">{b.orderCount}</td>
                  <td className="px-4 py-2.5 text-gray-900">€{b.totalSales.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-gray-600">€{b.cost.toFixed(2)}</td>
                  <td className={`px-4 py-2.5 font-medium ${b.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    €{b.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
