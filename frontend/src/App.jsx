import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import RegisterPage from './pages/RegisterPage.jsx';
import KdsPage from './pages/KdsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import LoginScreen from './features/auth/LoginScreen.jsx';
import { loggedOut } from './features/auth/authSlice.js';

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
