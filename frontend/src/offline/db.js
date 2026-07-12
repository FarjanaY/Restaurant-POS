import Dexie from 'dexie';

// Local-first order queue — orders are written here first, then synced to the
// server; each row carries a client-generated id so retries are idempotent.
export const offlineDb = new Dexie('restaurant-pos-offline');

offlineDb.version(1).stores({
  pendingOrders: 'clientOrderId, syncStatus, createdAt',
});
