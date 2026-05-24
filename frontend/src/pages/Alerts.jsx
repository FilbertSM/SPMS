import { useEffect, useMemo, useState } from 'react';
import Form4Warning from '../components/Form4Warning';
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
              <p className="text-[9px] text-[#45474d] font-medium">
                {alert.is_anomaly ? 'Active anomaly event' : 'Logged normal inference event'}
              </p>
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
          <button
            disabled
            title="Manual workflow only in the Form 4 demo"
            className={`${styles.button} flex-1 lg:w-full opacity-60 cursor-not-allowed`}
          >
            Acknowledge
          </button>
          <button
            disabled
            title="Manual workflow only in the Form 4 demo"
            className="btn-secondary flex-1 lg:w-full py-2 bg-[#e0e3e2] justify-center opacity-60 cursor-not-allowed"
          >
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
          No saved backend events returned from /api/alerts yet. Run latest inference from Dashboard to create the first event.
        </p>
      </div>
    </div>
  </div>
);

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadAlerts = async () => {
      try {
        setLoading(true);
        const payload = await fetchJsonWithAuth('/api/alerts?limit=50');
        if (!ignore) {
          setAlerts(Array.isArray(payload) ? payload : []);
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

  const sortedAlerts = useMemo(() => alerts, [alerts]);
  const activeCount = useMemo(() => alerts.filter((alert) => alert.is_anomaly).length, [alerts]);

  return (
    <div className="page-container space-y-10">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="heading-primary text-3xl">Active Machine Alerts</h2>
          <p className="text-subtitle mt-1">
            Saved backend inference events for maintenance review. {activeCount} active anomaly event(s), {Math.max(alerts.length - activeCount, 0)} logged normal event(s).
          </p>
        </div>
        <div className="flex gap-3">
          <button disabled title="Filtering is not implemented in this demo" className="btn-secondary opacity-60 cursor-not-allowed">
            <span className="material-symbols-outlined text-[18px]">filter_list</span> Filter
          </button>
          <button disabled title="Report export is not implemented in this demo" className="btn-primary py-2 px-4 w-auto mt-0 opacity-60 cursor-not-allowed">
            <span className="material-symbols-outlined text-[18px]">download</span> Export Report
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-lg px-4 py-3 text-sm font-bold">
          Backend data unavailable: {error}
        </div>
      )}

      <Form4Warning>
        Alert acknowledgement, ticket logging, filtering, and report export controls are disabled because those backend workflows are not implemented yet.
      </Form4Warning>

      <section className="space-y-4">
        {loading && alerts.length === 0 && (
          <div className="bg-white rounded-lg p-8 shadow-sm text-sm font-bold text-[#45474d]">
            Loading backend alerts...
          </div>
        )}
        {!loading && sortedAlerts.length === 0 && <EmptyAlertCard />}
        {sortedAlerts.map((alert) => (
          <AlertCard key={alert.id || `${alert.machine_id}-${alert.timestamp}`} alert={alert} />
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="heading-secondary text-xl">Maintenance Review Workflow</h2>
          <div className="h-px flex-grow bg-[#e0e3e2]"></div>
        </div>

        <Form4Warning>
          Acknowledge, Log Ticket, Filter, and Export stay disabled until the backend exposes audited workflow endpoints.
        </Form4Warning>

        <div className="panel-card">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#f1f4f3] flex items-center justify-center text-[#1b263b]">
              <span className="material-symbols-outlined">engineering</span>
            </div>
            <div>
              <h3 className="heading-secondary text-lg">Manual workflow in Form 4 demo</h3>
              <p className="text-sm text-[#45474d] mt-1 max-w-2xl">
                The frontend displays backend anomaly events. Acknowledgement, ticket logging, filtering, and report export need backend workflow support before they can be enabled.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Alerts;
