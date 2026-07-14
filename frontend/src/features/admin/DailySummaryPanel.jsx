import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client.js';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DailySummaryPanel() {
  const [date, setDate] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get('/reports/daily-summary', { params: { date } })
      .then(({ data }) => {
        setSummary(data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load summary'));
  }, [date]);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500">Date</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mt-1 rounded-md border border-gray-300 px-2 py-1"
      />

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {summary && (
        <div className="mt-4 max-w-sm space-y-3">
          <div className="rounded border border-gray-200 p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Orders</span>
              <span className="font-medium text-gray-900">{summary.orderCount}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-600">
              <span>Total sales</span>
              <span className="font-medium text-gray-900">€{summary.totalSales.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-600">
              <span>Tax collected</span>
              <span className="font-medium text-gray-900">€{summary.taxCollected.toFixed(2)}</span>
            </div>
          </div>

          <div className="rounded border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Tender Breakdown</h3>
            {Object.keys(summary.tenderBreakdown).length === 0 ? (
              <p className="mt-2 text-sm text-gray-400">No payments recorded.</p>
            ) : (
              Object.entries(summary.tenderBreakdown).map(([method, amount]) => (
                <div key={method} className="mt-2 flex justify-between text-sm text-gray-600 capitalize">
                  <span>{method}</span>
                  <span className="font-medium text-gray-900">€{amount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
