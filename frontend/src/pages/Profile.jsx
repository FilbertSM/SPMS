import React, { useEffect, useState } from 'react';
import { fetchJsonWithAuth } from '../utils/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferenceStatus, setPreferenceStatus] = useState(null);
  const [isSavingPreference, setIsSavingPreference] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await fetchJsonWithAuth('/api/users/me');
        if (!ignore) {
          setUser(data);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      ignore = true;
    };
  }, []);

  const handleToggleNotifications = async () => {
    if (!user) return;

    const nextValue = !user.email_notifications;
    setIsSavingPreference(true);
    setPreferenceStatus(null);

    try {
      const payload = await fetchJsonWithAuth('/api/users/me/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ email_notifications: nextValue }),
      });
      setUser((current) => ({
        ...current,
        email_notifications: Boolean(payload.email_notifications),
      }));
      setPreferenceStatus({ type: 'success', message: 'Preference saved to backend.' });
    } catch (err) {
      setPreferenceStatus({ type: 'error', message: err.message });
    } finally {
      setIsSavingPreference(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#1b263b]">sync</span>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-[#051125] font-headline">My Profile</h2>
          <p className="text-sm text-[#45474d]">
            Backend account fields currently exposed by the SPMS API.
          </p>
        </div>

        {error && (
          <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 text-[#ba1a1a] rounded-lg px-4 py-3 text-sm font-bold">
            Profile unavailable: {error}
          </div>
        )}

        <div className="bg-[#051125] rounded-xl border border-[#c5c6cd]/20 shadow-md overflow-hidden text-white">
          <div className="h-24 bg-[#1b263b] relative"></div>

          <div className="px-8 pb-8 relative">
            <div className="absolute -top-12 flex items-end gap-4">
              <div className="w-24 h-24 rounded-full bg-[#f1f4f3] border-4 border-[#051125] flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-5xl text-[#45474d]">person</span>
              </div>
            </div>

            <div className="pt-16 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-white">{user?.full_name || 'Unknown user'}</h3>
                <p className="text-[#c5c6cd]">{user?.email || 'No email returned'}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-block px-3 py-1 bg-[#2ecc71]/10 text-[#2ecc71] text-xs font-bold uppercase tracking-widest rounded-full border border-[#2ecc71]/20">
                    {user?.role || 'role unavailable'}
                  </span>
                  <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border ${
                    user?.is_active ? 'bg-[#2ecc71]/10 text-[#2ecc71] border-[#2ecc71]/20' : 'bg-[#ffdad6]/10 text-[#ffdad6] border-[#ffdad6]/20'
                  }`}>
                    {user?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#c5c6cd]/10 my-8"></div>

            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Security & Access</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-4 bg-[#1b263b]/40 rounded-xl border border-[#c5c6cd]/10">
                <p className="text-xs text-[#c5c6cd] uppercase tracking-widest mb-1">Account Email</p>
                <p className="text-sm font-bold text-white">{user?.email || '-'}</p>
              </div>
              <div className="p-4 bg-[#1b263b]/40 rounded-xl border border-[#c5c6cd]/10">
                <p className="text-xs text-[#c5c6cd] uppercase tracking-widest mb-1">Access Role</p>
                <p className="text-sm font-bold text-white">{user?.role || '-'}</p>
              </div>
            </div>

            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Preferences</h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#1b263b]/40 rounded-xl border border-[#c5c6cd]/10">
              <div>
                <p className="text-sm font-bold text-white">Email Notifications</p>
                <p className="text-xs text-[#c5c6cd] mt-1">
                  Stored by the backend as <span className="font-bold">email_notifications</span> on your account.
                </p>
                {preferenceStatus && (
                  <p className={`text-xs font-bold mt-2 ${preferenceStatus.type === 'success' ? 'text-[#6bfe9c]' : 'text-[#ffdad6]'}`}>
                    {preferenceStatus.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleToggleNotifications}
                disabled={isSavingPreference}
                className={`w-12 h-6 rounded-full relative flex items-center transition-colors disabled:opacity-60 ${
                  user?.email_notifications ? 'bg-[#2ecc71]' : 'bg-[#45474d]'
                }`}
                title="Toggle email notifications"
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${
                  user?.email_notifications ? 'translate-x-7' : 'translate-x-1'
                }`}></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
