import React from "react";

/**
 * Settings Component (Hanya Area Halaman Utama)
 * Sudah disesuaikan dengan utilitas class dari index.css & DESIGN.md
 */
export default function Settings() {
  return (
    <div className="page-container">
      
      {/* Page Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#45474d] block mb-2 font-label">
            Configuration Environment
          </span>
          <h1 className="heading-primary">
            System Settings & Configuration
          </h1>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-md text-sm font-bold text-[#45474d] hover:bg-[#e6e9e8] transition-colors">
            Discard Changes
          </button>
          {/* Menggunakan skema warna primary #1B263B sesuai DESIGN.md */}
          <button className="px-6 py-2.5 rounded-md text-sm font-bold text-white bg-[#1b263b] hover:bg-[#051125] shadow-lg active:scale-[0.98] transition-all font-label uppercase tracking-widest">
            Save Global Config
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* 1. ML Threshold Configuration (Wide Card) */}
        <section className="panel-card col-span-12 lg:col-span-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-[#1b263b] bg-[#f1f4f3] p-2 rounded-lg">
              psychology
            </span>
            <div>
              <h3 className="heading-secondary">ML Threshold Configuration</h3>
              <p className="text-subtitle font-medium">
                Define Mean Squared Error (MSE) anomaly detection parameters.
              </p>
            </div>
          </div>

          <div className="space-y-10">
            {/* Critical Threshold */}
            <div className="group">
              <div className="flex justify-between items-end mb-4">
                <div>
                  {/* Menggunakan aksen warna tersier #E74C3C untuk keadaan error/critical */}
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#e74c3c] font-label">
                    Critical Alert Threshold
                  </label>
                  <p className="text-subtitle">
                    Triggers immediate machine shutdown and tech dispatch.
                  </p>
                </div>
                <span className="text-2xl font-black text-[#051125] font-headline">
                  0.35 <span className="text-[10px] text-[#45474d] font-normal tracking-normal">MSE</span>
                </span>
              </div>
              <input 
                className="w-full h-1.5 bg-[#e0e3e2] rounded-full appearance-none cursor-pointer accent-[#e74c3c]" 
                max="1" 
                min="0" 
                step="0.01" 
                type="range" 
                defaultValue="0.35" 
              />
            </div>

            {/* Warning Threshold */}
            <div className="group">
              <div className="flex justify-between items-end mb-4">
                <div>
                  {/* Menggunakan aksen sekunder #2ECC71 untuk warning/aman */}
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#006d37] font-label">
                    Warning Threshold
                  </label>
                  <p className="text-subtitle">
                    Flags maintenance request in dashboard without interruption.
                  </p>
                </div>
                <span className="text-2xl font-black text-[#051125] font-headline">
                  0.15 <span className="text-[10px] text-[#45474d] font-normal tracking-normal">MSE</span>
                </span>
              </div>
              <input 
                className="w-full h-1.5 bg-[#e0e3e2] rounded-full appearance-none cursor-pointer accent-[#2ecc71]" 
                max="1" 
                min="0" 
                step="0.01" 
                type="range" 
                defaultValue="0.15" 
              />
            </div>

            {/* Consecutive Breach Duration */}
            <div className="pt-6 border-t border-[#c5c6cd]/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#45474d]">timer</span>
                <div>
                  <label className="form-label">
                    Consecutive Breach Duration
                  </label>
                  <p className="text-xs text-[#45474d]">Wait time before triggering alert state</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  className="w-20 bg-[#f1f4f3] border-0 border-b-2 border-[#c5c6cd]/50 focus:ring-0 focus:border-[#1b263b] text-right font-bold text-[#1b263b] rounded-t-md" 
                  type="number" 
                  defaultValue="5" 
                />
                <span className="text-xs font-bold text-[#45474d] font-label">MINS</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Maintenance Mode Toggle (Side Card) */}
        {/* Menggunakan warna dasar putih/panel-card agar tulisan teks gelap tidak pudar atau hilang */}
        <section className="panel-card col-span-12 lg:col-span-4 flex flex-col justify-between overflow-hidden relative border-t-4 border-t-[#1b263b]">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-8xl text-[#1b263b]">construction</span>
          </div>
          <div>
            <h3 className="heading-secondary mb-2">Maintenance Mode</h3>
            <p className="text-subtitle leading-relaxed mb-6">
              Pause AI inference and monitoring during planned repairs to prevent false positives.
            </p>
          </div>
          <div className="flex items-center justify-between bg-[#f1f4f3] p-4 rounded-lg border border-[#c5c6cd]/20">
            <span className="text-xs font-bold tracking-tight text-[#1b263b] font-label">AI INFERENCE ENGINE</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input className="sr-only peer" type="checkbox" />
              <div className="w-14 h-7 bg-[#e0e3e2] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2ecc71]"></div>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse"></span>
            <span className="text-[10px] uppercase font-black tracking-widest text-[#2ecc71] font-label">
              Operational
            </span>
          </div>
        </section>

        {/* 2. Notification Rules */}
        <section className="panel-card col-span-12 lg:col-span-5">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-[#1b263b] bg-[#f1f4f3] p-2 rounded-lg">
              mail
            </span>
            <h3 className="heading-secondary">Notification Rules</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between py-2 border-b border-[#c5c6cd]/10">
              <div>
                <p className="text-[13px] font-bold text-[#1b263b]">Critical Status Alerts</p>
                <p className="text-[11px] text-[#45474d]">SMS + Push Notification</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-[#e0e3e2] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1b263b]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-[#c5c6cd]/10">
              <div>
                <p className="text-[13px] font-bold text-[#1b263b]">Warning Notifications</p>
                <p className="text-[11px] text-[#45474d]">Email only</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-[#e0e3e2] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1b263b]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-[#c5c6cd]/10">
              <div>
                <p className="text-[13px] font-bold text-[#1b263b]">Sensor Offline Event</p>
                <p className="text-[11px] text-[#45474d]">SMS for immediate action</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-[#e0e3e2] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1b263b]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-[13px] font-bold text-[#1b263b]">Weekly Summary Reports</p>
                <p className="text-[11px] text-[#45474d]">Automated PDF analytics</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked className="sr-only peer" type="checkbox" />
                <div className="w-11 h-6 bg-[#e0e3e2] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1b263b]"></div>
              </label>
            </div>
          </div>
        </section>

        {/* 3. User Access Management */}
        <section className="panel-card col-span-12 lg:col-span-7">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#1b263b] bg-[#f1f4f3] p-2 rounded-lg">
                group
              </span>
              <h3 className="heading-secondary">User Access Management</h3>
            </div>
            <button className="text-[11px] font-bold uppercase tracking-widest text-[#1b263b] flex items-center gap-1 hover:underline font-label">
              <span className="material-symbols-outlined text-sm">add</span> Add Personnel
            </button>
          </div>

          <div className="overflow-hidden">
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
                <tr>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#f1f4f3] flex items-center justify-center font-bold text-xs text-[#1b263b]">AW</div>
                      <div>
                        <p className="text-sm font-bold text-[#1b263b]">Agus Wijaya</p>
                        <p className="text-[11px] text-[#45474d] font-label">ID: 1024</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b263b]/5 text-[#1b263b] uppercase font-label">Admin</span>
                  </td>
                  <td className="py-4 text-right text-[12px] text-[#45474d] font-medium">Today, 08:42 AM</td>
                  <td className="py-4 text-right">
                    <button className="material-symbols-outlined text-[#45474d] hover:text-[#1b263b]">more_vert</button>
                  </td>
                </tr>
                <tr>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#f1f4f3] flex items-center justify-center font-bold text-xs text-[#1b263b]">SD</div>
                      <div>
                        <p className="text-sm font-bold text-[#1b263b]">Siti Dewi</p>
                        <p className="text-[11px] text-[#45474d] font-label">ID: 2944</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2ecc71]/10 text-[#006d37] uppercase font-label">Technician</span>
                  </td>
                  <td className="py-4 text-right text-[12px] text-[#45474d] font-medium">Yesterday, 04:15 PM</td>
                  <td className="py-4 text-right">
                    <button className="material-symbols-outlined text-[#45474d] hover:text-[#1b263b]">more_vert</button>
                  </td>
                </tr>
                <tr>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#f1f4f3] flex items-center justify-center font-bold text-xs text-[#1b263b]">BP</div>
                      <div>
                        <p className="text-sm font-bold text-[#1b263b]">Budi Prasetyo</p>
                        <p className="text-[11px] text-[#45474d] font-label">ID: 3310</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2ecc71]/10 text-[#006d37] uppercase font-label">Technician</span>
                  </td>
                  <td className="py-4 text-right text-[12px] text-[#45474d] font-medium">3 days ago</td>
                  <td className="py-4 text-right">
                    <button className="material-symbols-outlined text-[#45474d] hover:text-[#1b263b]">more_vert</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Data Retention & Security */}
        <section className="panel-card col-span-12 flex flex-wrap gap-8 items-center justify-between border-l-4 border-l-[#1b263b]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#1b263b]">security</span>
              <div>
                <h3 className="text-lg font-bold text-[#1b263b] font-headline">Security & Retention</h3>
                <p className="text-xs text-[#45474d]">Global data governance parameters</p>
              </div>
            </div>
            <div className="h-10 w-px bg-[#c5c6cd]/40"></div>
            <div className="flex items-center gap-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-[#45474d] font-label">
                Audit Log Retention
              </label>
              <select defaultValue="180 Days" className="bg-white border border-[#c5c6cd]/40 rounded px-4 py-1.5 text-xs font-bold text-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/20 font-label outline-none">
                <option>90 Days</option>
                <option>180 Days</option>
                <option>365 Days</option>
                <option>Indefinite</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-[#45474d] leading-none mb-1 font-label">Last Rotation</p>
              <p className="text-xs font-medium text-[#1b263b]">24 Oct 2023</p>
            </div>
            <button className="px-5 py-2.5 bg-white text-[#1b263b] text-[11px] font-bold uppercase tracking-widest border border-[#c5c6cd]/40 hover:bg-[#f1f4f3] hover:shadow-md transition-all flex items-center gap-2 font-label rounded-md">
              <span className="material-symbols-outlined text-base">key</span> Rotate Cryptographic Keys
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}