import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  // Fungsi utilitas mengontrol active/highlight capsule secara dinamis & presisi
  const getMenuClasses = (path) => {
    const isActive = location.pathname === path || (path === '/app' && location.pathname === '/app/');
    
    // Base class asli tetap utuh agar tidak menggeser alignment teks menu
    const baseClasses = "px-4 py-3 flex items-center gap-3 transition-all text-sm rounded-l-lg ml-2 font-medium";
    
    return isActive
      ? `${baseClasses} bg-white dark:bg-[#051125] text-[#051125] dark:text-[#6bfe9c] font-bold shadow-sm`
      : `${baseClasses} text-[#45474d] dark:text-[#c5c6cd] hover:bg-[#f1f4f3] dark:hover:bg-[#051125]/50`;
  };

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 border-r border-[#c5c6cd]/15 bg-[#ebeeed] dark:bg-[#1b263b] transition-all duration-200 ease-in-out">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#1b263b] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#6bfe9c]">settings_input_component</span>
          </div>
          <div>
            <h2 className="font-headline text-sm font-bold text-[#051125] dark:text-[#6bfe9c] uppercase tracking-tight">Unit PMA-04</h2>
            <p className="font-label text-xs font-medium text-[#45474d]">Active Sentinel</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          {/* Menu Dashboard */}
          <Link to="/app" className={getMenuClasses('/app')}>
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link>

          {/* Menu PMA */}
          <Link to="/app/pma" className={getMenuClasses('/app/pma')}>
            <span className="material-symbols-outlined">trending_up</span>
            <span>PMA</span>
          </Link>

          {/* Menu Vibration */}
          <Link to="/app/vibration" className={getMenuClasses('/app/vibration')}>
            <span className="material-symbols-outlined">trending_up</span>
            <span>Vibration</span>
          </Link>
          
          {/* Menu Alerts */}
          <Link to="/app/alerts" className={getMenuClasses('/app/alerts')}>
            <span className="material-symbols-outlined">warning</span>
            <span>Alerts</span>
          </Link>
          
          {/* Menu Audit Logs (Memperbaiki teks hancur _HEART) */}
          <Link to="/app/audit" className={getMenuClasses('/app/audit')}>
            <span className="material-symbols-outlined">security</span>
            <span>Audit Logs</span>
          </Link>
          
          {/* Menu Settings */}
          <Link to="/app/settings" className={getMenuClasses('/app/settings')}>
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </Link>


        </nav>
      </div>

      <div className="mt-auto p-6 space-y-6">
        <button
          disabled
          title="Manual workflow only in the Form 4 demo"
          className="w-full py-3 bg-[#1b263b]/60 text-[#f1f4f3] font-bold rounded-lg text-xs uppercase tracking-widest cursor-not-allowed"
        >
            Log Ticket
        </button>
        <div className="space-y-1">
          <Link to="/app/support" className={getMenuClasses('/app/support') + " !py-2 text-xs"}>
            <span className="material-symbols-outlined text-sm">help</span> 
            <span>Support</span>
          </Link>
          
          <Link to="/app/status" className={getMenuClasses('/app/status') + " !py-2 text-xs"}>
            <span className="material-symbols-outlined text-sm">analytics</span> 
            <span>System Status</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
