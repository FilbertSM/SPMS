import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: password
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Registration failed. Please check your inputs.');
      }

      console.log("Account created successfully!");
      navigate('/login');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
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
          <p className="text-[#828da7] text-sm leading-relaxed mb-8">
            Registration requires administrator approval. All access logs are tracked via Role-Based Access Control (RBAC).
          </p>
        </div>
      </div>

      <div className="auth-right-panel order-1 overflow-y-auto">
        <div className="auth-card my-auto">
          <div className="mb-8 text-center lg:text-left">
            <h3 className="heading-secondary">Request System Access</h3>
            <p className="text-subtitle mt-2">Submit your details to gain SPMS credentials.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="alert-error-box">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <div>
              <label className="form-label mb-1.5">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="e.g. Budi Prasetyo"
                required
              />
            </div>

            <div>
              <label className="form-label mb-1.5">Company Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="e.g. budi.p@sakafarma.com"
                required
              />
            </div>

            <div>
              <label className="form-label mb-1.5">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Create a strong password"
                required
              />
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isLoading} className="btn-primary mt-0">
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                    Processing...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-[#45474d]">
            Already approved? <Link to="/login" className="font-bold text-[#1b263b] hover:text-[#2ecc71] transition-colors">Sign In Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;