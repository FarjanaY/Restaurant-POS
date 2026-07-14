export default function ReportStatCard({ label, value, accent }) {
  return (
    <div className="rounded-sm border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
