import React, { useEffect, useState } from 'react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('spms_token');
        const response = await fetch('http://localhost:8000/api/audit-logs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 403) throw new Error("Access Denied: Administrative Privileges Required");
          throw new Error("Failed to synchronize with security vault");
        }

        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Filter Logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = dateFilter ? log.timestamp.includes(dateFilter) : true;
    return matchesSearch && matchesDate;
  });

  return (
    <div className="p-8 flex-1 overflow-y-auto bg-[#f1f4f3] font-body">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="heading-primary text-3xl flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-[#1b263b]">encrypted</span>
            Security Audit Trail
          </h2>
          <p className="text-subtitle mt-2">Real-time monitoring of user access, system modifications, and security anomalies.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-[10px] font-black text-[#2ecc71] bg-[#2ecc71]/10 px-4 py-2 rounded-sm border border-[#2ecc71]/20 tracking-widest">
            <span className="w-2 h-2 bg-[#2ecc71] rounded-full animate-pulse"></span>
            SYSTEM SENTINEL ACTIVE
          </span>
        </div>
      </section>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">search</span>
          <input 
            type="text" 
            placeholder="Search by User or Action..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#c5c6cd]/40 rounded-lg focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">calendar_today</span>
          <input 
            type="date" 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#c5c6cd]/40 rounded-lg focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex justify-center items-center gap-2 py-2.5 bg-[#e0e3e2] hover:bg-[#d0d3d2]">
          <span className="material-symbols-outlined text-lg">download</span> Export Security Report
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-lg text-sm font-bold flex items-center gap-3">
          <span className="material-symbols-outlined">report</span> {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#c5c6cd]/20 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8faf9] border-b border-[#c5c6cd]/30">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#75777d]">Temporal Data (UTC)</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#75777d]">Identity Provider</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#75777d]">Security Event</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#75777d]">Source IP</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#75777d]">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ebeeed]">
            {isLoading ? (
              <tr><td colSpan="5" className="text-center py-20 text-sm text-[#75777d] italic">Decrypting audit logs...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-20 text-sm text-[#75777d]">No security events found matching current filters.</td></tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#f9fafb] transition-colors group">
                  <td className="px-6 py-5">
                    <p className="text-[11px] font-bold text-[#1b263b]">{new Date(log.timestamp).toLocaleDateString()}</p>
                    <p className="text-[10px] text-[#75777d] font-mono mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#f1f4f3] flex items-center justify-center text-[#1b263b] font-bold text-[10px] border border-[#c5c6cd]/30">
                        {log.user_email?.substring(0, 2).toUpperCase()}
                      </div>
                      <p className="text-xs font-bold text-[#1b263b]">{log.user_email || 'System/Anonymous'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-[#1b263b]/5 text-[#1b263b] text-[9px] font-black uppercase tracking-wider border border-[#1b263b]/10">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-mono font-medium text-[#45474d]">{log.ip_address}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      log.status === 'SUCCESS' ? 'bg-[#2ecc71]/10 text-[#00743a]' : 'bg-[#e74c3c]/10 text-[#e74c3c]'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Placeholder */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-[#75777d] font-medium">Showing {filteredLogs.length} security entries</p>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 bg-white border border-[#c5c6cd]/40 text-[11px] font-bold rounded-lg disabled:opacity-50">Previous</button>
          <button className="px-4 py-1.5 bg-white border border-[#c5c6cd]/40 text-[11px] font-bold rounded-lg disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;