import { useEffect, useState } from 'react';

import { apiClient } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import Drawer from '../components/Drawer.jsx';
import OrderDetail, { STATUS_BADGE } from '../features/orders/OrderDetail.jsx';
import { IconTable, IconUsers, IconTrash, IconSliders } from '../components/icons.jsx';
import { useListLayout } from '../hooks/useListLayout.js';

export default function TablesPage() {
  const listLayout = useListLayout('tables');
  const [settings, setSettings] = useState(null);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState(null);
  const [savingToggle, setSavingToggle] = useState(false);
  const [editingTable, setEditingTable] = useState(undefined); // undefined = closed, null = new, object = editing
  const [openOrderId, setOpenOrderId] = useState(null);
  const [openOrder, setOpenOrder] = useState(null);

  function loadAll() {
    Promise.all([apiClient.get('/settings'), apiClient.get('/tables')])
      .then(([settingsRes, tablesRes]) => {
        setSettings(settingsRes.data);
        setTables(tablesRes.data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load tables'));
  }

  useEffect(loadAll, []);

  useEffect(() => {
    if (!openOrderId) return;
    apiClient.get(`/orders/${openOrderId}`).then(({ data }) => setOpenOrder(data));
  }, [openOrderId]);

  // Clears any previously-loaded order immediately on click, rather than in the
  // effect above, so the drawer never flashes stale data from the last table
  // while the new one's order is still in flight.
  function openOrderDrawer(orderId) {
    setOpenOrder(null);
    setOpenOrderId(orderId);
  }

  async function toggleTablesEnabled() {
    setSavingToggle(true);
    try {
      const { data } = await apiClient.patch('/settings', { tablesEnabled: !settings.tablesEnabled });
      setSettings(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update settings');
    } finally {
      setSavingToggle(false);
    }
  }

  async function saveTable(payload) {
    if (editingTable && editingTable._id) {
      await apiClient.patch(`/tables/${editingTable._id}`, payload);
    } else {
      await apiClient.post('/tables', payload);
    }
    setEditingTable(undefined);
    loadAll();
  }

  async function deleteTable(table) {
    if (!window.confirm(`Delete "${table.name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/tables/${table._id}`);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete table');
    }
  }

  const namedSections = [...new Set(tables.map((t) => t.section).filter(Boolean))];
  const unsectionedTables = tables.filter((t) => !t.section);

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Tables</h1>
            <p className="text-sm text-gray-400">
              Optional — turn this on only if your floor uses dine-in table service.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-sm border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IconSliders className="h-4 w-4 text-gray-400" />
              Table management
            </span>
            <ToggleSwitch
              checked={!!settings?.tablesEnabled}
              disabled={!settings || savingToggle}
              onChange={toggleTablesEnabled}
            />
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {settings && !settings.tablesEnabled && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-sm border border-dashed border-gray-200 bg-white py-16 text-center">
            <IconTable className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">Table management is turned off.</p>
            <p className="mt-1 max-w-sm text-sm text-gray-400">
              Quick-service and takeaway-only operations don't need this — flip the switch above if your
              venue seats dine-in guests at fixed tables.
            </p>
          </div>
        )}

        {settings?.tablesEnabled && (
          <>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-gray-500">{tables.length} table(s)</span>
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
              >
                + Add Table
              </button>
            </div>

            {namedSections.length > 0 ? (
              <>
                {namedSections.map((section) => (
                  <div key={section} className="mt-5">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">{section}</h2>
                    {listLayout === 'card' ? (
                      <TableGrid
                        tables={tables.filter((t) => t.section === section)}
                        onEdit={setEditingTable}
                        onDelete={deleteTable}
                        onOpenOrder={openOrderDrawer}
                      />
                    ) : (
                      <TableRows
                        tables={tables.filter((t) => t.section === section)}
                        onEdit={setEditingTable}
                        onDelete={deleteTable}
                        onOpenOrder={openOrderDrawer}
                      />
                    )}
                  </div>
                ))}
                {unsectionedTables.length > 0 && (
                  <div className="mt-5">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Other</h2>
                    {listLayout === 'card' ? (
                      <TableGrid
                        tables={unsectionedTables}
                        onEdit={setEditingTable}
                        onDelete={deleteTable}
                        onOpenOrder={openOrderDrawer}
                      />
                    ) : (
                      <TableRows
                        tables={unsectionedTables}
                        onEdit={setEditingTable}
                        onDelete={deleteTable}
                        onOpenOrder={openOrderDrawer}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-5">
                {listLayout === 'card' ? (
                  <TableGrid tables={tables} onEdit={setEditingTable} onDelete={deleteTable} onOpenOrder={openOrderDrawer} />
                ) : (
                  <TableRows tables={tables} onEdit={setEditingTable} onDelete={deleteTable} onOpenOrder={openOrderDrawer} />
                )}
              </div>
            )}

            {tables.length === 0 && (
              <div className="mt-5 flex flex-col items-center justify-center rounded-sm border border-dashed border-gray-200 bg-white py-16 text-center">
                <IconTable className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-400">No tables yet — add your first one.</p>
              </div>
            )}
          </>
        )}
      </div>

      {editingTable !== undefined && (
        <TableFormModal
          table={editingTable}
          onCancel={() => setEditingTable(undefined)}
          onSave={saveTable}
        />
      )}

      <Drawer
        open={!!openOrderId}
        onClose={() => setOpenOrderId(null)}
        title={openOrder ? `Order #${String(openOrder.tokenNumber).padStart(3, '0')}` : 'Loading…'}
      >
        {openOrder && <OrderDetail order={openOrder} />}
      </Drawer>
    </div>
  );
}

function TableGrid({ tables, onEdit, onDelete, onOpenOrder }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {tables.map((table) => (
        <TableCard key={table._id} table={table} onEdit={onEdit} onDelete={onDelete} onOpenOrder={onOpenOrder} />
      ))}
    </div>
  );
}

function TableRows({ tables, onEdit, onDelete, onOpenOrder }) {
  return (
    <div className="mt-2 overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2.5">Name</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Capacity</th>
            <th className="px-4 py-2.5">Current Order</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tables.map((table) => {
            const occupied = table.status === 'occupied';
            return (
              <tr key={table._id} className="border-t border-gray-100">
                <td className="px-4 py-2.5 font-semibold text-gray-900">{table.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      occupied ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {occupied ? 'Occupied' : 'Available'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-gray-500">
                  <span className="flex items-center gap-1">
                    <IconUsers className="h-3.5 w-3.5" />
                    Seats {table.capacity}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {occupied ? (
                    <button
                      type="button"
                      onClick={() => onOpenOrder(table.currentOrder._id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                    >
                      <span>#{String(table.currentOrder.tokenNumber).padStart(3, '0')}</span>
                      <span className={`rounded-full px-1.5 py-0.5 capitalize ${STATUS_BADGE[table.currentOrder.status]}`}>
                        {table.currentOrder.status}
                      </span>
                    </button>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(table)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(table)}
                      disabled={occupied}
                      title={occupied ? 'Cannot delete a table with an active order' : 'Delete table'}
                      className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TableCard({ table, onEdit, onDelete, onOpenOrder }) {
  const occupied = table.status === 'occupied';

  return (
    <div
      className={`group relative flex flex-col rounded-sm border p-4 shadow-sm transition ${
        occupied ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">{table.name}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            occupied ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {occupied ? 'Occupied' : 'Available'}
        </span>
      </div>
      <span className="mt-1 flex items-center gap-1 text-xs text-gray-400">
        <IconUsers className="h-3.5 w-3.5" />
        Seats {table.capacity}
      </span>

      {occupied ? (
        <button
          type="button"
          onClick={() => onOpenOrder(table.currentOrder._id)}
          className="mt-3 flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-white"
        >
          <span>#{String(table.currentOrder.tokenNumber).padStart(3, '0')}</span>
          <span className={`rounded-full px-1.5 py-0.5 capitalize ${STATUS_BADGE[table.currentOrder.status]}`}>
            {table.currentOrder.status}
          </span>
        </button>
      ) : (
        <div className="mt-3 flex-1" />
      )}

      <div className="mt-3 flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(table)}
          className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(table)}
          disabled={occupied}
          title={occupied ? 'Cannot delete a table with an active order' : 'Delete table'}
          className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <IconTrash className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function TableFormModal({ table, onCancel, onSave }) {
  const [name, setName] = useState(table?.name || '');
  const [capacity, setCapacity] = useState(table?.capacity || 2);
  const [section, setSection] = useState(table?.section || '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ name, capacity: Number(capacity), section });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save table');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-sm bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">{table ? 'Edit Table' : 'Add Table'}</h2>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Name
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Table 7"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Capacity
          <input
            required
            type="number"
            min="1"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Section <span className="font-normal text-gray-400">(optional)</span>
          <input
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="e.g. Patio"
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

function ToggleSwitch({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? 'bg-indigo-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
