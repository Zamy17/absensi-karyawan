// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Component to protect routes that require authentication
const ProtectedRoute = ({ requiredRole }) => {
  const { currentUser, userRole, loading } = useAuth();
  
  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  if (requiredRole && userRole !== requiredRole) {
    // Redirect based on user role
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'guard') {
      return <Navigate to="/guard/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }
  
  // Render the protected content
  return <Outlet />;
};

export default ProtectedRoute;