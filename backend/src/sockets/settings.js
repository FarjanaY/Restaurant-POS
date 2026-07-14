let settingsNamespace = null;

export function registerSettingsNamespace(io) {
  settingsNamespace = io.of('/settings');
  return settingsNamespace;
}

// No-op when no socket server is attached (e.g. controller/route tests that import
// app.js directly without booting server.js) — same pattern as sockets/kds.js.
// Broadcast, not targeted: every connected client (Sidebar, login screen, receipts
// on any device/tab) re-fetches branding the moment an admin saves Store Settings.
export function emitSettingsUpdated() {
  settingsNamespace?.emit('settings:updated');
}
