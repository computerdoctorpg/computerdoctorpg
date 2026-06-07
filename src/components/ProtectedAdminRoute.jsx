import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedAdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  // Safely check if user object is fully populated before making decisions
  const isUserDataIncomplete = user && user.role === undefined;

  if (loading || isUserDataIncomplete) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-slate-400">Provera administratorskih prava...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;