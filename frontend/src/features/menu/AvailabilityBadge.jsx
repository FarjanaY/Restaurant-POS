// A single top-right/inline tag per item: unavailable always wins (can't be
// bought regardless of any promo), then a promo label if the admin set one,
// otherwise a plain "Available" tag — never more than one badge at a time.
export default function AvailabilityBadge({ item, inline }) {
  const { label, className } =
    item.available === false
      ? { label: 'Not Available', className: 'bg-gray-900/80 text-white' }
      : item.promoLabel
        ? { label: item.promoLabel, className: 'bg-amber-500 text-white' }
        : { label: 'Available', className: 'bg-emerald-500 text-white' };

  if (inline) {
    return (
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>{label}</span>
    );
  }

  return (
    <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold shadow ${className}`}>
      {label}
    </span>
  );
}
