import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Calendar, Activity, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import TopNav from '../components/TopNav'; 
import Sidebar from '../components/Sidebar';

const PmaDashboard = () => {
  const [telemetryData, setTelemetryData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Date Range State
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  // 1. Data Fetching Logic
  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('spms_token');
      // I've increased the limit here so you actually have enough data to paginate!
      const response = await fetch(`http://127.0.0.1:8000/api/pma/getPMAData?start=${startDate}&end=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Helper function to safely round to 2 decimals
        const roundSafe = (val) => {
          return val != null ? Number(val.toFixed(2)) : 0;
        };
        
        const formattedData = data.map(item => ({
          ...item,
          readableTime: new Date(item.timestamp * 1000).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }) + ' WIB',
          
          // Apply the rounding to all machine metrics
          impeller_rpm: roundSafe(item.impeller_rpm),
          chopper_rpm: roundSafe(item.chopper_rpm),
          pump_speed: roundSafe(item.pump_speed),
          impeller_ampere: roundSafe(item.impeller_ampere),
          processtime_min: roundSafe(item.processtime_min),
          filterclear_interval_sec: roundSafe(item.filterclear_interval_sec)
        }));
        
        setTelemetryData(formattedData);
        setCurrentPage(1); 
      }
    } catch (error) {
      console.error("Failed to fetch PMA telemetry:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // --- Pagination Calculations ---
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = telemetryData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(telemetryData.length / rowsPerPage);

  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  return (
    // MASTER LAYOUT WRAPPER: Handles Sidebar and TopNav
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Sidebar goes here on the left */}
      <Sidebar />

      {/* Main Content Area (Right side) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navigation goes here at the top */}
        <TopNav />

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* --- HEADER SECTION --- */}
          <div className="flex justify-between items-start mb-8 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PMA Granulator #01</h1>
              <p className="text-slate-500 mt-2">
                System monitoring the wet granulation process. Real-time predictive maintenance enabled via LSTM neural network models.
              </p>
              
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <Calendar className="w-5 h-5 text-slate-400 ml-2 mr-3" />
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-slate-700 text-sm font-medium"
                  />
                  <span className="mx-3 text-slate-400">to</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent border-none outline-none text-slate-700 text-sm font-medium"
                  />
                </div>
                <button 
                  onClick={fetchTelemetry}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                >
                  Update Range
                </button>
              </div>
            </div>

            
          </div>

          {/* --- CHART SECTION --- */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-slate-700" />
              <h3 className="text-xl font-bold text-slate-900">Telemetry Visualization</h3>
            </div>
            
            <div className="h-[400px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center text-slate-400 font-medium">Loading telemetry...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="readableTime" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#f8fafc' }}
                      itemStyle={{ fontSize: '14px', fontWeight: '500' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="impeller_rpm" name="Impeller RPM" stroke="#f97316" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="chopper_rpm" name="Chopper RPM" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pump_speed" name="Pump Speed" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="impeller_ampere" name="Impeller Amp" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* --- DATA LOGS TABLE SECTION --- */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            
            {/* Table Header & Pagination Info */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Raw Telemetry Logs</h3>
              <span className="text-sm font-medium text-slate-500">
                Showing {indexOfFirstRow + 1} - {Math.min(indexOfLastRow, telemetryData.length)} of {telemetryData.length} records
              </span>
            </div>
            
            {/* Scrollable Table Container */}
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm text-left relative">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Timestamp (WIB)</th>
                    <th className="px-6 py-4">Impeller RPM</th>
                    <th className="px-6 py-4">Chopper RPM</th>
                    <th className="px-6 py-4">Pump Speed</th>
                    <th className="px-6 py-4">Impeller Ampere</th>
                    <th className="px-6 py-4">Process Time (m)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {/* Notice we map over currentRows, NOT telemetryData! */}
                  {currentRows.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">{row.readableTime}</td>
                      <td className="px-6 py-3 text-slate-600">{row.impeller_rpm}</td>
                      <td className="px-6 py-3 text-slate-600">{row.chopper_rpm}</td>
                      <td className="px-6 py-3 text-slate-600">{row.pump_speed}</td>
                      <td className="px-6 py-3 text-slate-600">{row.impeller_ampere}</td>
                      <td className="px-6 py-3 text-slate-600">{row.processtime_min}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <button 
                onClick={prevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              
              <span className="text-sm font-medium text-slate-600">
                Page <span className="font-bold text-slate-900">{currentPage}</span> of {totalPages || 1}
              </span>
              
              <button 
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </main>
      </div>
    </div>
  );
};

export default PmaDashboard;