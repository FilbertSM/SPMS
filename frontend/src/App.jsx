import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Login from './pages/Login';       
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/Routes'; 
import ForgotPassword from './pages/ForgotPassword';

// Import halaman baru yang tadi kita buat
import AuditLogs from './pages/AuditLogs';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          {/* Redirect root ke /app */}
          <Route path="/" element={<Navigate to="/app" replace />} />

          {/* Internal Routes - PROTECTED */}
          <Route path="/app" element={<Layout />}>
            <Route index element={<Dashboard />} /> 
            <Route path="alerts" element={<Alerts />} />            
            <Route path="audit" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
            <Route path="support" element={<div className="p-8 bg-[#f1f4f3] flex-1"><h1 className="text-2xl font-bold font-headline">Support Center</h1></div>} />
            <Route path="status" element={<div className="p-8 bg-[#f1f4f3] flex-1"><h1 className="text-2xl font-bold font-headline">System Status</h1></div>} />
          </Route>
        </Route>

        {/* Catch-all untuk URL acak yang tidak terdaftar, lempar kembali ke root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;