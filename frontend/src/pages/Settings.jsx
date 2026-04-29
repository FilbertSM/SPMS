const Settings = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-[#f4f7f6]">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#45474d] block mb-2 font-label">
              Configuration Environment
            </span>
            <h1 className="text-4xl font-extrabold text-[#1b263b] tracking-tight font-headline">
              System Settings & Configuration
            </h1>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-md text-sm font-bold text-[#45474d] hover:bg-[#e6e9e8] transition-colors">
              Discard Changes
            </button>
            <button className="px-6 py-2.5 rounded-md text-sm font-bold text-white bg-gradient-to-br from-[#051125] to-[#1b263b] shadow-lg active:scale-[0.98] transition-all">
              Save Global Config
            </button>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* 1. ML Threshold Configuration */}
          <section className="col-span-12 lg:col-span-8 bg-white rounded-xl p-8 shadow-sm border border-[#c5c6cd]/20">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-[#1b263b] bg-[#f1f4f3] p-2 rounded-lg">psychology</span>
              <div>
                <h3 className="text-xl font-bold text-[#1b263b] font-headline">ML Threshold Configuration</h3>
                <p className="text-xs text-[#45474d] font-medium">Define Mean Squared Error (MSE) anomaly detection parameters.</p>
              </div>
            </div>

            <div className="space-y-10">
              {/* Critical Threshold */}
              <div className="group">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#e74c3c]">Critical Alert Threshold</label>
                    <p className="text-sm text-[#45474d]">Triggers immediate machine shutdown and tech dispatch.</p>
                  </div>
                  <span className="text-2xl font-black text-[#1b263b] font-headline">0.35 <span className="text-[10px] text-[#45474d] font-normal tracking-normal">MSE</span></span>
                </div>
                <input className="w-full h-1.5 bg-[#e0e3e2] rounded-full appearance-none cursor-pointer accent-[#e74c3c]" type="range" min="0" max="1" step="0.01" defaultValue="0.35" />
              </div>

              {/* Warning Threshold */}
              <div className="group">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#00743a]">Warning Threshold</label>
                    <p className="text-sm text-[#45474d]">Flags maintenance request in dashboard without interruption.</p>
                  </div>
                  <span className="text-2xl font-black text-[#1b263b] font-headline">0.15 <span className="text-[10px] text-[#45474d] font-normal tracking-normal">MSE</span></span>
                </div>
                <input className="w-full h-1.5 bg-[#e0e3e2] rounded-full appearance-none cursor-pointer accent-[#2ecc71]" type="range" min="0" max="1" step="0.01" defaultValue="0.15" />
              </div>

              <div className="pt-6 border-t border-[#c5c6cd]/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#45474d]">timer</span>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#45474d]">Consecutive Breach Duration</label>
                    <p className="text-xs text-[#45474d]">Wait time before triggering alert state</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input className="w-20 bg-[#f1f4f3] border-0 border-b-2 border-[#75777d]/20 focus:ring-0 focus:border-[#1b263b] text-right font-bold text-[#1b263b]" type="number" defaultValue="5" />
                  <span className="text-xs font-bold text-[#45474d] font-label">MINS</span>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Maintenance Mode Toggle */}
          <section className="col-span-12 lg:col-span-4 bg-[#1b263b] text-white rounded-xl p-8 flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <span className="material-symbols-outlined text-8xl">construction</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2 font-headline">Maintenance Mode</h3>
              <p className="text-sm text-[#828da7] leading-relaxed mb-6">Pause AI inference and monitoring during planned repairs to prevent false positives.</p>
            </div>
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
              <span className="text-sm font-bold tracking-tight">AI INFERENCE ENGINE</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-14 h-7 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2ecc71]"></div>
              </label>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse"></span>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#2ecc71] font-label">Operational</span>
            </div>
          </section>

          {/* 3. Notification Rules */}
          <section className="col-span-12 lg:col-span-5 bg-white rounded-xl p-8 shadow-sm border border-[#c5c6cd]/20">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-[#1b263b] bg-[#f1f4f3] p-2 rounded-lg">mail</span>
              <h3 className="text-xl font-bold text-[#1b263b] font-headline">Notification Rules</h3>
            </div>
            <div className="space-y-6">
              {[
                { title: 'Critical Status Alerts', desc: 'SMS + Push Notification', active: true },
                { title: 'Warning Notifications', desc: 'Email only', active: true },
                { title: 'Sensor Offline Event', desc: 'SMS for immediate action', active: false },
                { title: 'Weekly Summary Reports', desc: 'Automated PDF analytics', active: true },
              ].map((rule, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#c5c6cd]/10 last:border-0">
                  <div>
                    <p className="text-[13px] font-bold text-[#1b263b]">{rule.title}</p>
                    <p className="text-[11px] text-[#45474d]">{rule.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={rule.active} />
                    <div className="w-11 h-6 bg-[#e0e3e2] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1b263b]"></div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* 4. User Access Management */}
          <section className="col-span-12 lg:col-span-7 bg-white rounded-xl p-8 shadow-sm border border-[#c5c6cd]/20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1b263b] bg-[#f1f4f3] p-2 rounded-lg">group</span>
                <h3 className="text-xl font-bold text-[#1b263b] font-headline">User Access Management</h3>
              </div>
              <button className="text-[11px] font-bold uppercase tracking-widest text-[#1b263b] flex items-center gap-1 hover:underline font-label">
                <span className="material-symbols-outlined text-sm">add</span> Add Personnel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#c5c6cd]/30">
                    <th className="pb-3 text-[10px] font-bold text-[#45474d] uppercase tracking-widest font-label">Personnel</th>
                    <th className="pb-3 text-[10px] font-bold text-[#45474d] uppercase tracking-widest text-center font-label">Role</th>
                    <th className="pb-3 text-[10px] font-bold text-[#45474d] uppercase tracking-widest text-right font-label">Last Login</th>
                    <th className="pb-3 text-[10px] font-bold text-[#45474d] uppercase tracking-widest text-right font-label">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c5c6cd]/10">
                  {[
                    { name: 'Agus Wijaya', id: '1024', role: 'Admin', time: 'Today, 08:42 AM', initial: 'AW' },
                    { name: 'Siti Dewi', id: '2944', role: 'Technician', time: 'Yesterday, 04:15 PM', initial: 'SD' },
                    { name: 'Budi Prasetyo', id: '3310', role: 'Technician', time: '3 days ago', initial: 'BP' },
                  ].map((user, i) => (
                    <tr key={i}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#f1f4f3] flex items-center justify-center font-bold text-xs text-[#1b263b]">{user.initial}</div>
                          <div>
                            <p className="text-sm font-bold text-[#1b263b]">{user.name}</p>
                            <p className="text-[11px] text-[#45474d] font-label">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-label ${user.role === 'Admin' ? 'bg-[#1b263b]/5 text-[#1b263b]' : 'bg-[#6bfe9c]/20 text-[#00743a]'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 text-right text-[12px] text-[#45474d] font-medium">{user.time}</td>
                      <td className="py-4 text-right">
                        <button className="material-symbols-outlined text-[#45474d] hover:text-[#1b263b]">more_vert</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. Data Retention & Security */}
          <section className="col-span-12 bg-white rounded-xl p-8 flex flex-wrap gap-8 items-center justify-between border-l-4 border-[#1b263b] shadow-sm border border-[#c5c6cd]/20">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1b263b]">security</span>
                <div>
                  <h3 className="text-lg font-bold text-[#1b263b] font-headline">Security & Retention</h3>
                  <p className="text-xs text-[#45474d]">Global data governance parameters</p>
                </div>
              </div>
              <div className="hidden md:block h-10 w-px bg-[#c5c6cd]/30"></div>
              <div className="flex items-center gap-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-[#45474d] font-label">Audit Log Retention</label>
                <select className="bg-[#f1f4f3] border-0 rounded px-4 py-1.5 text-xs font-bold text-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/20 font-label">
                  <option>90 Days</option>
                  <option defaultValue="180 Days">180 Days</option>
                  <option>365 Days</option>
                  <option>Indefinite</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase text-[#45474d] leading-none mb-1 font-label">Last Rotation</p>
                <p className="text-xs font-medium text-[#1b263b]">24 Oct 2023</p>
              </div>
              <button className="px-5 py-2.5 bg-white text-[#1b263b] text-[11px] font-bold uppercase tracking-widest border border-[#c5c6cd]/30 hover:shadow-md transition-all flex items-center gap-2 font-label rounded-md">
                <span className="material-symbols-outlined text-base">key</span> Rotate Cryptographic Keys
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Settings;