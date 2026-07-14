import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { apiClient } from '../api/client.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

// Per-page list-view preference (Orders/Tables/Staff/Categories/Items/
// Discount/Inventory/Customers each independently table-or-card) set from
// Store Settings — same live-refetch pattern as useStoreProfile: every
// mounted consumer re-fetches over the `/settings` socket namespace the
// moment any of them is saved, from any tab/device, no reload.
export function useListLayout(page) {
  const [layout, setLayout] = useState('table');

  useEffect(() => {
    function load() {
      apiClient
        .get('/settings')
        .then(({ data }) => setLayout(data.listLayouts?.[page] === 'card' ? 'card' : 'table'))
        .catch(() => {});
    }

    load();
    const socket = io(`${SOCKET_URL}/settings`);
    socket.on('settings:updated', load);
    return () => socket.disconnect();
  }, [page]);

  return layout;
}

export async function setListLayout(page, layout) {
  await apiClient.patch('/settings', { listLayouts: { [page]: layout } });
}
