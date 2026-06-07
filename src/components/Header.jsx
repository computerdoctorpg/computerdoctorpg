import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  LogOut, Cloud, ShieldAlert, Laptop, Loader2, Package, BarChart3, Menu,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { getOperatorDisplayName } from '@/lib/operatorAuth';

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const displayLabel = user.displayName || getOperatorDisplayName(user) || user.email || 'Nepoznat korisnik';

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      toast({
        title: 'Odjava uspešna',
        description: 'Uspešno ste se odjavili sa sistema.',
        className: 'bg-green-600 text-white border-none',
      });
    } catch (error) {
      console.error('Logout handler error:', error);
      toast({ title: 'Odjava', description: 'Odjavljeni ste sa sistema.' });
    } finally {
      setIsLoggingOut(false);
      setMenuOpen(false);
    }
  };

  const navLinks = [
    { to: '/', label: 'Nalozi', icon: Laptop, active: location.pathname === '/', className: 'bg-blue-600 hover:bg-blue-700' },
    { to: '/parts', label: 'Polovni dijelovi', icon: Package, active: location.pathname === '/parts', className: 'bg-blue-600 hover:bg-blue-700' },
  ];

  if (isAdmin) {
    navLinks.push(
      { to: '/admin', label: 'Admin Panel', icon: ShieldAlert, active: location.pathname === '/admin' && !location.search.includes('tab=finances'), className: 'bg-purple-600 hover:bg-purple-700' },
      { to: '/admin?tab=finances', label: 'Finansije dijelova', icon: BarChart3, active: location.pathname === '/admin' && location.search.includes('tab=finances'), className: 'bg-green-600 hover:bg-green-700' },
    );
  }

  const NavButtons = ({ onNavigate, vertical = false }) => (
    <div className={vertical ? 'flex flex-col gap-2' : 'flex items-center gap-2 flex-wrap justify-center'}>
      {navLinks.map(({ to, label, icon: Icon, active, className }) => (
        <Link key={to} to={to} onClick={onNavigate}>
          <Button
            variant={active ? 'default' : 'ghost'}
            size={vertical ? 'default' : 'sm'}
            className={`w-full justify-start ${active ? className : 'text-slate-300 hover:text-white'}`}
          >
            <Icon className="w-4 h-4 mr-2" /> {label}
          </Button>
        </Link>
      ))}
    </div>
  );

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-3 sm:p-4 sticky top-0 z-40 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img className="h-10 sm:h-12 w-auto object-contain shrink-0" alt="Computer Doctor logo" src="/images/logo.png" />
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-white leading-tight truncate">COMPUTER DOCTOR</h1>
            <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/30 inline-flex items-center gap-1">
              <Cloud className="w-3 h-3" /> CLOUD
            </span>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          <NavButtons />
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex flex-col items-end">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
              <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`} />
              <span className="max-w-[140px] truncate">{displayLabel}</span>
            </div>
            <span className={`text-xs uppercase tracking-wider font-semibold ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`}>
              {isAdmin ? 'Admin' : 'Operater'}
            </span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="hidden sm:flex items-center gap-2"
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {isLoggingOut ? 'Odjava...' : 'Odjavi se'}
          </Button>

          {/* Mobile menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden border-slate-600 text-slate-200 shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-slate-900 border-slate-700 text-white w-[min(100vw-2rem,320px)]">
              <SheetHeader>
                <SheetTitle className="text-left text-white">Meni</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="rounded-lg bg-slate-800/80 p-3 border border-slate-700">
                  <p className="text-sm font-medium text-white truncate">{displayLabel}</p>
                  <p className={`text-xs mt-1 ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`}>
                    {isAdmin ? 'Admin (sve dozvole)' : 'Operater'}
                  </p>
                </div>
                <NavButtons vertical onNavigate={() => setMenuOpen(false)} />
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                  {isLoggingOut ? 'Odjava...' : 'Odjavi se'}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
