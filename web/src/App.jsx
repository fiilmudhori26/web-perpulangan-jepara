import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import PublicWaliPage from './pages/PublicWaliPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import StudentListPage from './pages/StudentListPage';
import StudentDetailPage from './pages/StudentDetailPage';
import HomecomingPage from './pages/HomecomingPage';
import PaymentListPage from './pages/PaymentListPage';
import FinancePage from './pages/FinancePage';
import PeriodPage from './pages/PeriodPage';
import ReportPage from './pages/ReportPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-gray-500">Memuat...</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PublicWaliPage />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentListPage /></ProtectedRoute>} />
        <Route path="/students/:id" element={<ProtectedRoute><StudentDetailPage /></ProtectedRoute>} />
        <Route path="/homecoming" element={<ProtectedRoute><HomecomingPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><PaymentListPage /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
        <Route path="/periods" element={<ProtectedRoute><PeriodPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
