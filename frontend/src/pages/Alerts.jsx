import { useEffect, useMemo, useState } from 'react';
import { fetchJsonWithAuth } from '../utils/api';

const severityStyles = {
  critical: {
    border: 'border-[#e74c3c]/20',
    badge: 'bg-[#e74c3c]/10 text-[#e74c3c]',
    iconBg: 'bg-[#ffebee] text-[#e74c3c]',
    score: 'text-[#e74c3c]',
    bar: 'bg-[#e74c3c]',
    button: 'btn-danger',
    label: 'Critical',
  },
  warning: {
    border: 'border-[#2ecc71]/40',
    badge: 'bg-[#2ecc71]/20 text-[#00743a]',
    iconBg: 'bg-[#e8f5e9] text-[#00743a]',
    score: 'text-[#00743a]',
    bar: 'bg-[#00743a]',
    button: 'btn-success',
    label: 'Warning',
  },
  normal: {
    border: 'border-[#c5c6cd]/30',
    badge: 'bg-[#e0e3e2] text-[#45474d]',
    iconBg: 'bg-[#f1f4f3] text-[#45474d]',
    score: 'text-[#45474d]',
    bar: 'bg-[#75777d]',
    button: 'btn-secondary',
    label: 'Normal',
  },
};

const formatScore = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(3) : '-';
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'No timestamp';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Invalid timestamp';
  return date.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const scorePercent = (alert) => {
  const score = Number(alert?.reconstruction_error);
  const threshold = Number(alert?.threshold);
  if (!Number.isFinite(score) || !Number.isFinite(threshold) || threshold <= 0) return 0;
  return Math.min(100, Math.max(8, (score / (threshold * 1.5)) * 100));
};

const AlertCard = ({ alert }) => {
  const severity = alert?.severity || (alert?.is_anomaly ? 'warning' : 'normal');
  const styles = severityStyles[severity] || severityStyles.warning;

  return (
    <div className={`bg-white rounded-lg overflow-hidden flex shadow-sm border ${styles.border}`}>
      <div className="flex-grow p-5 flex flex-col lg:flex-row items-center gap-6">
        <div className="flex-shrink-0 w-full lg:w-48">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-sm ${styles.badge} text-[8px] font-black uppercase tracking-widest mb-2`}>
            {styles.label}
          </span>
          <h3 className="heading-secondary text-lg mb-1">{alert.machine_id || 'PMA Granulator #01'}</h3>
          <div className="flex items-center gap-2 text-[10px] text-[#45474d] font-medium">
            <span className="material-symbols-outlined text-[14px]">precision_manufacturing</span>
            Line B - Pharma
          </div>
        </div>

        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:border-l lg:border-[#c5c6cd]/30 lg:pl-6">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Metric & Variance</p>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded ${styles.iconBg} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-base">psychology</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#1b263b]">LSTM Autoencoder</p>
                <p className={`text-[11px] font-mono font-bold ${styles.score}`}>
                  Threshold {formatScore(alert.threshold)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Temporal Data</p>
            <div>
              <p className="text-xs font-bold text-[#1b263b]">{formatTimestamp(alert.timestamp)}</p>
              <p className="text-[9px] text-[#45474d] font-medium">Backend anomaly event</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Anomaly Score (MAE)</p>
            <div className="flex items-end gap-2">
              <span className={`text-xl font-mono font-bold ${styles.score} leading-none`}>{formatScore(alert.reconstruction_error)}</span>
              <span className={`text-[8px] font-black ${styles.score} border border-current/20 px-1 py-0.5 rounded-sm mb-0.5`}>
                {alert.is_anomaly ? 'ACTIVE' : 'LOGGED'}
              </span>
            </div>
            <div className="w-full h-1 bg-[#ebeeed] rounded-full overflow-hidden mt-1">
              <div className={`${styles.bar} h-full`} style={{ width: `${scorePercent(alert)}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-48 lg:pl-6 lg:border-l lg:border-[#c5c6cd]/30">
          <button className={`${styles.button} flex-1 lg:w-full`}>
            Acknowledge
          </button>
          <button className="btn-secondary flex-1 lg:w-full py-2 bg-[#e0e3e2] justify-center">
            Log Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyAlertCard = () => (
  <div className="bg-white rounded-lg overflow-hidden flex shadow-sm border border-[#c5c6cd]/30">
    <div className="flex-grow p-8 flex flex-col md:flex-row md:items-center gap-5">
      <div className="w-12 h-12 rounded bg-[#e8f5e9] flex items-center justify-center text-[#00743a]">
        <span className="material-symbols-outlined">check_circle</span>
      </div>
      <div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-[#2ecc71]/20 text-[#00743a] text-[8px] font-black uppercase tracking-widest mb-2">
          Clear
        </span>
        <h3 className="heading-secondary text-lg mb-1">No active backend anomaly events</h3>
        <p className="text-xs text-[#45474d] font-medium">
          The FastAPI dashboard summary did not return recent alerts yet. New LSTM Autoencoder events will appear here.
        </p>
      </div>
    </div>
  </div>
);

const Alerts = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadAlerts = async () => {
      try {
        setLoading(true);
        const payload = await fetchJsonWithAuth('/api/dashboard/summary');
        if (!ignore) {
          setSummary(payload);
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

    loadAlerts();
    const timer = window.setInterval(loadAlerts, 60000);

    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);

  const alerts = useMemo(() => {
    const rows = Array.isArray(summary?.recent_alerts) ? summary.recent_alerts : [];
    return rows.filter((alert) => alert.is_anomaly);
  }, [summary]);

  return (
    <div className="page-container space-y-10">
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

      {error && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-lg px-4 py-3 text-sm font-bold">
          Backend data unavailable: {error}
        </div>
      )}

      <section className="space-y-4">
        {loading && !summary && (
          <div className="bg-white rounded-lg p-8 shadow-sm text-sm font-bold text-[#45474d]">
            Loading backend alerts...
          </div>
        )}
        {!loading && alerts.length === 0 && <EmptyAlertCard />}
        {alerts.map((alert) => (
          <AlertCard key={alert.id || `${alert.machine_id}-${alert.timestamp}`} alert={alert} />
        ))}
      </section>

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
                  <p className="text-sm font-medium text-[#1b263b]">Oct 24, 09:12 - 10:45</p>
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
                  <p className="text-sm font-medium text-[#1b263b]">Oct 23, 14:00 - 14:15</p>
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
