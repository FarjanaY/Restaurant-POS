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
