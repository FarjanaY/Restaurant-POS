import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orderType: 'dine_in', // dine_in | takeaway
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
    orderTypeChanged(state, action) {
      state.orderType = action.payload;
    },
    cartCleared(state) {
      state.lines = [];
    },
  },
});

export const { itemAdded, lineQuantityChanged, lineRemoved, orderTypeChanged, cartCleared } =
  cartSlice.actions;
export default cartSlice.reducer;
