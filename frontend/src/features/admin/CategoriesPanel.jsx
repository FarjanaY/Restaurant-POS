import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client.js';
import { IconEdit, IconTrash } from '../../components/icons.jsx';
import { useListLayout } from '../../hooks/useListLayout.js';

export default function CategoriesPanel() {
  const listLayout = useListLayout('categories');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(undefined); // undefined = closed, null = new, object = editing

  function loadCategories() {
    apiClient
      .get('/admin/categories')
      .then(({ data }) => {
        setCategories(data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load categories'));
  }

  useEffect(loadCategories, []);

  async function saveCategory(payload) {
    if (editingCategory && editingCategory._id) {
      await apiClient.patch(`/admin/categories/${editingCategory._id}`, payload);
    } else {
      await apiClient.post('/admin/categories', payload);
    }
    setEditingCategory(undefined);
    loadCategories();
  }

  async function deleteCategory(category) {
    if (!window.confirm(`Delete "${category.name}"? This cannot be undone.`)) return;
    await apiClient.delete(`/admin/categories/${category._id}`);
    loadCategories();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <p className="text-sm text-gray-400">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</p>
        <button
          type="button"
          onClick={() => setEditingCategory(null)}
          className="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
        >
          + Add Category
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {listLayout === 'table' && (
        <table className="mt-4 w-full table-fixed text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="w-1/5 pb-2">Image</th>
              <th className="w-1/5 pb-2">Name</th>
              <th className="w-1/5 pb-2">Sort</th>
              <th className="w-1/5 pb-2">Active</th>
              <th className="w-1/5 pb-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c._id} className="h-16 border-t border-gray-100">
                <td className="py-2">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-indigo-50 text-lg">
                    {c.imageUrl ? <img src={c.imageUrl} alt="" className="h-full w-full object-cover" /> : '🏷️'}
                  </div>
                </td>
                <td className="truncate py-2 font-medium text-gray-900">{c.name}</td>
                <td className="py-2">{c.sortOrder}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(c)}
                      title="Edit"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50"
                    >
                      <IconEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(c)}
                      title="Delete"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {listLayout === 'card' && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {categories.map((c) => (
            <div key={c._id} className="overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
              <div className="flex h-20 w-full items-center justify-center bg-gray-50 text-2xl">
                {c.imageUrl ? <img src={c.imageUrl} alt="" className="h-full w-full object-cover" /> : '🏷️'}
              </div>
              <div className="p-3">
                <p className="truncate font-semibold text-gray-900">{c.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Sort: {c.sortOrder}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {c.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(c)}
                    title="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50"
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(c)}
                    title="Delete"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {categories.length === 0 && !error && (
        <p className="mt-4 text-sm text-gray-400">No categories yet — add your first one.</p>
      )}

      {editingCategory !== undefined && (
        <CategoryFormModal
          category={editingCategory}
          onCancel={() => setEditingCategory(undefined)}
          onSave={saveCategory}
        />
      )}
    </div>
  );
}

function CategoryFormModal({ category, onCancel, onSave }) {
  const [name, setName] = useState(category?.name || '');
  const [imageUrl, setImageUrl] = useState(category?.imageUrl || '');
  const [sortOrder, setSortOrder] = useState(category?.sortOrder ?? 0);
  const [active, setActive] = useState(category?.active ?? true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ name, imageUrl, sortOrder: Number(sortOrder), active });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save category');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-sm bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">{category ? 'Edit Category' : 'Add Category'}</h2>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Name
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Drinks"
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
          Sort order
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-1 w-24 rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4"
          />
          Active
        </label>

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
    </div>
  );
}
