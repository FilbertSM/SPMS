import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  // State untuk form
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Setup State to track user inputs and UI status
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 2. Prepare the data exactly as FastAPI's OAuth2 expects (Form Data, NOT JSON)
      const formData = new URLSearchParams();
      formData.append('username', email); // FastAPI looks for 'username' by default
      formData.append('password', password);

      // 3. Make the API Call to your backend
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      // 4. Handle failed logins (e.g., wrong password)
      if (!response.ok) {
        throw new Error('Invalid email or password. Please try again.');
      }

      // 5. Extract the JWT token and save it securely
      const data = await response.json();
      localStorage.setItem('spms_token', data.access_token);
      
      console.log("Authentication successful. Token secured.");

      // 6. Redirect to the Dashboard
      navigate('/');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f6] font-body">
      {/* Left: Branding & Visual (Unchanged) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1b263b] relative overflow-hidden items-center justify-center p-12">
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
            Enterprise-grade monitoring and anomaly detection for PMA Granulator and critical assets.
          </p>
          <div className="flex items-center gap-2 text-sm font-bold text-[#2ecc71] uppercase tracking-widest font-label">
            <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse"></span>
            System Online • AES-256 Encrypted
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#c5c6cd]/20">
          <div className="mb-8 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-[#1b263b] font-headline">Welcome back</h3>
            <p className="text-[#45474d] text-sm mt-2">Enter your credentials to access the SPMS dashboard.</p>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="mb-4 p-3 bg-[#e74c3c]/10 border border-[#e74c3c]/20 text-[#e74c3c] text-xs font-bold rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Display Error Message if login fails */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium">
                {error}
              </div>
            )}

            <div>
              {/* Note: Updated label to just 'Company Email' since we removed Employee ID from the backend */}
              <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-2 font-label">
                Company Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45474d]">mail</span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] font-medium"
                  placeholder="e.g. budi.p@sakafarma.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-bold text-[#45474d] uppercase tracking-widest font-label">
                  Password
                </label>
                <a href="#" className="text-[11px] font-bold text-[#1b263b] hover:text-[#2ecc71] transition-colors">Forgot Password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45474d]">lock</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 mt-4 bg-[#1b263b] text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-[#051125] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md font-label flex justify-center items-center gap-2"
            >
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
    </div>
  );
};

export default Login;