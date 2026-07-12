import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client.js';

export default function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [error, setError] = useState(null);

  async function refresh() {
    const { data } = await apiClient.get('/admin/categories');
    setCategories(data);
  }

  useEffect(() => {
    apiClient.get('/admin/categories').then(({ data }) => setCategories(data));
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/admin/categories', { name, sortOrder: Number(sortOrder) });
      setName('');
      setSortOrder(0);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create category');
    }
  }

  async function handleUpdate(id, patch) {
    await apiClient.patch(`/admin/categories/${id}`, patch);
    await refresh();
  }

  async function handleDelete(id) {
    await apiClient.delete(`/admin/categories/${id}`);
    await refresh();
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex items-end gap-2 border-b border-gray-200 pb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 rounded-md border border-gray-300 px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Sort order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-1 w-20 rounded-md border border-gray-300 px-2 py-1"
          />
        </div>
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-1.5 text-white">
          Add Category
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="pb-2">Name</th>
            <th className="pb-2">Sort</th>
            <th className="pb-2">Active</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c._id} className="border-t border-gray-100">
              <td className="py-2">
                <input
                  defaultValue={c.name}
                  onBlur={(e) => e.target.value !== c.name && handleUpdate(c._id, { name: e.target.value })}
                  className="rounded border border-transparent px-1 hover:border-gray-200"
                />
              </td>
              <td className="py-2">
                <input
                  type="number"
                  defaultValue={c.sortOrder}
                  onBlur={(e) =>
                    Number(e.target.value) !== c.sortOrder &&
                    handleUpdate(c._id, { sortOrder: Number(e.target.value) })
                  }
                  className="w-16 rounded border border-transparent px-1 hover:border-gray-200"
                />
              </td>
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={c.active}
                  onChange={(e) => handleUpdate(c._id, { active: e.target.checked })}
                />
              </td>
              <td className="py-2 text-right">
                <button
                  type="button"
                  onClick={() => handleDelete(c._id)}
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
