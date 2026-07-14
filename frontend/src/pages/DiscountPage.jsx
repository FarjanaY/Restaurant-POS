import { useEffect, useState } from 'react';

import { apiClient } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import { IconTag, IconTrash } from '../components/icons.jsx';
import { useListLayout } from '../hooks/useListLayout.js';

function isExpired(coupon) {
  return coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
}

export default function DiscountPage() {
  const listLayout = useListLayout('discount');
  const [coupons, setCoupons] = useState([]);
  const [error, setError] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(undefined); // undefined = closed, null = new, object = editing

  function loadCoupons() {
    apiClient
      .get('/coupons')
      .then(({ data }) => {
        setCoupons(data);
        setError(null);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load coupons'));
  }

  useEffect(loadCoupons, []);

  async function saveCoupon(payload) {
    if (editingCoupon && editingCoupon._id) {
      await apiClient.patch(`/coupons/${editingCoupon._id}`, payload);
    } else {
      await apiClient.post('/coupons', payload);
    }
    setEditingCoupon(undefined);
    loadCoupons();
  }

  async function toggleActive(coupon) {
    await apiClient.patch(`/coupons/${coupon._id}`, { active: !coupon.active });
    loadCoupons();
  }

  async function deleteCoupon(coupon) {
    if (!window.confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    await apiClient.delete(`/coupons/${coupon._id}`);
    loadCoupons();
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Discount</h1>
            <p className="text-sm text-gray-400">{coupons.length} coupon code(s)</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingCoupon(null)}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            + Add Coupon
          </button>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {(listLayout === 'table' || coupons.length === 0) && (
          <div className="mt-4 overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm">
            {listLayout === 'table' && (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map((coupon) => {
                    const expired = isExpired(coupon);
                    return (
                      <tr key={coupon._id} className={coupon.active && !expired ? '' : 'opacity-50'}>
                        <td className="px-4 py-3 font-mono font-medium text-gray-900">{coupon.code}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {coupon.type === 'percent' ? `${coupon.value}% off` : `€${coupon.value.toFixed(2)} off`}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              expired
                                ? 'bg-rose-100 text-rose-700'
                                : coupon.active
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {expired ? 'Expired' : coupon.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingCoupon(coupon)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(coupon)}
                            className="ml-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                          >
                            {coupon.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCoupon(coupon)}
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
            )}

            {coupons.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <IconTag className="h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm font-medium text-gray-400">No coupons yet — add your first one.</p>
              </div>
            )}
          </div>
        )}

        {listLayout === 'card' && coupons.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {coupons.map((coupon) => {
              const expired = isExpired(coupon);
              return (
                <div
                  key={coupon._id}
                  className={`rounded-sm border border-gray-100 bg-white p-4 shadow-sm ${
                    coupon.active && !expired ? '' : 'opacity-50'
                  }`}
                >
                  <p className="font-mono text-base font-semibold text-gray-900">{coupon.code}</p>
                  <p className="mt-2 text-2xl font-bold text-indigo-600">
                    {coupon.type === 'percent' ? `${coupon.value}% off` : `€${coupon.value.toFixed(2)} off`}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        expired
                          ? 'bg-rose-100 text-rose-700'
                          : coupon.active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {expired ? 'Expired' : coupon.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingCoupon(coupon)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(coupon)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                    >
                      {coupon.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCoupon(coupon)}
                      className="ml-auto rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingCoupon !== undefined && (
        <CouponFormModal
          coupon={editingCoupon}
          onCancel={() => setEditingCoupon(undefined)}
          onSave={saveCoupon}
        />
      )}
    </div>
  );
}

function CouponFormModal({ coupon, onCancel, onSave }) {
  const [code, setCode] = useState(coupon?.code || '');
  const [type, setType] = useState(coupon?.type || 'percent');
  const [value, setValue] = useState(coupon?.value ?? '');
  const [expiresAt, setExpiresAt] = useState(coupon?.expiresAt ? coupon.expiresAt.slice(0, 10) : '');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        code,
        type,
        value: Number(value),
        expiresAt: expiresAt || null,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save coupon');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-sm bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">{coupon ? 'Edit Coupon' : 'Add Coupon'}</h2>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Code
          <input
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. WELCOME10"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono uppercase focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <div className="mt-3 flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          {['percent', 'fixed'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                type === t ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'percent' ? '% Percent off' : '€ Fixed amount off'}
            </button>
          ))}
        </div>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Value
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === 'percent' ? 'e.g. 10 (for 10%)' : 'e.g. 5.00'}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <label className="mt-3 block text-sm font-medium text-gray-700">
          Expires <span className="font-normal text-gray-400">(optional)</span>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
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
