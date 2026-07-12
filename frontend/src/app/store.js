import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../features/cart/cartSlice.js';
import menuReducer from '../features/menu/menuSlice.js';
import authReducer from '../features/auth/authSlice.js';
import ordersReducer from '../features/orders/ordersSlice.js';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    menu: menuReducer,
    auth: authReducer,
    orders: ordersReducer,
  },
});
