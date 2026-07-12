import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { login } from './authSlice.js';

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [pin, setPin] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    dispatch(login(pin));
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-xs rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Staff Login</h1>
        <p className="mt-1 text-sm text-gray-500">Enter your PIN to start your shift.</p>

        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={8}
          className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest"
        />

        {status === 'failed' && <p className="mt-2 text-sm text-red-600">{error || 'Invalid PIN'}</p>}

        <button
          type="submit"
          disabled={status === 'loading' || pin.length === 0}
          className="mt-4 w-full rounded-md bg-gray-900 py-2 font-medium text-white disabled:opacity-40"
        >
          {status === 'loading' ? 'Checking…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
