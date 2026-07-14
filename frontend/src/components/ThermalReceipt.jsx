import { useStoreProfile } from '../hooks/useStoreProfile.js';

// Off-screen markup for the `#print-receipt-root` print target (see index.css)
// — laid out narrow/monospace to match 80mm thermal receipt paper. Never shown
// on screen; it only becomes visible for the duration of window.print().
export default function ThermalReceipt({ order }) {
  const storeProfile = useStoreProfile();
  if (!order) return null;

  const lastPayment = order.payments[order.payments.length - 1];

  return (
    <div
      id="print-receipt-root"
      className="hidden font-mono text-[11px] leading-relaxed text-black print:block"
    >
      <div className="text-center">
        <p className="text-sm font-bold">{storeProfile.name}</p>
        <p>Order #{String(order.tokenNumber).padStart(3, '0')}</p>
        <p>{new Date(order.createdAt).toLocaleString()}</p>
        <p>{order.type === 'dine_in' ? 'Dine-in' : 'Takeaway'}</p>
      </div>

      <div className="my-2 border-t border-dashed border-black" />

      {order.lines.map((line) => (
        <div key={line._id}>
          <div className="flex justify-between">
            <span>
              {line.quantity}x {line.nameSnapshot}
            </span>
            <span>€{line.lineTotal.toFixed(2)}</span>
          </div>
          {line.modifiers.length > 0 && (
            <p className="pl-2 text-[10px]">{line.modifiers.map((m) => m.nameSnapshot).join(', ')}</p>
          )}
          {line.notes && <p className="pl-2 text-[10px] italic">{line.notes}</p>}
        </div>
      ))}

      <div className="my-2 border-t border-dashed border-black" />

      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>€{order.subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>VAT</span>
        <span>€{order.vatTotal.toFixed(2)}</span>
      </div>
      {order.discount > 0 && (
        <div className="flex justify-between">
          <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
          <span>-€{order.discount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-bold">
        <span>TOTAL</span>
        <span>€{order.total.toFixed(2)}</span>
      </div>

      {order.payments.length > 0 && (
        <>
          <div className="my-2 border-t border-dashed border-black" />
          {order.payments.map((p) => (
            <div key={p._id} className="flex justify-between">
              <span>{p.method === 'cash' ? 'Cash tendered' : 'Card'}</span>
              <span>€{(p.method === 'cash' ? p.tendered : p.amount).toFixed(2)}</span>
            </div>
          ))}
          {lastPayment?.method === 'cash' && (
            <div className="flex justify-between font-bold">
              <span>Change</span>
              <span>€{lastPayment.change.toFixed(2)}</span>
            </div>
          )}
        </>
      )}

      <div className="my-2 border-t border-dashed border-black" />
      <p className="text-center">Thank you!</p>
    </div>
  );
}
