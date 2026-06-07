import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, RotateCcw, Search, Laptop, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTicketType = (ticket) => {
  if (ticket.isVhs) return { label: 'Snimci', className: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  if (ticket.isWarranty) return { label: 'Garancija', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  return { label: 'Servis', className: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
};

const RecycleBinTabContent = ({
  deletedTickets,
  isLoading,
  recycleBinMode = 'local',
  onRestore,
  onPermanentDelete,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return deletedTickets;
    return deletedTickets.filter((t) =>
      [t.id, t.customerName, t.customerSurname, t.customerPhone, t.deviceName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [deletedTickets, searchTerm]);

  const runAction = async (ticketId, action) => {
    setBusyId(ticketId);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };

  const modeLabels = {
    database: {
      title: 'Cloud korpa aktivna (Supabase)',
      text: 'Obrisani nalozi su vidljivi na svim uređajima i pregledačima.',
      className: 'text-green-300 bg-green-900/20 border-green-700/40',
    },
    cloud: {
      title: 'Cloud korpa aktivna (server)',
      text: 'Obrisani nalozi se čuvaju na serveru i sinhronizuju između svih uređaja.',
      className: 'text-green-300 bg-green-900/20 border-green-700/40',
    },
    local: {
      title: 'Korpa samo u ovom pregledaču',
      text: 'Pokrenite aplikaciju preko npm start (server) da korpa radi na svim uređajima. Stari lokalni zapisi se automatski prebacuju u cloud kad je dostupan.',
      className: 'text-amber-300 bg-amber-900/20 border-amber-700/40',
    },
  };

  const modeInfo = modeLabels[recycleBinMode] || modeLabels.local;

  return (
    <div className="space-y-6 mt-0">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Korpa za otpatke
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Obrisani nalozi se čuvaju ovdje. Možete ih vratiti ili trajno ukloniti.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-slate-300 border-slate-600 hover:bg-slate-800 shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Osveži
          </Button>
        </div>

        <div className={`mb-4 flex items-start gap-2 text-xs rounded-lg border p-3 ${modeInfo.className}`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{modeInfo.title}</p>
            <p className="mt-0.5 opacity-90">{modeInfo.text}</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pretraga po broju, klijentu, telefonu, uređaju..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Učitavanje obrisane naloge...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Korpa je prazna</p>
            <p className="text-sm mt-1">Obrisani nalozi će se pojaviti ovdje.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket, index) => {
              const type = getTicketType(ticket);
              const isBusy = busyId === ticket.id;

              return (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 flex flex-col lg:flex-row lg:items-center gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-lg">#{ticket.id}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${type.className}`}>
                        {type.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                      <p className="text-slate-300">
                        <span className="text-slate-500">Klijent: </span>
                        {ticket.customerName} {ticket.customerSurname}
                      </p>
                      <p className="text-slate-300">
                        <span className="text-slate-500">Telefon: </span>
                        {ticket.customerPhone || '—'}
                      </p>
                      <p className="text-slate-300 flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        {ticket.deviceName || '—'}
                      </p>
                      <p className="text-slate-400 text-xs">
                        Obrisano: {formatDate(ticket.deletedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => runAction(ticket.id, () => onRestore(ticket))}
                      disabled={isBusy}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4 mr-2" />
                      )}
                      Vrati nalog
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPermanentDelete(ticket)}
                      disabled={isBusy}
                      className="border-red-500/50 text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Obriši trajno
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-4 flex items-start gap-2 text-xs text-amber-400/90 bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              „Obriši trajno“ uklanja nalog zauvijek iz baze. Koristite „Vrati nalog“ ako ste obrisali greškom.
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RecycleBinTabContent;
