import { useEffect, useMemo, useState } from 'react';
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

    return () => socket.disconnect();
  }, []);

  // Re-render periodically so elapsed-time labels/colors stay current without a full refetch.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  async function toggleLineDone(order, line) {
    const { data } = await apiClient.patch(`/orders/${order._id}/lines/${line._id}`, {
      done: !line.done,
    });
    setOrders((prev) => prev.map((o) => (o._id === data._id ? data : o)));
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
        </div>
      </div>
    </div>
  );
}
