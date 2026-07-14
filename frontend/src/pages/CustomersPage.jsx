import { useEffect, useState } from 'react';

import { apiClient } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import { IconUsers, IconTrash } from '../components/icons.jsx';
import { useListLayout } from '../hooks/useListLayout.js';

export default function CustomersPage() {
  const listLayout = useListLayout('customers');
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(undefined); // undefined = closed, null = new, object = editing

  function loadCustomers() {
    apiClient
      .get('/customers')
      .then(({ data }) => {
        setCustomers(data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load customers'));
  }

  useEffect(loadCustomers, []);

  async function saveCustomer(payload) {
    if (editingCustomer && editingCustomer._id) {
      await apiClient.patch(`/customers/${editingCustomer._id}`, payload);
    } else {
      await apiClient.post('/customers', payload);
    }
    setEditingCustomer(undefined);
    loadCustomers();
  }

  async function deleteCustomer(customer) {
    if (!window.confirm(`Delete "${customer.name}"? This cannot be undone.`)) return;
    await apiClient.delete(`/customers/${customer._id}`);
    loadCustomers();
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <IconUsers className="h-10 w-10 text-gray-300" />
      <p className="mt-3 text-sm font-medium text-gray-400">No customers yet — add your first one.</p>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-400">{customers.length} customer(s)</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingCustomer(null)}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            + Add Customer
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {listLayout === 'table' && (
          <div className="mt-4 overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{customer.name}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.phone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.email || '—'}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-500">{customer.notes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingCustomer(customer)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCustomer(customer)}
                        className="ml-1 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {customers.length === 0 && emptyState}
          </div>
        )}

        {listLayout === 'card' && (
          <div className="mt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {customers.map((customer) => (
                <div key={customer._id} className="rounded-sm border border-gray-100 bg-white p-4 shadow-sm">
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="text-gray-400">Phone: </span>
                    {customer.phone || '—'}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="text-gray-400">Email: </span>
                    {customer.email || '—'}
                  </p>
                  <p className="mt-1 truncate text-sm text-gray-500">
                    <span className="text-gray-400">Notes: </span>
                    {customer.notes || '—'}
                  </p>
                  <div className="mt-3 flex justify-end gap-1 border-t border-gray-50 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingCustomer(customer)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCustomer(customer)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {customers.length === 0 && (
              <div className="rounded-sm border border-gray-100 bg-white shadow-sm">{emptyState}</div>
            )}
          </div>
        )}
      </div>

      {editingCustomer !== undefined && (
        <CustomerFormModal
          customer={editingCustomer}
          onCancel={() => setEditingCustomer(undefined)}
          onSave={saveCustomer}
        />
      )}
    </div>
  );
}

function CustomerFormModal({ customer, onCancel, onSave }) {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ name, phone, email, notes });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save customer');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-sm bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">{customer ? 'Edit Customer' : 'Add Customer'}</h2>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Name
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jamie Diner"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Phone
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
