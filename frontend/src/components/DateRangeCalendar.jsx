import { useState } from 'react';

import { IconChevronLeft, IconChevronRight } from './icons.jsx';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function toYmd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromYmd(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDisplay(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfWeek(date) {
  return addDays(date, -date.getDay());
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function buildPresets(today) {
  const year = today.getFullYear();
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return [
    { label: 'Today', from: today, to: today },
    { label: 'Yesterday', from: addDays(today, -1), to: addDays(today, -1) },
    { label: 'This Week', from: startOfWeek(today), to: addDays(startOfWeek(today), 6) },
    { label: 'Last Week', from: addDays(startOfWeek(today), -7), to: addDays(startOfWeek(today), -1) },
    { label: 'This Month', from: startOfMonth(today), to: endOfMonth(today) },
    { label: 'Last Month', from: startOfMonth(lastMonthDate), to: endOfMonth(lastMonthDate) },
    { label: 'This Year', from: new Date(year, 0, 1), to: new Date(year, 11, 31) },
    { label: 'Last Year', from: new Date(year - 1, 0, 1), to: new Date(year - 1, 11, 31) },
  ];
}

// A self-contained range-picker popup: month grid on the left (click once to
// start a range, click again to complete it — a preset on the right applies
// immediately), Start/End readouts at the bottom. `from`/`to` and `onChange`
// are plain "YYYY-MM-DD" strings, matching the same format a native
// `<input type="date">` produces, so callers can treat this as a drop-in
// upgrade over one.
export default function DateRangeCalendar({ from, to, onChange, onClose }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initialAnchor = from ? fromYmd(from) : today;
  const [viewDate, setViewDate] = useState(startOfMonth(initialAnchor));
  const [rangeStart, setRangeStart] = useState(from || null);
  const [rangeEnd, setRangeEnd] = useState(to || from || null);
  const [selecting, setSelecting] = useState(false);

  function applyRange(fromYmdVal, toYmdVal) {
    setRangeStart(fromYmdVal);
    setRangeEnd(toYmdVal);
    onChange(fromYmdVal, toYmdVal);
  }

  function handlePreset(preset) {
    applyRange(toYmd(preset.from), toYmd(preset.to));
    setViewDate(startOfMonth(preset.from));
    setSelecting(false);
    onClose();
  }

  function handleDayClick(date) {
    const ymd = toYmd(date);
    if (!selecting) {
      setRangeStart(ymd);
      setRangeEnd(ymd);
      setSelecting(true);
      return;
    }
    const [lo, hi] = ymd < rangeStart ? [ymd, rangeStart] : [rangeStart, ymd];
    applyRange(lo, hi);
    setSelecting(false);
    onClose();
  }

  const gridStart = startOfWeek(startOfMonth(viewDate));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const todayYmd = toYmd(today);

  return (
    <div className="flex overflow-hidden rounded-sm border border-gray-200 bg-white shadow-lg">
      <div className="w-80 p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900">
            {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 text-center text-xs font-medium text-gray-400">
          {WEEKDAYS.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-y-1 border-t border-gray-100 pt-2 text-center text-sm">
          {days.map((date) => {
            const ymd = toYmd(date);
            const inMonth = date.getMonth() === viewDate.getMonth();
            const inRange = rangeStart && rangeEnd && ymd >= rangeStart && ymd <= rangeEnd;
            const isEndpoint = ymd === rangeStart || ymd === rangeEnd;
            return (
              <div key={ymd} className={`flex items-center justify-center py-0.5 ${inRange ? 'bg-indigo-50' : ''}`}>
                <button
                  type="button"
                  onClick={() => handleDayClick(date)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                    isEndpoint
                      ? 'bg-indigo-500 font-semibold text-white'
                      : ymd === todayYmd
                        ? 'border border-indigo-400 text-gray-900'
                        : inMonth
                          ? 'text-gray-900 hover:bg-gray-100'
                          : 'text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {date.getDate()}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Start</p>
            <div className="mt-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700">
              {toDisplay(rangeStart) || '—'}
            </div>
          </div>
          <span className="mt-4 text-gray-300">–</span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">End</p>
            <div className="mt-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-700">
              {toDisplay(rangeEnd) || '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="w-36 shrink-0 space-y-2 border-l border-gray-100 bg-gray-50 p-3">
        {buildPresets(today).map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePreset(preset)}
            className="w-full rounded-lg bg-white px-3 py-2 text-left text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-100"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
