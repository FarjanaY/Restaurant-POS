import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { apiClient } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import Drawer from '../components/Drawer.jsx';
import OrderDetail, { STATUS_BADGE, formatDateTime } from '../features/orders/OrderDetail.jsx';
import { useListLayout } from '../hooks/useListLayout.js';
import {
  IconSearch,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconReceipt,
} from '../components/icons.jsx';

const STATUS_OPTIONS = ['all', 'open', 'held', 'paid', 'completed', 'voided'];
const TYPE_OPTIONS = ['all', 'dine_in', 'takeaway'];
const PAGE_SIZE = 20;
const EXPORT_PAGE_SIZE = 200; // capped server-side; export pages through this in a loop

const initialFilters = { status: 'all', type: 'all', dateFrom: '', dateTo: '', search: '' };

export default function OrdersPage() {
  const listLayout = useListLayout('orders');
  // The Dashboard's KPI cards deep-link here via ?status= (e.g. "Completed
  // Orders" → /orders?status=completed) — only honored once, on first mount,
  // same as AdminPage's ?tab= convention.
  const [searchParams] = useSearchParams();
  const requestedStatus = searchParams.get('status');
  const [filters, setFilters] = useState(
    STATUS_OPTIONS.includes(requestedStatus) ? { ...initialFilters, status: requestedStatus } : initialFilters
  );
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ orders: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Debounce free-text search so it doesn't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setFilters((f) => ({ ...f, search: searchInput }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  function buildParams(pageNum, limit) {
    const params = { page: pageNum, limit };
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.type !== 'all') params.type = filters.type;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.search) params.search = filters.search;
    return params;
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await apiClient.get('/orders', { params: buildParams(page, PAGE_SIZE) });
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function resetFilters() {
    setSearchInput('');
    setFilters(initialFilters);
    setPage(1);
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const rows = [];
      let pageNum = 1;
      // Page through every filtered result server-side (capped per request) rather
      // than trusting a single unbounded query — safe even if the filtered set is large.
      for (;;) {
        const { data } = await apiClient.get('/orders', { params: buildParams(pageNum, EXPORT_PAGE_SIZE) });
        rows.push(...data.orders);
        if (pageNum >= data.totalPages || data.orders.length === 0) break;
        pageNum += 1;
      }
      downloadCsv(rows);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not export CSV');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar>
        <div className="relative max-w-md">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search order # or item…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </TopBar>
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-400">{result.total} order(s) match your filters</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || result.total === 0}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconDownload className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-sm border border-gray-100 bg-white p-4 shadow-sm">
          <Field label="Status">
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 'all' ? 'All statuses' : s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Type">
            <select
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All types' : t === 'dine_in' ? 'Dine-in' : 'Takeaway'}
                </option>
              ))}
            </select>
          </Field>

          <Field label="From">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </Field>

          <Field label="To">
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </Field>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
          >
            Reset
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
          {listLayout === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {result.orders.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => setSelectedOrder(order)}
                      className="cursor-pointer transition hover:bg-indigo-50/40"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        #{String(order.tokenNumber).padStart(3, '0')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.lines.length}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">€{order.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {listLayout === 'card' && result.orders.length > 0 && (
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.orders.map((order) => (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className="cursor-pointer rounded-sm border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">
                      #{String(order.tokenNumber).padStart(3, '0')}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-400">Type</dt>
                      <dd className="text-gray-600">{order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-400">Items</dt>
                      <dd className="text-gray-600">{order.lines.length}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-400">Total</dt>
                      <dd className="font-medium text-gray-900">€{order.total.toFixed(2)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-gray-400">Created</dt>
                      <dd className="text-gray-500">{formatDateTime(order.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}

          {!loading && result.orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconReceipt className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-400">No orders match these filters.</p>
            </div>
          )}
          {loading && <p className="py-10 text-center text-sm text-gray-400">Loading…</p>}

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <span className="text-xs text-gray-400">
              Page {result.page || page} of {Math.max(1, result.totalPages)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= result.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <IconChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Order #${String(selectedOrder.tokenNumber).padStart(3, '0')}` : ''}
      >
        {selectedOrder && <OrderDetail order={selectedOrder} />}
      </Drawer>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(orders) {
  const headers = ['Order #', 'Type', 'Status', 'Items', 'Subtotal', 'VAT', 'Discount', 'Total', 'Created', 'Closed', 'Notes'];
  const rows = orders.map((o) => [
    o.tokenNumber,
    o.type === 'dine_in' ? 'Dine-in' : 'Takeaway',
    o.status,
    o.lines.map((l) => `${l.quantity}x ${l.nameSnapshot}`).join('; '),
    o.subtotal.toFixed(2),
    o.vatTotal.toFixed(2),
    o.discount.toFixed(2),
    o.total.toFixed(2),
    new Date(o.createdAt).toISOString(),
    o.closedAt ? new Date(o.closedAt).toISOString() : '',
    o.notes || '',
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
