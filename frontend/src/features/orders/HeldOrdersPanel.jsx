import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchHeldOrders, recallOrder } from './ordersSlice.js';
import { cartHydrated } from '../cart/cartSlice.js';

export default function HeldOrdersPanel({ onClose }) {
  const dispatch = useDispatch();
  const { heldOrders } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchHeldOrders());
  }, [dispatch]);

  async function handleRecall(orderId) {
    const result = await dispatch(recallOrder(orderId)).unwrap();
    dispatch(cartHydrated(result));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
<<<<<<< HEAD
      <div className="w-full max-w-sm rounded-sm bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Held Orders</h2>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-900">
=======
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Held Orders</h2>
          <button type="button" onClick={onClose} className="text-sm text-gray-500">
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
            Close
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {heldOrders.length === 0 && <p className="text-sm text-gray-400">No held orders.</p>}
          {heldOrders.map((order) => (
            <button
              key={order._id}
              type="button"
              onClick={() => handleRecall(order._id)}
<<<<<<< HEAD
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50"
=======
              className="flex w-full items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left hover:border-gray-400"
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
            >
              <span>
                <span className="font-medium text-gray-900">#{order.tokenNumber}</span>
                <span className="ml-2 text-sm text-gray-500">{order.lines.length} item(s)</span>
              </span>
              <span className="font-medium text-gray-900">€{order.total.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
