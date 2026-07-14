import { useDispatch } from 'react-redux';

import { useSidebar } from './SidebarContext.jsx';
import { loggedOut } from '../features/auth/authSlice.js';
import { IconMenu, IconX, IconBell, IconLogout } from './icons.jsx';

// `children` is a slot for page-specific content — currently each page's own
// search box, on the pages that have real search (Register, Orders, Kitchen).
// The sidebar-collapse toggle lives here (not inside Sidebar itself) so it
// sits beside that search box rather than buried in the nav. Logout also
// lives here now — the sidebar only shows the logo.
export default function TopBar({ children }) {
  const dispatch = useDispatch();
  const { collapsed, toggle } = useSidebar();

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3">
      <button
        type="button"
        onClick={toggle}
        title={collapsed ? 'Show menu' : 'Hide menu'}
        className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-black"
      >
        {collapsed ? <IconMenu className="h-5 w-5" /> : <IconX className="h-5 w-5" />}
      </button>
      <div className="flex-1">{children}</div>
      {/* Decorative — there's no notification system yet, so no unread badge/dot is shown. */}
      <span title="Notifications" className="cursor-default text-gray-400">
        <IconBell className="h-5 w-5" />
      </span>
      <button
        type="button"
        onClick={() => dispatch(loggedOut())}
        title="Log out"
        className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-white hover:text-black"
      >
        <IconLogout className="h-5 w-5" />
      </button>
    </header>
  );
}
