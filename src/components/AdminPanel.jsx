import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Users, Trash2, ShieldAlert, ArrowLeft, BarChart3, UserCircle as UsersCore } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import PartsSalesFinancialPage from './PartsSalesFinancialPage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);

  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultTab = queryParams.get('tab') || 'users';

  const fetchUsers = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error in Supabase fetch:', error);
        throw error;
      }
      
      if (data && Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Neuspešno učitavanje liste korisnika. Proverite konekciju.",
      });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Pristup Odbijen</h2>
          <p className="text-slate-400">Nemate administratorska prava za pristup ovom delu sistema.</p>
          <Link to="/">
            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Nazad na Nalozi
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCreateOperator = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Greška", description: "Lozinka mora imati bar 6 karaktera."});
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        throw new Error('Sesija nije pronađena. Molimo prijavite se ponovo.');
      }

      const accessToken = sessionData.session.access_token;

      let createdViaEdgeFunction = false;

      try {
        const { error } = await supabase.functions.invoke('admin-users', {
          headers: {
            Authorization: `Bearer ${accessToken}`
          },
          body: { action: 'create', email: normalizedEmail, password }
        });

        if (!error) {
          createdViaEdgeFunction = true;
        }
      } catch (edgeError) {
        console.warn('Edge function unavailable, using signUp fallback:', edgeError);
      }

      if (!createdViaEdgeFunction) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Korisnik nije kreiran.');

        const { error: profileError } = await supabase
          .from('users')
          .upsert({ id: data.user.id, email: normalizedEmail, role: 'operater' }, { onConflict: 'id' });

        if (profileError) throw profileError;
      }

      toast({
        title: "Uspešno",
        description: `Korisnik ${normalizedEmail} je uspešno kreiran kao Operater.`,
        className: "bg-green-600 text-white"
      });
      
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (error) {
      console.error('Create user error detailed:', error);
      toast({
        variant: "destructive",
        title: "Greška pri kreiranju",
        description: error.message || "Došlo je do greške prilikom kreiranja operatera.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        throw new Error('Sesija nije pronađena. Molimo prijavite se ponovo.');
      }

      const accessToken = sessionData.session.access_token;

      const { data, error } = await supabase.functions.invoke('admin-users', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: { action: 'delete', userId: userToDelete.id }
      });

      if (error) throw error;

      toast({
        title: "Korisnik obrisan",
        description: `Nalog ${userToDelete.email} je uspešno uklonjen.`,
      });
      
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error('Delete user error detailed:', error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: error.message || "Neuspešno brisanje korisnika.",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-600/20 rounded-xl">
          <ShieldAlert className="w-8 h-8 text-purple-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400">Upravljanje sistemom, operaterima i finansijama</p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="bg-slate-800 border border-slate-700 mb-6">
          <TabsTrigger value="users" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2">
            <Users className="w-4 h-4" />
            Operateri
          </TabsTrigger>
          <TabsTrigger value="finances" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Finansije Dijelova
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Create User Form */}
            <Card className="bg-slate-800 border-slate-700 text-white md:col-span-1 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  Novi Operater
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Kreirajte novi nalog za radnika.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOperator} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Adresa</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-900 border-slate-600 text-white"
                      placeholder="operater@computer-doctor.me"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Lozinka</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-900 border-slate-600 text-white"
                      placeholder="Min. 6 karaktera"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Kreiraj Nalog
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card className="bg-slate-800 border-slate-700 text-white md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Aktivni Nalozi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Email</th>
                          <th className="px-4 py-3">Uloga</th>
                          <th className="px-4 py-3">Kreiran</th>
                          <th className="px-4 py-3 text-right rounded-tr-lg">Akcije</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-750">
                            <td className="px-4 py-3 font-medium">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                (u.role === 'admin' || u.email === 'prodaja@computer-doctor.me') ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {((u.role === 'admin' || u.email === 'prodaja@computer-doctor.me') ? 'admin' : u.role || 'OPERATER').toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400">
                              {new Date(u.created_at).toLocaleDateString('sr-RS')}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {u.role !== 'admin' && u.email !== 'prodaja@computer-doctor.me' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUserToDelete(u)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center py-8 text-slate-400">
                              Nema pronađenih korisnika.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finances" className="mt-0">
          <PartsSalesFinancialPage />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Brisanje Operatera</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Da li ste sigurni da želite da obrišete nalog <strong>{userToDelete?.email}</strong>?
              Ova akcija će trajno ukloniti operatera iz sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">Otkaži</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700 text-white">
              Obriši Nalog
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;