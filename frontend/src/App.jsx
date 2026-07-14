import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';

import RegisterPage from './pages/RegisterPage.jsx';
import KdsPage from './pages/KdsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
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

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
