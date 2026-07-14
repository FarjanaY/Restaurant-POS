// Mirrors the backend's role gates (backend/src/routes/orders.js, admin.js,
// reports.js) so the UI hides/disables what a role has no real access to,
// instead of showing controls that silently 403.
export const REGISTER_ROLES = ['admin', 'manager', 'cashier'];
export const KDS_VIEW_ROLES = ['admin', 'manager', 'cashier', 'kitchen'];
export const KDS_BUMP_ROLES = ['admin', 'manager', 'kitchen'];
export const MENU_ADMIN_ROLES = ['admin'];
export const REPORTS_ROLES = ['admin', 'manager'];
export const ADMIN_AREA_ROLES = ['admin', 'manager'];
export const STAFF_ADMIN_ROLES = ['admin'];
export const DISCOUNT_ROLES = ['admin', 'manager'];
