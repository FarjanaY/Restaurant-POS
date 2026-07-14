import { useEffect, useState } from 'react';

import { apiClient } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import { IconUserCheck } from '../components/icons.jsx';
import { useListLayout } from '../hooks/useListLayout.js';

const ROLES = ['admin', 'manager', 'cashier', 'kitchen'];

const ROLE_BADGE = {
  admin: 'bg-indigo-100 text-indigo-600',
  manager: 'bg-blue-100 text-blue-700',
  cashier: 'bg-emerald-100 text-emerald-700',
  kitchen: 'bg-amber-100 text-amber-700',
};

export default function StaffPage() {
  const listLayout = useListLayout('staff');
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState(null);
  const [editingStaff, setEditingStaff] = useState(undefined); // undefined = closed, null = new, object = editing

  function loadStaff() {
    apiClient
      .get('/staff')
      .then(({ data }) => {
        setStaff(data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load staff'));
  }

  useEffect(loadStaff, []);

  async function saveStaff(payload) {
    if (editingStaff && editingStaff._id) {
      await apiClient.patch(`/staff/${editingStaff._id}`, payload);
    } else {
      await apiClient.post('/staff', payload);
    }
    setEditingStaff(undefined);
    loadStaff();
  }

  async function toggleActive(member) {
    if (member.active) {
      if (!window.confirm(`Deactivate ${member.name}? They won't be able to log in until reactivated.`)) return;
      await apiClient.delete(`/staff/${member._id}`);
    } else {
      await apiClient.patch(`/staff/${member._id}`, { active: true });
    }
    loadStaff();
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Staff</h1>
            <p className="text-sm text-gray-400">{staff.length} staff member(s)</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingStaff(null)}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            + Add Staff
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
          {listLayout === 'table' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staff.map((member) => (
                  <tr key={member._id} className={member.active ? '' : 'opacity-50'}>
                    <td className="px-4 py-3 font-medium text-gray-900">{member.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${ROLE_BADGE[member.role]}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          member.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingStaff(member)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(member)}
                        className="ml-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                      >
                        {member.active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {staff.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconUserCheck className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-400">No staff yet — add your first one.</p>
            </div>
          )}
        </div>

        {listLayout === 'card' && staff.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {staff.map((member) => (
              <div
                key={member._id}
                className={`rounded-sm border border-gray-100 bg-white p-4 shadow-sm ${member.active ? '' : 'opacity-50'}`}
              >
                <p className="font-medium text-gray-900">{member.name}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${ROLE_BADGE[member.role]}`}>
                    {member.role}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      member.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {member.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 flex justify-end gap-1 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingStaff(member)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(member)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    {member.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingStaff !== undefined && (
        <StaffFormModal staff={editingStaff} onCancel={() => setEditingStaff(undefined)} onSave={saveStaff} />
      )}
    </div>
  );
}

function StaffFormModal({ staff, onCancel, onSave }) {
  const [name, setName] = useState(staff?.name || '');
  const [role, setRole] = useState(staff?.role || 'cashier');
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name, role };
      if (pin) payload.pin = pin;
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save staff member');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-sm bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">{staff ? 'Edit Staff' : 'Add Staff'}</h2>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Name
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jordan Lee"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 capitalize focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          {staff ? 'Reset PIN' : 'PIN'} <span className="font-normal text-gray-400">{staff ? '(optional)' : '(4-6 digits)'}</span>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder={staff ? 'Leave blank to keep current PIN' : 'e.g. 1234'}
            inputMode="numeric"
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
