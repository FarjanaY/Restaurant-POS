import PrintReceiptButton from '../../components/PrintReceiptButton.jsx';

export const STATUS_BADGE = {
  open: 'bg-slate-100 text-slate-600',
  held: 'bg-amber-100 text-amber-700',
  paid: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  voided: 'bg-rose-100 text-rose-700',
};

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Full order breakdown shown inside a Drawer — used by both the Orders table
// (click a row) and Tables (click an occupied table to see what's on it).
export default function OrderDetail({ order }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[order.status]}`}>
          {order.status}
        </span>
        <span className="text-sm text-gray-500">
          {order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'}
        </span>
      </div>

      <PrintReceiptButton order={order} className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50" />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <DetailField label="Created" value={formatDateTime(order.createdAt)} />
        <DetailField label="Closed" value={order.closedAt ? formatDateTime(order.closedAt) : '—'} />
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Items</h3>
        <div className="mt-2 space-y-2">
          {order.lines.map((line) => (
            <div key={line._id} className="rounded-lg border border-gray-100 p-3 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-gray-900">
                  {line.quantity}× {line.nameSnapshot}
                </span>
                <span className="shrink-0 text-gray-500">€{line.lineTotal.toFixed(2)}</span>
              </div>
              {line.modifiers.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  {line.modifiers.map((m) => m.nameSnapshot).join(', ')}
                </p>
              )}
              {line.notes && <p className="mt-1 text-xs italic text-gray-500">{line.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      {order.notes && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Order notes</h3>
          <p className="mt-1 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{order.notes}</p>
        </div>
      )}

      <div className="rounded-lg border border-gray-100 p-3 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>€{order.subtotal.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex justify-between text-gray-600">
          <span>VAT</span>
          <span>€{order.vatTotal.toFixed(2)}</span>
        </div>
        {order.discount > 0 && (
          <div className="mt-1 flex justify-between text-gray-600">
            <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
            <span>−€{order.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 font-semibold text-gray-900">
          <span>Total</span>
          <span>€{order.total.toFixed(2)}</span>
        </div>
      </div>

      {order.payments.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payments</h3>
          <div className="mt-2 space-y-2">
            {order.payments.map((p) => (
              <div key={p._id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <span className="capitalize text-gray-600">{p.method}</span>
                <span className="font-medium text-gray-900">€{p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
