import { useEffect, useMemo, useState } from 'react';
<<<<<<< HEAD
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

import { apiClient } from '../api/client.js';
import { KDS_BUMP_ROLES } from '../features/auth/roles.js';
import TopBar from '../components/TopBar.jsx';
import DateRangeCalendar from '../components/DateRangeCalendar.jsx';
import {
  IconClock,
  IconCheckCircle,
  IconReceipt,
  IconSparkle,
  IconChefHat,
  IconBell,
  IconXCircle,
  IconSearch,
  IconCalendar,
} from '../components/icons.jsx';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

// Kitchen-facing lifecycle. Completed/cancelled come straight from the order's
// own status; while an order is active ("paid"), its stage is the manually-set
// kitchenStatus field — independent of the per-line `done` checklist, which
// only tracks which individual items are prepped, not the ticket's overall stage.
const STATUS_META = {
  new: { label: 'New Order', icon: IconSparkle, pill: 'bg-indigo-50 text-indigo-500' },
  cooking: { label: 'Cooking', icon: IconChefHat, pill: 'bg-amber-50 text-amber-600' },
  ready: { label: 'Ready to serve', icon: IconBell, pill: 'bg-blue-50 text-blue-600' },
  completed: { label: 'Completed', icon: IconCheckCircle, pill: 'bg-emerald-50 text-emerald-600' },
  cancelled: { label: 'Cancelled', icon: IconXCircle, pill: 'bg-rose-50 text-rose-600' },
};

// Clicking a card's status pill advances it one stage — this maps the current
// stage to the next kitchenStatus value it should be PATCHed to. 'ready' has no
// entry here because advancing past it means completing the order (a separate
// endpoint), handled explicitly in OrderCard instead.
const NEXT_KITCHEN_STATUS = { new: 'cooking', cooking: 'ready' };

const TABS = ['all', 'new', 'cooking', 'ready', 'completed', 'cancelled'];

function deriveStatus(order) {
  if (order.status === 'voided') return 'cancelled';
  if (order.status === 'completed') return 'completed';
  return order.kitchenStatus || 'new';
}

// Elapsed time in the kitchen — starts ticking the moment the order is paid
// (closedAt, when it enters the KDS queue; createdAt is a fallback for orders
// with no closedAt yet) and keeps counting live, second by second, while
// still active. Once the order is completed or cancelled, it freezes at that
// moment instead of continuing to grow, so the number reflects "how long it
// took", not "how long ago that was".
function elapsedSeconds(order) {
  const start = new Date(order.closedAt || order.createdAt).getTime();
  if (order.status === 'completed') {
    return (new Date(order.updatedAt).getTime() - start) / 1000;
  }
  if (order.status === 'voided') {
    return (new Date(order.closedAt || order.updatedAt).getTime() - start) / 1000;
  }
  return (Date.now() - start) / 1000;
}

// A real running-clock breakdown — "45 sec", "2 min 15 sec", "1 hour 20 min
// 30 sec" — instead of collapsing everything into one big minute count, so a
// ticket that's been sitting for hours still reads at a glance.
function formatElapsed(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} min ${seconds} sec`;
  }
  if (minutes > 0) {
    return `${minutes} min ${seconds} sec`;
  }
  return `${seconds} sec`;
}

// Compares an order's timestamp against a plain "YYYY-MM-DD" range (the same
// format both a native `<input type="date">` and DateRangeCalendar produce)
// by calendar day, in local time — not a UTC/ISO substring match, which would
// drift a day around midnight for anyone not on UTC.
function isInRange(dateStr, fromYmd, toYmd) {
  const d = new Date(dateStr);
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return ymd >= fromYmd && ymd <= toYmd;
}

function todayYmd() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatRangeLabel(from, to) {
  const format = (ymd) => {
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  };
  return from === to ? format(from) : `${format(from)} - ${format(to)}`;
}

export default function KdsPage() {
  const role = useSelector((state) => state.auth.user?.role);
  const canBump = KDS_BUMP_ROLES.includes(role);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  // mode: 'today' | 'all' | 'custom' — 'custom' filters to the [from, to] range.
  const [dateFilter, setDateFilter] = useState({ mode: 'today', from: '', to: '' });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [, setTick] = useState(0);

  useEffect(() => {
    // The kitchen cares about active tickets plus enough history to populate the
    // Completed/Cancelled tabs — all three are plain reads of the existing
    // per-status listOrders endpoint, no backend changes needed.
    Promise.all([
      apiClient.get('/orders', { params: { status: 'paid' } }),
      apiClient.get('/orders', { params: { status: 'completed' } }),
      apiClient.get('/orders', { params: { status: 'voided' } }),
    ]).then(([paid, completed, voided]) => {
      setOrders([...paid.data, ...completed.data, ...voided.data]);
    });

    const socket = io(`${SOCKET_URL}/kds`);

    function upsert(order) {
      setOrders((prev) =>
        prev.some((o) => o._id === order._id)
          ? prev.map((o) => (o._id === order._id ? order : o))
          : [order, ...prev]
      );
    }

    socket.on('order:new', upsert);
    socket.on('order:updated', upsert);
=======
import { io } from 'socket.io-client';

import { apiClient } from '../api/client.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

function elapsedMinutes(createdAt) {
  return (Date.now() - new Date(createdAt).getTime()) / 60000;
}

function ticketColor(minutes) {
  if (minutes >= 10) return 'border-red-400 bg-red-50';
  if (minutes >= 5) return 'border-yellow-400 bg-yellow-50';
  return 'border-gray-200 bg-white';
}

export default function KdsPage() {
  const [orders, setOrders] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    apiClient.get('/orders', { params: { status: 'paid' } }).then(({ data }) => setOrders(data));

    const socket = io(`${SOCKET_URL}/kds`);

    socket.on('order:new', (order) => {
      setOrders((prev) => (prev.some((o) => o._id === order._id) ? prev : [...prev, order]));
    });

    socket.on('order:updated', (order) => {
      if (order.status === 'completed') {
        setOrders((prev) => prev.filter((o) => o._id !== order._id));
        setCompleted((prev) =>
          prev.some((o) => o._id === order._id) ? prev : [order, ...prev].slice(0, 10)
        );
      } else {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? order : o)));
      }
    });
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

    return () => socket.disconnect();
  }, []);

<<<<<<< HEAD
  // Re-render every second so each card's elapsed-time timer ticks live,
  // without a full refetch.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
=======
  // Re-render periodically so elapsed-time labels/colors stay current without a full refetch.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
    return () => clearInterval(interval);
  }, []);

  async function toggleLineDone(order, line) {
<<<<<<< HEAD
    if (!canBump) return; // defense in depth — the backend already 403s this for non-kitchen roles
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
    const { data } = await apiClient.patch(`/orders/${order._id}/lines/${line._id}`, {
      done: !line.done,
    });
    setOrders((prev) => prev.map((o) => (o._id === data._id ? data : o)));
<<<<<<< HEAD

    // Checking off the last remaining item automatically bumps the ticket to
    // "Ready to serve" — the kitchen shouldn't have to also click the status
    // pill once every item is already prepped.
    const allLinesDone = data.lines.length > 0 && data.lines.every((l) => l.done);
    if (allLinesDone && data.status === 'paid' && data.kitchenStatus !== 'ready') {
      await advanceKitchenStatus(data, 'ready');
    }
  }

  async function bumpOrder(order) {
    if (!canBump) return;
    await apiClient.post(`/orders/${order._id}/complete`);
  }

  async function advanceKitchenStatus(order, status) {
    if (!canBump) return;
    const { data } = await apiClient.patch(`/orders/${order._id}/kitchen-status`, { status });
    setOrders((prev) => prev.map((o) => (o._id === data._id ? data : o)));
  }

  const withStatus = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((o) => ({ ...o, _kds: deriveStatus(o) })),
    [orders]
  );

  // Both the tab-count badges and the card grid must agree on the same date
  // scope — counts previously ignored the date filter entirely, so they kept
  // showing all-time totals even while a narrower scope was selected and the
  // grid below was correctly filtered, which made the two disagree.
  const dateFiltered = useMemo(() => {
    if (dateFilter.mode === 'all') return withStatus;
    const [from, to] =
      dateFilter.mode === 'custom' ? [dateFilter.from, dateFilter.to] : [todayYmd(), todayYmd()];
    return from && to ? withStatus.filter((o) => isInRange(o.createdAt, from, to)) : withStatus;
  }, [withStatus, dateFilter]);

  const counts = useMemo(() => {
    const c = { all: dateFiltered.length, new: 0, cooking: 0, ready: 0, completed: 0, cancelled: 0 };
    dateFiltered.forEach((o) => {
      c[o._kds] += 1;
    });
    return c;
  }, [dateFiltered]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dateFiltered.filter((o) => {
      if (activeTab !== 'all' && o._kds !== activeTab) return false;
      if (q) {
        const inToken = String(o.tokenNumber).includes(q);
        const inItems = o.lines.some((l) => l.nameSnapshot.toLowerCase().includes(q));
        if (!inToken && !inItems) return false;
      }
      return true;
    });
  }, [dateFiltered, activeTab, search]);

  return (
    <div className="flex h-full flex-col">
      <TopBar>
        <div className="relative max-w-md">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order or item…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </TopBar>
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Kitchen Orders</h1>
            {!canBump && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                View only
              </span>
            )}
          </div>

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDateFilter({ mode: 'today', from: '', to: '' })}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                dateFilter.mode === 'today'
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter({ mode: 'all', from: '', to: '' })}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                dateFilter.mode === 'all'
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              All time
            </button>
            <button
              type="button"
              onClick={() => setCalendarOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition ${
                dateFilter.mode === 'custom'
                  ? 'border-indigo-500 bg-indigo-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <IconCalendar className="h-4 w-4" />
              {dateFilter.mode === 'custom' ? formatRangeLabel(dateFilter.from, dateFilter.to) : 'Pick a date'}
            </button>
            {calendarOpen && (
              <>
                {/* Click-outside-to-close backdrop — a plain fixed overlay
                    behind the popup rather than a document listener, so a
                    click on the calendar itself never bubbles out and closes
                    it mid-selection. */}
                <div className="fixed inset-0 z-10" onClick={() => setCalendarOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2">
                  <DateRangeCalendar
                    from={dateFilter.mode === 'custom' ? dateFilter.from : todayYmd()}
                    to={dateFilter.mode === 'custom' ? dateFilter.to : todayYmd()}
                    onChange={(from, to) => setDateFilter({ mode: 'custom', from, to })}
                    onClose={() => setCalendarOpen(false)}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-indigo-500 bg-indigo-500 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab === 'all' ? 'All' : STATUS_META[tab].label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {counts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              canBump={canBump}
              expanded={!!expanded[order._id]}
              onToggleExpand={() =>
                setExpanded((prev) => ({ ...prev, [order._id]: !prev[order._id] }))
              }
              onToggleLine={(line) => toggleLineDone(order, line)}
              onBump={() => bumpOrder(order)}
              onAdvance={(status) => advanceKitchenStatus(order, status)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center rounded-sm border border-dashed border-gray-200 bg-white py-16 text-center">
              <IconReceipt className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-400">No orders match this view.</p>
            </div>
          )}
=======
  }

  async function bumpOrder(order) {
    // The order:updated broadcast (which the server sends to every connected
    // /kds client, including this one) is what actually moves it to Completed.
    await apiClient.post(`/orders/${order._id}/complete`);
  }

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [orders]
  );

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold text-gray-900">Kitchen — Active Orders</h1>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedOrders.map((order) => {
            const minutes = elapsedMinutes(order.createdAt);
            return (
              <div key={order._id} className={`rounded-lg border-2 p-4 ${ticketColor(minutes)}`}>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">#{order.tokenNumber}</span>
                  <span className="text-xs font-medium uppercase text-gray-500">
                    {order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{Math.floor(minutes)} min ago</p>

                <div className="mt-3 space-y-2">
                  {order.lines.map((line) => (
                    <label key={line._id} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={line.done}
                        onChange={() => toggleLineDone(order, line)}
                        className="mt-1"
                      />
                      <span className={line.done ? 'text-gray-400 line-through' : 'text-gray-900'}>
                        {line.quantity}× {line.nameSnapshot}
                        {line.modifiers.length > 0 && (
                          <span className="block text-xs text-gray-500">
                            {line.modifiers.map((m) => m.nameSnapshot).join(', ')}
                          </span>
                        )}
                        {line.notes && (
                          <span className="block text-xs italic text-gray-500">{line.notes}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>

                {order.notes && (
                  <p className="mt-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{order.notes}</p>
                )}

                <button
                  type="button"
                  onClick={() => bumpOrder(order)}
                  className="mt-3 w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white"
                >
                  Bump
                </button>
              </div>
            );
          })}
          {sortedOrders.length === 0 && <p className="text-sm text-gray-400">No active orders.</p>}
        </div>
      </div>

      <div className="w-64 shrink-0 border-l border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">Recently Completed</h2>
        <div className="mt-3 space-y-2">
          {completed.length === 0 && <p className="text-sm text-gray-400">None yet.</p>}
          {completed.map((order) => (
            <div key={order._id} className="rounded border border-gray-200 px-3 py-2 text-sm">
              <span className="font-medium text-gray-900">#{order.tokenNumber}</span>
              <span className="ml-2 text-gray-500">{order.lines.length} item(s)</span>
            </div>
          ))}
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
        </div>
      </div>
    </div>
  );
}
<<<<<<< HEAD

function OrderCard({ order, canBump, expanded, onToggleExpand, onToggleLine, onBump, onAdvance }) {
  const seconds = Math.max(0, Math.floor(elapsedSeconds(order)));
  const isDone = order.status === 'completed' || order.status === 'voided';
  const meta = STATUS_META[order._kds];
  const StatusIcon = meta.icon;
  const visibleLines = expanded ? order.lines : order.lines.slice(0, 3);
  const hiddenCount = order.lines.length - visibleLines.length;
  // Kitchen can click the pill itself to advance the ticket a stage — New →
  // Cooking → Ready → (Complete). Only meaningful while the order is still active.
  const isActive = order.status === 'paid';
  const canAdvance = canBump && isActive;
  const canCheckItems = canBump && isActive; // no point editing the checklist once completed/cancelled
  const handleAdvance = () => {
    if (order._kds === 'ready') onBump();
    else onAdvance(NEXT_KITCHEN_STATUS[order._kds]);
  };

  return (
    <div className="flex flex-col rounded-sm border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-gray-900">
          {order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'}
        </span>
        <span className="text-sm font-medium text-gray-400">
          #{String(order.tokenNumber).padStart(3, '0')}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
        <IconClock className="h-3.5 w-3.5" />
        {isDone ? `Took ${formatElapsed(seconds)}` : formatElapsed(seconds)}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
        <span className="font-semibold text-gray-900">Order ({order.lines.length})</span>
        <span className="font-semibold text-gray-900">€{order.total.toFixed(2)}</span>
      </div>

      {/* flex-1 makes this section absorb any leftover height so the status pill
          below always lands on the same baseline across every card in the row. */}
      <div className="mt-2 flex-1 space-y-2">
        {visibleLines.map((line) =>
          canCheckItems ? (
            <label key={line._id} className="flex items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={line.done}
                onChange={() => onToggleLine(line)}
                className="mt-1 h-4 w-4 shrink-0 accent-indigo-500"
              />
              <LineText line={line} />
            </label>
          ) : (
            <div key={line._id} className="flex items-start gap-2.5 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
              <LineText line={line} />
            </div>
          )
        )}
        {order.lines.length > 3 && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-600"
          >
            {expanded ? 'See less' : `See more (${hiddenCount}) →`}
          </button>
        )}
      </div>

      {order.notes && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
          {order.notes}
        </p>
      )}

      {canAdvance ? (
        <button
          type="button"
          onClick={handleAdvance}
          title={order._kds === 'ready' ? 'Mark this order completed' : `Move to ${STATUS_META[NEXT_KITCHEN_STATUS[order._kds]].label}`}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition hover:brightness-95 ${meta.pill}`}
        >
          <StatusIcon className="h-4 w-4" />
          {meta.label}
        </button>
      ) : (
        <div
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${meta.pill}`}
        >
          <StatusIcon className="h-4 w-4" />
          {meta.label}
        </div>
      )}
    </div>
  );
}

function LineText({ line }) {
  return (
    <span className={`min-w-0 flex-1 ${line.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-medium">
          {line.quantity}× {line.nameSnapshot}
        </span>
        <span className="shrink-0 text-xs text-gray-500">€{line.lineTotal.toFixed(2)}</span>
      </span>
      {line.modifiers.length > 0 && (
        <span className="block text-xs text-gray-500">
          {line.modifiers.map((m) => m.nameSnapshot).join(', ')}
        </span>
      )}
      {line.notes && <span className="block text-xs italic text-gray-500">{line.notes}</span>}
    </span>
  );
}
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
