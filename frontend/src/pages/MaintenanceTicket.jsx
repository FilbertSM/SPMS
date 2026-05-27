import React, { useState, useEffect } from 'react';
import { encryptTicketData, decryptTicketData } from '../utils/encryption';
import axios from 'axios';

const MaintenanceTicket = () => {
  const [machineId, setMachineId] = useState('PMA_Granulator_01');
  const [issueDescription, setIssueDescription] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null, success: null });
  
  const [tickets, setTickets] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);

  const fetchTicketHistory = async () => {
    setLoadingTable(true);
    try {
      const token = localStorage.getItem('spms_token');
      const response = await axios.get('http://127.0.0.1:8000/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const decryptedData = response.data.map(ticket => {
        let decryptedText = '';
        try {
          decryptedText = decryptTicketData(ticket.issue_description);
        } catch (error) {
          decryptedText = "🔒 [Encrypted Data - Key Mismatch]";
        }
        return { ...ticket, issue_description: decryptedText };
      });

      setTickets(decryptedData);
    } catch (err) {
      console.error("Gagal mengambil riwayat tiket:", err);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchTicketHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });

    try {
      const encryptedIssue = encryptTicketData(issueDescription);

      const payload = {
        machine_id: machineId,
        issue_description: encryptedIssue 
      };

      const token = localStorage.getItem('spms_token');
      await axios.post('http://127.0.0.1:8000/api/tickets', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatus({ loading: false, error: null, success: 'Ticket successfully created and encrypted!' });
      setIssueDescription(''); 
      fetchTicketHistory();

    } catch (err) {
      console.error(err);
      setStatus({ loading: false, error: 'Failed to submit ticket.', success: null });
    }
  };

  return (
    <div className="p-6 lg:p-8 flex-1 overflow-y-auto w-full h-[calc(100vh-80px)]">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-[#1b263b] font-headline mb-2">Maintenance Logging</h2>
        <p className="text-[#45474d] text-sm">
          Secure E2EE issue reporting for Granulator machines.
        </p>
      </div>

      <div className="flex flex-col gap-8 w-full">
        
        {/* BAGIAN ATAS: FORM */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30 w-full">
          <h3 className="text-sm font-bold text-[#1b263b] uppercase tracking-widest mb-6 border-b border-[#f1f4f3] pb-3">
            Create Ticket
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-[#45474d] uppercase tracking-widest mb-2 font-label">
                Machine ID
              </label>
              <select 
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] outline-none transition-all text-[#1b263b] text-sm font-medium"
                disabled
              >
                <option value="PMA_Granulator_01">PMA Granulator 01</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#45474d] uppercase tracking-widest mb-2 font-label">
                Issue Description (Confidential)
              </label>
              <textarea 
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows="5"
                className="w-full px-4 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] outline-none transition-all text-[#1b263b] text-sm font-medium resize-none"
                placeholder="Describe the failure or anomaly in the machine..."
                required
              ></textarea>
              <p className="text-[10px] text-[#2ecc71] mt-2 flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Protected by E2E Encryption
              </p>
            </div>

            {status.error && <div className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded">{status.error}</div>}
            {status.success && <div className="text-[#2ecc71] text-xs font-bold bg-[#2ecc71]/10 p-2 rounded">{status.success}</div>}

            <button 
              type="submit" 
              disabled={status.loading}
              className="w-full bg-[#1b263b] text-white font-bold py-2.5 px-4 rounded-lg hover:bg-[#2ecc71] transition-colors flex justify-center items-center gap-2 text-sm uppercase tracking-wider"
            >
              {status.loading ? 'Encrypting...' : 'Submit Secure Ticket'}
            </button>
          </form>
        </div>

        {/* BAGIAN BAWAH: TABEL RIWAYAT */}
        <div className="bg-white rounded-xl shadow-sm border border-[#c5c6cd]/30 overflow-hidden w-full">
          <div className="p-6 border-b border-[#f1f4f3] flex justify-between items-center bg-[#f1f4f3]/30">
            <h3 className="text-sm font-bold text-[#1b263b] uppercase tracking-widest">
              Ticket History
            </h3>
            <button onClick={fetchTicketHistory} className="text-[#45474d] hover:text-[#1b263b] transition-colors">
              <span className="material-symbols-outlined text-xl">{loadingTable ? 'sync' : 'refresh'}</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-[#c5c6cd]/30 text-[10px] uppercase tracking-widest text-[#45474d]">
                  <th className="p-4 font-bold">Date</th>
                  <th className="p-4 font-bold">Machine</th>
                  <th className="p-4 font-bold min-w-[200px]">Decrypted Issue</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#1b263b]">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-[#45474d] italic">
                      No maintenance tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket, index) => (
                    <tr key={index} className="border-b border-[#f1f4f3] hover:bg-[#f1f4f3]/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-xs text-[#45474d]">
                        {new Date(ticket.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="p-4 font-medium whitespace-nowrap">{ticket.machine_id}</td>
                      <td className="p-4 text-xs">{ticket.issue_description}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1b263b] text-[#6bfe9c] uppercase tracking-wider">
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MaintenanceTicket;