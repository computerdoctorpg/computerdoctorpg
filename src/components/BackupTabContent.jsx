import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { runClientBackup } from '@/lib/backup';
import { runServerBackup, previewBackupCounts } from '@/lib/backupApi';
import { BACKUP_TABLES } from '@/lib/backupConstants';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Database, Download, HardDrive, Loader2, RefreshCw, ShieldCheck, AlertTriangle,
} from 'lucide-react';

const TABLE_LABELS = {
  parts_categories: 'Kategorije delova',
  parts: 'Polovni delovi',
  clients: 'Klijenti',
  tickets: 'Servisni nalozi',
  parts_sales: 'Prodaja delova (stara)',
  parts_sales_new: 'Prodaja delova',
  users: 'Korisnici sistema',
};

const BackupTabContent = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [counts, setCounts] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMode, setBackupMode] = useState(null);

  const loadPreview = useCallback(async () => {
    setIsLoadingPreview(true);
    try {
      const preview = await previewBackupCounts();
      setCounts(preview.counts);
      setErrors(preview.errors || []);
    } catch (error) {
      console.error('Backup preview error:', error);
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: 'Neuspešno učitavanje pregleda podataka za backup.',
      });
    } finally {
      setIsLoadingPreview(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const handleBackup = async (mode) => {
    setIsBackingUp(true);
    setBackupMode(mode);
    try {
      let backup;
      if (mode === 'server') {
        backup = await runServerBackup();
      } else {
        backup = await runClientBackup({ createdBy: user?.email || user?.displayName || null });
      }

      toast({
        title: 'Backup preuzet',
        description: `Sačuvano ${backup.counts?.tickets ?? 0} naloga, ${backup.counts?.clients ?? 0} klijenata.`,
        className: 'bg-green-600 text-white border-none',
      });
    } catch (error) {
      console.error('Backup error:', error);

      if (mode === 'server') {
        toast({
          variant: 'destructive',
          title: 'Serverski backup nije dostupan',
          description: error.message || 'Koristite brzi backup ili dodajte SUPABASE_SERVICE_ROLE_KEY u .env.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Greška pri backupu',
          description: error.message || 'Backup nije uspio.',
        });
      }
    } finally {
      setIsBackingUp(false);
      setBackupMode(null);
    }
  };

  const totalRows = counts
    ? BACKUP_TABLES.reduce((sum, table) => sum + (counts[table] || 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-emerald-400" />
              Backup podataka
            </h2>
            <p className="text-slate-400 mt-2 max-w-2xl">
              Preuzmite kompletan JSON backup baze: naloge (uključujući korpu), klijente,
              delove, prodaju, korisnike i lokalnu korpu iz pregledača.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadPreview}
            disabled={isLoadingPreview || isBackingUp}
            className="border-slate-600 text-slate-200 hover:bg-slate-700 shrink-0"
          >
            {isLoadingPreview ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Osvježi pregled
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-slate-700 bg-slate-800 p-6 text-white">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Šta se bekapuje
          </h3>

          {isLoadingPreview ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-slate-300 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Podatak</th>
                    <th className="px-4 py-3 text-right font-semibold">Broj zapisa</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900/40">
                  {BACKUP_TABLES.map((table) => (
                    <tr key={table} className="border-b border-slate-700/80 last:border-0">
                      <td className="px-4 py-3 text-slate-200">{TABLE_LABELS[table] || table}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-400">
                        {counts?.[table] ?? 0}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-slate-600 bg-slate-900/60">
                    <td className="px-4 py-3 text-slate-300">Lokalna korpa (pregledač)</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-400">
                      {counts?.localRecycleBin ?? 0}
                    </td>
                  </tr>
                  <tr className="bg-slate-900/80">
                    <td className="px-4 py-3 font-semibold text-white">Ukupno iz baze</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">{totalRows}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200 text-sm flex gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Djelimičan pregled</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-100/90">
                  {errors.map((err) => (
                    <li key={`${err.table}-${err.message}`}>{err.table}: {err.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6 text-white">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Download className="w-5 h-5 text-green-400" />
              Preuzmi backup
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Fajl se automatski preuzima na računar kao JSON. Čuvajte ga na sigurnom mjestu.
            </p>

            <div className="space-y-3">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isBackingUp || isLoadingPreview}
                onClick={() => handleBackup('client')}
              >
                {isBackingUp && backupMode === 'client' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Preuzmi backup
              </Button>

              <Button
                variant="outline"
                className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-900/30"
                disabled={isBackingUp || isLoadingPreview}
                onClick={() => handleBackup('server')}
              >
                {isBackingUp && backupMode === 'server' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                )}
                Kompletan backup (+ auth nalozi)
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 text-xs text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-300 mb-2">Napomene</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Backup ne sadrži lozinke korisnika.</li>
              <li>Kompletan backup zahtijeva <code className="text-slate-300">SUPABASE_SERVICE_ROLE_KEY</code> u .env.</li>
              <li>Preporuka: backup jednom dnevno ili pre većih promena.</li>
              <li>Za vraćanje podataka koristite <code className="text-slate-300">npm run import-data</code>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupTabContent;
