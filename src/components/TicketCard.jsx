import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, ChevronRight, Hash, Laptop, Phone,
  User, Wrench, Battery, Zap, AlertCircle, RotateCcw,
  Printer, Mail, Smartphone, Download, Trash2, Loader2,
  History, Euro, Pencil, Shield, Film
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { canDeleteTickets, canEditDocuments } from '@/lib/permissions';
import { updateTicket } from '@/lib/db';
import { buildCompletionViberMessage, openViberChat } from '@/lib/viberUtils';

const STATUS_CONFIG = {
  pending: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: 'bg-amber-400', label: 'NA ČEKANJU' },
  open: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: 'bg-amber-400', label: 'OTVORENO' },
  'in-progress': { color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', dot: 'bg-purple-400', label: 'U RADU' },
  completed: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400', label: 'ZAVRŠENO' },
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DetailRow = ({ icon: Icon, label, value, mono, highlight }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${highlight || 'text-slate-500'}`} />
      <div className="min-w-0 flex-1">
        <span className="text-[10px] uppercase tracking-wide text-slate-500 block">{label}</span>
        <span className={`text-sm text-slate-200 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
      </div>
    </div>
  );
};

const TicketCard = ({
  ticket,
  index,
  onClick,
  onGenerateInvoice,
  onPrintTicket,
  onEditTicket,
  onDeleteClick,
  previousTicketCount = 0,
  compact = false,
}) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const canEdit = canEditDocuments(isAdmin);
  const canDelete = canDeleteTickets(isAdmin);
  const [isReopening, setIsReopening] = useState(false);

  const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.pending;
  const totalCost = (parseFloat(ticket.partsCost) || 0) + (parseFloat(ticket.serviceCost) || 0);

  const handleViberClick = async (e) => {
    e.stopPropagation();
    const message = buildCompletionViberMessage(ticket);
    const result = await openViberChat(ticket.customerPhone, message);
    if (!result.ok) {
      toast({ variant: 'destructive', title: 'Greška', description: 'Broj telefona nije dostupan.' });
      return;
    }
    toast({
      title: 'Viber',
      description: result.copied
        ? 'Poruka kopirana. Zalijepite je u Viber (Ctrl+V).'
        : 'Viber se otvara — kopirajte poruku ručno ako je polje prazno.',
      duration: 5000,
    });
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (canDelete && onDeleteClick) onDeleteClick(ticket);
    else toast({ variant: 'destructive', title: 'Pristup odbijen', description: 'Samo administratori mogu obrisati naloge.' });
  };

  const handleReopen = async (e) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setIsReopening(true);
    try {
      const historyEntry = {
        date: new Date().toISOString(),
        action: 'Status promenjen u OTVORENO',
        description: 'Admin ponovo otvorio nalog',
      };
      await updateTicket(ticket.id, {
        status: 'open',
        history: [...(ticket.history || []), historyEntry],
      });
      toast({ title: 'Nalog Otvoren', description: `Nalog #${ticket.id} ponovo otvoren.`, className: 'bg-yellow-600 text-white border-none' });
      window.dispatchEvent(new CustomEvent('ticket-updated'));
    } catch {
      toast({ variant: 'destructive', title: 'Greška', description: 'Neuspešno otvaranje naloga.' });
    } finally {
      setIsReopening(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      onClick={() => onClick(ticket)}
      className={`group bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-700/80 overflow-hidden hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-900/10 transition-all cursor-pointer flex flex-col ${
        compact ? 'w-[min(calc(100vw-2rem),320px)] sm:w-[320px] shrink-0' : ''
      }`}
    >
      {/* Header */}
      <div className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} bg-slate-900/60 border-b border-slate-700/60 flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-bold text-blue-400 shrink-0">#{ticket.id}</span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${status.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {ticket.isWarranty && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
              <Shield className="w-3 h-3" />
              GARANCIJA
            </span>
          )}
          {ticket.isVhs && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border bg-amber-500/20 text-amber-300 border-amber-500/40">
              <Film className="w-3 h-3" />
              VHS
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
          {isAdmin && ticket.status === 'completed' && (
            <Button onClick={handleReopen} size="icon" variant="ghost" disabled={isReopening}
              className="h-7 w-7 text-amber-400 hover:bg-amber-900/30" title="Ponovo otvori">
              {isReopening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            </Button>
          )}
          {canEdit && (
            <Button onClick={(e) => { e.stopPropagation(); onEditTicket?.(ticket); }} size="icon" variant="ghost"
              className="h-7 w-7 text-amber-400 hover:text-amber-300 hover:bg-amber-900/30" title="Uredi nalog">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {canEdit && (
            <Button onClick={(e) => { e.stopPropagation(); onPrintTicket(ticket); }} size="icon" variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-white" title="Pregled i štampa prijemnice">
              <Printer className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button onClick={handleViberClick} size="icon" className="h-7 w-7 bg-[#7360f2]/80 hover:bg-[#7360f2] text-white" title="Viber">
            <Smartphone className="w-3.5 h-3.5" />
          </Button>
          {isAdmin && ticket.status === 'completed' && (
            <Button onClick={(e) => { e.stopPropagation(); onGenerateInvoice(ticket); }} size="icon"
              className="h-7 w-7 bg-emerald-600/80 hover:bg-emerald-600 text-white" title="Račun">
              <Download className="w-3.5 h-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button onClick={handleDelete} size="icon" variant="ghost"
              className="h-7 w-7 text-red-400 hover:bg-red-900/30" title="Premjesti u korpu">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className={`${compact ? 'p-3 space-y-2' : 'p-4 space-y-3'} flex-grow`}>
        {/* Customer */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <h3 className={`font-bold text-white truncate ${compact ? 'text-sm' : 'text-base'}`}>
              {ticket.customerName} {ticket.customerSurname}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 ml-5">
            <span className="flex items-center gap-1 text-xs text-slate-300">
              <Phone className="w-3 h-3 text-slate-500" />
              {ticket.customerPhone}
            </span>
            {!compact && ticket.customerEmail && (
              <span className="flex items-center gap-1 text-xs text-slate-400 truncate">
                <Mail className="w-3 h-3" />
                {ticket.customerEmail}
              </span>
            )}
            {previousTicketCount > 1 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <History className="w-3 h-3" />
                {previousTicketCount}x
              </span>
            )}
          </div>
        </div>

        {/* Device / VHS */}
        <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700/50 space-y-1.5">
          {ticket.isVhs ? (
            <>
              <div className="flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold text-white text-xs">
                  {ticket.vhsCassetteCount || '?'} kaseta · {((ticket.vhsCassetteCount || 0) * (ticket.vhsPricePerCassette || 30)).toFixed(0)} €
                </span>
              </div>
              {ticket.vhsCassetteCondition && (
                <p className="text-[11px] text-slate-400 line-clamp-2 pl-5">{ticket.vhsCassetteCondition}</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-semibold text-white text-xs truncate">{ticket.deviceName}</span>
              </div>
              <div className={`${compact ? 'space-y-1 pl-5' : 'grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6'}`}>
                <DetailRow icon={Hash} label="S/N" value={ticket.deviceSerial} mono highlight="text-cyan-400/70" />
                {!compact && <DetailRow icon={Battery} label="Baterija" value={ticket.batterySerial} mono />}
                {!compact && <DetailRow icon={Zap} label="Punjač" value={ticket.chargerSerial} mono />}
              </div>
            </>
          )}
        </div>

        {/* Issue — skip for VHS */}
        {!ticket.isVhs && ticket.issueDescription && (
          <div className="bg-red-950/20 rounded-lg p-2 border border-red-900/30">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-300 line-clamp-2">{ticket.issueDescription}</p>
            </div>
          </div>
        )}

        {!compact && ticket.repairDetails && (
          <div className="flex items-start gap-2">
            <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400 line-clamp-1">{ticket.repairDetails}</p>
          </div>
        )}

        {/* Footer meta */}
        {!compact && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
            {isAdmin && totalCost > 0 && (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Euro className="w-3 h-3" />
                {totalCost.toFixed(2)}
              </span>
            )}
          </div>
        )}

        {compact && isAdmin && totalCost > 0 && (
          <div className="flex justify-end">
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
              <Euro className="w-3 h-3" />
              {totalCost.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {!compact && (
        <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-500 group-hover:text-blue-400 transition-colors">
          <span>Klikni za detalje</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      )}
    </motion.div>
  );
};

export default TicketCard;
