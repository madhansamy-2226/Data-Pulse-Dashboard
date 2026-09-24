import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading, isAdmin, isAnalyst } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'ADMIN' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'ANALYST' && !isAnalyst) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
