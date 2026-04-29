const TopNav = () => {
  return (
    <header className="flex justify-between items-center w-full px-6 py-3 border-b border-[#c5c6cd]/15 bg-[#f7faf9] dark:bg-[#051125] relative z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-[#051125] dark:text-[#f1f4f3] tracking-tighter font-headline">SPMS Granulator 01</h1>
        <div className="bg-[#f1f4f3] dark:bg-[#1b263b] h-6 w-[1px] mx-2"></div>
        <span className="text-[0.6875rem] font-medium font-label uppercase tracking-widest text-[#45474d]">Machine Health Dashboard</span>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-[#ebeeed] dark:hover:bg-[#1b263b] rounded-full transition-colors relative">
            <span className="material-symbols-outlined text-[#051125] dark:text-[#f7faf9]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full border-2 border-[#f7faf9]"></span>
          </button>
          <button className="p-2 hover:bg-[#ebeeed] dark:hover:bg-[#1b263b] rounded-full transition-colors">
            <span className="material-symbols-outlined text-[#051125] dark:text-[#f7faf9]">verified_user</span>
          </button>
        </div>
        <div className="flex items-center gap-3 pl-6 border-l border-[#c5c6cd]/15">
          <div className="text-right">
            <p className="text-xs font-bold text-[#051125] dark:text-white leading-tight">Maintenance Tech</p>
            <p className="text-[10px] text-[#45474d] uppercase tracking-tighter">Shift B-02</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#e0e3e2] flex items-center justify-center overflow-hidden">
             {/* Placeholder untuk foto profil */}
             <span className="material-symbols-outlined text-[#45474d]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;