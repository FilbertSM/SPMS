const Alerts = () => {
  return (
    <div className="page-container space-y-10">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="heading-primary text-3xl">Active Machine Alerts</h2>
          <p className="text-subtitle mt-1">Real-time anomaly detection and predictive maintenance triggers.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
          </button>
          <button className="btn-primary py-2 px-4 w-auto mt-0">
            <span className="material-symbols-outlined text-[18px]">download</span> Export Report
          </button>
        </div>
      </section>

      {/* Active Alerts Grid */}
      <section className="space-y-4">
        {/* CRITICAL ALERT ITEM */}
        <div className="bg-white rounded-lg overflow-hidden flex shadow-sm border border-[#e74c3c]/20">
          <div className="flex-grow p-5 flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-full lg:w-48">
              <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-[#e74c3c]/10 text-[#e74c3c] text-[8px] font-black uppercase tracking-widest mb-2">Critical</span>
              <h3 className="heading-secondary text-lg mb-1">PMA Granulator #01</h3>
              <div className="flex items-center gap-2 text-[10px] text-[#45474d] font-medium">
                <span className="material-symbols-outlined text-[14px]">precision_manufacturing</span>
                Line B • Pharma
              </div>
            </div>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:border-l lg:border-[#c5c6cd]/30 lg:pl-6">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Metric & Variance</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#ffebee] flex items-center justify-center text-[#e74c3c]">
                    <span className="material-symbols-outlined text-base">vibration</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#1b263b]">Vibration Velocity</p>
                    <p className="text-[11px] font-mono font-bold text-[#e74c3c]">12.4 mm/s <span className="text-[9px] opacity-70">(+84%)</span></p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Temporal Data</p>
                <div>
                  <p className="text-xs font-bold text-[#1b263b]">08:14 <span className="text-[9px] font-normal text-[#45474d] uppercase ml-1">Elapsed</span></p>
                  <p className="text-[9px] text-[#45474d] font-medium">14:22:10 UTC</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Anomaly Score (MSE)</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-mono font-bold text-[#e74c3c] leading-none">0.38</span>
                  <span className="text-[8px] font-black text-[#e74c3c] border border-[#e74c3c]/20 px-1 py-0.5 rounded-sm mb-0.5">PEAK</span>
                </div>
                <div className="w-full h-1 bg-[#ebeeed] rounded-full overflow-hidden mt-1">
                  <div className="bg-[#e74c3c] h-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-48 lg:pl-6 lg:border-l lg:border-[#c5c6cd]/30">
              <button className="btn-danger flex-1 lg:w-full">
                Acknowledge
              </button>
              <button className="btn-secondary flex-1 lg:w-full py-2 bg-[#e0e3e2] justify-center">
                Log Ticket
              </button>
            </div>
          </div>
        </div>

        {/* WARNING ALERT ITEM */}
        <div className="bg-white rounded-lg overflow-hidden flex shadow-sm border border-[#2ecc71]/40">
          <div className="flex-grow p-5 flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-full lg:w-48">
              <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-[#2ecc71]/20 text-[#00743a] text-[8px] font-black uppercase tracking-widest mb-2">Warning</span>
              <h3 className="heading-secondary text-lg mb-1">Blister Packager 04</h3>
              <div className="flex items-center gap-2 text-[10px] text-[#45474d] font-medium">
                <span className="material-symbols-outlined text-[14px]">package</span>
                North Area • Pack
              </div>
            </div>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:border-l lg:border-[#c5c6cd]/30 lg:pl-6">
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Metric & Variance</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#e8f5e9] flex items-center justify-center text-[#00743a]">
                    <span className="material-symbols-outlined text-base">bolt</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#1b263b]">Motor Current</p>
                    <p className="text-[11px] font-mono font-bold text-[#00743a]">Threshold Breach</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Temporal Data</p>
                <div>
                  <p className="text-xs font-bold text-[#1b263b]">02:45 <span className="text-[9px] font-normal text-[#45474d] uppercase ml-1">Elapsed</span></p>
                  <p className="text-[9px] text-[#45474d] font-medium">14:28:44 UTC</p>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Anomaly Score (MSE)</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-mono font-bold text-[#00743a] leading-none">0.19</span>
                  <span className="text-[8px] font-black text-[#00743a] border border-[#00743a]/20 px-1 py-0.5 rounded-sm mb-0.5">ACTIVE</span>
                </div>
                <div className="w-full h-1 bg-[#ebeeed] rounded-full overflow-hidden mt-1">
                  <div className="bg-[#00743a] h-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-48 lg:pl-6 lg:border-l lg:border-[#c5c6cd]/30">
              <button className="btn-success flex-1 lg:w-full">
                Acknowledge
              </button>
              <button className="btn-secondary flex-1 lg:w-full py-2 bg-[#e0e3e2] justify-center">
                Log Ticket
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Historical Log Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="heading-secondary text-xl">Resolved Alerts & Maintenance Log</h2>
          <div className="h-px flex-grow bg-[#e0e3e2]"></div>
        </div>
        
        <div className="panel-card p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f4f7f6]">
              <tr>
                <th className="px-6 py-4 text-[10px] font-label font-bold uppercase tracking-widest text-[#75777d]">Machine Asset</th>
                <th className="px-6 py-4 text-[10px] font-label font-bold uppercase tracking-widest text-[#75777d]">Incident Period</th>
                <th className="px-6 py-4 text-[10px] font-label font-bold uppercase tracking-widest text-[#75777d]">Outcome</th>
                <th className="px-6 py-4 text-[10px] font-label font-bold uppercase tracking-widest text-[#75777d] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebeeed]">
              <tr className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-white flex items-center justify-center border border-[#c5c6cd]/40">
                      <span className="material-symbols-outlined text-[#75777d]">precision_manufacturing</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1b263b]">Centrifuge Pump 02</p>
                      <p className="text-[10px] text-[#45474d] uppercase font-medium mt-0.5">Bearing Friction Anomaly</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-[#1b263b]">Oct 24, 09:12 — 10:45</p>
                  <p className="text-[10px] text-[#45474d] mt-0.5">Total Downtime: 1h 33m</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2ecc71]/20 text-[#00743a] uppercase">
                    Resolved: Part Replaced
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#1b263b] hover:text-[#2ecc71] font-bold text-xs uppercase tracking-wider underline decoration-2 underline-offset-4 transition-colors">View Log</button>
                </td>
              </tr>
              
              <tr className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-white flex items-center justify-center border border-[#c5c6cd]/40">
                      <span className="material-symbols-outlined text-[#75777d]">settings_input_component</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1b263b]">Air Compressor Main</p>
                      <p className="text-[10px] text-[#45474d] uppercase font-medium mt-0.5">Pressure Variance</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-[#1b263b]">Oct 23, 14:00 — 14:15</p>
                  <p className="text-[10px] text-[#45474d] mt-0.5">Total Downtime: 15m</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e0e3e2] text-[#45474d] uppercase">
                    System Recalibrated
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-[#1b263b] hover:text-[#2ecc71] font-bold text-xs uppercase tracking-wider underline decoration-2 underline-offset-4 transition-colors">View Log</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Alerts;