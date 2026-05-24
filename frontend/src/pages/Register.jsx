import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchJson } from '../utils/api';

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false); 
  const [successMsg, setSuccessMsg] = useState(null); 

  // --- LIST DOMAIN RESMI YANG DIIZINKAN ---
  const ALLOWED_DOMAINS = ['sakafarma.com', 'gmail.com', 'president.ac.id', 'student.president.ac.id'];

  // --- LIVE VALIDATION STATES ---
  const isLengthValid = password.length >= 8 && password.length <= 20;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong = isLengthValid && hasUppercase && hasNumber && hasSpecial;
  const isMatching = password === confirmPassword && confirmPassword !== '';

  const handleCloseError = () => {
    setIsClosing(true); 
    setTimeout(() => {
      setError(null);     
      setIsClosing(false); 
    }, 400); 
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        handleCloseError(); 
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // --- FRONTEND VALIDATION LOGIC ---
  const validateForm = () => {
    // 1. Strict Email & Domain Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address structure.");
      return false;
    }

    const emailDomain = email.trim().split('@')[1]?.toLowerCase();
    if (!ALLOWED_DOMAINS.includes(emailDomain)) {
      setError("Registration is restricted to sakafarma.com, gmail.com, president.ac.id, or student.president.ac.id emails.");
      return false;
    }

    // 2. Strong Password Complexity Check
    if (!isPasswordStrong) {
      setError("Please meet all password requirements.");
      return false;
    }

    // 3. Double Password Validation
    if (!isMatching) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const payload = {
        full_name: fullName, 
        email: email.trim().toLowerCase(),
        password: password.trim()
      };

      await fetchJson('/api/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessMsg("Account created successfully! Redirecting to sign in...");
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error("Registration Error:", err); 
      setError(err.message);
      setIsLoading(false); 
    } 
  };

  return (
    <div className="auth-container">
      {/* --- ERROR TOAST --- */}
      {error && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border-l-4 border-[#e74c3c] px-6 py-4 shadow-2xl rounded-lg ${isClosing ? 'animate-toast-out' : 'animate-toast-in'}`}>
          <span className="material-symbols-outlined text-[#e74c3c]">error</span>
          <p className="text-sm font-bold text-[#1b263b]">{error}</p>
          <button onClick={handleCloseError} className="ml-4 text-[#c5c6cd] hover:text-[#45474d] transition-colors bg-transparent border-none cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* --- SUCCESS TOAST --- */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border-l-4 border-[#2ecc71] px-6 py-4 shadow-2xl rounded-lg animate-toast-in">
          <span className="material-symbols-outlined text-[#2ecc71]">check_circle</span>
          <p className="text-sm font-bold text-[#1b263b]">{successMsg}</p>
        </div>
      )}

      {/* --- LEFT PANEL --- */}
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
            Registration is restricted to approved capstone domains. Role-based access is enforced by the backend after sign-in.
          </p>
        </div>
      </div>

      {/* --- RIGHT PANEL --- */}
      <div className="auth-right-panel order-1 overflow-y-auto">
        <div className="auth-card my-auto">
          <div className="mb-6 text-center lg:text-left">
            <h3 className="heading-secondary">Request System Access</h3>
            <p className="text-subtitle mt-2">Submit your details to gain SPMS credentials.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* FULL NAME */}
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

            {/* COMPANY EMAIL */}
            <div>
              <label className="form-label mb-1.5">Company Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] font-medium text-sm"
                placeholder="e.g. budi.p@sakafarma.com"
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="form-label mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] font-medium text-sm"
                  placeholder="••••••••"
                  required
                />
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

              {/* LIVE VALIDATION CHECKLIST FOR REGISTER */}
              <div className="space-y-1.5 mt-2.5 px-1">
                <ValidationItem label="8 characters (20 max)" isValid={isLengthValid} />
                <ValidationItem label="1 uppercase letter, 1 number, 1 symbol" isValid={hasUppercase && hasNumber && hasSpecial} />
                <ValidationItem label="Strong password" isValid={isPasswordStrong} />
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
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
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#45474d] hover:text-[#1b263b] bg-transparent border-none cursor-pointer flex items-center"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              {/* Button disabled dynamically if criteria is not met */}
              <button 
                type="submit" 
                disabled={isLoading || !isPasswordStrong || !isMatching} 
                className="btn-primary mt-0 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
            Already have an account? <Link to="/login" className="font-bold text-[#1b263b] hover:text-[#2ecc71] transition-colors">Sign In Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENT FOR CHECKLIST ---
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
