import { useEffect, useState } from 'react';

import { apiClient } from '../../api/client.js';
import { downloadCsv } from '../../utils/csv.js';
import { todayYmd, addDays } from '../../utils/dateRange.js';
import { categoryEmoji } from '../menu/categoryEmoji.js';
import { IconDownload } from '../../components/icons.jsx';
import DateRangeFilterButton from '../../components/DateRangeFilterButton.jsx';
import ReportStatCard from './ReportStatCard.jsx';

export default function ItemSalesReportPanel() {
  const today = todayYmd();
  const [range, setRange] = useState({ from: addDays(today, -6), to: today });
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get('/reports/sales-by-item', { params: { from: range.from, to: range.to } })
      .then(({ data }) => {
        setReport(data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load report'));
  }, [range.from, range.to]);

  function exportCsv() {
    if (!report) return;
    downloadCsv(
      `item-sales-report-${range.from}-to-${range.to}.csv`,
      ['Item', 'Quantity Sold', 'Revenue', 'Share %'],
      report.items.map((item) => [item.name, item.quantity, item.revenue.toFixed(2), item.share])
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Item-based Sales Report</h2>
          <p className="text-xs text-gray-400">Which menu items sold best in the selected range.</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilterButton from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} />
          <button
            type="button"
            onClick={exportCsv}
            disabled={!report}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconDownload className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {report && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReportStatCard label="Items Sold" value={report.totals.quantity} />
            <ReportStatCard label="Total Revenue" value={`€${report.totals.revenue.toFixed(2)}`} />
          </div>

          {report.items.length === 0 ? (
            <p className="mt-5 text-sm text-gray-400">No sales in this range.</p>
          ) : (
            <div className="mt-5 space-y-2">
              {report.items.map((item) => (
                <div key={item.name} className="flex items-center gap-3 rounded-sm border border-gray-100 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-xl">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      categoryEmoji(item.name)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${item.share}%` }} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="font-semibold text-gray-900">€{item.revenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">
                      {item.quantity} sold · {item.share}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
