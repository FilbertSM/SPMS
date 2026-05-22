import React, { useCallback, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchJsonWithAuth } from '../utils/api';

const dateInputValueFromToday = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

const buildTelemetryUrl = (baseUrl, range) => {
  if (!range?.start || !range?.end) return baseUrl;
  const params = new URLSearchParams({ start: range.start, end: range.end });
  return `${baseUrl}?${params.toString()}`;
};

const MotorChart = () => {
  const [telemetryData, setTelemetryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [startDate, setStartDate] = useState(() => dateInputValueFromToday(-1));
  const [endDate, setEndDate] = useState(() => dateInputValueFromToday());
  const [appliedRange, setAppliedRange] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;

  const fetchTelemetry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonWithAuth(buildTelemetryUrl('/api/motor/telemetry', appliedRange));

      const roundSafe = (val) => {
        const parsed = Number(val);
        return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
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
    } catch (error) {
      console.error("Failed to fetch Motor telemetry:", error);
      setTelemetryData([]);
      setError(error.message || 'Failed to fetch Motor telemetry.');
    } finally {
      setLoading(false);
    }
  }, [appliedRange]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchTelemetry();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchTelemetry]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = telemetryData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(telemetryData.length / rowsPerPage);
  const firstVisibleRow = telemetryData.length ? indexOfFirstRow + 1 : 0;

  const nextPage = () => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  const prevPage = () => setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));

  return (
    <div className="page-container font-sans text-slate-800">
          
          {/* Header Area */}
          <div className="flex justify-between items-start mb-8 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Motor #1.1 Diagnostics</h1>
              <p className="text-slate-500 mt-2">
                Vibration and thermal monitoring for maintenance review. This page reports anomaly signals only and does not control the machine.
              </p>
              
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-2">
                  <Calendar className="w-5 h-5 text-slate-400 ml-2 mr-3" />
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent border-none outline-none text-slate-700 text-sm font-medium" />
                  <span className="mx-3 text-slate-400">to</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent border-none outline-none text-slate-700 text-sm font-medium" />
                </div>
                <button onClick={() => setAppliedRange({ start: startDate, end: endDate })} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                  Update Range
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              Motor telemetry unavailable: {error}
            </div>
          )}

          {/* Chart Area */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-slate-700" />
              <h3 className="text-xl font-bold text-slate-900">Vibration & Temperature Visualization</h3>
            </div>
            <div className="h-[400px] w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center text-slate-400 font-medium">Loading telemetry...</div>
              ) : telemetryData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-400 font-medium">No telemetry rows for this range.</div>
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
                Showing {firstVisibleRow} - {Math.min(indexOfLastRow, telemetryData.length)} of {telemetryData.length} records
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
                  {currentRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center font-medium text-slate-400">
                        No telemetry rows to display.
                      </td>
                    </tr>
                  ) : currentRows.map((row, index) => (
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
    </div>
  );
};

export default MotorChart;
