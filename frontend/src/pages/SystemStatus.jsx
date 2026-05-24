import { useEffect, useMemo, useState } from 'react';
import Form4Warning from '../components/Form4Warning';
import { fetchJsonWithAuth } from '../utils/api';

const statusLabel = (value) => (value ? 'Ready' : 'Missing');

const SystemStatus = () => {
  const [summary, setSummary] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadStatus = async () => {
      try {
        setLoading(true);
        const [summaryPayload, telemetryPayload, alertsPayload] = await Promise.all([
          fetchJsonWithAuth('/api/dashboard/summary'),
          fetchJsonWithAuth('/api/telemetry/latest?limit=1'),
          fetchJsonWithAuth('/api/alerts?limit=5'),
        ]);
        if (!ignore) {
          setSummary(summaryPayload);
          setTelemetry(Array.isArray(telemetryPayload) ? telemetryPayload : []);
          setAlerts(Array.isArray(alertsPayload) ? alertsPayload : []);
          setLastChecked(new Date());
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadStatus();
    return () => {
      ignore = true;
    };
  }, []);

  const artifactEntries = useMemo(
    () => Object.entries(summary?.artifact_status || {}).filter(([, value]) => typeof value === 'boolean'),
    [summary],
  );

  return (
    <div className="page-container">
      <div className="space-y-6">
        <div>
          <h1 className="heading-primary text-3xl">System Status</h1>
          <p className="text-subtitle mt-2">
            Read-only backend/API status for the Form 4 demo. This page does not modify machine or model settings.
          </p>
        </div>

        {error && (
          <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-lg px-4 py-3 text-sm font-bold">
            Backend status unavailable: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="panel-card">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Dashboard Summary</p>
            <p className="text-2xl font-black text-[#051125] mt-2">{summary ? 'Reachable' : loading ? 'Checking...' : 'Unavailable'}</p>
          </div>
          <div className="panel-card">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Latest Telemetry</p>
            <p className="text-2xl font-black text-[#051125] mt-2">{telemetry.length ? 'Rows returned' : loading ? 'Checking...' : 'No rows'}</p>
          </div>
          <div className="panel-card">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">Alert Events</p>
            <p className="text-2xl font-black text-[#051125] mt-2">{alerts.length} recent</p>
          </div>
        </div>

        <section className="panel-card">
          <h2 className="heading-secondary text-xl mb-4">ML Runtime Readiness</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {artifactEntries.length === 0 && (
              <p className="text-sm font-bold text-[#45474d]">No boolean artifact readiness keys returned yet.</p>
            )}
            {artifactEntries.map(([key, ready]) => (
              <div key={key} className="rounded-lg bg-[#f1f4f3] border border-[#c5c6cd]/20 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-bold capitalize text-[#1b263b]">{key.replaceAll('_', ' ')}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${ready ? 'text-[#006d37]' : 'text-[#ba1a1a]'}`}>
                  {statusLabel(ready)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <Form4Warning>
          UNFINISHED DEMO SECTION. This page is read-only status evidence. Automated service health checks, alert routing, and uptime monitoring are not implemented in the frontend.
        </Form4Warning>

        <p className="text-xs font-bold text-[#45474d]">
          Last checked: {lastChecked ? lastChecked.toLocaleString() : 'Not checked yet'}
        </p>
      </div>
    </div>
  );
};

export default SystemStatus;
