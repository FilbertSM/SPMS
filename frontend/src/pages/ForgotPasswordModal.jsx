import React, { useState, useEffect } from 'react';
import { fetchJson } from '../utils/api';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  // --- STATE MANAGEMENT ---
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // --- LIVE VALIDATION LOGIC ---
  const isLengthValid = newPassword.length >= 8 && newPassword.length <= 20;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isComplexityValid = hasUppercase && hasNumber && hasSpecial;
  const isPasswordStrong = isLengthValid && isComplexityValid;
  const isMatching = newPassword === confirmPassword && confirmPassword !== '';

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccessMsg(null);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await fetchJson('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isPasswordStrong || !isMatching || otp.length !== 6) return;

    setIsLoading(true);
    try {
      await fetchJson('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          new_password: newPassword
        }),
      });
      setSuccessMsg("Password updated successfully!");
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err.message || "Invalid OTP or Code expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1b263b]/80 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-[#c5c6cd] hover:text-[#e74c3c] bg-transparent border-none cursor-pointer z-10">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="w-12 h-12 bg-[#2ecc71]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#2ecc71]/20">
              <span className="material-symbols-outlined text-2xl text-[#2ecc71]">
                {step === 1 ? 'mark_email_unread' : 'mark_email_read'}
              </span>
            </div>
            <h3 className="text-2xl font-black text-[#1b263b] font-headline">
              {step === 1 ? 'Reset Password' : 'Enter OTP Code'}
            </h3>
            <p className="text-sm text-[#45474d] mt-2">
              {step === 1 
                ? "Enter your email to receive a recovery code." 
                : `We've sent a 6-digit code to ${email}.`}
            </p>
          </div>

          {/* Toast Error/Success */}
          {error && <div className="mb-4 p-3 bg-[#e74c3c]/10 border border-[#e74c3c]/20 rounded-lg flex items-center gap-2 text-[#e74c3c] text-[11px] font-bold">
            <span className="material-symbols-outlined text-base">error</span>{error}
          </div>}
          {successMsg && <div className="mb-4 p-3 bg-[#2ecc71]/10 border border-[#2ecc71]/20 rounded-lg flex items-center gap-2 text-[#00743a] text-[11px] font-bold">
            <span className="material-symbols-outlined text-base">check_circle</span>{successMsg}
          </div>}

          {/* STEP 1: INPUT EMAIL */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-2 font-label">Company Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45474d]">mail</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] outline-none transition-all text-sm font-medium" placeholder="e.g. budi.p@kalbeconsumerhealth.co.id" required />
                </div>
              </div>
              <button type="submit" disabled={isLoading || !email} className="w-full py-3 bg-[#1b263b] hover:bg-[#2c3e50] text-white text-sm font-bold rounded-lg transition-all disabled:bg-[#c5c6cd] flex items-center justify-center gap-2">
                {isLoading ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : 'Send OTP Code'}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP & NEW PASSWORD */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-2 text-center font-label">6-Digit OTP Code</label>
                <input type="text" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full py-3 bg-[#f1f4f3] border border-transparent rounded-xl focus:bg-white focus:border-[#2ecc71] outline-none transition-all text-2xl font-black tracking-[0.5em] text-center text-[#1b263b]" placeholder="••••••" required />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-2 font-label">New Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-4 pr-10 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none text-sm font-medium text-[#1b263b]" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#45474d] hover:text-[#1b263b] bg-transparent border-none cursor-pointer flex items-center">
                    <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {/* LIVE VALIDATION CHECKLIST (3 Items matching design) */}
                <div className="space-y-2 mt-3 px-1">
                   <ValidationItem label="8 characters (20 max)" isValid={isLengthValid} />
                   <ValidationItem label="1 letter, 1 number, 1 special character (# ? ! @)" isValid={isComplexityValid} />
                   <ValidationItem label="Strong password" isValid={isPasswordStrong} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-2 font-label">Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full pl-4 pr-10 py-3 bg-[#f1f4f3] border rounded-lg outline-none transition-all text-sm font-medium text-[#1b263b] ${isMatching ? 'border-[#2ecc71]/50 focus:border-[#2ecc71]' : 'border-transparent focus:border-[#1b263b]'}`} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#45474d] hover:text-[#1b263b] bg-transparent border-none cursor-pointer flex items-center">
                    <span className="material-symbols-outlined text-xl">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isLoading || !isPasswordStrong || !isMatching || otp.length !== 6} className="w-full py-3 bg-[#1b263b] hover:bg-[#2c3e50] text-white text-sm font-bold rounded-lg transition-all disabled:bg-[#c5c6cd] disabled:cursor-not-allowed">
                  {isLoading ? 'Processing...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper Component Checklist
const ValidationItem = ({ label, isValid }) => (
  <div className="flex items-center gap-2.5">
    <span className={`material-symbols-outlined text-[18px] ${isValid ? 'text-[#2ecc71]' : 'text-[#a1a3ab]'}`}>
      {isValid ? 'check_circle' : 'radio_button_unchecked'}
    </span>
    <span className={`text-[12px] font-medium ${isValid ? 'text-[#1b263b]' : 'text-[#75777d]'}`}>
      {label}
    </span>
  </div>
);

export default ForgotPasswordModal;