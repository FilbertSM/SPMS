import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TopNav = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Fetch User Data on Mount
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('spms_token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Force logout if token is invalid or expired
          handleLogout();
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, [navigate]);

  // 2. Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Logout Logic
  const handleLogout = () => {
    localStorage.removeItem('spms_token');
    navigate('/login');
  };

  return (
    <header className="flex justify-between items-center w-full px-6 py-3 border-b border-[#c5c6cd]/15 bg-[#f7faf9] dark:bg-[#051125] relative z-10">
      
      {/* Left side: Branding */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-[#051125] dark:text-[#f1f4f3] tracking-tighter font-headline">SPMS Granulator 01</h1>
        <div className="bg-[#f1f4f3] dark:bg-[#1b263b] h-6 w-[1px] mx-2"></div>
        <span className="text-[0.6875rem] font-medium font-label uppercase tracking-widest text-[#45474d]">Machine Health Dashboard</span>
      </div>

      {/* Right side: Actions & User Profile */}
      <div className="flex items-center gap-6">
        
        {/* Quick Actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-[#ebeeed] dark:hover:bg-[#1b263b] rounded-full transition-colors relative">
            <span className="material-symbols-outlined text-[#051125] dark:text-[#f7faf9]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full border-2 border-[#f7faf9]"></span>
          </button>
          <button className="p-2 hover:bg-[#ebeeed] dark:hover:bg-[#1b263b] rounded-full transition-colors">
            <span className="material-symbols-outlined text-[#051125] dark:text-[#f7faf9]">verified_user</span>
          </button>
        </div>

        {/* User Profile & Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-6 border-l border-[#c5c6cd]/15 hover:opacity-70 transition-opacity text-left bg-transparent"
          >
            <div className="text-right">
              {/* Dynamically render fetched user data */}
              <p className="text-xs font-bold text-[#051125] dark:text-white leading-tight">
                {user ? user.full_name : 'Loading...'}
              </p>
              <p className="text-[10px] text-[#45474d] uppercase tracking-tighter">
                {user ? user.email : 'Authenticating'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#e0e3e2] flex items-center justify-center overflow-hidden">
               {/* Placeholder untuk foto profil */}
               <span className="material-symbols-outlined text-[#45474d]">person</span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-4 w-48 bg-white dark:bg-[#051125] rounded-xl shadow-xl border border-[#c5c6cd]/20 overflow-hidden z-50 transform origin-top-right transition-all">
              <div className="py-1">
                <button 
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#051125] dark:text-[#f1f4f3] hover:bg-[#ebeeed] dark:hover:bg-[#1b263b] flex items-center gap-3 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#45474d]">person</span>
                  My Profile
                </button>
                
                <button 
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#051125] dark:text-[#f1f4f3] hover:bg-[#ebeeed] dark:hover:bg-[#1b263b] flex items-center gap-3 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#45474d]">settings</span>
                  Admin
                </button>
                
                <div className="h-[1px] w-full bg-[#c5c6cd]/20 my-1"></div>
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#ba1a1a] hover:bg-[#ba1a1a]/10 flex items-center gap-3 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default TopNav;