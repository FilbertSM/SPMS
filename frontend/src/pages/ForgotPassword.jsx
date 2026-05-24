import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchJson } from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const data = await fetchJson('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      
      // Even if the email doesn't exist, we show success for security
      setStatus({ type: 'success', message: data.message });
    } catch {
      setStatus({ type: 'error', message: 'Connection failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6] font-body p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#c5c6cd]/20">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-[#1b263b] font-headline">Reset Password</h3>
          <p className="text-[#45474d] text-sm mt-2">Enter your company email to receive a recovery link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {status.message && (
            <div className={`p-3 rounded-lg text-sm font-medium ${
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status.message}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Company Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm"
              placeholder="e.g. operator@sakafarma.com"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-[#1b263b] text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-[#051125] transition-all disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-bold text-[#1b263b] hover:text-[#2ecc71] transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
