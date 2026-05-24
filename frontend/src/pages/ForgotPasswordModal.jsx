// src/components/ForgotPasswordModal.jsx
import React, { useState } from 'react';
import { fetchJson } from '../utils/api';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await fetchJson('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStatus({ type: 'success', message: data.message });
    } catch {
      setStatus({ type: 'error', message: 'Connection failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        
        <h3 className="text-2xl font-bold text-[#1b263b] mb-2">Reset Password</h3>
        <p className="text-gray-500 text-sm mb-6">Enter your approved SPMS email to receive a recovery link.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {status.message && (
            <div className={`p-3 rounded-lg text-xs ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {status.message}
            </div>
          )}
          <input 
            type="email" 
            placeholder="operator@sakafarma.com"
            className="w-full px-4 py-3 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-[#1b263b]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-[#1b263b] text-white font-bold rounded-lg uppercase tracking-widest">
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
