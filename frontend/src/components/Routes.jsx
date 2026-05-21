import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Check if the user has a token in their digital wallet
    const token = localStorage.getItem('spms_token');

    // If no token exists, send them immediately back to the login page
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If they have a token, let them enter the requested page
    // Jika digunakan sebagai wrapper tanpa children, render <Outlet /> untuk memuat sub-rute internal
    return children ? children : <Outlet />;
};

export default ProtectedRoute;