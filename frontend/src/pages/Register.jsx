import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchJson } from '../utils/api';

const Register = () => {
  const navigate = useNavigate();
  
  // Phase 1 States
  const [email, setEmail] = useState('');
  
  // Phase 2 States
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  
  // Global States
  const [error, setError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false); 
  const [successMsg, setSuccessMsg] = useState(null); 

  const ALLOWED_DOMAINS = ['kalbeconsumerhealth.co.id', 'gmail.com', 'president.ac.id', 'student.president.ac.id'];

  const isLengthValid = password.length >= 8 && password.length <= 20;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong = isLengthValid && hasUppercase && hasNumber && hasSpecial;
  const isMatching = password === confirmPassword && confirmPassword !== '';

  const handleCloseError = () => {
    setIsClosing(true); 
    setTimeout(() => { setError(null); setIsClosing(false); }, 400); 
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => { handleCloseError(); }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // --- FASE 1: REQUEST OTP ---
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setEmailError(null);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address structure.");
      return;
    }

    const emailDomain = email.trim().split('@')[1]?.toLowerCase();
    if (!ALLOWED_DOMAINS.includes(emailDomain)) {
      setEmailError("Registration is restricted to official company domains only.");
      return;
    }

    setIsLoading(true);
    try {
      await fetchJson('/api/register/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      setSuccessMsg("OTP sent to your email! Please check your inbox.");
      setTimeout(() => setSuccessMsg(null), 3000);
      setStep(2); 
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FASE 2: SUBMIT REGISTRASI (OTP + DATA) ---
  const handleFinalRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("OTP must be exactly 6 digits.");
      return;
    }
    if (!isPasswordStrong) {
      setError("Please meet all password requirements.");
      return;
    }
    if (!isMatching) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        full_name: fullName, 
        email: email.trim().toLowerCase(),
        password: password.trim(),
        otp: otp.trim()
      };

      await fetchJson('/api/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessMsg("Account verified and created successfully! Redirecting...");
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      setError(err.message);
      setIsLoading(false); 
    }
  };

  return (
    <div className="auth-container">
      {/* ERROR & SUCCESS TOASTS */}
      {error && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border-l-4 border-[#e74c3c] px-6 py-4 shadow-2xl rounded-lg ${isClosing ? 'animate-toast-out' : 'animate-toast-in'}`}>
          <span className="material-symbols-outlined text-[#e74c3c]">error</span>
          <p className="text-sm font-bold text-[#1b263b]">{error}</p>
          <button onClick={handleCloseError} className="ml-4 text-[#c5c6cd] hover:text-[#45474d] transition-colors bg-transparent border-none cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {successMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border-l-4 border-[#2ecc71] px-6 py-4 shadow-2xl rounded-lg animate-toast-in">
          <span className="material-symbols-outlined text-[#2ecc71]">check_circle</span>
          <p className="text-sm font-bold text-[#1b263b]">{successMsg}</p>
        </div>
      )}

      {/* LEFT PANEL */}
      <div className="auth-left-panel order-2">
         <div className="absolute top-0 right-0 w-full h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M100,100 C70,60 30,40 0,0 L0,100 Z" fill="#ffffff" />
          </svg>
        </div>
        <div className="relative z-10 text-white max-w-md text-center lg:text-left">
          <div className="w-14 h-14 bg-[#2ecc71]/20 rounded-xl flex items-center justify-center mb-6 border border-[#2ecc71]/30 mx-auto lg:mx-0">
            <span className="material-symbols-outlined text-3xl text-[#2ecc71]">shield_person</span>
          </div>
          <h2 className="text-3xl font-black font-headline mb-4 leading-tight">Strict Access Control</h2>
          <p className="text-[#c5c6cd] text-sm leading-relaxed mb-8">
            Registration is restricted to approved capstone domains. Verify your email via OTP to set up your account.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right-panel order-1 overflow-y-auto">
        <div className="auth-card my-auto">
          
          {step === 1 ? (
            <>
              {/* --- FASE 1 FORM --- */}
              <div className="mb-6 text-center lg:text-left">
                <h3 className="heading-secondary">Request System Access</h3>
                <p className="text-subtitle mt-2">Enter your company email to receive a verification OTP.</p>
              </div>

              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="form-label mb-1.5">Company Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className={`w-full px-4 py-3 bg-[#f1f4f3] border rounded-lg focus:bg-white outline-none transition-all text-[#1b263b] font-medium text-sm ${
                      emailError 
                        ? 'border-[#e74c3c] focus:border-[#e74c3c] focus:ring-2 focus:ring-[#e74c3c]/20' 
                        : 'border-transparent focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10'
                    }`}
                    placeholder="e.g. budi.p@kalbeconsumerhealth.co.id"
                    required
                  />
                  {emailError && (
                    <p className="mt-1.5 text-[11px] font-semibold text-[#e74c3c] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      {emailError}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isLoading || !email} className="btn-primary mt-0 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoading ? 'Sending OTP...' : 'Send OTP Code'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* --- FASE 2 FORM --- */}
              <div className="mb-6 text-center lg:text-left">
                <h3 className="heading-secondary">Complete Registration</h3>
                <p className="text-subtitle mt-2">
                  OTP sent to <span className="font-bold text-[#1b263b]">{email}</span>. Fill the form below to finish.
                </p>
              </div>

              <form onSubmit={handleFinalRegister} className="space-y-4">
                {/* OTP INPUT */}
                <div>
                  <label className="form-label mb-1.5">Verification Code</label>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] font-bold tracking-[0.5em] text-center text-lg"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                {/* FULL NAME INPUT */}
                <div>
                  <label className="form-label mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] font-medium text-sm"
                    placeholder="e.g. Budi Prasetyo"
                    required
                  />
                </div>

                {/* PASSWORD INPUT */}
                <div>
                  <label className="form-label mb-1.5">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] outline-none transition-all text-[#1b263b] font-medium text-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#45474d] hover:text-[#1b263b] bg-transparent border-none cursor-pointer">
                      <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                  <div className="space-y-1.5 mt-2.5 px-1">
                    <ValidationItem label="8 characters (20 max)" isValid={isLengthValid} />
                    <ValidationItem label="1 uppercase letter, 1 number, 1 symbol" isValid={hasUppercase && hasNumber && hasSpecial} />
                    <ValidationItem label="Strong password" isValid={isPasswordStrong} />
                  </div>
                </div>

                {/* CONFIRM PASSWORD INPUT */}
                <div>
                  <label className="form-label mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-4 pr-10 py-3 bg-[#f1f4f3] border rounded-lg outline-none transition-all text-[#1b263b] font-medium text-sm ${
                        isMatching ? 'border-green-500/50 focus:border-green-500' : 'border-transparent focus:border-[#1b263b]'
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#45474d] hover:text-[#1b263b] bg-transparent border-none cursor-pointer">
                      <span className="material-symbols-outlined text-xl">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button type="submit" disabled={isLoading || !isPasswordStrong || !isMatching || otp.length < 6} className="btn-primary mt-0 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isLoading ? 'Processing...' : 'Create Account'}
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-[#45474d] hover:text-[#1b263b] transition-colors">
                    Back to Request OTP
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-xs text-[#45474d]">
            Already have an account? <Link to="/login" className="font-bold text-[#1b263b] hover:text-[#2ecc71] transition-colors">Sign In Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const ValidationItem = ({ label, isValid }) => (
  <div className="flex items-center gap-2">
    <span className={`material-symbols-outlined text-xs ${isValid ? 'text-[#2ecc71]' : 'text-gray-400'}`}>
      {isValid ? 'check' : 'circle'}
    </span>
    <span className={`text-[11px] font-medium ${isValid ? 'text-gray-700' : 'text-gray-400'}`}>
      {label}
    </span>
  </div>
);

export default Register;