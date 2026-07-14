import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Reads from localStorage directly (not the Redux store) so this module has no
// import-cycle dependency on authSlice — the key is the contract between them.
apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('pos.auth');
  if (raw) {
    const { token } = JSON.parse(raw);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
