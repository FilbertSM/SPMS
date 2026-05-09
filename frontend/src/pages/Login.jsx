import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Invalid email or password. Please try again.');
      }

      const data = await response.json();
      localStorage.setItem('spms_token', data.access_token);
      
      console.log("Authentication successful. Token secured.");
      navigate('/');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
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
            Enterprise-grade monitoring and anomaly detection for PMA Granulator and critical assets.
          </p>
          <div className="flex items-center gap-2 text-sm font-bold text-[#2ecc71] uppercase tracking-widest font-label">
            <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse"></span>
            System Online • AES-256 Encrypted
          </div>
        </div>
      </div>

      <div className="auth-right-panel">
        <div className="auth-card">
          <div className="mb-8 text-center lg:text-left">
            <h3 className="heading-secondary">Welcome back</h3>
            <p className="text-subtitle mt-2">Enter your credentials to access the SPMS dashboard.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="alert-error-box">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <div>
              <label className="form-label">Company Email</label>
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

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label mb-0">Password</label>
                <a href="#" className="text-[11px] font-bold text-[#1b263b] hover:text-[#2ecc71] transition-colors">Forgot Password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45474d]">lock</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-icon-field"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

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
    </div>
  );
};

export default Login;