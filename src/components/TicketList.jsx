import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import TicketCard from '@/components/TicketCard';
import { groupTicketsByDay, formatMonthLabel } from '@/lib/ticketUtils';

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

            <div className="flex gap-3 items-stretch bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
              {/* Day label — fiksna lijeva kolona */}
              <div className="w-[72px] sm:w-[88px] shrink-0 flex flex-col items-center justify-center py-4 px-2 bg-slate-900/60 border-r border-slate-700/50">
                <span className="text-2xl sm:text-3xl font-bold text-white leading-none">
                  {day.dayNumber}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 capitalize mt-1 text-center leading-tight">
                  {day.monthShort}
                </span>
                <span className={`text-[10px] font-semibold mt-1.5 px-1.5 py-0.5 rounded ${
                  day.weekdayLabel === 'Danas'
                    ? 'bg-blue-600/30 text-blue-300'
                    : day.weekdayLabel === 'Juče'
                      ? 'bg-slate-600/40 text-slate-300'
                      : 'text-slate-500'
                }`}>
                  {day.weekdayLabel}
                </span>
                <span className="text-[10px] text-slate-600 mt-2 font-medium">
                  {day.tickets.length}
                </span>
              </div>

              {/* Kartice u istom redu — horizontalni scroll */}
              <div className="flex-1 min-w-0 overflow-x-auto py-3 pr-3 ticket-row-scroll">
                {day.tickets.length > 1 && (
                  <p className="text-[10px] text-slate-500 mb-2 px-1 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    {day.tickets.length} naloga — prevucite udesno
                  </p>
                )}
                <div className="flex gap-3 items-stretch pb-1">
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

              {/* Hint za scroll */}
              {day.tickets.length > 1 && (
                <div className="flex items-center pr-2 text-slate-500 shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              )}
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
