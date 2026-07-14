import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orderType: 'dine_in', // dine_in | takeaway
  orderNotes: '',
  currentOrderId: null, // set once this cart corresponds to an order already created server-side
<<<<<<< HEAD
  discount: 0, // resolved server-side — combined total of couponCode + manualDiscount, never computed locally
  couponCode: null,
  manualDiscount: 0, // staff-applied flat discount; stacks with a coupon, tracked separately for display
  tableId: null, // only meaningful when the optional Tables feature is enabled
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
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
<<<<<<< HEAD
    // Re-picks modifiers on an already-added line (e.g. changing Size/Milk
    // before sending the order) — keeps quantity/notes as they were, only the
    // modifier selection and its resulting unit price change.
    lineModifiersChanged(state, action) {
      const { index, modifiers, unitPrice } = action.payload;
      if (state.lines[index]) {
        state.lines[index].modifiers = modifiers;
        state.lines[index].unitPrice = unitPrice;
      }
    },
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
    lineNotesChanged(state, action) {
      const { index, notes } = action.payload;
      if (state.lines[index]) {
        state.lines[index].notes = notes;
      }
    },
<<<<<<< HEAD
    // A quick-add from the special-instructions modifier suggestions — appends
    // one modifier and its price delta, without going through the full
    // required/max-select validation the ModifierPicker enforces (this is a
    // convenience shortcut, not a replacement for "Edit").
    lineModifierAdded(state, action) {
      const { index, modifier } = action.payload;
      const line = state.lines[index];
      if (line && !line.modifiers.some((m) => m.modifierId === modifier.modifierId)) {
        line.modifiers.push(modifier);
        line.unitPrice += modifier.priceDelta;
      }
    },
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
    orderTypeChanged(state, action) {
      state.orderType = action.payload;
    },
    orderNotesChanged(state, action) {
      state.orderNotes = action.payload;
    },
<<<<<<< HEAD
    tableChanged(state, action) {
      state.tableId = action.payload;
    },
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
    cartCleared(state) {
      state.lines = [];
      state.orderNotes = '';
      state.currentOrderId = null;
<<<<<<< HEAD
      state.discount = 0;
      state.couponCode = null;
      state.manualDiscount = 0;
      state.tableId = null;
    },
    // Clears just the coupon (e.g. "Remove" when no server order exists yet to
    // round-trip through) — keeps the rest of the cart, including any manual
    // discount, intact. In practice this only fires if a coupon was somehow
    // marked applied without a synced order, since applyCoupon always syncs first.
    couponCleared(state) {
      state.couponCode = null;
    },
    // Same reasoning as couponCleared, but for the manual-discount side — leaves
    // any active coupon untouched.
    manualDiscountCleared(state) {
      state.manualDiscount = 0;
    },
    // Loads an order fetched from the server (e.g. on recall, or after applying a
    // coupon/discount) back into cart shape — the server is always the source of
    // truth for discount, since it's resolved from the coupon + manual discount,
    // never computed locally.
=======
    },
    // Loads an order fetched from the server (e.g. on recall) back into cart shape.
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
    cartHydrated(state, action) {
      const order = action.payload;
      state.orderType = order.type;
      state.orderNotes = order.notes || '';
      state.currentOrderId = order._id;
<<<<<<< HEAD
      state.discount = order.discount || 0;
      state.couponCode = order.couponCode || null;
      state.manualDiscount = order.manualDiscount || 0;
      state.tableId = order.tableId || null;
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
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
<<<<<<< HEAD
  lineModifiersChanged,
  lineModifierAdded,
  lineNotesChanged,
  orderTypeChanged,
  orderNotesChanged,
  tableChanged,
  cartCleared,
  couponCleared,
  manualDiscountCleared,
=======
  lineNotesChanged,
  orderTypeChanged,
  orderNotesChanged,
  cartCleared,
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
  cartHydrated,
} = cartSlice.actions;
export default cartSlice.reducer;
