import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Login from './pages/Login';       
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
// 1. Import the Bouncer component you just created
import ProtectedRoute from './components/Routes'; 
import ForgotPassword from './pages/ForgotPassword';

const AuditLogs = () => (
  <div className="p-8 flex-1 overflow-y-auto bg-[#f1f4f3]">
    <h1 className="text-3xl font-headline font-bold text-[#051125]">Audit Logs</h1>
    <p className="mt-2 text-[#45474d] font-body">Halaman ini nantinya akan menampilkan log keamanan yang di-hash dengan SHA-256.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* 2. Changed root redirect: Send users to the app first. 
               If they don't have a token, ProtectedRoute will catch them and bounce them to /login */}
        <Route path="/" element={<Navigate to="/app" replace />} />

        {/* Public Routes - No token required */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Internal Routes - PROTECTED */}
        {/* 3. Wrap the Layout inside ProtectedRoute. This acts as a master lock for all child routes below it. */}
        <Route 
          path="/app" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} /> 
          <Route path="alerts" element={<Alerts />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
          
          <Route path="support" element={<div className="p-8 bg-[#f1f4f3] flex-1"><h1 className="text-2xl font-bold font-headline">Support Center</h1></div>} />
          <Route path="status" element={<div className="p-8 bg-[#f1f4f3] flex-1"><h1 className="text-2xl font-bold font-headline">System Status</h1></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;