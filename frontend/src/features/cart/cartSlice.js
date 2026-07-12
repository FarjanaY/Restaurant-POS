import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orderType: 'dine_in', // dine_in | takeaway
  orderNotes: '',
  currentOrderId: null, // set once this cart corresponds to an order already created server-side
  lines: [], // { menuItemId, name, quantity, unitPrice, modifiers, notes }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    itemAdded(state, action) {
      state.lines.push(action.payload);
    },
    lineQuantityChanged(state, action) {
      const { index, quantity } = action.payload;
      if (state.lines[index]) {
        state.lines[index].quantity = quantity;
      }
    },
    lineRemoved(state, action) {
      state.lines.splice(action.payload, 1);
    },
    lineNotesChanged(state, action) {
      const { index, notes } = action.payload;
      if (state.lines[index]) {
        state.lines[index].notes = notes;
      }
    },
    orderTypeChanged(state, action) {
      state.orderType = action.payload;
    },
    orderNotesChanged(state, action) {
      state.orderNotes = action.payload;
    },
    cartCleared(state) {
      state.lines = [];
      state.orderNotes = '';
      state.currentOrderId = null;
    },
    // Loads an order fetched from the server (e.g. on recall) back into cart shape.
    cartHydrated(state, action) {
      const order = action.payload;
      state.orderType = order.type;
      state.orderNotes = order.notes || '';
      state.currentOrderId = order._id;
      state.lines = order.lines.map((line) => ({
        menuItemId: line.menuItemId,
        name: line.nameSnapshot,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        notes: line.notes || '',
        modifiers: line.modifiers.map((m) => ({
          modifierId: m.modifierId,
          name: m.nameSnapshot,
          priceDelta: m.priceDelta,
        })),
      }));
    },
  },
});

export const {
  itemAdded,
  lineQuantityChanged,
  lineRemoved,
  lineNotesChanged,
  orderTypeChanged,
  orderNotesChanged,
  cartCleared,
  cartHydrated,
} = cartSlice.actions;
export default cartSlice.reducer;
