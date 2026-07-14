import TopBar from '../components/TopBar.jsx';
import { IconHelpCircle, IconClock } from '../components/icons.jsx';

const FAQS = [
  {
    q: 'A staff member forgot their PIN — what do I do?',
    a: 'Go to Staff, click Edit on their row, and set a new PIN in the "Reset PIN" field. They can log in with the new PIN immediately.',
  },
  {
    q: 'How do I turn table service on or off?',
    a: 'Go to Tables and use the "Table management" switch at the top. It\'s fully optional — quick-service and takeaway-only venues can leave it off.',
  },
  {
    q: 'A coupon code isn\'t applying at the register.',
    a: 'Check Discount to confirm the code is Active and hasn\'t passed its expiry date. Expired or deactivated codes are rejected at checkout by design.',
  },
  {
    q: 'Where do I see today\'s sales and best sellers?',
    a: 'The Dashboard shows a live snapshot: revenue, order mix, trending dishes, and recent sales. Orders has the full searchable history with CSV export.',
  },
];

export default function SupportHelpPage() {
  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <h1 className="text-xl font-semibold text-gray-900">Support and Help</h1>
        <p className="text-sm text-gray-400">Answers to common questions, and how to reach us if you're stuck.</p>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-sm border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-900">Frequently asked questions</h2>
            <div className="mt-3 space-y-4">
              {FAQS.map((item) => (
                <div key={item.q} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                  <p className="text-sm font-medium text-gray-900">{item.q}</p>
                  <p className="mt-1 text-sm text-gray-500">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
              <IconHelpCircle className="h-4.5 w-4.5" />
            </div>
            <h2 className="mt-3 text-sm font-semibold text-gray-900">Contact support</h2>
            <p className="mt-1 text-sm text-gray-500">
              Email <a href="mailto:support@restaurantpos.example" className="text-indigo-500 hover:underline">support@restaurantpos.example</a> with
              your restaurant name and a description of the issue.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
              <IconClock className="h-3.5 w-3.5" />
              Typical response time: 1 business day
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
