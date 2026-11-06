import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment-200 dark:bg-espresso-950 flex flex-col items-center justify-center p-4">
        <div className="relative w-12 h-12 curvy-edge bg-gradient-to-tr from-terracotta-600 to-ochre-400 p-[1.5px] shadow-glow-terracotta mb-4 animate-pulse">
          <div className="w-full h-full bg-parchment-100 dark:bg-espresso-900 curvy-edge flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-terracotta-500 animate-spin" />
          </div>
        </div>
        <p className="text-xs font-mono text-espresso-600 dark:text-parchment-400">[ VERIFYING CLOUDORA SESSION ]</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

