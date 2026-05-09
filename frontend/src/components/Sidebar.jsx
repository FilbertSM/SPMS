import { Link } from 'react-router-dom';

const Sidebar = () => {
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
          {/* UPDATED: to="/app" */}
          <Link to="/app" className="bg-[#ffffff] dark:bg-[#051125] text-[#051125] dark:text-[#6bfe9c] font-bold rounded-l-lg ml-2 px-4 py-3 flex items-center gap-3 transition-all">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          
          {/* UPDATED: to="/app/alerts" */}
          <Link to="/app/alerts" className="text-[#45474d] dark:text-[#c5c6cd] px-4 py-3 flex items-center gap-3 hover:bg-[#f1f4f3] dark:hover:bg-[#051125]/50 transition-all">
            <span className="material-symbols-outlined">warning</span>
            <span className="text-sm font-medium">Alerts</span>
          </Link>
          
          {/* UPDATED: to="/app/audit" */}
          <Link to="/app/audit" className="text-[#45474d] dark:text-[#c5c6cd] px-4 py-3 flex items-center gap-3 hover:bg-[#f1f4f3] dark:hover:bg-[#051125]/50 transition-all">
            <span className="material-symbols-outlined">security</span>
            <span className="text-sm font-medium">Audit Logs</span>
          </Link>
          
          {/* UPDATED: to="/app/settings" */}
          <Link to="/app/settings" className="text-[#45474d] dark:text-[#c5c6cd] px-4 py-3 flex items-center gap-3 hover:bg-[#f1f4f3] dark:hover:bg-[#051125]/50 transition-all">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-6">
        <button className="w-full py-3 bg-[#1b263b] text-[#6bfe9c] font-bold rounded-lg text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">
            Log Ticket
        </button>
        <div className="space-y-1">
          {/* UPDATED: to="/app/support" */}
          <Link to="/app/support" className="text-[#45474d] dark:text-[#c5c6cd] px-4 py-2 flex items-center gap-3 hover:bg-[#f1f4f3] dark:hover:bg-[#051125]/50 transition-all text-xs font-medium">
            <span className="material-symbols-outlined text-sm">help</span> Support
          </Link>
          
          {/* UPDATED: to="/app/status" */}
          <Link to="/app/status" className="text-[#45474d] dark:text-[#c5c6cd] px-4 py-2 flex items-center gap-3 hover:bg-[#f1f4f3] dark:hover:bg-[#051125]/50 transition-all text-xs font-medium">
            <span className="material-symbols-outlined text-sm">analytics</span> System Status
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;