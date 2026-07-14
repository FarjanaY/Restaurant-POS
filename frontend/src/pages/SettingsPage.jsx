import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { apiClient } from '../api/client.js';
import TopBar from '../components/TopBar.jsx';
import { IconTable, IconGrid } from '../components/icons.jsx';
import { setListLayout } from '../hooks/useListLayout.js';

const THEME_OPTIONS = ['Minimalist', 'Modern', 'Classic', 'Vibrant'];

const LAYOUT_TOPICS = [
  { key: 'orders', label: 'Orders' },
  { key: 'tables', label: 'Tables' },
  { key: 'staff', label: 'Staff' },
  { key: 'categories', label: 'Menu Categories' },
  { key: 'items', label: 'Menu Items' },
  { key: 'discount', label: 'Discount' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'customers', label: 'Customers' },
];

export default function SettingsPage() {
  const [layouts, setLayouts] = useState(null);
  const [settings, setSettings] = useState(null);
  const [profileForm, setProfileForm] = useState(null);
  const [generalForm, setGeneralForm] = useState(null);
  const [socialForm, setSocialForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get('/settings')
      .then(({ data }) => {
        setSettings(data);
        setLayouts(data.listLayouts || {});
        const p = data.restaurantProfile || {};
        setProfileForm({
          name: p.name || '',
          logoUrl: p.logoUrl || '',
          ownerName: p.ownerName || '',
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          zipCode: p.zipCode || '',
          city: p.city || '',
          country: p.country || '',
          openingTime: p.openingTime || '',
          closingTime: p.closingTime || '',
        });
        const g = data.generalSettings || {};
        setGeneralForm({
          metaTitle: g.metaTitle || '',
          metaKeyword: g.metaKeyword || '',
          theme: g.theme || '',
          description: g.description || '',
        });
        const s = data.socialSettings || {};
        setSocialForm({
          facebookUrl: s.facebookUrl || '',
          instagramUrl: s.instagramUrl || '',
          twitterUrl: s.twitterUrl || '',
          websiteUrl: s.websiteUrl || '',
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load settings'));
  }, []);

  function updateProfile(key, value) {
    setSaved(false);
    setProfileForm((f) => ({ ...f, [key]: value }));
  }

  function updateGeneral(key, value) {
    setSaved(false);
    setGeneralForm((f) => ({ ...f, [key]: value }));
  }

  function updateSocial(key, value) {
    setSaved(false);
    setSocialForm((f) => ({ ...f, [key]: value }));
  }

  function updateLayout(page, value) {
    setLayouts((prev) => ({ ...prev, [page]: value }));
    setListLayout(page, value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data } = await apiClient.patch('/settings', {
        restaurantProfile: profileForm,
        generalSettings: generalForm,
        socialSettings: socialForm,
      });
      setSettings(data);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <h1 className="text-xl font-semibold text-gray-900">Store Settings</h1>
        <p className="text-sm text-gray-400">Restaurant profile, general info, and social links.</p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {profileForm && generalForm && socialForm && (
          <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-sm border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-900">Restaurant Settings</h2>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Upload Restaurant Logo</label>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-2xl">
                    {profileForm.logoUrl ? (
                      <img src={profileForm.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      '🍽️'
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Logo image URL"
                    value={profileForm.logoUrl}
                    onChange={(e) => updateProfile('logoUrl', e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Restaurant Name" value={profileForm.name} onChange={(v) => updateProfile('name', v)} />
                <Field
                  label="Restaurant Owner Full Name"
                  value={profileForm.ownerName}
                  onChange={(v) => updateProfile('ownerName', v)}
                />
                <Field
                  label="Owner Phone number"
                  value={profileForm.phone}
                  onChange={(v) => updateProfile('phone', v)}
                />
                <Field label="Owner Email" value={profileForm.email} onChange={(v) => updateProfile('email', v)} />
                <Textarea
                  label="Full Address"
                  value={profileForm.address}
                  onChange={(v) => updateProfile('address', v)}
                  full
                />
                <Field label="Zip-Code" value={profileForm.zipCode} onChange={(v) => updateProfile('zipCode', v)} />
                <Field label="City" value={profileForm.city} onChange={(v) => updateProfile('city', v)} />
                <Field label="Country" value={profileForm.country} onChange={(v) => updateProfile('country', v)} />
                <Field
                  label="Restaurant Opening Time"
                  placeholder="e.g. 7:00 AM"
                  value={profileForm.openingTime}
                  onChange={(v) => updateProfile('openingTime', v)}
                />
                <Field
                  label="Restaurant Close Time"
                  placeholder="e.g. 11:00 PM"
                  value={profileForm.closingTime}
                  onChange={(v) => updateProfile('closingTime', v)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-sm border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-900">General Settings</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Meta Title"
                    placeholder="Title"
                    value={generalForm.metaTitle}
                    onChange={(v) => updateGeneral('metaTitle', v)}
                  />
                  <Field
                    label="Meta Tag Keyword"
                    placeholder="Enter word"
                    value={generalForm.metaKeyword}
                    onChange={(v) => updateGeneral('metaKeyword', v)}
                  />
                  <Select
                    label="Restaurant Themes"
                    value={generalForm.theme}
                    onChange={(v) => updateGeneral('theme', v)}
                    options={THEME_OPTIONS}
                    full
                  />
                  <Textarea
                    label="Description"
                    placeholder="Type description"
                    value={generalForm.description}
                    onChange={(v) => updateGeneral('description', v)}
                    full
                  />
                </div>
              </div>

              <div className="rounded-sm border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-900">Social Settings</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field
                    label="Facebook URL"
                    placeholder="facebook.url"
                    value={socialForm.facebookUrl}
                    onChange={(v) => updateSocial('facebookUrl', v)}
                  />
                  <Field
                    label="Instagram URL"
                    placeholder="instagram.url"
                    value={socialForm.instagramUrl}
                    onChange={(v) => updateSocial('instagramUrl', v)}
                  />
                  <Field
                    label="Twitter URL"
                    placeholder="twitter.url"
                    value={socialForm.twitterUrl}
                    onChange={(v) => updateSocial('twitterUrl', v)}
                  />
                  <Field
                    label="Website URL"
                    placeholder="website.url"
                    value={socialForm.websiteUrl}
                    onChange={(v) => updateSocial('websiteUrl', v)}
                  />
                </div>
              </div>
            </div>

            {layouts && (
              <div className="rounded-sm border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-900">Display Settings</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Table or card view, set independently for each page — applies immediately, no need to hit Save.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {LAYOUT_TOPICS.map((topic) => (
                    <div
                      key={topic.key}
                      className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-700">{topic.label}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateLayout(topic.key, 'table')}
                          title="Table view"
                          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${
                            layouts[topic.key] !== 'card'
                              ? 'border-indigo-500 bg-indigo-500 text-white'
                              : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <IconTable className="h-3.5 w-3.5" />
                          Table
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLayout(topic.key, 'card')}
                          title="Card view"
                          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${
                            layouts[topic.key] === 'card'
                              ? 'border-indigo-500 bg-indigo-500 text-white'
                              : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <IconGrid className="h-3.5 w-3.5" />
                          Card
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 xl:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              {saved && <span className="text-sm font-medium text-emerald-600">Saved.</span>}
            </div>
          </form>
        )}

        <div className="mt-5 rounded-sm border border-gray-100 bg-white p-5 shadow-sm xl:max-w-2xl">
          <div className="flex items-center gap-2">
            <IconTable className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-900">Table Management</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Turning dine-in table service on or off, and managing the floor plan, now lives on the{' '}
            <Link to="/tables" className="font-medium text-indigo-500 hover:underline">
              Tables
            </Link>{' '}
            page — currently {settings?.tablesEnabled ? 'enabled' : 'disabled'}.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, full }) {
  return (
    <label className={`block text-sm font-medium text-gray-700 ${full ? 'sm:col-span-2' : ''}`}>
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder, full }) {
  return (
    <label className={`block text-sm font-medium text-gray-700 ${full ? 'sm:col-span-2' : ''}`}>
      {label}
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, full }) {
  return (
    <label className={`block text-sm font-medium text-gray-700 ${full ? 'sm:col-span-2' : ''}`}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
