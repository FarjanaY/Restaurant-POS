import { useState } from 'react';

import CategoriesPanel from '../features/admin/CategoriesPanel.jsx';
import MenuItemsPanel from '../features/admin/MenuItemsPanel.jsx';
import ModifierGroupsPanel from '../features/admin/ModifierGroupsPanel.jsx';
import DailySummaryPanel from '../features/admin/DailySummaryPanel.jsx';

const TABS = [
  { key: 'categories', label: 'Categories', Component: CategoriesPanel },
  { key: 'items', label: 'Menu Items', Component: MenuItemsPanel },
  { key: 'modifiers', label: 'Modifier Groups', Component: ModifierGroupsPanel },
  { key: 'reports', label: 'Daily Summary', Component: DailySummaryPanel },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const Active = TABS.find((t) => t.key === activeTab).Component;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>

      <div className="mt-4 flex gap-2 border-b border-gray-200 pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === tab.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Active />
      </div>
    </div>
  );
}
