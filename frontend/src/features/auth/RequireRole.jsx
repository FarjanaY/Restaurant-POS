import { useSelector } from 'react-redux';

// Guards a route by role, mirroring the backend's own requireRole gate for
// that endpoint — a direct URL visit shouldn't reach a page whose every API
// call would 403 anyway.
export default function RequireRole({ roles, children }) {
  const role = useSelector((state) => state.auth.user?.role);

  if (!roles.includes(role)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-sm rounded-sm border border-gray-100 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900">Access denied</h1>
          <p className="mt-2 text-sm text-gray-500">Your role ({role}) doesn't have access to this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
