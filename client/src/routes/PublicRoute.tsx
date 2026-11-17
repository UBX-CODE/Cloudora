import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080C] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-7 h-7 text-white/50 animate-spin mb-3" />
        <span className="text-xs font-mono text-gray-400">[ INITIALIZING CLOUDORA ]</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

