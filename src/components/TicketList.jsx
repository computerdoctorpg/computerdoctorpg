import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import TicketCard from '@/components/TicketCard';
import { groupTicketsByDay, formatMonthLabel } from '@/lib/ticketUtils';

const weekdayBadgeClass = (label) => {
  if (label === 'Danas') return 'bg-blue-600/30 text-blue-300';
  if (label === 'Juče') return 'bg-slate-600/40 text-slate-300';
  return 'text-slate-500';
};

const renderTicketCard = (ticket, index, handlers, clientTicketCounts, compact) => {
  const countKey = ticket.clientId || ticket.customerPhone;
  const previousTicketCount = clientTicketCounts[countKey] || 0;

  return (
    <TicketCard
      key={ticket.id}
      index={Math.min(index, 12)}
      ticket={ticket}
      compact={compact}
      onClick={handlers.onTicketClick}
      onUpdateStatus={handlers.onUpdateStatus}
      onAddNotes={handlers.onAddNotes}
      onGenerateInvoice={handlers.onGenerateInvoice}
      onPrintTicket={handlers.onPrintTicket}
      onEditTicket={handlers.onEditTicket}
      onPrintDeliveryNote={handlers.onPrintDeliveryNote}
      onDeleteClick={handlers.onDeleteClick}
      previousTicketCount={previousTicketCount}
    />
  );
};

const TicketList = ({
  tickets,
  onTicketClick,
  onUpdateStatus,
  onAddNotes,
  onGenerateInvoice,
  onPrintTicket,
  onEditTicket,
  onPrintDeliveryNote,
  onDeleteClick,
  clientTicketCounts = {},
}) => {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
        <div className="bg-slate-800 p-4 rounded-full mb-4">
          <Clock className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-lg font-medium">Nema pronađenih naloga</p>
        <p className="text-sm">Pokušajte drugu pretragu ili kreirajte novi nalog</p>
      </div>
    );
  }

  const handlers = {
    onTicketClick,
    onUpdateStatus,
    onAddNotes,
    onGenerateInvoice,
    onPrintTicket,
    onEditTicket,
    onPrintDeliveryNote,
    onDeleteClick,
  };

  const dayGroups = groupTicketsByDay(tickets);
  let cardIndex = 0;
  let lastMonthKey = null;

  return (
    <div className="space-y-3 md:space-y-8">
      {dayGroups.map((day) => {
        const showMonthDivider = day.monthKey !== lastMonthKey;
        lastMonthKey = day.monthKey;
        const ticketCountLabel = day.tickets.length === 1 ? '1 nalog' : `${day.tickets.length} naloga`;
        const dayStartIndex = cardIndex;
        cardIndex += day.tickets.length;

        return (
          <React.Fragment key={day.dayKey}>
            {showMonthDivider && (
              <div className="flex items-center gap-3 pt-4 first:pt-0">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400/80 capitalize">
                  {formatMonthLabel(day.monthKey)}
                </span>
                <div className="flex-1 h-px bg-slate-700/60" />
              </div>
            )}

            {/* Mobil: kompaktne kartice jedna ispod druge */}
            <div className="md:hidden bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-900/60 border-b border-slate-700/50">
                <span className="text-2xl font-bold text-white leading-none tabular-nums">
                  {day.dayNumber}
                </span>
                <div className="min-w-0">
                  <span className="text-xs text-slate-400 capitalize block leading-tight">
                    {day.monthShort}
                  </span>
                  <span className={`text-[10px] font-semibold ${weekdayBadgeClass(day.weekdayLabel)}`}>
                    {day.weekdayLabel}
                  </span>
                </div>
                <span className="ml-auto text-xs text-slate-500 font-medium shrink-0">
                  {ticketCountLabel}
                </span>
              </div>

              <div className="flex flex-col gap-3 p-3">
                <AnimatePresence mode="popLayout">
                  {day.tickets.map((ticket, i) =>
                    renderTicketCard(ticket, dayStartIndex + i, handlers, clientTicketCounts, true),
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop: široka mreža punih kartica */}
            <div className="hidden md:block">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-white leading-none tabular-nums">
                  {day.dayNumber}
                </span>
                <div>
                  <span className="text-sm text-slate-400 capitalize">{day.monthShort}</span>
                  <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded ${weekdayBadgeClass(day.weekdayLabel)}`}>
                    {day.weekdayLabel}
                  </span>
                </div>
                <span className="text-sm text-slate-500">{ticketCountLabel}</span>
                <div className="flex-1 h-px bg-slate-700/60" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {day.tickets.map((ticket, i) =>
                    renderTicketCard(ticket, dayStartIndex + i, handlers, clientTicketCounts, false),
                  )}
                </AnimatePresence>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default TicketList;
