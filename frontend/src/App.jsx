import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage.jsx';
import KdsPage from './pages/KdsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="flex gap-4 border-b border-gray-200 bg-white px-6 py-3">
          <Link to="/" className="font-medium text-gray-900">
            Register
          </Link>
          <Link to="/kds" className="font-medium text-gray-900">
            Kitchen
          </Link>
          <Link to="/admin" className="font-medium text-gray-900">
            Admin
          </Link>
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
