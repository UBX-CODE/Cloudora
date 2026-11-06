import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const PublicRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment-200 dark:bg-espresso-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-terracotta-500 animate-spin mb-3" />
        <span className="text-xs font-mono text-espresso-600 dark:text-parchment-400">[ INITIALIZING ARCHIVE ]</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

