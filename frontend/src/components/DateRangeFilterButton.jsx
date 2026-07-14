import { useState } from 'react';

import DateRangeCalendar from './DateRangeCalendar.jsx';
import { IconCalendar } from './icons.jsx';

function formatDisplay(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

// The same button-triggers-a-popup-calendar pattern built for the Kitchen
// Display System's date filter (frontend/src/pages/KdsPage.jsx) — extracted
// here so the Reports & Analytics panels can reuse it verbatim instead of
// each re-implementing the open/close + click-outside wiring.
export default function DateRangeFilterButton({ from, to, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-indigo-500 bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition"
      >
        <IconCalendar className="h-4 w-4" />
        {from === to ? formatDisplay(from) : `${formatDisplay(from)} - ${formatDisplay(to)}`}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2">
            <DateRangeCalendar from={from} to={to} onChange={onChange} onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
