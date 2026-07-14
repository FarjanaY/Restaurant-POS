import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client.js';

function toApiLines(cartLines) {
  return cartLines.map((line) => ({
    menuItemId: line.menuItemId,
    quantity: line.quantity,
    notes: line.notes,
    modifierIds: line.modifiers.map((m) => m.modifierId),
  }));
}

<<<<<<< HEAD
// Creates the order server-side if this cart hasn't been sent yet, or PATCHes
// the existing one (e.g. recalled from held) so its lines/type/notes match the
// current cart — the one place every other thunk goes through to stay in sync.
async function syncCartToServer(cart) {
  const payload = {
    type: cart.orderType,
    notes: cart.orderNotes,
    lines: toApiLines(cart.lines),
    tableId: cart.tableId || null,
  };
  if (cart.currentOrderId) {
    const { data } = await apiClient.patch(`/orders/${cart.currentOrderId}`, payload);
    return data;
  }
  const { data } = await apiClient.post('/orders', payload);
  return data;
}

// Re-resolves a coupon against the order's just-synced lines — a flat discount
// amount would go stale the moment the cart changes (e.g. a 10%-off coupon must
// recompute against a new subtotal), so this always re-derives it server-side.
async function reapplyCouponIfAny(order, couponCode) {
  if (!couponCode) return order;
  const { data } = await apiClient.post(`/orders/${order._id}/coupon`, { code: couponCode });
  return data;
}

export const holdOrder = createAsyncThunk('orders/hold', async (cart) => {
  const synced = await syncCartToServer(cart);
  const withCoupon = await reapplyCouponIfAny(synced, cart.couponCode);
  const { data: held } = await apiClient.patch(`/orders/${withCoupon._id}`, { status: 'held' });
=======
// Holding a cart that doesn't exist server-side yet is create-then-mark-held;
// a cart recalled from an existing held order re-holds via a plain PATCH.
export const holdOrder = createAsyncThunk('orders/hold', async (cart) => {
  const payload = { type: cart.orderType, notes: cart.orderNotes, lines: toApiLines(cart.lines) };

  const orderId = cart.currentOrderId;
  if (orderId) {
    const { data } = await apiClient.patch(`/orders/${orderId}`, { ...payload, status: 'held' });
    return data;
  }

  const { data: created } = await apiClient.post('/orders', payload);
  const { data: held } = await apiClient.patch(`/orders/${created._id}`, { status: 'held' });
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
  return held;
});

export const fetchHeldOrders = createAsyncThunk('orders/fetchHeld', async () => {
  const { data } = await apiClient.get('/orders', { params: { status: 'held' } });
  return data;
});

export const recallOrder = createAsyncThunk('orders/recall', async (orderId) => {
  const { data } = await apiClient.patch(`/orders/${orderId}`, { status: 'open' });
  return data;
});

<<<<<<< HEAD
// Voids an order that was already sent to the server (open/held, unpaid) —
// the backend rejects voiding anything already paid, by design.
export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(`/orders/${orderId}/void`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not cancel order');
    }
  }
);

// Syncs the cart to a server-side order before payment, re-applying any active
// coupon against the final line set. Payments work against either 'open' or
// 'held' orders on the backend, so this deliberately doesn't force a status change.
export const sendOrder = createAsyncThunk('orders/send', async (cart, { rejectWithValue }) => {
  try {
    const synced = await syncCartToServer(cart);
    return await reapplyCouponIfAny(synced, cart.couponCode);
=======
// Syncs the cart to a server-side order before payment — creates it if this is a
// brand-new cart, or PATCHes it if it already exists (e.g. recalled from held).
// Payments work against either 'open' or 'held' orders on the backend, so this
// deliberately doesn't force a status change.
export const sendOrder = createAsyncThunk('orders/send', async (cart, { rejectWithValue }) => {
  const payload = { type: cart.orderType, notes: cart.orderNotes, lines: toApiLines(cart.lines) };
  try {
    if (cart.currentOrderId) {
      const { data } = await apiClient.patch(`/orders/${cart.currentOrderId}`, payload);
      return data;
    }
    const { data } = await apiClient.post('/orders', payload);
    return data;
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not send order');
  }
});

<<<<<<< HEAD
// Applying a coupon requires the order to exist server-side first (the discount
// is resolved against its actual gross total), so this syncs the cart, then applies.
export const applyCoupon = createAsyncThunk(
  'orders/applyCoupon',
  async ({ cart, code }, { rejectWithValue }) => {
    try {
      const synced = await syncCartToServer(cart);
      const { data } = await apiClient.post(`/orders/${synced._id}/coupon`, { code });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not apply coupon');
    }
  }
);

// Returns null if the cart was never sent to the server — there's no server-side
// coupon to remove, so the component just clears the local coupon state instead.
export const removeCoupon = createAsyncThunk(
  'orders/removeCoupon',
  async (cart, { rejectWithValue }) => {
    if (!cart.currentOrderId) return null;
    try {
      const { data } = await apiClient.delete(`/orders/${cart.currentOrderId}/coupon`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not remove coupon');
    }
  }
);

// A flat, staff-entered discount — independent of (and stacks with) a coupon.
// The server re-resolves any existing coupon fresh, so this doesn't need to
// resend it separately.
export const applyManualDiscount = createAsyncThunk(
  'orders/applyManualDiscount',
  async ({ cart, amount }, { rejectWithValue }) => {
    try {
      const synced = await syncCartToServer(cart);
      const { data } = await apiClient.post(`/orders/${synced._id}/discount`, { amount });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not apply discount');
    }
  }
);

export const removeManualDiscount = createAsyncThunk(
  'orders/removeManualDiscount',
  async (cart, { rejectWithValue }) => {
    if (!cart.currentOrderId) return null;
    try {
      const { data } = await apiClient.delete(`/orders/${cart.currentOrderId}/discount`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not remove discount');
    }
  }
);

=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
export const addCashPayment = createAsyncThunk(
  'orders/addCashPayment',
  async ({ orderId, tendered }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(`/orders/${orderId}/payments`, {
        method: 'cash',
        tendered,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Payment failed');
    }
  }
);

// Requests a Stripe PaymentIntent for the order's remaining balance — the
// Terminal SDK then hands this to the reader (see stripeTerminal.js).
export const createCardIntent = createAsyncThunk(
  'orders/createCardIntent',
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(`/orders/${orderId}/card-intent`);
      return data; // { clientSecret, paymentIntentId }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not start card payment');
    }
  }
);

// Records a card payment after the Terminal SDK has already collected and
// processed it — the backend independently re-verifies the PaymentIntent
// with Stripe before trusting it (see paymentsController.addPayment).
export const confirmCardPayment = createAsyncThunk(
  'orders/confirmCardPayment',
  async ({ orderId, paymentIntentId }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post(`/orders/${orderId}/payments`, {
        method: 'card',
        paymentIntentId,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Payment failed');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: { heldOrders: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHeldOrders.fulfilled, (state, action) => {
        state.heldOrders = action.payload;
      })
      .addCase(holdOrder.pending, (state) => {
        state.status = 'holding';
        state.error = null;
      })
      .addCase(holdOrder.fulfilled, (state) => {
        state.status = 'idle';
      })
      .addCase(holdOrder.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error.message;
      });
  },
});

export default ordersSlice.reducer;
