import { categoryEmoji } from './categoryEmoji.js';
import AvailabilityBadge from './AvailabilityBadge.jsx';
import { IconX, IconPlus } from '../../components/icons.jsx';

export default function ItemDetailsModal({ item, categoryName, onClose, onAdd }) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-sm bg-white shadow-xl">
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
        >
          <IconX className="h-4 w-4" />
        </button>
        <div className="relative flex aspect-video w-full items-center justify-center bg-linear-to-br from-indigo-50 to-purple-50 text-6xl">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            categoryEmoji(categoryName)
          )}
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
            <AvailabilityBadge item={item} inline />
          </div>
          {item.description && <p className="mt-1 text-sm text-gray-500">{item.description}</p>}
          <p className="mt-3 text-2xl font-bold text-gray-900">€{item.basePrice.toFixed(2)}</p>

          <button
            type="button"
            disabled={item.available === false}
            onClick={onAdd}
            className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-sm bg-indigo-500 py-2 font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconPlus className="h-4 w-4" />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
