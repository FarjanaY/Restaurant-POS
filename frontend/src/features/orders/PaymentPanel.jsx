import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { addPayment } from './ordersSlice.js';

function Receipt({ order, onDone }) {
  const lastPayment = order.payments[order.payments.length - 1];

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Receipt — Order #{order.tokenNumber}</h2>
        <p className="text-sm text-gray-500">{order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'}</p>

        <div className="mt-4 space-y-2 border-y border-gray-100 py-3">
          {order.lines.map((line) => (
            <div key={line._id} className="flex justify-between text-sm">
              <span>
                {line.quantity}× {line.nameSnapshot}
                {line.modifiers.length > 0 && (
                  <span className="text-gray-400">
                    {' '}
                    ({line.modifiers.map((m) => m.nameSnapshot).join(', ')})
                  </span>
                )}
              </span>
              <span>€{line.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>€{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT</span>
            <span>€{order.vatTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Total</span>
            <span>€{order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm text-gray-600">
          {order.payments.map((p) => (
            <div key={p._id} className="flex justify-between">
              <span>{p.method === 'cash' ? 'Cash tendered' : 'Card'}</span>
              <span>€{p.tendered?.toFixed(2)}</span>
            </div>
          ))}
          {lastPayment && (
            <div className="flex justify-between font-medium text-gray-900">
              <span>Change</span>
              <span>€{lastPayment.change.toFixed(2)}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDone}
          className="mt-4 w-full rounded-md bg-gray-900 py-2 font-medium text-white"
        >
          New Order
        </button>
      </div>
    </div>
  );
}

export default function PaymentPanel({ order: initialOrder, onClose, onDone }) {
  const dispatch = useDispatch();
  const [order, setOrder] = useState(initialOrder);
  const [tendered, setTendered] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const paidSoFar = order.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.round((order.total - paidSoFar) * 100) / 100;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const updated = await dispatch(
        addPayment({ orderId: order._id, tendered: Number(tendered) })
      ).unwrap();
      setOrder(updated);
      setTendered('');
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (order.status === 'paid') {
    return <Receipt order={order} onDone={onDone} />;
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Charge — Order #{order.tokenNumber}</h2>

        <div className="mt-4 space-y-1 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>€{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT</span>
            <span>€{order.vatTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>€{order.total.toFixed(2)}</span>
          </div>
          {paidSoFar > 0 && (
            <div className="flex justify-between text-gray-500">
              <span>Paid so far</span>
              <span>€{paidSoFar.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Remaining</span>
            <span>€{remaining.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <label htmlFor="tendered" className="block text-sm font-medium text-gray-700">
            Cash tendered
          </label>
          <input
            id="tendered"
            type="number"
            step="0.01"
            min="0"
            autoFocus
            value={tendered}
            onChange={(e) => setTendered(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xl"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-gray-300 py-2 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !tendered || Number(tendered) <= 0}
              className="flex-1 rounded-md bg-gray-900 py-2 text-white disabled:opacity-40"
            >
              {submitting ? 'Processing…' : 'Take Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
