import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ForgotPasswordModal from './ForgotPasswordModal';

const Login = () => {
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState(() => localStorage.getItem('spms_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('spms_remembered_email'))); // New: Remember Me
  const [showPassword, setShowPassword] = useState(false); // New: Show/Hide Password
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // --- VALIDATION LOGIC (UPDATED: PASSED COMPLEXITY REMOVED) ---
  const validateForm = () => {
    // 1. Strict Email Validation (Regex) - Tetap dipertahankan agar format email benar
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid company email address (e.g., name@domain.com).");
      return false;
    }

    return true;
  };

  // --- HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      // 1. Buat data dalam format yang dimau FastAPI (username & password)
      const details = {
        'username': email,
        'password': password
      };

      // 2. Ubah object di atas menjadi string "username=...&password=..."
      const formBody = Object.keys(details)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(details[key]))
        .join('&');

      // 3. Kirim dengan header yang sangat spesifik
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: formBody
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('spms_token', data.access_token);
      
      setSuccessMsg("Login successful!");
      setTimeout(() => { navigate('/app'); }, 1000);
      
    } catch {
      setError("Login failed: Invalid email or password.");
      setIsLoading(false);
    }
  };

  const handleCloseError = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setError(null);
      setIsClosing(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        handleCloseError();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, handleCloseError]);

  return (
    <div className="auth-container">
      {/* --- TOAST NOTIFICATION --- */}
      {error && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border-l-4 border-[#e74c3c] px-6 py-4 shadow-2xl rounded-lg ${isClosing ? 'animate-toast-out' : 'animate-toast-in'}`}>
          <span className="material-symbols-outlined text-[#e74c3c]">error</span>
          <p className="text-sm font-bold text-[#1b263b]">{error}</p>
          <button 
            onClick={handleCloseError}
            className="ml-4 text-[#c5c6cd] hover:text-[#45474d] transition-colors bg-transparent border-none cursor-pointer"
          >
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
      
      {/* --- LEFT PANEL --- */}
      <div className="auth-left-panel">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,100 C30,60 70,40 100,0 L100,100 Z" fill="#ffffff" />
          </svg>
        </div>
        <div className="relative z-10 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <span className="material-symbols-outlined text-4xl text-[#2ecc71]">precision_manufacturing</span>
            <h1 className="text-3xl font-extrabold font-headline tracking-tight">PT. Saka Farma</h1>
          </div>
          <h2 className="text-5xl font-black font-headline mb-6 leading-tight">Secure Predictive Maintenance System</h2>
          <p className="text-[#c5c6cd] text-lg leading-relaxed mb-8">
            Secure predictive monitoring and anomaly detection for PMA Granulator data.
          </p>
          <div className="flex items-center gap-2 text-sm font-bold text-[#2ecc71] uppercase tracking-widest font-label">
            <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse"></span>
            Authenticated backend access
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL --- */}
      <div className="auth-right-panel">
        <div className="auth-card">
          <div className="mb-8 text-center lg:text-left">
            <h3 className="heading-secondary">Welcome back</h3>
            <p className="text-subtitle mt-2">Enter your credentials to access the SPMS dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* EMAIL INPUT */}
            <div>
              <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-2 font-label">
                Company Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45474d]">mail</span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-icon-field"
                  placeholder="e.g. budi.p@sakafarma.com"
                  required
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-bold text-[#45474d] uppercase tracking-widest font-label">
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(true)} 
                  className="text-xs font-bold text-[#1b263b] hover:text-[#2ecc71] transition-colors bg-transparent border-none cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45474d]">lock</span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] font-medium"
                  placeholder="••••••••"
                  required
                />
                {/* SHOW/HIDE PASSWORD ICON BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#45474d] hover:text-[#1b263b] bg-transparent border-none cursor-pointer flex items-center"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* REMEMBER ME CHECKBOX */}
            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#1b263b] focus:ring-[#1b263b] cursor-pointer"
              />
              <label htmlFor="remember_me" className="ml-2 block text-xs font-bold text-[#45474d] uppercase tracking-widest cursor-pointer select-none">
                Remember Me
              </label>
            </div>

            {/* SUBMIT BUTTON */}
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#45474d]">
            Don't have an access account? <Link to="/register" className="font-bold text-[#1b263b] hover:text-[#2ecc71] transition-colors">Request Access</Link>
          </p>
        </div>
      </div>

      <ForgotPasswordModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default Login;
