import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav'; 
import Sidebar from '../components/Sidebar'; // <-- Added Sidebar Import

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);


  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('spms_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
          setNotificationsEnabled(data.email_notifications ?? true);
        } else {
          localStorage.removeItem('spms_token');
          navigate('/login');
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "No data available";
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };

  const handleToggle = async () => {
    if (isUpdating) return; // Prevent spam-clicking

    const previousState = notificationsEnabled;
    const newState = !previousState;
    
    // 1. Optimistic UI Update: Instantly flip the toggle on screen
    setNotificationsEnabled(newState);
    setIsUpdating(true);

    try {
      const token = localStorage.getItem('spms_token');
      
      // 2. Send the update to the FastAPI backend
      const response = await fetch('http://127.0.0.1:8000/api/users/me/preferences', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_notifications: newState }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preference to database');
      }

      console.log(`Successfully saved email_notifications: ${newState}`);

    } catch (error) {
      console.error("Update failed:", error);
      // 3. Rollback: If the API fails, flip the toggle back to its original state
      setNotificationsEnabled(previousState);
      // Optional: If you copied your Toast component over here, you could pop an error toast!
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#f4f7f6] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#1b263b]">sync</span>
      </div>
    );
  }

  return (
    // 1. Main Layout Wrapper: Prevents scrolling on the body, handles Sidebar positioning
    <div className="flex h-screen bg-[#f4f7f6] font-body overflow-hidden">
      
      {/* Sidebar on the left */}
      <Sidebar />

      {/* 2. Main Content Area: Takes up remaining space, scrolls internally if needed */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        
        {/* TopNav at the top of the content area */}
        <TopNav />
        
        <main className="flex-1 p-6 lg:p-12">
          <div className="max-w-4xl mx-auto">
            
            {/* Page Header (Dark text because background is now light grey) */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#051125] font-headline">My Profile</h2>
              <p className="text-sm text-[#45474d]">Manage your SPMS account settings and audit information.</p>
            </div>

            {/* Profile Card (Forced Navy styling as requested) */}
            <div className="bg-[#051125] rounded-2xl border border-[#c5c6cd]/20 shadow-md overflow-hidden text-white">
              
              {/* Top Banner Area (Lighter Navy) */}
              <div className="h-24 bg-[#1b263b] relative"></div>

              {/* Avatar & Core Info */}
              <div className="px-8 pb-8 relative">
                <div className="absolute -top-12 flex items-end gap-4">
                  <div className="w-24 h-24 rounded-full bg-[#f1f4f3] border-4 border-[#051125] flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-5xl text-[#45474d]">person</span>
                  </div>
                </div>

                <div className="pt-16 flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{user?.full_name}</h3>
                    <p className="text-[#c5c6cd]">{user?.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-[#2ecc71]/10 text-[#2ecc71] text-xs font-bold uppercase tracking-widest rounded-full border border-[#2ecc71]/20">
                      {user?.role}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-[#c5c6cd]/10 my-8"></div>

                {/* Security & Audit Info */}
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Security & Audit</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-4 bg-[#1b263b]/40 rounded-xl border border-[#c5c6cd]/10">
                    <p className="text-xs text-[#c5c6cd] uppercase tracking-widest mb-1">Account Created</p>
                    <p className="text-sm font-bold text-white">
                      {formatDate(user?.created_at)}
                    </p>
                  </div>
                  <div className="p-4 bg-[#1b263b]/40 rounded-xl border border-[#c5c6cd]/10">
                    <p className="text-xs text-[#c5c6cd] uppercase tracking-widest mb-1">Last Login</p>
                    <p className="text-sm font-bold text-white">
                      {formatDate(user?.last_login) === "No data available" ? "First time logging in" : formatDate(user?.last_login)}
                    </p>
                  </div>
                </div>

                {/* Preferences */}
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Preferences</h4>
                <div className="flex items-center justify-between p-4 bg-[#1b263b]/40 rounded-xl border border-[#c5c6cd]/10">
                  <div>
                    <p className="text-sm font-bold text-white">System Notifications</p>
                    <p className="text-xs text-[#c5c6cd] mt-1">Receive critical email alerts regarding PMA Granulator status.</p>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <button 
                    onClick={handleToggle}
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${notificationsEnabled ? 'bg-[#2ecc71]' : 'bg-[#45474d]'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform duration-200 ${notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`}></div>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;