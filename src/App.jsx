import React from 'react';
import { Helmet } from 'react-helmet';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RepairTicketsDashboard from '@/components/RepairTicketsDashboard';
import AuthPage from '@/components/AuthPage';
import Header from '@/components/Header';
import AdminPanel from '@/components/AdminPanel';
import PartsPage from '@/components/PartsPage';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-400">Provera autentifikacije...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Helmet>
        <title>PC Servis Admin - Supabase Cloud</title>
        <meta name="description" content="Profesionalni administrativni panel za PC servis sa Supabase cloud bazom podataka." />
      </Helmet>
      <BrowserRouter>
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <RepairTicketsDashboard />
              </ProtectedRoute>
            } />
            <Route path="/parts" element={
              <ProtectedRoute>
                <PartsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <ProtectedAdminRoute>
                  <AdminPanel />
                </ProtectedAdminRoute>
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;