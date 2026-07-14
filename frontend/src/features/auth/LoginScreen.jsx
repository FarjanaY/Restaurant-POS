import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { login } from './authSlice.js';
<<<<<<< HEAD
import { useStoreProfile } from '../../hooks/useStoreProfile.js';
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [pin, setPin] = useState('');
<<<<<<< HEAD
  const storeProfile = useStoreProfile('/settings/public');
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

  function handleSubmit(e) {
    e.preventDefault();
    dispatch(login(pin));
  }

  return (
<<<<<<< HEAD
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <form onSubmit={handleSubmit} className="w-full max-w-xs rounded-sm bg-white p-6 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-indigo-500 text-sm font-bold text-white">
            {storeProfile.logoUrl ? (
              <img src={storeProfile.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              storeProfile.name[0].toUpperCase()
            )}
          </div>
          <span className="text-lg font-semibold text-gray-900">{storeProfile.name}</span>
        </div>
        <p className="mt-3 text-sm text-gray-500">Enter your PIN to start your shift.</p>
=======
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-xs rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Staff Login</h1>
        <p className="mt-1 text-sm text-gray-500">Enter your PIN to start your shift.</p>
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={8}
<<<<<<< HEAD
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
=======
          className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest"
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
        />

        {status === 'failed' && <p className="mt-2 text-sm text-red-600">{error || 'Invalid PIN'}</p>}

        <button
          type="submit"
          disabled={status === 'loading' || pin.length === 0}
<<<<<<< HEAD
          className="mt-4 w-full rounded-lg bg-indigo-500 py-2 font-medium text-white transition hover:bg-indigo-600 disabled:opacity-40"
=======
          className="mt-4 w-full rounded-md bg-gray-900 py-2 font-medium text-white disabled:opacity-40"
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
        >
          {status === 'loading' ? 'Checking…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
