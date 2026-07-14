import { useMemo, useState } from 'react';

<<<<<<< HEAD
// Rebuilds the { groupId: [modifierId, ...] } selections shape from a cart
// line's already-chosen modifiers, so editing an existing line starts from
// what's currently selected instead of blank.
function initialSelectionsFrom(groups, initialModifiers) {
  if (!initialModifiers) return {};
  const selections = {};
  for (const group of groups) {
    const chosen = group.modifiers
      .filter((m) => initialModifiers.some((im) => im.modifierId === m._id))
      .map((m) => m._id);
    if (chosen.length > 0) selections[group._id] = chosen;
  }
  return selections;
}

export default function ModifierPicker({ item, initialModifiers, onConfirm, onCancel }) {
  const groups = item.modifierGroupIds;
  const isEditing = !!initialModifiers;
  const [selections, setSelections] = useState(() => initialSelectionsFrom(groups, initialModifiers));
=======
export default function ModifierPicker({ item, onConfirm, onCancel }) {
  const groups = item.modifierGroupIds;
  const [selections, setSelections] = useState({});
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

  function toggle(group, modifierId) {
    setSelections((prev) => {
      const current = prev[group._id] || [];
      if (group.maxSelect === 1) {
        return { ...prev, [group._id]: current[0] === modifierId ? [] : [modifierId] };
      }
      if (current.includes(modifierId)) {
        return { ...prev, [group._id]: current.filter((id) => id !== modifierId) };
      }
      if (current.length >= group.maxSelect) return prev;
      return { ...prev, [group._id]: [...current, modifierId] };
    });
  }

  const canConfirm = groups.every((group) => (selections[group._id] || []).length >= group.minSelect);

  const selectedModifiers = useMemo(
    () =>
      groups.flatMap((group) =>
        (selections[group._id] || []).map((modifierId) => {
          const modifier = group.modifiers.find((m) => m._id === modifierId);
          return { modifierId, name: modifier.name, priceDelta: modifier.priceDelta };
        })
      ),
    [groups, selections]
  );

  const unitPrice = item.basePrice + selectedModifiers.reduce((sum, m) => sum + m.priceDelta, 0);

  function handleConfirm() {
    onConfirm({
      menuItemId: item._id,
      name: item.name,
      quantity: 1,
      unitPrice,
      modifiers: selectedModifiers,
      notes: '',
    });
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
<<<<<<< HEAD
      <div className="w-full max-w-md rounded-sm bg-white p-6 shadow-xl">
=======
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
        <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
        <p className="mt-1 text-sm text-gray-500">Base price €{item.basePrice.toFixed(2)}</p>

        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <div key={group._id}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">{group.name}</h3>
                <span className="text-xs text-gray-500">
                  {group.required ? 'Required' : 'Optional'}
                  {group.maxSelect > 1 ? ` · up to ${group.maxSelect}` : ''}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.modifiers
                  .filter((m) => m.active)
                  .map((modifier) => {
                    const isSelected = (selections[group._id] || []).includes(modifier._id);
                    return (
                      <button
                        key={modifier._id}
                        type="button"
                        onClick={() => toggle(group, modifier._id)}
<<<<<<< HEAD
                        className={`rounded-full border px-3 py-1 text-sm transition ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
=======
                        className={`rounded-full border px-3 py-1 text-sm ${
                          isSelected
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-300 text-gray-700'
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
                        }`}
                      >
                        {modifier.name}
                        {modifier.priceDelta ? ` +€${modifier.priceDelta.toFixed(2)}` : ''}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">€{unitPrice.toFixed(2)}</span>
          <div className="flex gap-2">
<<<<<<< HEAD
            <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-50">
=======
            <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-gray-600">
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
              Cancel
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
<<<<<<< HEAD
              className="rounded-lg bg-indigo-500 px-4 py-2 text-white transition hover:bg-indigo-600 disabled:opacity-40"
            >
              {isEditing ? 'Save changes' : 'Add to order'}
=======
              className="rounded-md bg-gray-900 px-4 py-2 text-white disabled:opacity-40"
            >
              Add to order
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
