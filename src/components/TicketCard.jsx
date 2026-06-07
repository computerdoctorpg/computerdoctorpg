import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, Mail, Laptop, Hash, Calendar, 
  Printer, Download, ChevronDown, Trash2, Phone, CalendarCheck, Battery, RotateCcw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { updateTicket } from '@/lib/db';

const TicketCard = ({ 
  ticket, 
  index, 
  onClick,
  onGenerateInvoice, 
  onPrintTicket,
  onDeleteClick
}) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [isReopening, setIsReopening] = useState(false);

  const statusColors = {
    'pending': 'bg-yellow-500',
    'open': 'bg-yellow-500',
    'in-progress': 'bg-purple-500',
    'completed': 'bg-green-500'
  };

  const statusTranslations = {
    'pending': 'NA ČEKANJU',
    'open': 'OTVORENO',
    'in-progress': 'U RADU',
    'completed': 'ZAVRŠENO'
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViberClick = (e) => {
    e.stopPropagation();
    
    let cleanPhone = ticket.customerPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    if (!cleanPhone.startsWith('382')) cleanPhone = '382' + cleanPhone;

    const message = "Pozdrav. Vaš uređaj je završen. Radimo od 9 do 17, subotom od 10 do 13.";
    const encodedMessage = encodeURIComponent(message);
    
    const viberUrl = `viber://chat?number=%2B${cleanPhone}&draft=${encodedMessage}`;
    
    window.open(viberUrl, '_self');
    
    toast({
      title: "Otvaranje Vibera",
      description: "Preusmeravanje na Viber aplikaciju...",
      duration: 3000,
    });
  };

  const handleEmailClick = (e) => {
    e.stopPropagation();
    toast({
      title: "Slanje Emaila",
      description: "Generisanje obaveštenja za centralu...",
    });
    setTimeout(() => {
      toast({
        title: "Email Poslat",
        description: "Info o nalogu poslat na prodaja@computer-doctor.me",
        className: "bg-green-600 text-white border-none"
      });
    }, 1500);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (isAdmin && onDeleteClick) {
      onDeleteClick(ticket);
    } else {
      toast({
        variant: "destructive",
        title: "Pristup odbijen",
        description: "Samo administratori mogu obrisati naloge."
      });
    }
  };

  const handleReopen = async (e) => {
    e.stopPropagation();
    if (!isAdmin) return;

    setIsReopening(true);
    try {
      const historyEntry = {
        date: new Date().toISOString(),
        action: 'Status promenjen u OTVORENO',
        description: 'Admin ponovo otvorio nalog'
      };
      
      const newHistory = [...(ticket.history || []), historyEntry];
      
      await updateTicket(ticket.id, { 
        status: 'open',
        history: newHistory 
      });
      
      toast({ 
        title: "Nalog Otvoren", 
        description: `Nalog #${ticket.id} je uspešno ponovo otvoren.`,
        className: "bg-yellow-600 text-white border-none" 
      });
      
      // Dispatch custom event to trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('ticket-updated'));
    } catch (error) {
      console.error("Error reopening ticket:", error);
      toast({ 
        variant: "destructive", 
        title: "Greška", 
        description: "Neuspešno otvaranje naloga. Pokušajte ponovo." 
      });
    } finally {
      setIsReopening(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onClick(ticket)}
      className='group bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 hover:shadow-xl transition-all cursor-pointer relative flex flex-col'
    >
      <div className='p-6 flex-grow'>
        <div className='flex justify-between items-start mb-4'>
           <div>
             <h3 className='text-xl font-bold text-white mb-1'>
               {ticket.customerName} <br/> {ticket.customerSurname}
             </h3>
             <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${statusColors[ticket.status] || 'bg-slate-500'}`}>
               {statusTranslations[ticket.status] || ticket.status}
             </div>
           </div>

           {/* Quick Actions on Card Top Right */}
           <div className='flex gap-1 items-center'>
              {/* Admin Reopen Button for Closed Tickets */}
              {isAdmin && ticket.status === 'completed' && (
                <Button
                  onClick={handleReopen}
                  size="icon"
                  variant="outline"
                  disabled={isReopening}
                  className='h-8 w-8 border-yellow-500/50 text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300 ml-1'
                  title="Ponovo Otvori Nalog"
                >
                  {isReopening ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className='w-4 h-4' />}
                </Button>
              )}

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrintTicket(ticket);
                }}
                variant="ghost"
                size="icon"
                className='h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700'
                title="Štampaj Prijemni List"
              >
                <Printer className='w-4 h-4' />
              </Button>

              <Button
                onClick={handleEmailClick}
                variant="ghost"
                size="icon"
                className='h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700'
                title="Pošalji Email"
              >
                <Mail className='w-4 h-4' />
              </Button>

              <Button
                onClick={handleViberClick}
                size="icon"
                className='h-8 w-8 bg-[#7360f2] hover:bg-[#5e4ad1] text-white shadow-md'
                title="Pošalji Viber"
              >
                <Smartphone className='w-4 h-4' />
              </Button>
              
              {ticket.status === 'completed' && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateInvoice(ticket);
                  }}
                  size="icon"
                  className='h-8 w-8 bg-green-600 hover:bg-green-700 text-white'
                  title="Račun / Otpremnica"
                >
                  <Download className='w-4 h-4' />
                </Button>
              )}

              {/* Hide Delete Button for Non-Admins entirely */}
              {isAdmin && (
                <Button
                  onClick={handleDelete}
                  size="icon"
                  variant="ghost"
                  className='h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/30 ml-1'
                  title="Obriši Nalog"
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              )}
           </div>
        </div>

        <div className='space-y-3 text-sm text-slate-300 mb-2'>
          {/* Device Info Section */}
          <div className="space-y-1">
            <div className='flex items-center gap-2.5'>
              <Laptop className='w-4 h-4 text-blue-400 shrink-0' />
              <span className='truncate font-medium text-white'>{ticket.deviceName}</span>
            </div>
            <div className='flex items-center gap-2.5'>
              <Hash className='w-4 h-4 text-blue-400 shrink-0' />
              <span className='font-mono text-xs'>{ticket.deviceSerial}</span>
            </div>
            {ticket.batterySerial && (
              <div className='flex items-center gap-2.5'>
                <Battery className='w-4 h-4 text-green-400 shrink-0' />
                <span className='font-mono text-xs'>Serijski broj baterije: {ticket.batterySerial}</span>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-700/50 my-2" />

          {/* Contact Info Section */}
          <div className="space-y-1">
            <div className='flex items-center gap-2.5'>
              <Phone className='w-4 h-4 text-blue-400 shrink-0' />
              <span className='truncate'>{ticket.customerPhone}</span>
            </div>
            {ticket.customerEmail && (
              <div className='flex items-center gap-2.5'>
                <Mail className='w-4 h-4 text-blue-400 shrink-0' />
                <span className='truncate text-xs'>{ticket.customerEmail}</span>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-700/50 my-2" />

          {/* Dates Section */}
          <div className="grid grid-cols-1 gap-2">
            <div className='flex flex-col gap-1'>
               <span className='text-[10px] text-slate-500 uppercase font-semibold tracking-wider'>Primljeno</span>
               <div className='flex items-center gap-1.5 text-xs'>
                 <Calendar className='w-3.5 h-3.5 text-blue-400 shrink-0' />
                 <span>{formatDate(ticket.createdAt)}</span>
               </div>
            </div>
            
            {ticket.completedAt && (
              <div className='flex flex-col gap-1'>
                 <span className='text-[10px] text-slate-500 uppercase font-semibold tracking-wider'>Završeno</span>
                 <div className='flex items-center gap-1.5 text-xs'>
                   <CalendarCheck className='w-3.5 h-3.5 text-green-400 shrink-0' />
                   <span>{formatDate(ticket.completedAt)}</span>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Expand Indicator (Visual only, whole card clicks) */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
           <ChevronDown className="w-5 h-5 text-slate-500" />
        </div>
      </div>
    </motion.div>
  );
};

export default TicketCard;