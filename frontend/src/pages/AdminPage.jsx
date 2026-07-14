import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import CategoriesPanel from '../features/admin/CategoriesPanel.jsx';
import MenuItemsPanel from '../features/admin/MenuItemsPanel.jsx';
import ModifierGroupsPanel from '../features/admin/ModifierGroupsPanel.jsx';
import DailyCostsPanel from '../features/admin/DailyCostsPanel.jsx';
import SalesReportPanel from '../features/admin/SalesReportPanel.jsx';
import SalesReportTablePanel from '../features/admin/SalesReportTablePanel.jsx';
import ItemSalesReportPanel from '../features/admin/ItemSalesReportPanel.jsx';
import { MENU_ADMIN_ROLES, REPORTS_ROLES } from '../features/auth/roles.js';
import TopBar from '../components/TopBar.jsx';

// Two separate tab GROUPS sharing this one page/route — the Sidebar's "Menu"
// and "Reports & Analytics" links both deep-link here via ?tab=, and each
// should only ever show its own group's tab bar, not one merged bar with
// every tab from both contexts.
const MENU_TABS = [
  { key: 'categories', label: 'Categories', Component: CategoriesPanel, roles: MENU_ADMIN_ROLES },
  { key: 'items', label: 'Menu Items', Component: MenuItemsPanel, roles: MENU_ADMIN_ROLES },
  { key: 'modifiers', label: 'Modifier Groups', Component: ModifierGroupsPanel, roles: MENU_ADMIN_ROLES },
];

// Sales Analytics (Daily/Weekly/Monthly/Yearly, one unified panel) replaced
// the old separate Daily Summary + Daily Sales Report + Monthly Sales Report
// tabs. Sales Report is a separate, plain tabular view of the same data.
const REPORTS_TABS = [
  { key: 'sales-analytics', label: 'Sales Analytics', Component: SalesReportPanel, roles: REPORTS_ROLES },
  { key: 'sales-report', label: 'Sales Report', Component: SalesReportTablePanel, roles: REPORTS_ROLES },
  { key: 'item-sales', label: 'Item-based Sales Report', Component: ItemSalesReportPanel, roles: REPORTS_ROLES },
  { key: 'costs', label: 'Daily Costs', Component: DailyCostsPanel, roles: REPORTS_ROLES },
];

const MENU_TAB_KEYS = MENU_TABS.map((t) => t.key);

export default function AdminPage() {
  const role = useSelector((state) => state.auth.user?.role);
  const [searchParams, setSearchParams] = useSearchParams();

  // The sidebar's "Menu"/"Reports & Analytics" links deep-link here via ?tab=,
  // so the requested tab (not component-local state) decides which group's
  // bar to show.
  const requestedTab = searchParams.get('tab');
  const group = MENU_TAB_KEYS.includes(requestedTab) ? MENU_TABS : REPORTS_TABS;
  const tabs = group.filter((tab) => tab.roles.includes(role));

  const activeTab = tabs.some((t) => t.key === requestedTab) ? requestedTab : tabs[0]?.key;
  const Active = tabs.find((t) => t.key === activeTab)?.Component;

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>

        <div className="mt-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSearchParams({ tab: tab.key })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-sm border border-gray-100 bg-white p-5 shadow-sm">
          {Active && <Active />}
        </div>
      </div>
    </div>
  );
}
