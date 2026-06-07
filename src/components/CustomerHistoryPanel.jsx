import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Phone, Mail, Laptop, ChevronDown, ChevronUp,
  Hash, Calendar, History, User, Download, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { buildClientSummaries, clientMatchesSearch, exportClientsToCsv } from '@/lib/ticketUtils';

const STATUS_LABELS = {
  pending: 'Na čekanju',
  open: 'Otvoreno',
  'in-progress': 'U radu',
  completed: 'Završeno',
};

const STATUS_COLORS = {
  pending: 'text-amber-400',
  open: 'text-amber-400',
  'in-progress': 'text-purple-400',
  completed: 'text-emerald-400',
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const CustomerHistoryPanel = ({ tickets, onTicketClick }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClient, setExpandedClient] = useState(null);

  const clients = useMemo(() => buildClientSummaries(tickets), [tickets]);

  const filteredClients = useMemo(
    () => clients.filter((c) => clientMatchesSearch(c, searchTerm)),
    [clients, searchTerm]
  );

  const toggleExpand = (key) => {
    setExpandedClient((prev) => (prev === key ? null : key));
  };

  const handleExport = () => {
    if (filteredClients.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nema podataka',
        description: 'Nema klijenata za export.',
      });
      return;
    }
    exportClientsToCsv(filteredClients);
    toast({
      title: 'Export završen',
      description: `${filteredClients.length} klijenata sačuvano u CSV fajl.`,
      className: 'bg-green-600 text-white border-none',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/15 border border-indigo-500/25">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Istorija Klijenata</h2>
          </div>
          <span className="text-sm text-slate-500">{filteredClients.length} klijenata</span>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/20 hover:text-indigo-200"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Pretraga po imenu, telefonu, serijskom broju, uređaju..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p>Nema pronađenih klijenata</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredClients.map((client, index) => {
              const key = client.clientId || client.customerPhone || index;
              const isExpanded = expandedClient === key;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="bg-slate-800/60 rounded-xl border border-slate-700/80 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(key)}
                    className="w-full px-4 py-4 flex items-center gap-4 hover:bg-slate-700/30 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-indigo-400" />
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
                      <div>
                        <p className="font-bold text-white truncate flex items-center gap-2 flex-wrap">
                          {client.customerName} {client.customerSurname}
                          {client.isWarrantyClient && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                              <Shield className="w-3 h-3" />
                              Garantni klijent
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {client.customerPhone}
                        </p>
                      </div>

                      <div className="text-sm">
                        <p className="text-slate-400 text-xs mb-0.5">Uređaji</p>
                        <p className="text-slate-300 truncate">
                          {client.devices.slice(0, 2).join(', ')}
                          {client.devices.length > 2 && ` +${client.devices.length - 2}`}
                        </p>
                      </div>

                      <div className="text-sm">
                        <p className="text-slate-400 text-xs mb-0.5">Poslednja poseta</p>
                        <p className="text-slate-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(client.lastVisit)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/15 border border-blue-500/25 text-blue-300 text-sm font-semibold">
                          <History className="w-3.5 h-3.5" />
                          {client.ticketCount} {client.ticketCount === 1 ? 'nalog' : 'naloga'}
                        </span>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-700/60"
                      >
                        <div className="p-4 space-y-3 bg-slate-900/30">
                          {client.customerEmail && (
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-3">
                              <Mail className="w-3.5 h-3.5" />
                              {client.customerEmail}
                            </p>
                          )}

                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Svi nalozi ({client.ticketCount})
                          </p>

                          <div className="space-y-2">
                            {client.tickets.map((ticket) => (
                              <button
                                key={ticket.id}
                                type="button"
                                onClick={() => onTicketClick(ticket)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-blue-500/40 hover:bg-slate-800 transition-all text-left group"
                              >
                                <span className="font-mono text-sm font-bold text-blue-400 shrink-0">
                                  #{ticket.id}
                                </span>
                                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3">
                                  <span className="flex items-center gap-1.5 text-sm text-white truncate">
                                    <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    {ticket.deviceName}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate">
                                    <Hash className="w-3 h-3 shrink-0" />
                                    {ticket.deviceSerial || '-'}
                                  </span>
                                  <span className={`text-xs font-medium ${STATUS_COLORS[ticket.status]}`}>
                                    {STATUS_LABELS[ticket.status]}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500 shrink-0 hidden sm:block">
                                  {formatDate(ticket.createdAt)}
                                </span>
                                <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-blue-400 rotate-[-90deg] shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CustomerHistoryPanel;
