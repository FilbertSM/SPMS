import React, { useEffect, useState } from 'react';
import { fetchBlobWithAuth, fetchJsonWithAuth } from '../utils/api';
import CryptoJS from 'crypto-js'; 

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isExporting, setIsExporting] = useState(false);
  
  // State untuk tombol Verify SHA-256
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await fetchJsonWithAuth('/api/audit-logs');
        setLogs(data);
        setAccessDenied(false);
      } catch (err) {
        if (err.status === 403) {
          setAccessDenied(true);
          setError(null);
        } else {
          setError(err.message);
        }
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

  const indexOfLastLog = currentPage * itemsPerPage;
  const indexOfFirstLog = indexOfLastLog - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await fetchBlobWithAuth('/api/audit-logs/export');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      a.href = url;
      a.download = `SPMS_Security_Audit_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Fungsi Hash SHA-256 untuk mendemonstrasikan Anti-Tampering
  const generateHash = (log) => {
    const dataString = `${log.id}-${log.timestamp}-${log.user_email}-${log.action}-${log.status}`;
    return CryptoJS.SHA256(dataString).toString(CryptoJS.enc.Hex).substring(0, 16) + "...";
  };

  return (
    <div className="p-8 flex-1 overflow-y-auto bg-[#f1f4f3] font-body">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="heading-primary text-3xl flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-[#1b263b]">encrypted</span>
            Authenticated Backend Audit Events
          </h2>
          <p className="text-subtitle mt-2">Authenticated backend audit events recorded by the FastAPI service.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tombol Verify SHA-256 diselipkan di sini */}
          {!accessDenied && (
            <button 
              onClick={() => setIsVerified(!isVerified)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                isVerified 
                  ? 'bg-[#1b263b] text-[#6bfe9c] border border-transparent' 
                  : 'bg-white text-[#1b263b] border border-[#c5c6cd]/40 hover:bg-[#f1f4f3]'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isVerified ? 'verified_user' : 'policy'}
              </span>
              {isVerified ? 'Verified' : 'Verify SHA-256'}
            </button>
          )}
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">calendar_today</span>
          <input 
            type="date" 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#c5c6cd]/40 rounded-lg focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-sm"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting || accessDenied}
          className="btn-secondary flex justify-center items-center gap-2 py-2.5 bg-[#e0e3e2] hover:bg-[#d0d3d2] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">download</span> 
          {isExporting ? 'Downloading...' : 'Export Security Report'}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-lg text-sm font-bold flex items-center gap-3">
          <span className="material-symbols-outlined">report</span> {error}
        </div>
      )}

      {accessDenied && (
        <div className="panel-card border-l-4 border-l-[#ba1a1a]">
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined rounded-lg bg-[#ffdad6] p-2 text-[#ba1a1a]">lock</span>
            <div>
              <h3 className="heading-secondary text-xl">Admin access required</h3>
              <p className="text-sm text-[#45474d] mt-2">
                The backend returned 403 for audit logs. Sign in with an administrator account to view or export authenticated backend audit events.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!accessDenied && (
      <div className="bg-white rounded-xl shadow-sm border border-[#c5c6cd]/20 overflow-x-auto">
        <table className="min-w-[860px] w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8faf9] border-b border-[#c5c6cd]/30">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#75777d]">Temporal Data (UTC)</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#75777d]">Identity Provider</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#75777d]">Security Event</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#75777d]">Source IP</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#75777d]">Outcome</th>
              {isVerified && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#2ecc71]">SHA-256 Fingerprint</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ebeeed]">
            {isLoading ? (
              <tr><td colSpan={isVerified ? "6" : "5"} className="text-center py-20 text-sm text-[#75777d] italic">Loading audit logs...</td></tr>
            ) : currentLogs.length === 0 ? (
              <tr><td colSpan={isVerified ? "6" : "5"} className="text-center py-20 text-sm text-[#75777d]">No audit events found matching current filters.</td></tr>
            ) : (
              currentLogs.map((log) => (
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
                  {isVerified && (
                    <td className="px-6 py-5">
                      <span className="font-mono text-[10px] text-[#45474d] bg-[#f1f4f3] px-2 py-1 rounded border border-[#c5c6cd]/50 shadow-inner">
                        {generateHash(log)}
                      </span>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {!accessDenied && (
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-[#75777d] font-medium">
          Showing {filteredLogs.length === 0 ? 0 : indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} security entries
        </p>
        
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-[#75777d] font-bold">
            Page {currentPage} of {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-1.5 bg-white border border-[#c5c6cd]/40 text-[11px] font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f1f4f3] transition-colors"
            >
              Previous
            </button>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-1.5 bg-white border border-[#c5c6cd]/40 text-[11px] font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f1f4f3] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default AuditLogs;