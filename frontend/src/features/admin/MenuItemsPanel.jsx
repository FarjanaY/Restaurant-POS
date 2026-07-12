import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client.js';

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  basePrice: '',
  taxCategoryId: '',
  sortOrder: 0,
  modifierGroupIds: [],
};

export default function MenuItemsPanel() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxCategories, setTaxCategories] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  async function refresh() {
    const [itemsRes, categoriesRes, taxRes, groupsRes] = await Promise.all([
      apiClient.get('/admin/menu-items'),
      apiClient.get('/admin/categories'),
      apiClient.get('/admin/tax-categories'),
      apiClient.get('/admin/modifier-groups'),
    ]);
    setItems(itemsRes.data);
    setCategories(categoriesRes.data);
    setTaxCategories(taxRes.data);
    setModifierGroups(groupsRes.data);
  }

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/menu-items'),
      apiClient.get('/admin/categories'),
      apiClient.get('/admin/tax-categories'),
      apiClient.get('/admin/modifier-groups'),
    ]).then(([itemsRes, categoriesRes, taxRes, groupsRes]) => {
      setItems(itemsRes.data);
      setCategories(categoriesRes.data);
      setTaxCategories(taxRes.data);
      setModifierGroups(groupsRes.data);
    });
  }, []);

  function toggleModifierGroup(id) {
    setForm((f) => ({
      ...f,
      modifierGroupIds: f.modifierGroupIds.includes(id)
        ? f.modifierGroupIds.filter((g) => g !== id)
        : [...f.modifierGroupIds, id],
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/admin/menu-items', {
        ...form,
        basePrice: Number(form.basePrice),
        sortOrder: Number(form.sortOrder),
      });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create menu item');
    }
  }

  async function handleUpdate(id, patch) {
    await apiClient.patch(`/admin/menu-items/${id}`, patch);
    await refresh();
  }

  async function handleDelete(id) {
    await apiClient.delete(`/admin/menu-items/${id}`);
    await refresh();
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2 border-b border-gray-200 pb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="mt-1 rounded-md border border-gray-300 px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Category</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            required
            className="mt-1 rounded-md border border-gray-300 px-2 py-1"
          >
            <option value="" disabled>
              Select…
            </option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Base price (€)</label>
          <input
            type="number"
            step="0.01"
            value={form.basePrice}
            onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
            required
            className="mt-1 w-24 rounded-md border border-gray-300 px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Tax category</label>
          <select
            value={form.taxCategoryId}
            onChange={(e) => setForm((f) => ({ ...f, taxCategoryId: e.target.value }))}
            required
            className="mt-1 rounded-md border border-gray-300 px-2 py-1"
          >
            <option value="" disabled>
              Select…
            </option>
            {taxCategories.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Sort order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            className="mt-1 w-20 rounded-md border border-gray-300 px-2 py-1"
          />
        </div>

        <div className="w-full">
          <label className="block text-xs font-medium text-gray-500">Modifier groups</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {modifierGroups.map((g) => (
              <label key={g._id} className="flex items-center gap-1 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.modifierGroupIds.includes(g._id)}
                  onChange={() => toggleModifierGroup(g._id)}
                />
                {g.name}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="rounded-md bg-gray-900 px-4 py-1.5 text-white">
          Add Menu Item
        </button>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="pb-2">Name</th>
            <th className="pb-2">Category</th>
            <th className="pb-2">Price</th>
            <th className="pb-2">Tax</th>
            <th className="pb-2">Sort</th>
            <th className="pb-2">Active</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id} className="border-t border-gray-100">
              <td className="py-2">{item.name}</td>
              <td className="py-2">{categories.find((c) => c._id === item.categoryId)?.name || '—'}</td>
              <td className="py-2">
                <input
                  type="number"
                  step="0.01"
                  defaultValue={item.basePrice}
                  onBlur={(e) =>
                    Number(e.target.value) !== item.basePrice &&
                    handleUpdate(item._id, { basePrice: Number(e.target.value) })
                  }
                  className="w-20 rounded border border-transparent px-1 hover:border-gray-200"
                />
              </td>
              <td className="py-2">{taxCategories.find((t) => t._id === item.taxCategoryId)?.name || '—'}</td>
              <td className="py-2">
                <input
                  type="number"
                  defaultValue={item.sortOrder}
                  onBlur={(e) =>
                    Number(e.target.value) !== item.sortOrder &&
                    handleUpdate(item._id, { sortOrder: Number(e.target.value) })
                  }
                  className="w-16 rounded border border-transparent px-1 hover:border-gray-200"
                />
              </td>
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={(e) => handleUpdate(item._id, { active: e.target.checked })}
                />
              </td>
              <td className="py-2 text-right">
                <button
                  type="button"
                  onClick={() => handleDelete(item._id)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
