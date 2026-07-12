import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../features/cart/cartSlice.js';
import menuReducer from '../features/menu/menuSlice.js';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    menu: menuReducer,
  },
});
