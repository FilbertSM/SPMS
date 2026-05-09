import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  // 1. Setup State to track user inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI states for loading and errors
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 2. Make the API Call to your backend using standard JSON
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

      // 3. Handle errors (like if the email is already in the database)
      if (!response.ok) {
        const errData = await response.json();
        // FastAPI returns errors in a 'detail' field
        throw new Error(errData.detail || 'Registration failed. Please check your inputs.');
      }

      // 4. Success! Redirect to login page
      console.log("Account created successfully!");
      navigate('/login');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7f6] font-body">
      {/* Right: Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1b263b] relative overflow-hidden items-center justify-center p-12 order-2">
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

      {/* Left: Form Register */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 order-1 overflow-y-auto">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#c5c6cd]/20 my-auto">
          <div className="mb-8 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-[#1b263b] font-headline">Request System Access</h3>
            <p className="text-[#45474d] text-sm mt-2">Submit your details to gain SPMS credentials.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Display Error Message if registration fails */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm"
                placeholder="e.g. Budi Prasetyo"
                required
              />
            </div>

            {/* Replaced Employee ID & Role with a single Email input */}
            <div>
              <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Company Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm"
                placeholder="e.g. budi.p@sakafarma.com"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm"
                placeholder="Create a strong password"
                required
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-[#1b263b] text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-[#051125] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md font-label flex justify-center items-center gap-2"
              >
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