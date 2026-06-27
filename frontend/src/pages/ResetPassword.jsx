import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchJson } from '../utils/api';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token'); 
    
    // --- STATE MANAGEMENT ---
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); 
    const [showPassword, setShowPassword] = useState(false); 
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    // --- LIVE VALIDATION STATES (Sama seperti Register) ---
    const isLengthValid = newPassword.length >= 8 && newPassword.length <= 20;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    const isPasswordStrong = isLengthValid && hasUppercase && hasNumber && hasSpecial;
    const isMatching = newPassword === confirmPassword && confirmPassword !== '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        
        if (!isPasswordStrong) {
            setStatus({ type: 'error', message: 'Please meet all password requirements.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        setIsLoading(true);
        try {
            await fetchJson('/api/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, new_password: newPassword }),
            });

            setStatus({ type: 'success', message: 'Password updated successfully! Redirecting to login...' });
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setStatus({ type: 'error', message: error.message || "Connection failed. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6] p-6 font-body">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#c5c6cd]/20">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold font-headline text-[#1b263b]">Set New Password</h2>
                    <p className="text-gray-500 text-sm mt-1">Please create a secure new password for your SPMS account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* TOAST / NOTIFICATION MESSAGE */}
                    {status.message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${
                            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            {status.message}
                        </div>
                    )}

                    {/* NEW PASSWORD INPUT */}
                    <div>
                        <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">New Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                className="w-full pl-4 pr-10 py-2.5 bg-[#f1f4f3] border border-transparent rounded-lg focus:bg-white focus:border-[#1b263b] focus:ring-2 focus:ring-[#1b263b]/10 outline-none transition-all text-[#1b263b] text-sm font-medium"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
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
                        
                        {/* LIVE VALIDATION CHECKLIST (Sesuai gambar image_c8adab.jpg) */}
                        <div className="space-y-1.5 mt-2.5 px-1">
                            <ValidationItem label="8 characters (20 max)" isValid={isLengthValid} />
                            <ValidationItem label="1 uppercase letter, 1 number, 1 symbol" isValid={hasUppercase && hasNumber && hasSpecial} />
                            <ValidationItem label="Strong password" isValid={isPasswordStrong} />
                        </div>
                    </div>

                    {/* CONFIRM PASSWORD INPUT */}
                    <div>
                        <label className="block text-[11px] font-bold text-[#45474d] uppercase tracking-widest mb-1.5 font-label">Confirm New Password</label>
                        <div className="relative">
                            <input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="••••••••"
                                className={`w-full pl-4 pr-10 py-2.5 bg-[#f1f4f3] border rounded-lg outline-none transition-all text-[#1b263b] text-sm font-medium ${
                                    isMatching ? 'border-green-500/50 focus:border-green-500' : 'border-transparent focus:border-[#1b263b]'
                                }`}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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

                    {/* SUBMIT BUTTON (Otomatis Terkunci jika Belum Kuat/Cocok) */}
                    <button 
                        type="submit" 
                        disabled={isLoading || !isPasswordStrong || !isMatching}
                        className="w-full py-3 bg-[#1b263b] text-[#6bfe9c] font-bold rounded-lg uppercase tracking-widest text-sm hover:bg-[#051125] transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
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

export default ResetPassword;
