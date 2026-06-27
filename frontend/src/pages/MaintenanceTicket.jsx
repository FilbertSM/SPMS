import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { decryptTicketData, encryptTicketData } from '../utils/encryption';
import { API_BASE_URL } from '../utils/api';

const apiUrl = (path) => `${API_BASE_URL}${path}`;
const authHeader = () => {
  const token = localStorage.getItem('spms_token');
  return { Authorization: `Bearer ${token}` };
};

const decryptField = (value) => {
  if (!value) return '';
  const decrypted = decryptTicketData(value);
  return decrypted || '[Encrypted data - key mismatch]';
};

const statusStyles = {
  OPEN: 'bg-[#fff4ce] text-[#805600]',
  IN_REVIEW: 'bg-[#e8f5e9] text-[#00743a]',
  RESOLVED: 'bg-[#1b263b] text-white',
};

const formatStatus = (value) => (value || 'OPEN').replace('_', ' ');

const MaintenanceTicket = () => {
  const location = useLocation();
  const routeState = location.state || {};
  const [machineId, setMachineId] = useState(routeState.machineId || 'PMA Granulator #01');
  const [anomalyEventId, setAnomalyEventId] = useState(routeState.anomalyEventId ? String(routeState.anomalyEventId) : '');
  const [issueDescription, setIssueDescription] = useState(routeState.prefill || '');
  const [resolutionDrafts, setResolutionDrafts] = useState({});
  const [status, setStatus] = useState({ loading: false, error: null, success: null });
  const [tickets, setTickets] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);

  const fetchTicketHistory = useCallback(async () => {
    setLoadingTable(true);
    try {
      const response = await axios.get(apiUrl('/api/tickets'), {
        headers: authHeader(),
      });

      const decryptedData = response.data.map((ticket) => ({
        ...ticket,
        issue_description_plain: decryptField(ticket.issue_description),
        resolution_note_plain: decryptField(ticket.resolution_note),
      }));

      setTickets(decryptedData);
      setStatus((current) => ({ ...current, error: null }));
    } catch (err) {
      setStatus({ loading: false, error: err.response?.data?.detail || 'Failed to load maintenance tickets.', success: null });
    } finally {
      setLoadingTable(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(fetchTicketHistory, 0);
    return () => window.clearTimeout(timer);
  }, [fetchTicketHistory]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null, success: null });

    try {
      const payload = {
        machine_id: machineId,
        issue_description: encryptTicketData(issueDescription),
        anomaly_event_id: anomalyEventId ? Number(anomalyEventId) : null,
      };

      await axios.post(apiUrl('/api/tickets'), payload, {
        headers: authHeader(),
      });

      setStatus({ loading: false, error: null, success: 'Encrypted maintenance ticket created.' });
      setIssueDescription('');
      setAnomalyEventId('');
      fetchTicketHistory();
    } catch (err) {
      setStatus({ loading: false, error: err.response?.data?.detail || 'Failed to submit ticket.', success: null });
    }
  };

  const updateTicketStatus = async (ticket, nextStatus) => {
    const resolutionText = resolutionDrafts[ticket.id] || '';
    setStatus({ loading: true, error: null, success: null });

    try {
      await axios.patch(
        apiUrl(`/api/tickets/${ticket.id}/status`),
        {
          status: nextStatus,
          resolution_note: nextStatus === 'RESOLVED' ? encryptTicketData(resolutionText) : undefined,
        },
        { headers: authHeader() },
      );
      setStatus({ loading: false, error: null, success: `Ticket #${ticket.id} moved to ${nextStatus.replace('_', ' ')}.` });
      setResolutionDrafts((current) => ({ ...current, [ticket.id]: '' }));
      fetchTicketHistory();
    } catch (err) {
      setStatus({ loading: false, error: err.response?.data?.detail || 'Failed to update ticket status.', success: null });
    }
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h2 className="heading-primary text-3xl">Maintenance Ticketing</h2>
          <p className="text-subtitle mt-2 max-w-2xl">
            Human follow-up records for anomaly review. Ticket notes are encrypted before submission.
          </p>
        </div>
        <button onClick={fetchTicketHistory} className="btn-secondary justify-center">
          <span className={`material-symbols-outlined text-xl ${loadingTable ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      {status.error && <div className="text-[#ba1a1a] text-sm font-bold bg-[#ffdad6] border border-[#ba1a1a]/20 p-3 rounded-lg">{status.error}</div>}
      {status.success && <div className="text-[#006d37] text-sm font-bold bg-[#e8f5e9] border border-[#006d37]/20 p-3 rounded-lg">{status.success}</div>}

      <section className="panel-card">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
          <div>
            <h3 className="heading-secondary text-xl">Create Ticket</h3>
            <p className="text-subtitle mt-1">Link a maintenance follow-up to an alert when needed.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f4f3] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#45474d]">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Encrypted notes
          </span>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="form-label mb-2">Machine ID</label>
            <input
              value={machineId}
              onChange={(event) => setMachineId(event.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="form-label mb-2">Linked Alert ID</label>
            <input
              value={anomalyEventId}
              onChange={(event) => setAnomalyEventId(event.target.value)}
              type="number"
              min="1"
              placeholder="Optional"
              className="input-field"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="form-label mb-2">Issue Description</label>
            <textarea
              value={issueDescription}
              onChange={(event) => setIssueDescription(event.target.value)}
              rows="4"
              className="input-field resize-none"
              placeholder="Inspection request or maintenance follow-up."
              required
            />
          </div>
          <div className="lg:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={status.loading}
              className="btn-primary w-full sm:w-auto px-5 py-2.5 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              {status.loading ? 'Saving...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-lg shadow-sm border border-[#c5c6cd]/30 overflow-hidden w-full">
        <div className="p-5 border-b border-[#f1f4f3] bg-[#f7faf9] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="heading-secondary text-xl">Ticket History</h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#45474d]">{tickets.length} record(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#c5c6cd]/30 text-[10px] uppercase tracking-widest text-[#45474d]">
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Machine</th>
                <th className="px-4 py-3 font-bold">Alert</th>
                <th className="px-4 py-3 font-bold min-w-[220px]">Issue</th>
                <th className="px-4 py-3 font-bold min-w-[240px]">Resolution</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#1b263b]">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-sm font-medium text-[#45474d]">
                    No maintenance tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-[#f1f4f3] align-top hover:bg-[#f7faf9]">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-[#45474d]">
                      {new Date(ticket.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">{ticket.machine_id}</td>
                    <td className="px-4 py-3 text-xs font-bold">{ticket.anomaly_event_id ? `#${ticket.anomaly_event_id}` : '-'}</td>
                    <td className="px-4 py-3 text-xs leading-relaxed max-w-[320px]">{ticket.issue_description_plain}</td>
                    <td className="px-4 py-3 text-xs">
                      {ticket.status === 'RESOLVED' ? (
                        <span className="leading-relaxed">{ticket.resolution_note_plain || '-'}</span>
                      ) : (
                        <textarea
                          value={resolutionDrafts[ticket.id] || ''}
                          onChange={(event) => setResolutionDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))}
                          rows={2}
                          placeholder="Encrypted resolution note"
                          className="w-full min-w-48 rounded-md border border-[#c5c6cd]/40 bg-[#f7faf9] p-2 text-xs outline-none focus:border-[#1b263b]"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyles[ticket.status] || statusStyles.OPEN}`}>
                        {formatStatus(ticket.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 min-w-32">
                        <button
                          disabled={ticket.status !== 'OPEN'}
                          onClick={() => updateTicketStatus(ticket, 'IN_REVIEW')}
                          className="btn-secondary justify-center px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          In Review
                        </button>
                        <button
                          disabled={ticket.status === 'RESOLVED' || !(resolutionDrafts[ticket.id] || '').trim()}
                          onClick={() => updateTicketStatus(ticket, 'RESOLVED')}
                          className="btn-primary justify-center px-3 py-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MaintenanceTicket;
