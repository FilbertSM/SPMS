import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

// --- NEW IMPORTS ---
import TopNav from '../components/TopNav'; 
import Sidebar from '../components/Sidebar';

const MotorChart = () => {
  const [telemetryData, setTelemetryData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [startDate, setStartDate] = useState(new Date(Date.now() - 86400000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('spms_token');
      const response = await fetch(`http://127.0.0.1:8000/api/motor/telemetry?start=${startDate}&end=${endDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const roundSafe = (val) => {
          return val != null ? Number(Number(val).toFixed(2)) : 0;
        };
        
        const formattedData = data.map(item => ({
          ...item,
          readableTime: new Date(item.timestamp * 1000).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }) + ' WIB',
          
          x_velocity_mm_s: roundSafe(item.x_velocity_mm_s),
          z_velocity_mm_s: roundSafe(item.z_velocity_mm_s),
          x_peak_accel_g: roundSafe(item.x_peak_accel_g),
          z_peak_accel_g: roundSafe(item.z_peak_accel_g),
          temperature: roundSafe(item.temperature)
        }));
        
        setTelemetryData(formattedData);
        setCurrentPage(1); 
      }
    } catch (error) {
      console.error("Failed to fetch Motor telemetry:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []); 

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = telemetryData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(telemetryData.length / rowsPerPage);

  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  return (
    // MASTER LAYOUT WRAPPER: Handles Sidebar and TopNav
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Sidebar fixed on the left */}
      <Sidebar />

      {/* Main Content Area (Right side) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TopNav fixed at the top */}
        <TopNav />

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8">
          
          {/* Header Area */}
          <div className="flex justify-between items-start mb-8 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Motor #1.1 Diagnostics</h1>
              <p className="text-slate-500 mt-2">
                Vibration and thermal monitoring. Peak acceleration tracking for bearing wear detection.
              </p>
              
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <Calendar className="w-5 h-5 text-slate-400 ml-2 mr-3" />
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-none outline-none text-slate-700 text-sm font-medium" />
                  <span className="mx-3 text-slate-400">to</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-none outline-none text-slate-700 text-sm font-medium" />
                </div>
                <button onClick={fetchTelemetry} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                  Update Range
                </button>
              </div>
            </div>
          </div>

          {/* Chart Area */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-slate-700" />
              <h3 className="text-xl font-bold text-slate-900">Vibration & Temperature Visualization</h3>
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
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#f8fafc' }} itemStyle={{ fontSize: '14px', fontWeight: '500' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    
                    <Line type="monotone" dataKey="x_velocity_mm_s" name="X-Vel (mm/s)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="z_velocity_mm_s" name="Z-Vel (mm/s)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="x_peak_accel_g" name="X-Peak (G)" stroke="#ef4444" strokeWidth={2} dot={false} hidden />
                    <Line type="monotone" dataKey="z_peak_accel_g" name="Z-Peak (G)" stroke="#f97316" strokeWidth={2} dot={false} hidden />
                    <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#10b981" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Raw Motor Logs</h3>
              <span className="text-sm font-medium text-slate-500">
                Showing {indexOfFirstRow + 1} - {Math.min(indexOfLastRow, telemetryData.length)} of {telemetryData.length} records
              </span>
            </div>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm text-left relative">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Timestamp (WIB)</th>
                    <th className="px-6 py-4">X-Vel (mm/s)</th>
                    <th className="px-6 py-4">Z-Vel (mm/s)</th>
                    <th className="px-6 py-4">X-Peak (G)</th>
                    <th className="px-6 py-4">Z-Peak (G)</th>
                    <th className="px-6 py-4">Temp (°C)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentRows.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">{row.readableTime}</td>
                      <td className="px-6 py-3 text-slate-600">{row.x_velocity_mm_s}</td>
                      <td className="px-6 py-3 text-slate-600">{row.z_velocity_mm_s}</td>
                      <td className="px-6 py-3 text-slate-600">{row.x_peak_accel_g}</td>
                      <td className="px-6 py-3 text-slate-600">{row.z_peak_accel_g}</td>
                      <td className="px-6 py-3 text-slate-600 font-bold">{row.temperature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <button onClick={prevPage} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm font-medium text-slate-600">
                Page <span className="font-bold text-slate-900">{currentPage}</span> of {totalPages || 1}
              </span>
              <button onClick={nextPage} disabled={currentPage === totalPages || totalPages === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default MotorChart;