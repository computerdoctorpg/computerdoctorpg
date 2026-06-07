import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { createOperatorAccount, deleteOperatorAccount } from '@/lib/adminUsersApi';
import { getOperatorDisplayName, isOperatorInternalEmail } from '@/lib/operatorAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Users, Trash2, ShieldAlert, ArrowLeft, BarChart3, HardDrive } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import PartsSalesFinancialPage from './PartsSalesFinancialPage';
import BackupTabContent from './BackupTabContent';
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

const getUserLabel = (u) => {
  if (u.display_name) return u.display_name;
  return getOperatorDisplayName({ email: u.email });
};

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatorEmail, setOperatorEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
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

      if (error) throw error;
      setUsers(Array.isArray(data) ? data : []);
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
    const email = operatorEmail.trim().toLowerCase();
    const name = displayName.trim();
    if (!email || !password) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: 'destructive', title: 'Greška', description: 'Unesite ispravnu email adresu.' });
      return;
    }
    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Greška', description: 'Lozinka mora imati bar 6 karaktera.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOperatorAccount({
        email,
        displayName: name,
        password,
        sendWelcomeEmail: true,
      });

      let description = `Nalog za ${email} kreiran.`;
      if (result.emailSent) {
        description += ' Email sa pristupom poslat.';
      } else if (result.emailError) {
        description += ` Email nije poslat: ${result.emailError}`;
      }

      toast({
        title: result.emailSent ? 'Uspešno' : 'Nalog kreiran',
        description,
        className: result.emailSent ? 'bg-green-600 text-white' : undefined,
      });

      setOperatorEmail('');
      setDisplayName('');
      setPassword('');
      fetchUsers();
    } catch (error) {
      console.error('Create user error detailed:', error);
      toast({
        variant: 'destructive',
        title: 'Greška pri kreiranju',
        description: error.message || 'Došlo je do greške prilikom kreiranja operatera.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteOperatorAccount(userToDelete.id);

      toast({
        title: "Korisnik obrisan",
        description: `Nalog ${getUserLabel(userToDelete)} je uspešno uklonjen.`,
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
        <div className="overflow-x-auto max-w-full -mx-1 px-1 pb-1 mb-6">
          <TabsList className="bg-slate-800 border border-slate-700 w-max min-w-full flex-nowrap inline-flex">
          <TabsTrigger value="users" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2 text-slate-300">
            <Users className="w-4 h-4" />
            Operateri
          </TabsTrigger>
          <TabsTrigger value="finances" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2 text-slate-300">
            <BarChart3 className="w-4 h-4" />
            Finansije Dijelova
          </TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2 text-slate-300">
            <HardDrive className="w-4 h-4" />
            Backup
          </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="users" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 h-fit rounded-lg border border-slate-700 bg-slate-800 text-white shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h2 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-400" />
                  Novi Operater
                </h2>
                <p className="text-sm text-slate-400">
                  Unesite email, ime i lozinku. Zaposleni dobija email sa pristupom i linkom za prijavu.
                </p>
              </div>
              <div className="p-6 pt-0">
                <form onSubmit={handleCreateOperator} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="operatorEmail" className="text-slate-200">Email zaposlenog</Label>
                    <Input
                      id="operatorEmail"
                      type="email"
                      value={operatorEmail}
                      onChange={(e) => setOperatorEmail(e.target.value)}
                      className="bg-slate-950 border-slate-600 text-white placeholder:text-slate-500"
                      placeholder="marko@gmail.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-slate-200">Ime i prezime</Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-slate-950 border-slate-600 text-white placeholder:text-slate-500"
                      placeholder="npr. Marko Petrović"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">Lozinka</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-950 border-slate-600 text-white placeholder:text-slate-500"
                      placeholder="Min. 6 karaktera"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Kreiraj Nalog
                  </Button>
                </form>
              </div>
            </div>

            <div className="md:col-span-2 rounded-lg border border-slate-700 bg-slate-800 text-white shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h2 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Aktivni Nalozi
                </h2>
              </div>
              <div className="p-6 pt-0">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-700">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-slate-900 text-slate-300">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg font-semibold">Ime / Email</th>
                          <th className="px-4 py-3 font-semibold">Uloga</th>
                          <th className="px-4 py-3 font-semibold">Kreiran</th>
                          <th className="px-4 py-3 text-right rounded-tr-lg font-semibold">Akcije</th>
                        </tr>
                      </thead>
                      <tbody className="bg-slate-900/40">
                        {users.map((u) => {
                          const isUserAdmin = u.role === 'admin' || u.email === 'prodaja@computer-doctor.me';
                          const label = getUserLabel(u);
                          return (
                            <tr key={u.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-800/80">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-white">{label}</p>
                                {isOperatorInternalEmail(u.email) && (
                                  <p className="text-[11px] text-slate-500 mt-0.5">Prijava: {label.toLowerCase()}</p>
                                )}
                                {!isOperatorInternalEmail(u.email) && (
                                  <p className="text-[11px] text-slate-400 mt-0.5">Prijava: {u.email}</p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isUserAdmin
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                  {(isUserAdmin ? 'admin' : u.role || 'operater').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-300">
                                {new Date(u.created_at).toLocaleDateString('sr-RS')}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {!isUserAdmin && (
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
                          );
                        })}
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
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="finances" className="mt-0">
          <PartsSalesFinancialPage />
        </TabsContent>

        <TabsContent value="backup" className="mt-0">
          <BackupTabContent />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Brisanje Operatera</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Da li ste sigurni da želite da obrišete nalog <strong className="text-white">{userToDelete ? getUserLabel(userToDelete) : ''}</strong>?
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
