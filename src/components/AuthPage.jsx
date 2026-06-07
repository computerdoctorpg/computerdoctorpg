import React, { useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Loader2, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { resolveLoginEmail } from '@/lib/operatorAuth';

const getLoginErrorMessage = (error) => {
  const message = error?.message || '';
  const code = error?.code || error?.error_code || '';

  if (message === 'Invalid login credentials' || code === 'invalid_credentials') {
    return 'Pogrešno korisničko ime/email ili lozinka.';
  }

  if (message === 'Email not confirmed' || code === 'email_not_confirmed') {
    return 'Email nije potvrđen. Provjeri inbox ili resetuj lozinku u Supabase panelu.';
  }

  if (code === 'too_many_requests') {
    return 'Previše pokušaja prijave. Sačekaj par minuta pa probaj ponovo.';
  }

  return message || 'Došlo je do greške pri prijavi.';
};

const AuthPage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { signIn } = useAuth();
  const { toast } = useToast();
  const isEmailLogin = login.includes('@');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const loginEmail = resolveLoginEmail(login);

    try {
      const { data, error } = await signIn(loginEmail, password);

      if (error) {
        console.error('Login error:', error);
        toast({
          variant: 'destructive',
          title: 'Greška pri prijavi',
          description: getLoginErrorMessage(error),
        });
      } else if (data?.session) {
        toast({
          title: 'Dobrodošli',
          description: 'Uspešna prijava na Cloud sistem.',
          className: 'bg-green-600 text-white border-none',
        });
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      toast({
        variant: 'destructive',
        title: 'Kritična greška',
        description: 'Došlo je do neočekivane greške u sistemu.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const normalizedEmail = resolveLoginEmail(login);

    if (!normalizedEmail || !login.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Reset lozinke',
        description: 'Reset lozinke radi samo za admin email. Operateri ne koriste email — kontaktirajte admina.',
      });
      return;
    }

    setIsResetting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Email poslat',
        description: 'Link za reset lozinke je poslat na tvoj email.',
        className: 'bg-green-600 text-white border-none',
      });
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        variant: 'destructive',
        title: 'Reset nije uspio',
        description: error.message || 'Nije moguće poslati email za reset lozinke.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-blue-600/20 p-3 rounded-full w-fit mb-4 relative">
            <Lock className="w-8 h-8 text-blue-400" />
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5" title="Cloud Connected">
              <Cloud className="w-3 h-3 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Pristup</CardTitle>
          <CardDescription className="text-slate-400">
            Prijava na Centralni Cloud Sistem
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login" className="text-slate-200">Korisničko ime ili email</Label>
              <Input
                id="login"
                type="text"
                placeholder="Marko ili prodaja@computer-doctor.me"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-400 caret-white focus:ring-blue-500"
                required
                autoFocus
                autoComplete="username"
              />
              <p className="text-[11px] text-slate-500">Operateri: samo ime. Admin: pun email.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Lozinka</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-400 caret-white focus:ring-blue-500"
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              type="submit"
              disabled={isLoading || isResetting}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Prijavljivanje...
                </>
              ) : (
                'Prijavi se'
              )}
            </Button>

            {isEmailLogin && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-slate-300 hover:text-white hover:bg-slate-700/50"
                onClick={handleResetPassword}
                disabled={isLoading || isResetting}
              >
                {isResetting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Slanje linka...
                  </>
                ) : (
                  'Zaboravljena lozinka?'
                )}
              </Button>
            )}

            <p className="text-xs text-center text-slate-400 mt-0 leading-relaxed">
              Operateri se prijavljuju imenom koje im je dodijelio admin.
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AuthPage;
