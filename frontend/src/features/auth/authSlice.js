import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../api/client.js';

const STORAGE_KEY = 'pos.auth';

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const persisted = loadPersisted();

export const login = createAsyncThunk('auth/login', async (pin, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post('/auth/login', { pin });
    return data; // { token, user }
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: persisted?.token || null,
    user: persisted?.user || null,
    status: 'idle',
    error: null,
  },
  reducers: {
    loggedOut(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem(STORAGE_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload));
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
      });
  },
});

export const { loggedOut } = authSlice.actions;
export default authSlice.reducer;
