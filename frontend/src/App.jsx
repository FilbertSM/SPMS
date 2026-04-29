import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

// Placeholder (Halaman sementara) untuk menu lain agar tidak error saat diklik
const Alerts = () => (
  <div className="p-8 flex-1 overflow-y-auto bg-[#f1f4f3]">
    <h1 className="text-3xl font-headline font-bold text-[#051125]">Alerts</h1>
    <p className="mt-2 text-[#45474d] font-body">Halaman ini nantinya akan menampilkan peringatan anomali dari model LSTM.</p>
  </div>
);

const AuditLogs = () => (
  <div className="p-8 flex-1 overflow-y-auto bg-[#f1f4f3]">
    <h1 className="text-3xl font-headline font-bold text-[#051125]">Audit Logs</h1>
    <p className="mt-2 text-[#45474d] font-body">Halaman ini nantinya akan menampilkan log keamanan yang di-hash dengan SHA-256.</p>
  </div>
);

const Settings = () => (
  <div className="p-8 flex-1 overflow-y-auto bg-[#f1f4f3]">
    <h1 className="text-3xl font-headline font-bold text-[#051125]">Settings</h1>
    <p className="mt-2 text-[#45474d] font-body">Halaman administrasi dan Role-Based Access Control (RBAC).</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Layout menjadi bungkus utama (Parent Route) */}
        <Route path="/" element={<Layout />}>
          {/* Index route: otomatis muncul di halaman depan ("/") */}
          <Route index element={<Dashboard />} />
          
          {/* Nested routes: muncul di dalam Outlet yang ada di Layout.jsx */}
          <Route path="alerts" element={<Alerts />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Tambahan rute untuk menu di pojok kiri bawah Sidebar */}
          <Route path="support" element={<div className="p-8 bg-[#f1f4f3] flex-1"><h1 className="text-2xl font-bold font-headline">Support Center</h1></div>} />
          <Route path="status" element={<div className="p-8 bg-[#f1f4f3] flex-1"><h1 className="text-2xl font-bold font-headline">System Status</h1></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;