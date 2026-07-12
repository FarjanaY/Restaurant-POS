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
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not send order');
  }
});

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
