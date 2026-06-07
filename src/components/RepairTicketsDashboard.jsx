import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, LayoutGrid, BarChart3, RefreshCw, CalendarDays } from 'lucide-react';
import AddTicketDialog from '@/components/AddTicketDialog';
import TicketList from '@/components/TicketList';
import InvoiceDialog from '@/components/InvoiceDialog';
import TicketDetailsDialog from '@/components/TicketDetailsDialog';
import PrintableTicket from '@/components/PrintableTicket';
import PrintableDeliveryNote from '@/components/PrintableDeliveryNote';
import FinanceDashboard from '@/components/FinanceDashboard';
import TicketSuccessDialog from '@/components/TicketSuccessDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { upsertClient, createTicket, updateTicket, fetchAllTickets, deleteTicket } from '@/lib/db';
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

const RepairTicketsDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [printableTicket, setPrintableTicket] = useState(null);
  const [printableDeliveryNote, setPrintableDeliveryNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  
  const { toast } = useToast();
  // Ensure user and isAdmin are extracted safely with defaults
  const { isAdmin, user } = useAuth() || { isAdmin: false, user: null };

  const statusTranslations = {
    'pending': 'Na Čekanju',
    'open': 'Otvoreno',
    'in-progress': 'U Radu',
    'completed': 'Završeno'
  };

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTickets = await fetchAllTickets();
      if (fetchedTickets) {
        setTickets(fetchedTickets);
      }
      setRetryCount(0);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Neuspešno učitavanje podataka sa servera.",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRetryCount(prev => prev + 1)}
          >
            Pokušaj Ponovo
          </Button>
        )
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets, retryCount]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadTickets();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTickets]);

  // Handle custom ticket update events (e.g. from direct actions inside TicketCard)
  useEffect(() => {
    const handleTicketUpdated = () => {
      loadTickets();
    };
    window.addEventListener('ticket-updated', handleTicketUpdated);
    return () => window.removeEventListener('ticket-updated', handleTicketUpdated);
  }, [loadTickets]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    tickets.forEach(ticket => {
      if (ticket.createdAt) {
        const date = new Date(ticket.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(key);
      }
    });
    return Array.from(months).sort().reverse();
  }, [tickets]);

  const formatMonthDisplay = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    if (printableTicket || printableDeliveryNote) {
      const timer = setTimeout(() => {
        window.print();
        setTimeout(() => {
          setPrintableTicket(null);
          setPrintableDeliveryNote(null);
        }, 500);
      }, 800); 
      return () => clearTimeout(timer);
    }
  }, [printableTicket, printableDeliveryNote]);

  const addTicket = async (ticketData) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Pristup odbijen",
        description: "Morate biti prijavljeni da biste kreirali nalog."
      });
      throw new Error("User not authenticated");
    }

    console.log("addTicket flow started in Dashboard:", ticketData);
    try {
      console.log("Upserting client...");
      const client = await upsertClient({
        first_name: ticketData.customerName,
        last_name: ticketData.customerSurname,
        email: ticketData.customerEmail,
        phone: ticketData.customerPhone
      });

      const history = [{
        date: new Date().toISOString(),
        action: 'Nalog kreiran',
        description: `Servisni nalog registrovan (Operater: ${user.email})`
      }];
      
      const fullTicketData = {
        ...ticketData,
        createdAt: new Date().toISOString(),
        history
      };

      console.log("Creating ticket in database...");
      const newTicket = await createTicket(fullTicketData, client.id);
      
      console.log("Ticket created successfully:", newTicket.ticket_number);
      await loadTickets();
      
      const ticketForPrint = { 
        ...fullTicketData, 
        id: newTicket.ticket_number, 
        status: 'pending' 
      };
      
      // Setup print target for later if they click print in success dialog
      setSelectedTicket(ticketForPrint);
      
      setIsAddDialogOpen(false);
      setIsSuccessDialogOpen(true);
      
      toast({
        title: "Uspešno",
        description: `Nalog ${newTicket.ticket_number} sačuvan u cloud bazi.`,
        className: "bg-green-600 text-white border-none"
      });
    } catch (error) {
      console.error("Error in addTicket flow:", error);
      toast({
        variant: "destructive",
        title: "Greška pri kreiranju naloga",
        description: error.message || "Proverite konekciju ili kontaktirajte administratora."
      });
      // Rethrow to let the dialog know it failed, so it stops spinner
      throw error; 
    }
  };

  const handlePrintFromSuccessDialog = () => {
    setIsSuccessDialogOpen(false);
    if (selectedTicket) {
      setPrintableDeliveryNote(null);
      // Create a fresh copy of ticket just in case to ensure re-render
      setPrintableTicket({ ...selectedTicket });
    }
  };

  const updateTicketStatus = async (ticketId, newStatus, updates = {}) => {
    if (!user) return;
    try {
      const statusText = statusTranslations[newStatus] || newStatus;
      const historyEntry = {
        date: new Date().toISOString(),
        action: `Status promenjen u ${statusText}`,
        description: updates.repairDetails || `Nalog označen kao ${statusText}`
      };

      const currentTicket = tickets.find(t => t.id === ticketId);
      const newHistory = [...(currentTicket?.history || []), historyEntry];
      
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : currentTicket.completedAt;

      const updatedTicket = await updateTicket(ticketId, {
        status: newStatus,
        ...updates,
        completedAt,
        history: newHistory
      });

      await loadTickets();
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        const refreshedTicket = tickets.find(t => t.id === ticketId);
        // Explicitly check if we are keeping dialog open or replacing
        if (refreshedTicket) setSelectedTicket(refreshedTicket);
      }

      toast({
        title: "Status Ažuriran",
        description: `Nalog označen kao ${statusText}.`
      });

      if (newStatus === 'completed' && updatedTicket) {
        const completedTicketData = tickets.find(t => t.id === ticketId);
        setPrintableTicket(null);
        setPrintableDeliveryNote({
          ...completedTicketData,
          ...updates,
          dispatchNoteNumber: updatedTicket.dispatch_note_number
        });
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Neuspešno ažuriranje naloga."
      });
    }
  };

  const addRepairNotes = async (ticketId, data) => {
    if (!user) return;
    try {
      const updates = typeof data === 'string' ? { repairDetails: data } : data;
      const currentTicket = tickets.find(t => t.id === ticketId);
      
      const historyEntry = {
        date: new Date().toISOString(),
        action: 'Detalji naloga ažurirani',
        description: 'Servisne beleške ili troškovi ažurirani'
      };
      const newHistory = [...(currentTicket?.history || []), historyEntry];

      await updateTicket(ticketId, {
        ...updates,
        history: newHistory
      });

      await loadTickets();
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        const refreshedTicket = tickets.find(t => t.id === ticketId);
        if (refreshedTicket) setSelectedTicket(refreshedTicket);
      }
      
      toast({
        title: "Sačuvano",
        description: "Podaci naloga su ažurirani u cloud bazi."
      });
    } catch (error) {
      console.error("Error adding repair notes:", error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Neuspešno čuvanje podataka."
      });
    }
  };

  const handleOpenTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setIsDetailsDialogOpen(true);
  };

  const openInvoiceDialog = ticket => {
    setSelectedTicket(ticket);
    setIsInvoiceDialogOpen(true);
  };

  const handlePrintTicket = ticket => {
    setPrintableDeliveryNote(null);
    // Explicitly copy to force fresh render in PrintableTicket
    setPrintableTicket({ ...ticket });
  };

  const handlePrintDeliveryNote = ticket => {
    setPrintableTicket(null);
    setPrintableDeliveryNote({ ...ticket });
  };

  const handleTicketDeleteClick = (ticket) => {
    if (!isAdmin) {
       toast({
         variant: "destructive",
         title: "Zabranjeno",
         description: "Samo administratori imaju dozvolu za brisanje."
       });
       return;
    }
    setTicketToDelete(ticket);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete || !isAdmin) return;

    try {
      await deleteTicket(ticketToDelete.id, isAdmin);
      await loadTickets();
      
      toast({
        title: "Nalog Obrisan",
        description: `Nalog #${ticketToDelete.id} je trajno uklonjen iz cloud baze.`,
        className: "bg-red-600 text-white border-none"
      });
      
      setIsDeleteDialogOpen(false);
      setTicketToDelete(null);
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast({
        variant: "destructive",
        title: "Greška",
        description: error.message || "Neuspešno brisanje naloga iz baze."
      });
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (!ticket) return false;
    
    const matchesSearch = 
      (ticket.customerName && ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (ticket.customerSurname && ticket.customerSurname.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (ticket.customerEmail && ticket.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (ticket.deviceName && ticket.deviceName.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (ticket.deviceSerial && ticket.deviceSerial.toLowerCase().includes(searchTerm.toLowerCase()));
      
    // Handle 'open' properly within filters if 'pending' is selected
    const filterToCheck = filterStatus === 'pending' ? ['pending', 'open'] : [filterStatus];
    const matchesFilter = filterStatus === 'all' || filterToCheck.includes(ticket.status);
    
    let matchesMonth = true;
    if (filterMonth !== 'all') {
       if (ticket.createdAt) {
          const date = new Date(ticket.createdAt);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          matchesMonth = key === filterMonth;
       } else {
          matchesMonth = false;
       }
    }

    return matchesSearch && matchesFilter && matchesMonth;
  });

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t?.status === 'pending' || t?.status === 'open').length,
    inProgress: tickets.filter(t => t?.status === 'in-progress').length,
    completed: tickets.filter(t => t?.status === 'completed').length
  };

  return (
    <>
      <style>{`
        @media print {
          .dashboard-container { display: none !important; }
          .printable-content { 
            display: flex !important; 
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 100vw; 
            min-height: 100vh;
            z-index: 9999;
            background: white !important;
            color: black !important;
            justify-content: flex-start;
            align-items: flex-start;
          }
        }
      `}</style>

      {printableTicket && (
        <div className="printable-content hidden">
          <PrintableTicket ticket={printableTicket} />
        </div>
      )}
      {printableDeliveryNote && (
        <div className="printable-content hidden">
          <PrintableDeliveryNote ticket={printableDeliveryNote} />
        </div>
      )}

      <div className='min-h-screen p-4 md:p-8 dashboard-container'>
        <div className='max-w-7xl mx-auto'>
          
          <Tabs defaultValue="tickets" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList className="bg-slate-800/80 border border-slate-700 p-1 h-auto">
                <TabsTrigger value="tickets" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <LayoutGrid className="w-4 h-4" />
                  Nalozi
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="finances" className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <BarChart3 className="w-4 h-4" />
                    Finansije
                  </TabsTrigger>
                )}
              </TabsList>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadTickets}
                className="text-slate-300 border-slate-600 hover:bg-slate-800"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Osveži Podatke
              </Button>
            </div>

            <TabsContent value="tickets" className="space-y-8 mt-0">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {[{ label: 'Ukupno Naloga', value: stats.total, color: 'from-blue-500 to-blue-600' }, 
                  { label: 'Na Čekanju', value: stats.pending, color: 'from-yellow-500 to-yellow-600' }, 
                  { label: 'U Radu', value: stats.inProgress, color: 'from-purple-500 to-purple-600' }, 
                  { label: 'Završeno', value: stats.completed, color: 'from-green-500 to-green-600' }
                ].map((stat, index) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }} className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}>
                    <p className='text-white/80 text-sm mb-1'>{stat.label}</p>
                    <p className='text-3xl font-bold text-white'>{stat.value}</p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className='bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700'>
                <div className='flex flex-col md:flex-row gap-4'>
                  <div className='flex-1 relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
                    <input type='text' placeholder='Pretraga po imenu, emailu, uređaju...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all' />
                  </div>

                  <div className='relative'>
                    <CalendarDays className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                    <select 
                      value={filterMonth} 
                      onChange={e => setFilterMonth(e.target.value)} 
                      className='pl-10 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[180px]'
                    >
                      <option value='all'>Svi Meseci</option>
                      {availableMonths.map(month => (
                        <option key={month} value={month}>
                          {formatMonthDisplay(month)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='relative'>
                    <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className='pl-10 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[160px]'>
                      <option value='all'>Svi Statusi</option>
                      <option value='pending'>Na Čekanju / Otvoreno</option>
                      <option value='in-progress'>U Radu</option>
                      <option value='completed'>Završeno</option>
                    </select>
                  </div>

                  <Button onClick={() => setIsAddDialogOpen(true)} className='bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2'>
                    <Plus className='w-5 h-5' />
                    Novi Nalog
                  </Button>
                </div>
              </motion.div>

              <TicketList 
                tickets={filteredTickets} 
                onTicketClick={handleOpenTicketDetails}
                onUpdateStatus={updateTicketStatus} 
                onAddNotes={addRepairNotes} 
                onGenerateInvoice={openInvoiceDialog} 
                onPrintTicket={handlePrintTicket}
                onPrintDeliveryNote={handlePrintDeliveryNote}
                onDeleteClick={handleTicketDeleteClick}
              />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="finances" className="mt-0">
                <FinanceDashboard tickets={tickets} />
              </TabsContent>
            )}
          </Tabs>

          <AddTicketDialog 
            isOpen={isAddDialogOpen} 
            onClose={() => setIsAddDialogOpen(false)} 
            onSubmit={addTicket} 
          />
          
          <TicketSuccessDialog
            isOpen={isSuccessDialogOpen}
            onClose={() => setIsSuccessDialogOpen(false)}
            onPrint={handlePrintFromSuccessDialog}
          />
          
          <TicketDetailsDialog 
            isOpen={isDetailsDialogOpen} 
            onClose={() => setIsDetailsDialogOpen(false)} 
            ticket={selectedTicket}
            onUpdateStatus={updateTicketStatus}
            onAddNotes={addRepairNotes}
            onPrintTicket={handlePrintTicket}
            onPrintDeliveryNote={handlePrintDeliveryNote}
            onDeleteClick={handleTicketDeleteClick}
          />

          <InvoiceDialog isOpen={isInvoiceDialogOpen} onClose={() => setIsInvoiceDialogOpen(false)} ticket={selectedTicket} />

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-400">Potvrda Brisanja</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-300">
                  Da li ste sigurni da želite da obrišete nalog <span className="font-bold text-white">#{ticketToDelete?.id}</span> za klijenta <span className="font-bold text-white">{ticketToDelete?.customerName}</span>?
                  <br/><br/>
                  <span className="text-red-400/80 text-xs">Ova radnja je nepovratna i trajno će ukloniti sve podatke o nalogu iz cloud baze.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">Otkaži</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteTicket} className="bg-red-600 hover:bg-red-700 text-white">
                  Obriši Trajno
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </>
  );
};

export default RepairTicketsDashboard;