import { IconPrinter } from './icons.jsx';
import ThermalReceipt from './ThermalReceipt.jsx';

// Drop this in wherever an order is visible and printable — it renders both the
// trigger and the (screen-hidden) receipt markup window.print() will pick up.
export default function PrintReceiptButton({ order, className }) {
  return (
    <>
      <button
        type="button"
        onClick={() => window.print()}
        className={
          className ||
          'flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50'
        }
      >
        <IconPrinter className="h-4 w-4" />
        Print Receipt
      </button>
      <ThermalReceipt order={order} />
    </>
  );
}
