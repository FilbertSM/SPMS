import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isClosing, setIsClosing] = useState(false); // If you are using the smooth error close here too
  const [successMsg, setSuccessMsg] = useState(null); // <-- ADD THIS
  
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Prepare JSON payload (Make sure 'fullName' matches your state variable name!)
      const payload = {
        full_name: fullName, 
        email: email,
        password: password
      };

      // 2. Send as application/json
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Critical difference from Login!
        },
        body: JSON.stringify(payload),
      });

      // 3. Smart Error Handling
      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Registration failed. Please try again.';

        // Safely extract the exact error message from FastAPI
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail; // Handles our "Email already registered" 400 error
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail[0].msg; // Handles Pydantic 422 Validation errors (like short passwords)
          }
        }
        throw new Error(errorMessage);
      }

      // 4. Success Logic
      setSuccessMsg("Account created successfully! Redirecting...");
      setTimeout(() => {
        navigate('/login');
      }, 9500);

    } catch (err) {
      console.error("Registration Error:", err); // Helps debug in the F12 console
      setError(err.message);
      setIsLoading(false); // Guarantees the button ALWAYS resets
    } 
  };

  return (
    <div className="auth-container">
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