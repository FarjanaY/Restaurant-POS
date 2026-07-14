import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client.js';

export const fetchMenu = createAsyncThunk('menu/fetch', async () => {
  const { data } = await apiClient.get('/menu');
  return data; // { categories, items }
});

const menuSlice = createSlice({
  name: 'menu',
  initialState: { categories: [], items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload.categories;
        state.items = action.payload.items;
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default menuSlice.reducer;
