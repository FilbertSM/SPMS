import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Check if the user has a token in their digital wallet
    const token = localStorage.getItem('spms_token');

    // If no token exists, send them immediately back to the login page
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If they have a token, let them enter the requested page (Dashboard)
    return children;
};

export default ProtectedRoute;