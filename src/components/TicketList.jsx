import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import TicketCard from '@/components/TicketCard';
import { groupTicketsByDay, formatMonthLabel } from '@/lib/ticketUtils';

const weekdayBadgeClass = (label) => {
  if (label === 'Danas') return 'bg-blue-600/30 text-blue-300';
  if (label === 'Juče') return 'bg-slate-600/40 text-slate-300';
  return 'text-slate-500';
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

  const dayGroups = groupTicketsByDay(tickets);
  let cardIndex = 0;
  let lastMonthKey = null;

  return (
    <div className="space-y-3">
      {dayGroups.map((day) => {
        const showMonthDivider = day.monthKey !== lastMonthKey;
        lastMonthKey = day.monthKey;
        const ticketCountLabel = day.tickets.length === 1 ? '1 nalog' : `${day.tickets.length} naloga`;

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

            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
              {/* Mobil: datum kao horizontalna traka */}
              <div className="sm:hidden flex items-center gap-2.5 px-3 py-2.5 bg-slate-900/60 border-b border-slate-700/50">
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

              <div className="flex items-stretch">
                {/* Desktop: fiksna lijeva kolona sa datumom */}
                <div className="hidden sm:flex w-[88px] shrink-0 flex-col items-center justify-center py-4 px-2 bg-slate-900/60 border-r border-slate-700/50">
                  <span className="text-3xl font-bold text-white leading-none tabular-nums">
                    {day.dayNumber}
                  </span>
                  <span className="text-xs text-slate-400 capitalize mt-1 text-center leading-tight">
                    {day.monthShort}
                  </span>
                  <span className={`text-[10px] font-semibold mt-1.5 px-1.5 py-0.5 rounded ${weekdayBadgeClass(day.weekdayLabel)}`}>
                    {day.weekdayLabel}
                  </span>
                  <span className="text-[10px] text-slate-600 mt-2 font-medium">
                    {day.tickets.length}
                  </span>
                </div>

                {/* Kartice — vertikalno na mobitelu, horizontalni scroll na desktopu */}
                <div className="flex-1 min-w-0 sm:overflow-x-auto py-3 px-3 sm:pr-3 ticket-row-scroll">
                  {day.tickets.length > 1 && (
                    <p className="hidden sm:flex text-[10px] text-slate-500 mb-2 px-1 items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      {day.tickets.length} naloga — prevucite udesno
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-stretch sm:pb-1">
                    <AnimatePresence mode="popLayout">
                      {day.tickets.map((ticket) => {
                        const countKey = ticket.clientId || ticket.customerPhone;
                        const previousTicketCount = clientTicketCounts[countKey] || 0;
                        const currentIndex = cardIndex++;
                        return (
                          <TicketCard
                            key={ticket.id}
                            index={Math.min(currentIndex, 12)}
                            ticket={ticket}
                            compact
                            onClick={onTicketClick}
                            onUpdateStatus={onUpdateStatus}
                            onAddNotes={onAddNotes}
                            onGenerateInvoice={onGenerateInvoice}
                            onPrintTicket={onPrintTicket}
                            onEditTicket={onEditTicket}
                            onPrintDeliveryNote={onPrintDeliveryNote}
                            onDeleteClick={onDeleteClick}
                            previousTicketCount={previousTicketCount}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>

                {day.tickets.length > 1 && (
                  <div className="hidden sm:flex items-center pr-2 text-slate-500 shrink-0">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <style>{`
        .ticket-row-scroll {
          scrollbar-width: thin;
          scrollbar-color: #475569 transparent;
        }
        .ticket-row-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .ticket-row-scroll::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        .ticket-row-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
        }
      `}</style>
    </div>
  );
};

export default TicketList;
