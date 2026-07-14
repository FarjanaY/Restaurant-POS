import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { apiClient } from '../api/client.js';

const DEFAULT_PROFILE = { name: 'Restaurant POS', logoUrl: '' };
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

// Whatever the admin sets on the Store Settings page (Restaurant Name +
// Upload Restaurant Logo) — falls back to the generic defaults until a real
// name/logo is saved. `endpoint` lets the login screen (no token yet) read
// the public branding-only route instead of the full authenticated one.
//
// Refetches live over the `/settings` socket namespace (same broadcast
// pattern as the KDS screen's order updates) rather than only on mount — the
// Sidebar in particular mounts once for the whole app and never remounts on
// client-side navigation, and a save can come from a completely different
// device/tab, so a same-tab-only signal wouldn't be enough.
export function useStoreProfile(endpoint = '/settings') {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  useEffect(() => {
    function load() {
      apiClient
        .get(endpoint)
        .then(({ data }) => {
          const p = endpoint === '/settings' ? data.restaurantProfile || {} : data;
          setProfile({ name: p.name || DEFAULT_PROFILE.name, logoUrl: p.logoUrl || '' });
        })
        .catch(() => {});
    }

    load();
    const socket = io(`${SOCKET_URL}/settings`);
    socket.on('settings:updated', load);
    return () => socket.disconnect();
  }, [endpoint]);

  return profile;
}
