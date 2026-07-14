import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client.js';
import { IconEdit, IconTrash } from '../../components/icons.jsx';

export default function DailyCostsPanel() {
  const [costs, setCosts] = useState([]);
  const [error, setError] = useState(null);
  const [editingCost, setEditingCost] = useState(undefined); // undefined = closed, null = new, object = editing

  function loadCosts() {
    apiClient
      .get('/daily-costs')
      .then(({ data }) => {
        setCosts(data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load daily costs'));
  }

  useEffect(loadCosts, []);

  async function saveCost(payload) {
    if (editingCost && editingCost._id) {
      await apiClient.patch(`/daily-costs/${editingCost._id}`, payload);
    } else {
      await apiClient.post('/daily-costs', payload);
    }
    setEditingCost(undefined);
    loadCosts();
  }

  async function deleteCost(cost) {
    if (!window.confirm(`Delete the cost entry for ${cost.date}? This cannot be undone.`)) return;
    await apiClient.delete(`/daily-costs/${cost._id}`);
    loadCosts();
  }

  return (
    <div>
      <p className="text-sm text-gray-400">
        Daily running cost (food cost, labor, overhead — whatever you choose to track), shown alongside revenue on
        the Dashboard's Revenue chart.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <p className="text-sm text-gray-400">{costs.length} entr{costs.length === 1 ? 'y' : 'ies'}</p>
        <button
          type="button"
          onClick={() => setEditingCost(null)}
          className="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-600"
        >
          + Add Cost
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <table className="mt-4 w-full table-fixed text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="w-1/4 pb-2">Date</th>
            <th className="w-1/4 pb-2">Amount</th>
            <th className="pb-2">Notes</th>
            <th className="w-24 pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {costs.map((c) => (
            <tr key={c._id} className="h-14 border-t border-gray-100">
              <td className="py-2 font-medium text-gray-900">{c.date}</td>
              <td className="py-2">€{c.amount.toFixed(2)}</td>
              <td className="truncate py-2 text-gray-500">{c.notes || '—'}</td>
              <td className="py-2">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCost(c)}
                    title="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50"
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCost(c)}
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

      {costs.length === 0 && !error && (
        <p className="mt-4 text-sm text-gray-400">No cost entries yet — add your first one.</p>
      )}

      {editingCost !== undefined && (
        <DailyCostFormModal cost={editingCost} onCancel={() => setEditingCost(undefined)} onSave={saveCost} />
      )}
    </div>
  );
}

function DailyCostFormModal({ cost, onCancel, onSave }) {
  const [date, setDate] = useState(cost?.date || new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(cost?.amount ?? '');
  const [notes, setNotes] = useState(cost?.notes || '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ date, amount: Number(amount), notes });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save cost entry');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-sm bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">{cost ? 'Edit Cost' : 'Add Cost'}</h2>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Date
          <input
            required
            autoFocus
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Amount (€)
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Notes
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Food cost + labor"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
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
