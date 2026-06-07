import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import TicketCard from '@/components/TicketCard';

const TicketList = ({ 
  tickets, 
  onTicketClick,
  onUpdateStatus, 
  onAddNotes, 
  onGenerateInvoice, 
  onPrintTicket,
  onPrintDeliveryNote,
  onDeleteClick
}) => {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed">
        <div className="bg-slate-800 p-4 rounded-full mb-4">
          <Clock className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-lg font-medium">Nema pronađenih naloga</p>
        <p className="text-sm">Kreirajte novi nalog za početak</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {tickets.map((ticket, index) => (
          <TicketCard 
            key={ticket.id} 
            index={index}
            ticket={ticket} 
            onClick={onTicketClick}
            onUpdateStatus={onUpdateStatus}
            onAddNotes={onAddNotes}
            onGenerateInvoice={onGenerateInvoice}
            onPrintTicket={onPrintTicket}
            onPrintDeliveryNote={onPrintDeliveryNote}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TicketList;