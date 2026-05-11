import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token'); // Gets token from URL
    
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch('http://127.0.0.1:8000/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password: newPassword }),
        });

        if (response.ok) {
            alert("Password updated!");
            navigate('/login');
        } else {
            setMessage("Failed to reset password. Token may be expired.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f7f6]">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-4 font-headline text-[#1b263b]">Set New Password</h2>
                <input 
                    type="password" 
                    placeholder="Enter new password"
                    className="w-full p-3 bg-[#f1f4f3] rounded-lg mb-4"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <button type="submit" className="w-full py-3 bg-[#1b263b] text-[#6bfe9c] font-bold rounded-lg uppercase tracking-widest">
                    Update Password
                </button>
                {message && <p className="mt-4 text-red-500 text-sm">{message}</p>}
            </form>
        </div>
    );
};

export default ResetPassword;