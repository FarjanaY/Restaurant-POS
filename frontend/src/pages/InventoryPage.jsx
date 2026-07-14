import { useEffect, useState } from 'react';

import { apiClient } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import { IconBox, IconTrash } from '../components/icons.jsx';
import { useListLayout } from '../hooks/useListLayout.js';

export default function InventoryPage() {
  const listLayout = useListLayout('inventory');
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(undefined); // undefined = closed, null = new, object = editing
  const [adjustValues, setAdjustValues] = useState({});

  function loadItems() {
    apiClient
      .get('/inventory')
      .then(({ data }) => {
        setItems(data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load inventory'));
  }

  useEffect(loadItems, []);

  async function saveItem(payload) {
    if (editingItem && editingItem._id) {
      await apiClient.patch(`/inventory/${editingItem._id}`, payload);
    } else {
      await apiClient.post('/inventory', payload);
    }
    setEditingItem(undefined);
    loadItems();
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete "${item.name}" from inventory?`)) return;
    await apiClient.delete(`/inventory/${item._id}`);
    loadItems();
  }

  async function adjustItem(item, sign) {
    const raw = Number(adjustValues[item._id]);
    if (!raw || raw <= 0) return;
    await apiClient.patch(`/inventory/${item._id}/adjust`, { delta: raw * sign });
    setAdjustValues((prev) => ({ ...prev, [item._id]: '' }));
    loadItems();
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-400">{items.length} item(s) tracked</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingItem(null)}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            + Add Item
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {listLayout === 'table' && (
        <div className="mt-4 overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">On Hand</th>
                <th className="px-4 py-3">Low Stock At</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Adjust</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => {
                const low = item.quantityOnHand <= item.lowStockThreshold;
                return (
                  <tr key={item._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.quantityOnHand} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.lowStockThreshold} {item.unit}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          low ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {low ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={adjustValues[item._id] || ''}
                          onChange={(e) => setAdjustValues((prev) => ({ ...prev, [item._id]: e.target.value }))}
                          placeholder="qty"
                          className="w-16 rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => adjustItem(item, 1)}
                          className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                        >
                          + Restock
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustItem(item, -1)}
                          className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          − Use
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
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
                );
              })}
            </tbody>
          </table>
        </div>
        )}

        {listLayout === 'card' && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const low = item.quantityOnHand <= item.lowStockThreshold;
            return (
              <div key={item._id} className="rounded-sm border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      low ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {low ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">On Hand</p>
                    <p className="text-gray-600">
                      {item.quantityOnHand} {item.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Low Stock At</p>
                    <p className="text-gray-500">
                      {item.lowStockThreshold} {item.unit}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={adjustValues[item._id] || ''}
                    onChange={(e) => setAdjustValues((prev) => ({ ...prev, [item._id]: e.target.value }))}
                    placeholder="qty"
                    className="w-16 rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-indigo-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustItem(item, 1)}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                  >
                    + Restock
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustItem(item, -1)}
                    className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    − Use
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
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
            );
          })}
        </div>
        )}

        {items.length === 0 && (
          <div className="mt-4 flex flex-col items-center justify-center rounded-sm border border-gray-100 bg-white py-16 text-center shadow-sm">
            <IconBox className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-400">No inventory items yet — add your first one.</p>
          </div>
        )}
      </div>

      {editingItem !== undefined && (
        <InventoryFormModal item={editingItem} onCancel={() => setEditingItem(undefined)} onSave={saveItem} />
      )}
    </div>
  );
}

function InventoryFormModal({ item, onCancel, onSave }) {
  const [name, setName] = useState(item?.name || '');
  const [unit, setUnit] = useState(item?.unit || 'pcs');
  const [quantityOnHand, setQuantityOnHand] = useState(item?.quantityOnHand ?? 0);
  const [lowStockThreshold, setLowStockThreshold] = useState(item?.lowStockThreshold ?? 0);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name,
        unit,
        quantityOnHand: Number(quantityOnHand),
        lowStockThreshold: Number(lowStockThreshold),
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save inventory item');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-sm bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">{item ? 'Edit Item' : 'Add Item'}</h2>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Name
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Flour"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Unit
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. kg, L, pcs"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-gray-700">
            Quantity on hand
            <input
              type="number"
              min="0"
              value={quantityOnHand}
              onChange={(e) => setQuantityOnHand(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Low stock at
            <input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>

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
