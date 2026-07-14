import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client.js';
<<<<<<< HEAD
import { IconTrash } from '../../components/icons.jsx';
import { useListLayout } from '../../hooks/useListLayout.js';

export default function MenuItemsPanel() {
  const listLayout = useListLayout('items');
=======

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  basePrice: '',
  taxCategoryId: '',
  sortOrder: 0,
  modifierGroupIds: [],
};

export default function MenuItemsPanel() {
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxCategories, setTaxCategories] = useState([]);
  const [modifierGroups, setModifierGroups] = useState([]);
<<<<<<< HEAD
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(undefined); // undefined = closed, null = new, object = editing

  function loadAll() {
=======
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
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
    Promise.all([
      apiClient.get('/admin/menu-items'),
      apiClient.get('/admin/categories'),
      apiClient.get('/admin/tax-categories'),
      apiClient.get('/admin/modifier-groups'),
<<<<<<< HEAD
    ])
      .then(([itemsRes, categoriesRes, taxRes, groupsRes]) => {
        setItems(itemsRes.data);
        setCategories(categoriesRes.data);
        setTaxCategories(taxRes.data);
        setModifierGroups(groupsRes.data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load menu items'));
  }

  useEffect(loadAll, []);

  async function saveItem(payload) {
    if (editingItem && editingItem._id) {
      await apiClient.patch(`/admin/menu-items/${editingItem._id}`, payload);
    } else {
      await apiClient.post('/admin/menu-items', payload);
    }
    setEditingItem(undefined);
    loadAll();
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    await apiClient.delete(`/admin/menu-items/${item._id}`);
    loadAll();
=======
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
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
  }

  return (
    <div>
<<<<<<< HEAD
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <p className="text-sm text-gray-400">{items.length} item{items.length === 1 ? '' : 's'}</p>
        <button
          type="button"
          onClick={() => setEditingItem(null)}
          className="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
        >
          + Add Menu Item
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {listLayout === 'table' && (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="pb-2">Image</th>
              <th className="pb-2">Name</th>
              <th className="pb-2">Category</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">Tax</th>
              <th className="pb-2">Sort</th>
              <th className="pb-2">Promo</th>
              <th className="pb-2">Active</th>
              <th className="pb-2">Available</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-t border-gray-100">
                <td className="py-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-indigo-50 text-lg">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : '🍽️'}
                  </div>
                </td>
                <td className="py-2">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                </td>
                <td className="py-2">{categories.find((c) => c._id === item.categoryId)?.name || '—'}</td>
                <td className="py-2">€{item.basePrice.toFixed(2)}</td>
                <td className="py-2">{taxCategories.find((t) => t._id === item.taxCategoryId)?.name || '—'}</td>
                <td className="py-2">{item.sortOrder}</td>
                <td className="py-2">{item.promoLabel || '—'}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.available ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.available ? 'Available' : 'Not Available'}
                  </span>
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    className="ml-1 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {listLayout === 'card' && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <div key={item._id} className="overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
              <div className="flex h-28 w-full items-center justify-center bg-gray-50 text-3xl">
                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : '🍽️'}
              </div>
              <div className="p-3">
                <div className="font-semibold text-gray-900">{item.name}</div>
                {item.description && (
                  <div className="mt-0.5 truncate text-xs text-gray-500" title={item.description}>
                    {item.description}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{categories.find((c) => c._id === item.categoryId)?.name || '—'}</span>
                  <span className="font-medium text-gray-900">€{item.basePrice.toFixed(2)}</span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                  <span>{taxCategories.find((t) => t._id === item.taxCategoryId)?.name || '—'}</span>
                  <span>Sort: {item.sortOrder}</span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.active ? 'Active' : 'Inactive'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.available ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.available ? 'Available' : 'Not Available'}
                  </span>
                  {item.promoLabel && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                      {item.promoLabel}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !error && (
        <p className="mt-4 text-sm text-gray-400">No menu items yet — add your first one.</p>
      )}

      {editingItem !== undefined && (
        <MenuItemFormModal
          item={editingItem}
          categories={categories}
          taxCategories={taxCategories}
          modifierGroups={modifierGroups}
          onCancel={() => setEditingItem(undefined)}
          onSave={saveItem}
        />
      )}
    </div>
  );
}

function MenuItemFormModal({ item, categories, taxCategories, modifierGroups, onCancel, onSave }) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [categoryId, setCategoryId] = useState(item?.categoryId || '');
  const [basePrice, setBasePrice] = useState(item?.basePrice ?? '');
  const [taxCategoryId, setTaxCategoryId] = useState(item?.taxCategoryId || '');
  const [sortOrder, setSortOrder] = useState(item?.sortOrder ?? 0);
  const [promoLabel, setPromoLabel] = useState(item?.promoLabel || '');
  const [available, setAvailable] = useState(item?.available ?? true);
  const [active, setActive] = useState(item?.active ?? true);
  // listMenuItems populates modifierGroupIds with full group docs, not bare
  // ids — normalize to ids either way so the checkbox comparison below works.
  const [modifierGroupIds, setModifierGroupIds] = useState(
    (item?.modifierGroupIds || []).map((g) => (typeof g === 'string' ? g : g._id))
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function toggleModifierGroup(id) {
    setModifierGroupIds((ids) => (ids.includes(id) ? ids.filter((g) => g !== id) : [...ids, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name,
        description,
        imageUrl,
        categoryId,
        basePrice: Number(basePrice),
        taxCategoryId,
        sortOrder: Number(sortOrder),
        promoLabel,
        available,
        active,
        modifierGroupIds,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save menu item');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-gray-900">{item ? 'Edit Menu Item' : 'Add Menu Item'}</h2>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Name
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-gray-700">
            Category
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Tax category
            <select
              required
              value={taxCategoryId}
              onChange={(e) => setTaxCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Base price (€)
            <input
              required
              type="number"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Sort order
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Shown under the item name on the Register menu"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Image URL
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://… — leave blank to use a category emoji instead"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        {imageUrl && (
          <div className="mt-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Promo label
          <input
            value={promoLabel}
            onChange={(e) => setPromoLabel(e.target.value)}
            placeholder="e.g. 20% OFF — leave blank for none"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <div className="mt-3 flex gap-4">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-4 w-4" />
            Available
          </label>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
            Active
          </label>
        </div>

        <div className="mt-3">
=======
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
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
          <label className="block text-xs font-medium text-gray-500">Modifier groups</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {modifierGroups.map((g) => (
              <label key={g._id} className="flex items-center gap-1 text-sm text-gray-700">
                <input
                  type="checkbox"
<<<<<<< HEAD
                  checked={modifierGroupIds.includes(g._id)}
=======
                  checked={form.modifierGroupIds.includes(g._id)}
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
                  onChange={() => toggleModifierGroup(g._id)}
                />
                {g.name}
              </label>
            ))}
          </div>
        </div>

<<<<<<< HEAD
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-indigo-500 py-2 text-white transition hover:bg-indigo-600 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
=======
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
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
    </div>
  );
}
