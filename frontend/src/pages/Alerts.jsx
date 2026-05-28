import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchBlobWithAuth, fetchJsonWithAuth } from '../utils/api';
import { encryptTicketData } from '../utils/encryption';

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
    border: 'border-[#ffe08a]/70',
    badge: 'bg-[#fff4ce] text-[#805600]',
    iconBg: 'bg-[#fff4ce] text-[#805600]',
    score: 'text-[#805600]',
    bar: 'bg-[#805600]',
    button: 'btn-secondary',
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

const AlertCard = ({ alert, ackNote, onAckNoteChange, onAcknowledge, onOpenTicket }) => {
  const severity = alert?.severity || (alert?.is_anomaly ? 'warning' : 'normal');
  const styles = severityStyles[severity] || severityStyles.warning;
  const acknowledged = Boolean(alert.acknowledged_at);

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${styles.border}`}>
      <div className="p-4 sm:p-5 grid grid-cols-1 xl:grid-cols-[12rem_1fr_16rem] gap-5 xl:items-center">
        <div className="min-w-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-sm ${styles.badge} text-[8px] font-black uppercase tracking-widest mb-2`}>
            {styles.label}
          </span>
          <h3 className="text-base font-black text-[#051125] truncate">{alert.machine_id || 'PMA Granulator #01'}</h3>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-[#45474d] font-bold">
            <span className="material-symbols-outlined text-[14px]">precision_manufacturing</span>
            Alert #{alert.id}
          </div>
          {acknowledged && (
            <p className="mt-2 text-[10px] font-bold text-[#006d37]">
              Acknowledged by {alert.acknowledged_by || 'operator'}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 xl:border-l xl:border-[#c5c6cd]/30 xl:pl-5">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Threshold</p>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded ${styles.iconBg} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-base">psychology</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#1b263b]">LSTM Autoencoder</p>
                <p className={`text-[11px] font-mono font-bold ${styles.score}`}>
                  {formatScore(alert.threshold)} ({alert.threshold_source || 'artifact'})
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Event Time</p>
            <div>
              <p className="text-xs font-bold text-[#1b263b]">{formatTimestamp(alert.timestamp)}</p>
              <p className="text-[9px] text-[#45474d] font-medium">
                {alert.is_anomaly ? 'Anomaly event' : 'Normal inference'}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#75777d]">Anomaly Score (MAE)</p>
            <div className="flex items-end gap-2">
              <span className={`text-xl font-mono font-bold ${styles.score} leading-none`}>{formatScore(alert.reconstruction_error)}</span>
              <span className={`text-[8px] font-black ${styles.score} border border-current/20 px-1 py-0.5 rounded-sm mb-0.5`}>
                {acknowledged ? 'ACKED' : alert.is_anomaly ? 'ACTIVE' : 'LOGGED'}
              </span>
            </div>
            <div className="w-full h-1 bg-[#ebeeed] rounded-full overflow-hidden mt-1">
              <div className={`${styles.bar} h-full`} style={{ width: `${scorePercent(alert)}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 xl:border-l xl:border-[#c5c6cd]/30 xl:pl-5">
          <input
            value={ackNote}
            onChange={(event) => onAckNoteChange(alert.id, event.target.value)}
            disabled={acknowledged}
            placeholder={acknowledged ? alert.acknowledgement_note || 'Acknowledged' : 'Acknowledgement note'}
            className="input-field py-2 text-xs disabled:opacity-70"
          />
          <button
            disabled={acknowledged}
            onClick={() => onAcknowledge(alert)}
            className={`${styles.button} w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <span className="material-symbols-outlined text-[18px]">done</span>
            {acknowledged ? 'Acknowledged' : 'Acknowledge'}
          </button>
          <button
            onClick={() => onOpenTicket(alert)}
            className="btn-secondary w-full py-2 bg-[#e0e3e2] justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">medical_services</span>
            Log Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

const EmptyAlertCard = () => (
  <div className="bg-white rounded-lg shadow-sm border border-[#c5c6cd]/30">
    <div className="p-6 flex flex-col md:flex-row md:items-center gap-4">
      <div className="w-12 h-12 rounded bg-[#e8f5e9] flex items-center justify-center text-[#00743a]">
        <span className="material-symbols-outlined">check_circle</span>
      </div>
      <div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-[#2ecc71]/20 text-[#00743a] text-[8px] font-black uppercase tracking-widest mb-2">
          Clear
        </span>
        <h3 className="heading-secondary text-lg mb-1">No events match the current filters</h3>
        <p className="text-xs text-[#45474d] font-medium">
          Run latest inference from Dashboard when a new review event is needed.
        </p>
      </div>
    </div>
  </div>
);

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({ severity: 'all', acknowledgement: 'all' });
  const [ackNotes, setAckNotes] = useState({});
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [ticketText, setTicketText] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadAlerts = useCallback(async () => {
    const params = new URLSearchParams({ limit: '50' });
    if (filters.severity !== 'all') params.set('severity', filters.severity);
    if (filters.acknowledgement !== 'all') params.set('acknowledgement_status', filters.acknowledgement);

    try {
      setLoading(true);
      const payload = await fetchJsonWithAuth(`/api/alerts?${params.toString()}`);
      setAlerts(Array.isArray(payload) ? payload : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadAlerts, 0);
    const timer = window.setInterval(loadAlerts, 60000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadAlerts]);

  const activeCount = useMemo(() => alerts.filter((alert) => alert.is_anomaly).length, [alerts]);

  const handleAcknowledge = async (alert) => {
    try {
      setWorking(true);
      await fetchJsonWithAuth(`/api/alerts/${alert.id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ note: ackNotes[alert.id] || 'Reviewed in Form 4 demo workflow.' }),
      });
      setSuccess(`Alert #${alert.id} acknowledged.`);
      await loadAlerts();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  const handleExport = async () => {
    try {
      setWorking(true);
      const blob = await fetchBlobWithAuth('/api/alerts/export');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SPMS_Alert_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSuccess('Alert CSV evidence exported.');
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  const openTicketModal = (alert) => {
    setSelectedAlert(alert);
    setTicketText(`Alert #${alert.id}: ${alert.severity} anomaly score ${formatScore(alert.reconstruction_error)} against threshold ${formatScore(alert.threshold)}.`);
  };

  const createLinkedTicket = async () => {
    if (!selectedAlert || !ticketText.trim()) return;
    try {
      setWorking(true);
      await fetchJsonWithAuth('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({
          machine_id: selectedAlert.machine_id || 'PMA Granulator #01',
          anomaly_event_id: selectedAlert.id,
          issue_description: encryptTicketData(ticketText.trim()),
        }),
      });
      setSelectedAlert(null);
      setTicketText('');
      setSuccess(`Encrypted ticket created for alert #${selectedAlert.id}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <h2 className="heading-primary text-3xl">Alerts</h2>
          <p className="text-subtitle mt-1">
            {activeCount} active anomaly event(s), {Math.max(alerts.length - activeCount, 0)} logged normal event(s).
          </p>
        </div>
        <div className="panel-card p-3 flex flex-col sm:flex-row gap-2 sm:items-center">
          <select
            value={filters.severity}
            onChange={(event) => setFilters((current) => ({ ...current, severity: event.target.value }))}
            className="input-field py-2 text-xs sm:w-44"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="normal">Normal</option>
          </select>
          <select
            value={filters.acknowledgement}
            onChange={(event) => setFilters((current) => ({ ...current, acknowledgement: event.target.value }))}
            className="input-field py-2 text-xs sm:w-48"
          >
            <option value="all">All Statuses</option>
            <option value="unacknowledged">Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
          <button disabled={working} onClick={handleExport} className="btn-primary py-2.5 px-4 w-full sm:w-auto mt-0 disabled:opacity-60">
            <span className="material-symbols-outlined text-[18px]">download</span> Export CSV
          </button>
        </div>
      </section>

      {error && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-lg px-4 py-3 text-sm font-bold">
          Backend workflow unavailable: {error}
        </div>
      )}
      {success && (
        <div className="bg-[#e8f5e9] border border-[#006d37]/20 text-[#006d37] rounded-lg px-4 py-3 text-sm font-bold">
          {success}
        </div>
      )}

      <section className="space-y-4">
        {loading && alerts.length === 0 && (
          <div className="bg-white rounded-lg p-8 shadow-sm text-sm font-bold text-[#45474d]">
            Loading backend alerts...
          </div>
        )}
        {!loading && alerts.length === 0 && <EmptyAlertCard />}
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id || `${alert.machine_id}-${alert.timestamp}`}
            alert={alert}
            ackNote={ackNotes[alert.id] || ''}
            onAckNoteChange={(id, value) => setAckNotes((current) => ({ ...current, [id]: value }))}
            onAcknowledge={handleAcknowledge}
            onOpenTicket={openTicketModal}
          />
        ))}
      </section>

      <section className="rounded-lg border border-[#c5c6cd]/30 bg-white px-4 py-3">
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-[#f1f4f3] flex items-center justify-center text-[#1b263b]">
            <span className="material-symbols-outlined">engineering</span>
          </div>
          <div>
            <h3 className="text-sm font-black text-[#051125]">Human review only</h3>
            <p className="text-xs text-[#45474d] mt-1 max-w-2xl">
              Acknowledgements and tickets do not stop, control, override, or physically interact with the PMA Granulator.
            </p>
          </div>
        </div>
      </section>

      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#051125]/50 px-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="heading-secondary text-xl">Create Ticket</h3>
              <p className="text-xs font-medium text-[#45474d] mt-1">
                Linked to alert #{selectedAlert.id}. Ticket text is encrypted before submission.
              </p>
            </div>
            <textarea
              value={ticketText}
              onChange={(event) => setTicketText(event.target.value)}
              rows={6}
              className="input-field min-h-36 resize-none"
            />
            <div className="mt-5 flex flex-col sm:flex-row justify-end gap-3">
              <button type="button" onClick={() => setSelectedAlert(null)} className="btn-secondary justify-center">
                Cancel
              </button>
              <button type="button" disabled={working || !ticketText.trim()} onClick={createLinkedTicket} className="btn-primary mt-0 disabled:opacity-60">
                <span className="material-symbols-outlined text-[18px]">lock</span>
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
