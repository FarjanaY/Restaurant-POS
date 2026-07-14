import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  REGISTER_ROLES,
  KDS_VIEW_ROLES,
  MENU_ADMIN_ROLES,
  REPORTS_ROLES,
  ADMIN_AREA_ROLES,
  STAFF_ADMIN_ROLES,
  DISCOUNT_ROLES,
} from '../features/auth/roles.js';
import { useSidebar } from './SidebarContext.jsx';
import { useStoreProfile } from '../hooks/useStoreProfile.js';
import {
  IconGrid,
  IconClipboard,
  IconHome,
  IconList,
  IconTable,
  IconBook,
  IconBox,
  IconUsers,
  IconUserCheck,
  IconBarChart,
  IconSliders,
  IconTag,
} from './icons.jsx';

// Real, wired-up pages.
const LIVE_ITEMS = [
  { to: '/', label: 'POS', roles: REGISTER_ROLES, Icon: IconGrid },
  { to: '/kds', label: 'Kitchen', roles: KDS_VIEW_ROLES, Icon: IconClipboard },
  { to: '/dashboard', label: 'Dashboard', roles: ADMIN_AREA_ROLES, Icon: IconHome },
  { to: '/orders', label: 'Orders', roles: ADMIN_AREA_ROLES, Icon: IconList },
  { to: '/tables', label: 'Tables', roles: ADMIN_AREA_ROLES, Icon: IconTable },
  { to: '/staff', label: 'Staff', roles: STAFF_ADMIN_ROLES, Icon: IconUserCheck },
  {
    to: '/admin?tab=categories',
    match: '/admin',
    matchTabs: ['categories', 'items', 'modifiers'],
    label: 'Menu',
    roles: MENU_ADMIN_ROLES,
    Icon: IconBook,
  },
  {
    to: '/admin?tab=sales-analytics',
    match: '/admin',
    matchTabs: ['sales-analytics', 'sales-report', 'item-sales', 'costs'],
    label: 'Reports & Analytics',
    roles: REPORTS_ROLES,
    Icon: IconBarChart,
  },
  { to: '/discount', label: 'Discount', roles: DISCOUNT_ROLES, Icon: IconTag },
  { to: '/inventory', label: 'Inventory', roles: ADMIN_AREA_ROLES, Icon: IconBox },
  { to: '/customers', label: 'Customers', roles: ADMIN_AREA_ROLES, Icon: IconUsers },
  { to: '/settings', label: 'Store Settings', roles: ADMIN_AREA_ROLES, Icon: IconSliders },
];

// Nothing left unbuilt for now — kept as an empty list (rather than removing
// the section outright) so the next planned-but-not-built feature has an
// obvious place to go.
const PLANNED_ITEMS = [];

function tabParamOf(to) {
  return new URL(to, 'http://x').searchParams.get('tab');
}

export default function Sidebar() {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role;
  const location = useLocation();
  const activeTab = new URLSearchParams(location.search).get('tab');
  const { collapsed } = useSidebar();
  const initial = user?.name?.[0]?.toUpperCase() || '?';
  const storeProfile = useStoreProfile();

  const liveItems = LIVE_ITEMS.filter((item) => item.roles.includes(role));
  const plannedItems = PLANNED_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-x-hidden bg-slate-900 transition-[width] duration-200 ease-in-out ${
        collapsed ? 'w-16' : 'w-44 lg:w-56'
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-indigo-500 text-sm font-bold text-white">
          {storeProfile.logoUrl ? (
            <img src={storeProfile.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            storeProfile.name[0].toUpperCase()
          )}
        </div>
        <span
          className={`overflow-hidden whitespace-nowrap text-lg font-semibold text-white transition-[max-width,opacity] duration-200 ease-in-out ${
            collapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
          }`}
        >
          {storeProfile.name}
        </span>
      </div>

      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3">
        {liveItems.map((item) => {
          const isActive = item.match
            ? location.pathname === item.match && (item.matchTabs || [tabParamOf(item.to)]).includes(activeTab)
            : location.pathname === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={`flex items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.Icon className="h-5 w-5 shrink-0" />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-in-out ${
                  collapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {plannedItems.length > 0 && (
          <>
            {!collapsed ? (
              <div className="mb-1 mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Coming soon
              </div>
            ) : (
              <div className="my-3 border-t border-slate-800" />
            )}
            {plannedItems.map((item) => (
              <div
                key={item.label}
                title={`${item.label} — not built yet, planned for a later phase`}
                className={`flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 ${
                  collapsed ? 'justify-center' : 'justify-between'
                }`}
              >
                <span className="flex items-center gap-3">
                  <item.Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && item.label}
                </span>
                {!collapsed && (
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                    Soon
                  </span>
                )}
              </div>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-slate-800 px-3 py-4">
        <div className="flex items-center justify-start gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
            {initial}
          </div>
          <div
            className={`overflow-hidden text-sm leading-tight transition-[max-width,opacity] duration-200 ease-in-out ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'
            }`}
          >
            <div className="truncate font-medium text-white">{user?.name}</div>
            <div className="truncate text-xs capitalize text-slate-400">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
