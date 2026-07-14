import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client.js';

const EMPTY_FORM = { name: '', minSelect: 0, maxSelect: 1, required: false, modifiers: [] };

export default function ModifierGroupsPanel() {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);

  async function refresh() {
    const { data } = await apiClient.get('/admin/modifier-groups');
    setGroups(data);
  }

  useEffect(() => {
    apiClient.get('/admin/modifier-groups').then(({ data }) => setGroups(data));
  }, []);

  function addModifierRow() {
    setForm((f) => ({ ...f, modifiers: [...f.modifiers, { name: '', priceDelta: 0 }] }));
  }

  function updateModifierRow(index, patch) {
    setForm((f) => ({
      ...f,
      modifiers: f.modifiers.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }));
  }

  function removeModifierRow(index) {
    setForm((f) => ({ ...f, modifiers: f.modifiers.filter((_, i) => i !== index) }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/admin/modifier-groups', {
        ...form,
        minSelect: Number(form.minSelect),
        maxSelect: Number(form.maxSelect),
        modifiers: form.modifiers.map((m) => ({ ...m, priceDelta: Number(m.priceDelta) })),
      });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create modifier group');
    }
  }

  async function handleDelete(id) {
    await apiClient.delete(`/admin/modifier-groups/${id}`);
    await refresh();
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="space-y-3 border-b border-gray-200 pb-4">
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
<<<<<<< HEAD
              className="mt-1 rounded-lg border border-gray-300 px-2 py-1"
=======
              className="mt-1 rounded-md border border-gray-300 px-2 py-1"
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Min select</label>
            <input
              type="number"
              value={form.minSelect}
              onChange={(e) => setForm((f) => ({ ...f, minSelect: e.target.value }))}
<<<<<<< HEAD
              className="mt-1 w-20 rounded-lg border border-gray-300 px-2 py-1"
=======
              className="mt-1 w-20 rounded-md border border-gray-300 px-2 py-1"
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Max select</label>
            <input
              type="number"
              value={form.maxSelect}
              onChange={(e) => setForm((f) => ({ ...f, maxSelect: e.target.value }))}
<<<<<<< HEAD
              className="mt-1 w-20 rounded-lg border border-gray-300 px-2 py-1"
=======
              className="mt-1 w-20 rounded-md border border-gray-300 px-2 py-1"
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
            />
          </div>
          <label className="flex items-center gap-1 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.required}
              onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
            />
            Required
          </label>
        </div>

        <div className="space-y-2">
          {form.modifiers.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                placeholder="Modifier name"
                value={m.name}
                onChange={(e) => updateModifierRow(i, { name: e.target.value })}
<<<<<<< HEAD
                className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
=======
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price delta"
                value={m.priceDelta}
                onChange={(e) => updateModifierRow(i, { priceDelta: e.target.value })}
<<<<<<< HEAD
                className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm"
=======
                className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
              />
              <button type="button" onClick={() => removeModifierRow(i)} className="text-xs text-red-600">
                Remove
              </button>
            </div>
          ))}
<<<<<<< HEAD
          <button type="button" onClick={addModifierRow} className="text-sm font-medium text-indigo-500 hover:text-indigo-600">
=======
          <button type="button" onClick={addModifierRow} className="text-sm text-gray-600 underline">
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
            + Add modifier option
          </button>
        </div>

<<<<<<< HEAD
        <button type="submit" className="rounded-lg bg-indigo-500 px-4 py-1.5 text-white transition hover:bg-indigo-600">
=======
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-1.5 text-white">
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
          Add Modifier Group
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div className="mt-4 space-y-3">
        {groups.map((g) => (
          <div key={g._id} className="rounded border border-gray-200 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">
                {g.name} ({g.minSelect}-{g.maxSelect}{g.required ? ', required' : ''})
              </span>
              <button
                type="button"
                onClick={() => handleDelete(g._id)}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                Delete
              </button>
            </div>
            <p className="mt-1 text-gray-500">
              {g.modifiers.map((m) => `${m.name} (+€${m.priceDelta.toFixed(2)})`).join(', ') || 'No options'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
