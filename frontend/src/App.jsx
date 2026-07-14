<<<<<<< HEAD
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
=======
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

import RegisterPage from './pages/RegisterPage.jsx';
import KdsPage from './pages/KdsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
<<<<<<< HEAD
import DashboardPage from './pages/DashboardPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import TablesPage from './pages/TablesPage.jsx';
import StaffPage from './pages/StaffPage.jsx';
import DiscountPage from './pages/DiscountPage.jsx';
import SupportHelpPage from './pages/SupportHelpPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import LoginScreen from './features/auth/LoginScreen.jsx';
import RequireRole from './features/auth/RequireRole.jsx';
import Sidebar from './components/Sidebar.jsx';
import { SidebarProvider } from './components/SidebarContext.jsx';
import {
  REGISTER_ROLES,
  KDS_VIEW_ROLES,
  ADMIN_AREA_ROLES,
  STAFF_ADMIN_ROLES,
  DISCOUNT_ROLES,
} from './features/auth/roles.js';

function App() {
  const { token } = useSelector((state) => state.auth);
=======
import LoginScreen from './features/auth/LoginScreen.jsx';
import { loggedOut } from './features/auth/authSlice.js';

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <BrowserRouter>
<<<<<<< HEAD
      <SidebarProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Routes>
              <Route
                path="/"
                element={
                  <RequireRole roles={REGISTER_ROLES}>
                    <RegisterPage />
                  </RequireRole>
                }
              />
              <Route
                path="/kds"
                element={
                  <RequireRole roles={KDS_VIEW_ROLES}>
                    <KdsPage />
                  </RequireRole>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireRole roles={ADMIN_AREA_ROLES}>
                    <AdminPage />
                  </RequireRole>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireRole roles={ADMIN_AREA_ROLES}>
                    <DashboardPage />
                  </RequireRole>
                }
              />
              <Route
                path="/orders"
                element={
                  <RequireRole roles={ADMIN_AREA_ROLES}>
                    <OrdersPage />
                  </RequireRole>
                }
              />
              <Route
                path="/tables"
                element={
                  <RequireRole roles={ADMIN_AREA_ROLES}>
                    <TablesPage />
                  </RequireRole>
                }
              />
              <Route
                path="/staff"
                element={
                  <RequireRole roles={STAFF_ADMIN_ROLES}>
                    <StaffPage />
                  </RequireRole>
                }
              />
              <Route
                path="/discount"
                element={
                  <RequireRole roles={DISCOUNT_ROLES}>
                    <DiscountPage />
                  </RequireRole>
                }
              />
              <Route
                path="/support"
                element={
                  <RequireRole roles={ADMIN_AREA_ROLES}>
                    <SupportHelpPage />
                  </RequireRole>
                }
              />
              <Route
                path="/inventory"
                element={
                  <RequireRole roles={ADMIN_AREA_ROLES}>
                    <InventoryPage />
                  </RequireRole>
                }
              />
              <Route
                path="/customers"
                element={
                  <RequireRole roles={ADMIN_AREA_ROLES}>
                    <CustomersPage />
                  </RequireRole>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireRole roles={ADMIN_AREA_ROLES}>
                    <SettingsPage />
                  </RequireRole>
                }
              />
            </Routes>
          </div>
        </div>
      </SidebarProvider>
=======
      <div className="min-h-screen bg-gray-50">
        <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex gap-4">
            <Link to="/" className="font-medium text-gray-900">
              Register
            </Link>
            <Link to="/kds" className="font-medium text-gray-900">
              Kitchen
            </Link>
            <Link to="/admin" className="font-medium text-gray-900">
              Admin
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>
              {user.name} ({user.role})
            </span>
            <button
              type="button"
              onClick={() => dispatch(loggedOut())}
              className="text-gray-400 hover:text-red-600"
            >
              Log out
            </button>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<RegisterPage />} />
          <Route path="/kds" element={<KdsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
    </BrowserRouter>
  );
}

export default App;
