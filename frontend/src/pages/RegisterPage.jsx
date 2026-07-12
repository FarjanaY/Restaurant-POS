import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchMenu } from '../features/menu/menuSlice.js';
import {
  itemAdded,
  lineQuantityChanged,
  lineRemoved,
  lineNotesChanged,
  orderTypeChanged,
  orderNotesChanged,
  cartCleared,
} from '../features/cart/cartSlice.js';
import { holdOrder, sendOrder } from '../features/orders/ordersSlice.js';
import ModifierPicker from '../features/menu/ModifierPicker.jsx';
import HeldOrdersPanel from '../features/orders/HeldOrdersPanel.jsx';
import PaymentPanel from '../features/orders/PaymentPanel.jsx';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { categories, items, status, error } = useSelector((state) => state.menu);
  const cart = useSelector((state) => state.cart);
  const cartLines = cart.lines;
  const holdStatus = useSelector((state) => state.orders.status);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [pickerItem, setPickerItem] = useState(null);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [sendError, setSendError] = useState(null);

  useEffect(() => {
    dispatch(fetchMenu());
  }, [dispatch]);

  // Falls back to the first category until the cashier picks one — no effect needed to sync it.
  const selectedCategoryId = activeCategoryId ?? categories[0]?._id;

  function handleItemTap(item) {
    if (item.modifierGroupIds.length > 0) {
      setPickerItem(item);
      return;
    }
    dispatch(
      itemAdded({
        menuItemId: item._id,
        name: item.name,
        quantity: 1,
        unitPrice: item.basePrice,
        modifiers: [],
        notes: '',
      })
    );
  }

  async function handleHold() {
    await dispatch(holdOrder(cart)).unwrap();
    dispatch(cartCleared());
  }

  async function handleCharge() {
    setSendError(null);
    try {
      const order = await dispatch(sendOrder(cart)).unwrap();
      setPaymentOrder(order);
    } catch (err) {
      setSendError(err);
    }
  }

  if (status === 'loading' || status === 'idle') {
    return <div className="p-6 text-gray-500">Loading menu…</div>;
  }
  if (status === 'failed') {
    return <div className="p-6 text-red-600">Failed to load menu: {error}</div>;
  }

  const visibleItems = items.filter((item) => item.categoryId === selectedCategoryId);
  // Gross running total only — the authoritative VAT split is computed server-side
  // once the order is sent (Step 7's computeOrderTotals), not duplicated here.
  const cartTotal = cartLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-2 overflow-x-auto border-b border-gray-200 pb-3">
          {categories.map((category) => (
            <button
              key={category._id}
              type="button"
              onClick={() => setActiveCategoryId(category._id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategoryId === category._id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleItems.map((item) => (
            <button
              key={item._id}
              type="button"
              onClick={() => handleItemTap(item)}
              className="rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm hover:border-gray-400"
            >
              <div className="font-medium text-gray-900">{item.name}</div>
              <div className="mt-1 text-sm text-gray-500">€{item.basePrice.toFixed(2)}</div>
            </button>
          ))}
          {visibleItems.length === 0 && (
            <p className="col-span-full text-sm text-gray-400">No items in this category.</p>
          )}
        </div>
      </div>

      <div className="flex w-80 shrink-0 flex-col border-l border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Current Order</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowHeldOrders(true)}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Recall
            </button>
            {cartLines.length > 0 && (
              <button
                type="button"
                onClick={() => dispatch(cartCleared())}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {['dine_in', 'takeaway'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => dispatch(orderTypeChanged(type))}
              className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium ${
                cart.orderType === type
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              {type === 'dine_in' ? 'Dine-in' : 'Takeaway'}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
          {cartLines.length === 0 && <p className="text-sm text-gray-400">No items yet.</p>}
          {cartLines.map((line, index) => (
            <div key={index} className="border-b border-gray-100 pb-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{line.name}</span>
                <button
                  type="button"
                  onClick={() => dispatch(lineRemoved(index))}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
              {line.modifiers.length > 0 && (
                <p className="text-xs text-gray-500">{line.modifiers.map((m) => m.name).join(', ')}</p>
              )}
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      dispatch(lineQuantityChanged({ index, quantity: Math.max(1, line.quantity - 1) }))
                    }
                    className="h-6 w-6 rounded border border-gray-300 text-gray-600"
                  >
                    −
                  </button>
                  <span>{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => dispatch(lineQuantityChanged({ index, quantity: line.quantity + 1 }))}
                    className="h-6 w-6 rounded border border-gray-300 text-gray-600"
                  >
                    +
                  </button>
                </div>
                <span className="font-medium text-gray-900">
                  €{(line.unitPrice * line.quantity).toFixed(2)}
                </span>
              </div>
              <input
                type="text"
                value={line.notes}
                onChange={(e) => dispatch(lineNotesChanged({ index, notes: e.target.value }))}
                placeholder="Special instructions…"
                className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 placeholder:text-gray-400"
              />
            </div>
          ))}
        </div>

        <textarea
          value={cart.orderNotes}
          onChange={(e) => dispatch(orderNotesChanged(e.target.value))}
          placeholder="Order notes…"
          rows={2}
          className="mt-3 w-full resize-none rounded border border-gray-200 px-2 py-1 text-sm text-gray-700 placeholder:text-gray-400"
        />

        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span>€{cartTotal.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            VAT-inclusive; the exact tax split is computed when the order is sent.
          </p>
          {sendError && <p className="mt-1 text-sm text-red-600">{sendError}</p>}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={cartLines.length === 0 || holdStatus === 'holding'}
              onClick={handleHold}
              className="rounded-md border border-gray-300 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
            >
              {holdStatus === 'holding' ? 'Holding…' : 'Hold'}
            </button>
            <button
              type="button"
              disabled={cartLines.length === 0}
              onClick={handleCharge}
              className="rounded-md bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              Charge
            </button>
          </div>
        </div>
      </div>

      {pickerItem && (
        <ModifierPicker
          item={pickerItem}
          onCancel={() => setPickerItem(null)}
          onConfirm={(line) => {
            dispatch(itemAdded(line));
            setPickerItem(null);
          }}
        />
      )}

      {showHeldOrders && <HeldOrdersPanel onClose={() => setShowHeldOrders(false)} />}

      {paymentOrder && (
        <PaymentPanel
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onDone={() => {
            setPaymentOrder(null);
            dispatch(cartCleared());
          }}
        />
      )}
    </div>
  );
}
