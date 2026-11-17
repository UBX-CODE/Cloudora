import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080C] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-7 h-7 text-white/50 animate-spin mb-3" />
        <p className="text-xs font-mono text-gray-400">[ VERIFYING CLOUDORA SESSION ]</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

