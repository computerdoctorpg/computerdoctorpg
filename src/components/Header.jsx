import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Cloud, ShieldAlert, Laptop, Loader2, Package, BarChart3 } from 'lucide-react';

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Safely return null if user object doesn't exist to prevent crashes
  if (!user) return null;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    
    try {
      await signOut();
      toast({
        title: "Odjava uspešna",
        description: "Uspešno ste se odjavili sa sistema.",
        className: "bg-green-600 text-white border-none"
      });
    } catch (error) {
      console.error("Logout handler error:", error);
      toast({
        title: "Odjava",
        description: "Odjavljeni ste sa sistema.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            className="h-12 w-auto object-contain" 
            alt="Computer Doctor logo" 
            src="/images/logo.png" 
          />
          <div>
            <h1 className='text-xl font-bold text-white leading-tight'>COMPUTER DOCTOR</h1>
            <div className="flex items-center gap-2">
              <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1">
                <Cloud className="w-3 h-3" /> CLOUD
              </span>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-4 flex-wrap justify-center">
          <Link to="/">
            <Button 
              variant={location.pathname === '/' ? 'default' : 'ghost'} 
              size="sm"
              className={location.pathname === '/' ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-300 hover:text-white'}
            >
              <Laptop className="w-4 h-4 mr-2" /> Nalozi
            </Button>
          </Link>

          <Link to="/parts">
            <Button 
              variant={location.pathname === '/parts' ? 'default' : 'ghost'} 
              size="sm"
              className={location.pathname === '/parts' ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-300 hover:text-white'}
            >
              <Package className="w-4 h-4 mr-2" /> Polovni dijelovi
            </Button>
          </Link>

          {isAdmin && (
            <>
              <Link to="/admin">
                <Button 
                  variant={location.pathname === '/admin' && !location.search.includes('tab=finances') ? 'default' : 'ghost'} 
                  size="sm"
                  className={location.pathname === '/admin' && !location.search.includes('tab=finances') ? 'bg-purple-600 hover:bg-purple-700' : 'text-slate-300 hover:text-white'}
                >
                  <ShieldAlert className="w-4 h-4 mr-2" /> Admin Panel
                </Button>
              </Link>
              <Link to="/admin?tab=finances">
                <Button 
                  variant={location.pathname === '/admin' && location.search.includes('tab=finances') ? 'default' : 'ghost'} 
                  size="sm"
                  className={location.pathname === '/admin' && location.search.includes('tab=finances') ? 'bg-green-600 hover:bg-green-700' : 'text-slate-300 hover:text-white'}
                >
                  <BarChart3 className="w-4 h-4 mr-2" /> Finansije dijelova
                </Button>
              </Link>
            </>
          )}
        </nav>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
              <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
              {user?.email ? user.email : 'Nepoznat korisnik'}
            </div>
            <span className={`text-xs uppercase tracking-wider font-semibold ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`}>
              Uloga: {isAdmin ? 'Admin (Sve Dozvole)' : (user?.role || 'Operater')}
            </span>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 min-w-[110px]"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {isLoggingOut ? 'Odjava...' : 'Odjavi se'}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;