import { useMemo, useState } from 'react';

export default function CartLineItem({
  line,
  menuItem,
  onQuantityChange,
  onRemove,
  onEditModifiers,
  onNotesChange,
  onAddModifier,
}) {
  const [notesDraft, setNotesDraft] = useState(line.notes);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const canEditModifiers = menuItem && menuItem.modifierGroupIds.length > 0;

  // Every modifier across all of this item's groups, minus ones already on
  // the line — typed text is matched against these so "Special instructions"
  // doubles as a quick way to add a modifier without opening the full picker.
  const availableModifiers = useMemo(() => {
    if (!menuItem) return [];
    return menuItem.modifierGroupIds.flatMap((group) => group.modifiers.filter((m) => m.active));
  }, [menuItem]);

  const suggestions = useMemo(() => {
    const query = notesDraft.trim().toLowerCase();
    if (!query) return [];
    return availableModifiers
      .filter(
        (m) => m.name.toLowerCase().includes(query) && !line.modifiers.some((lm) => lm.modifierId === m._id)
      )
      .slice(0, 5);
  }, [availableModifiers, notesDraft, line.modifiers]);

  function handlePickSuggestion(modifier) {
    onAddModifier({ modifierId: modifier._id, name: modifier.name, priceDelta: modifier.priceDelta });
    setNotesDraft('');
    setShowSuggestions(false);
  }

  function handleNotesBlur() {
    setShowSuggestions(false);
    if (notesDraft !== line.notes) onNotesChange(notesDraft);
  }

  return (
    <div className="flex items-start gap-3 border-b border-gray-50 py-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-xs font-semibold text-indigo-600">
        {line.quantity}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium text-gray-900">{line.name}</span>
          <div className="flex shrink-0 items-center gap-2">
            {canEditModifiers && (
              <button
                type="button"
                onClick={onEditModifiers}
                className="text-xs font-medium text-indigo-500 hover:text-indigo-600"
              >
                Edit
              </button>
            )}
            <button type="button" onClick={onRemove} className="text-gray-300 hover:text-red-600">
              ✕
            </button>
          </div>
        </div>
        {line.modifiers.length > 0 && (
          <p className="text-xs text-gray-400">{line.modifiers.map((m) => m.name).join(', ')}</p>
        )}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, line.quantity - 1))}
              className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 text-xs text-gray-500 hover:bg-gray-50"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => onQuantityChange(line.quantity + 1)}
              className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 text-xs text-gray-500 hover:bg-gray-50"
            >
              +
            </button>
          </div>
          <span className="text-sm font-semibold text-gray-900">€{(line.unitPrice * line.quantity).toFixed(2)}</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={notesDraft}
            onChange={(e) => {
              setNotesDraft(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleNotesBlur}
            placeholder={canEditModifiers ? 'Special instructions or add a modifier…' : 'Special instructions…'}
            className="mt-2 w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 placeholder:text-gray-400"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full z-10 mt-1 rounded-sm border border-gray-100 bg-white py-1 shadow-lg">
              {suggestions.map((modifier) => (
                <button
                  key={modifier._id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePickSuggestion(modifier)}
                  className="flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-xs hover:bg-indigo-50"
                >
                  <span className="truncate text-gray-900">{modifier.name}</span>
                  {modifier.priceDelta ? (
                    <span className="shrink-0 text-gray-400">+€{modifier.priceDelta.toFixed(2)}</span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
