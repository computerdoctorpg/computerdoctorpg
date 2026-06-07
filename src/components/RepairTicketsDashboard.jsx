import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, LayoutGrid, BarChart3, RefreshCw, CalendarDays, Users, Laptop, Cpu, Shield, Film, Trash2 } from 'lucide-react';
import AddTicketDialog from '@/components/AddTicketDialog';
import AddVhsDialog, { VHS_PRICE_PER_CASSETTE } from '@/components/AddVhsDialog';
import TicketList from '@/components/TicketList';
import CustomerHistoryPanel from '@/components/CustomerHistoryPanel';
import InvoiceDialog from '@/components/InvoiceDialog';
import EditPrijemniListDialog from '@/components/EditPrijemniListDialog';
import EditVhsReceiptDialog from '@/components/EditVhsReceiptDialog';
import TicketDetailsDialog from '@/components/TicketDetailsDialog';
import PrintableTicket from '@/components/PrintableTicket';
import PrintableVhsTicket from '@/components/PrintableVhsTicket';
import PrintableDeliveryNote from '@/components/PrintableDeliveryNote';
import FinanceDashboard from '@/components/FinanceDashboard';
import WarrantyTabContent from '@/components/WarrantyTabContent';
import VhsTabContent from '@/components/VhsTabContent';
import RecycleBinTabContent from '@/components/RecycleBinTabContent';
import NewTicketMenu from '@/components/NewTicketMenu';
import TicketSuccessDialog from '@/components/TicketSuccessDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { canEditDocuments } from '@/lib/permissions';
import { upsertClient, createTicket, updateTicket, fetchAllTickets, fetchDeletedTickets, deleteTicket, restoreTicket, permanentlyDeleteTicket, getRecycleBinMode, isSoftDeleteDbSupported, probeSoftDeleteSupport } from '@/lib/db';
import { runPrintAndEmailJob, printHtmlDocument } from '@/lib/printAndEmailDocument';
import { ticketMatchesSearch, ticketMatchesBrandModel, getClientTicketCounts, getMonthKey, getDayKey, formatDayKeyDisplay, getUniqueBrands } from '@/lib/ticketUtils';
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
  const [addTicketIsWarranty, setAddTicketIsWarranty] = useState(false);
  const [isAddVhsDialogOpen, setIsAddVhsDialogOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [ticketToPermanentDelete, setTicketToPermanentDelete] = useState(null);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const [deletedTickets, setDeletedTickets] = useState([]);
  const [isDeletedLoading, setIsDeletedLoading] = useState(false);
  const [recycleBinMode, setRecycleBinMode] = useState('local');

  const [printableTicket, setPrintableTicket] = useState(null);
  const [printableVhsTicket, setPrintableVhsTicket] = useState(null);
  const [printableDeliveryNote, setPrintableDeliveryNote] = useState(null);
  const skipPrintEffectRef = useRef(false);
  const toastRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterDay, setFilterDay] = useState('all');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterModel, setFilterModel] = useState('');

  const [isPrijemniEditOpen, setIsPrijemniEditOpen] = useState(false);
  const [prijemniEditTicket, setPrijemniEditTicket] = useState(null);
  const [isNewPrijemniTicket, setIsNewPrijemniTicket] = useState(false);
  const [prijemniStartPreview, setPrijemniStartPreview] = useState(false);
  const [isVhsEditOpen, setIsVhsEditOpen] = useState(false);
  const [vhsEditTicket, setVhsEditTicket] = useState(null);
  const [isNewVhsTicket, setIsNewVhsTicket] = useState(false);
  const [activeTab, setActiveTab] = useState('tickets');
  
  const { toast } = useToast();
  toastRef.current = toast;
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
      return fetchedTickets || [];
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
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets, retryCount]);

  const loadDeletedTickets = useCallback(async () => {
    if (!isAdmin) return [];
    setIsDeletedLoading(true);
    try {
      const fetched = await fetchDeletedTickets();
      setDeletedTickets(fetched || []);
      await probeSoftDeleteSupport();
      const mode = await getRecycleBinMode(isSoftDeleteDbSupported());
      setRecycleBinMode(mode);
      return fetched || [];
    } catch (error) {
      console.error('Error loading deleted tickets:', error);
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: 'Neuspešno učitavanje korpe za otpatke.',
      });
      return [];
    } finally {
      setIsDeletedLoading(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    if (isAdmin) {
      loadDeletedTickets();
    }
  }, [isAdmin, loadDeletedTickets]);

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

  const regularTickets = useMemo(() => tickets.filter((t) => t.isWarranty !== true && t.isVhs !== true), [tickets]);
  const warrantyTickets = useMemo(() => tickets.filter((t) => t.isWarranty === true), [tickets]);
  const vhsTickets = useMemo(() => tickets.filter((t) => t.isVhs === true), [tickets]);

  const availableMonths = useMemo(() => {
    const months = new Set();
    regularTickets.forEach(ticket => {
      if (ticket.createdAt) {
        const date = new Date(ticket.createdAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(key);
      }
    });
    return Array.from(months).sort().reverse();
  }, [regularTickets]);

  const availableDays = useMemo(() => {
    const days = new Set();
    regularTickets.forEach((ticket) => {
      if (!ticket.createdAt) return;
      if (filterMonth !== 'all' && getMonthKey(ticket.createdAt) !== filterMonth) return;
      days.add(getDayKey(ticket.createdAt));
    });
    return Array.from(days).sort().reverse();
  }, [regularTickets, filterMonth]);

  useEffect(() => {
    setFilterDay('all');
  }, [filterMonth]);

  const handleMonthChange = (value) => {
    setFilterMonth(value);
  };

  const formatMonthDisplay = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('sr-RS', { month: 'long', year: 'numeric' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterMonth('all');
    setFilterDay('all');
    setFilterBrand('');
    setFilterModel('');
  };

  useEffect(() => {
    if (!printableVhsTicket) return;
    if (skipPrintEffectRef.current) return;

    const timer = setTimeout(() => {
      window.print();
      setTimeout(() => {
        setPrintableVhsTicket(null);
      }, 500);
    }, 800);

    return () => clearTimeout(timer);
  }, [printableVhsTicket]);

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
        phone: ticketData.customerPhone,
        is_warranty_client: addTicketIsWarranty ? true : undefined,
      });

      const history = [{
        date: new Date().toISOString(),
        action: addTicketIsWarranty ? 'Garantni nalog kreiran' : 'Nalog kreiran',
        description: addTicketIsWarranty
          ? `Garantni servisni nalog registrovan (Operater: ${user.email})`
          : `Servisni nalog registrovan (Operater: ${user.email})`
      }];
      
      const fullTicketData = {
        ...ticketData,
        isWarranty: addTicketIsWarranty,
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
        clientId: client.id,
        status: 'pending',
        isWarranty: addTicketIsWarranty,
      };
      
      setSelectedTicket(ticketForPrint);
      setIsAddDialogOpen(false);
      setAddTicketIsWarranty(false);
      setIsSuccessDialogOpen(false);
      setPrijemniEditTicket(ticketForPrint);
      setIsNewPrijemniTicket(true);
      setIsPrijemniEditOpen(true);
      
      toast({
        title: "Uspešno",
        description: `Nalog ${newTicket.ticket_number} kreiran. Uredite prijemni list prije štampe.`,
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

  const addVhsTicket = async (formData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Pristup odbijen', description: 'Morate biti prijavljeni.' });
      throw new Error('User not authenticated');
    }

    try {
      const count = formData.vhsCassetteCount || 1;
      const total = count * VHS_PRICE_PER_CASSETTE;

      const client = await upsertClient({
        first_name: formData.customerName,
        last_name: formData.customerSurname,
        phone: formData.customerPhone,
      });

      const history = [{
        date: new Date().toISOString(),
        action: 'VHS prijem kreiran',
        description: `Prijem ${count} VHS kaseta (Operater: ${user.email})`,
      }];

      const fullTicketData = {
        customerName: formData.customerName,
        customerSurname: formData.customerSurname,
        customerPhone: formData.customerPhone,
        deviceName: `VHS digitalizacija (${count} kaseta)`,
        deviceSerial: '-',
        issueDescription: 'Digitalizacija VHS kaseta u MP4 format na USB',
        notes: formData.notes || '',
        isVhs: true,
        vhsCassetteCount: count,
        vhsCassetteCondition: formData.vhsCassetteCondition,
        vhsPricePerCassette: VHS_PRICE_PER_CASSETTE,
        estimatedCost: total,
        serviceCost: total,
        createdAt: new Date().toISOString(),
        history,
      };

      const newTicket = await createTicket(fullTicketData, client.id);
      await loadTickets();

      const ticketForPrint = {
        ...fullTicketData,
        id: newTicket.ticket_number,
        clientId: client.id,
        status: 'pending',
      };

      setIsAddVhsDialogOpen(false);
      setVhsEditTicket(ticketForPrint);
      setIsNewVhsTicket(true);
      setIsVhsEditOpen(true);

      toast({
        title: 'Uspešno',
        description: `VHS prijem ${newTicket.ticket_number} kreiran. Uredite prijemnici prije štampe.`,
        className: 'bg-amber-600 text-white border-none',
      });
    } catch (error) {
      console.error('Error in addVhsTicket:', error);
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: error.message || 'Neuspešno kreiranje VHS prijema.',
      });
      throw error;
    }
  };

  const handlePrintFromSuccessDialog = () => {
    setIsSuccessDialogOpen(false);
    if (selectedTicket) {
      if (selectedTicket.isVhs) {
        setVhsEditTicket({ ...selectedTicket });
        setIsNewVhsTicket(false);
        setIsVhsEditOpen(true);
        return;
      }
      setPrijemniEditTicket({ ...selectedTicket });
      setIsNewPrijemniTicket(false);
      setPrijemniStartPreview(true);
      setIsPrijemniEditOpen(true);
    }
  };

  const updateTicketStatus = async (ticketId, newStatus, updates = {}) => {
    if (!user) return;
    try {
      const statusText = statusTranslations[newStatus] || newStatus;
      const currentTicket = tickets.find(t => t.id === ticketId);

      let historyEntry;
      if (newStatus === 'in-progress') {
        historyEntry = {
          date: new Date().toISOString(),
          action: 'Pristupio na popravku',
          description: updates.repairDetails?.trim() || 'Popravka započeta',
        };
      } else {
        historyEntry = {
          date: new Date().toISOString(),
          action: `Status promenjen u ${statusText}`,
          description: updates.repairDetails?.trim() || `Nalog označen kao ${statusText}`,
        };
      }

      const newHistory = [...(currentTicket?.history || []), historyEntry];
      
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : currentTicket?.completedAt;

      const updatedTicket = await updateTicket(ticketId, {
        status: newStatus,
        ...updates,
        completedAt,
        history: newHistory
      });

      const freshTickets = await loadTickets();
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        const refreshedTicket = freshTickets?.find(t => t.id === ticketId);
        if (refreshedTicket) {
          setSelectedTicket({
            ...refreshedTicket,
            ...updates,
            status: newStatus,
            history: newHistory,
          });
        }
      }

      toast({
        title: newStatus === 'in-progress' ? 'Popravka započeta' : 'Status Ažuriran',
        description: newStatus === 'in-progress'
          ? 'Status: U radu. Uneseni tekst je sačuvan.'
          : `Nalog označen kao ${statusText}.`,
      });

      if (newStatus === 'completed' && updatedTicket) {
        const completedTicketData = tickets.find(t => t.id === ticketId);
        const ticketForDoc = {
          ...completedTicketData,
          ...updates,
          dispatchNoteNumber: updatedTicket.dispatch_note_number,
        };
        printHtmlDocument(() => {
          setPrintableTicket(null);
          setPrintableVhsTicket(null);
          setPrintableDeliveryNote(ticketForDoc);
        })
          .then(() => setTimeout(() => setPrintableDeliveryNote(null), 500))
          .catch((err) => console.error('Auto print delivery note failed:', err));
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

      const freshTickets = await loadTickets();
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        const refreshedTicket = freshTickets?.find(t => t.id === ticketId);
        if (refreshedTicket) {
          setSelectedTicket({
            ...refreshedTicket,
            ...(typeof updates === 'object' ? updates : {}),
          });
        }
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
      throw error;
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

  const savePrijemniListChanges = async (editedTicket) => {
    if (!user || !editedTicket?.id) {
      throw new Error('Nalog nije validan za čuvanje.');
    }

    const currentTicket = tickets.find((t) => t.id === editedTicket.id) || editedTicket;
    const historyEntry = {
      date: new Date().toISOString(),
      action: 'Podaci naloga ažurirani',
      description: 'Izmijenjeni podaci klijenta, uređaja ili prijemnog lista',
    };
    const newHistory = [...(currentTicket.history || []), historyEntry];

    const client = await upsertClient({
      first_name: editedTicket.customerName,
      last_name: editedTicket.customerSurname,
      phone: editedTicket.customerPhone,
      email: editedTicket.customerEmail || null,
      is_warranty_client: editedTicket.isWarranty ? true : undefined,
    });

    await updateTicket(editedTicket.id, {
      clientId: client.id,
      deviceName: editedTicket.deviceName,
      deviceSerial: editedTicket.deviceSerial,
      chargerSerial: editedTicket.chargerSerial || '',
      batterySerial: editedTicket.batterySerial || '',
      issueDescription: editedTicket.issueDescription,
      notes: editedTicket.notes ?? '',
      osPassword: editedTicket.osPassword || '',
      keepData: !!editedTicket.keepData,
      hasBag: !!editedTicket.hasBag,
      bagDescription: editedTicket.bagDescription || '',
      warrantyUntil: editedTicket.warrantyUntil || null,
      warrantyInvoice: editedTicket.warrantyInvoice || null,
      history: newHistory,
    });

    const freshTickets = await loadTickets();
    const saved = freshTickets?.find((t) => t.id === editedTicket.id);
    const merged = saved
      ? {
          ...saved,
          customerName: editedTicket.customerName,
          customerSurname: editedTicket.customerSurname,
          customerPhone: editedTicket.customerPhone,
          customerEmail: editedTicket.customerEmail || saved.customerEmail,
          clientId: client.id,
        }
      : { ...editedTicket, clientId: client.id, history: newHistory };

    setSelectedTicket((prev) => (prev?.id === editedTicket.id ? merged : prev));
    return merged;
  };

  const saveVhsChanges = async (editedTicket) => {
    if (!user || !editedTicket?.id) throw new Error('Nalog nije validan za čuvanje.');

    const currentTicket = tickets.find((t) => t.id === editedTicket.id) || editedTicket;
    const count = parseInt(editedTicket.vhsCassetteCount, 10) || 1;
    const total = count * VHS_PRICE_PER_CASSETTE;

    const historyEntry = {
      date: new Date().toISOString(),
      action: 'VHS prijem ažuriran',
      description: 'Izmijenjeni podaci klijenta ili kaseta',
    };
    const newHistory = [...(currentTicket.history || []), historyEntry];

    const client = await upsertClient({
      first_name: editedTicket.customerName,
      last_name: editedTicket.customerSurname,
      phone: editedTicket.customerPhone,
    });

    await updateTicket(editedTicket.id, {
      clientId: client.id,
      deviceName: `VHS digitalizacija (${count} kaseta)`,
      notes: editedTicket.notes ?? '',
      vhsCassetteCount: count,
      vhsCassetteCondition: editedTicket.vhsCassetteCondition || '',
      vhsPricePerCassette: VHS_PRICE_PER_CASSETTE,
      serviceCost: total,
      estimatedCost: total,
      history: newHistory,
    });

    const freshTickets = await loadTickets();
    const saved = freshTickets?.find((t) => t.id === editedTicket.id);
    const merged = saved
      ? {
          ...saved,
          customerName: editedTicket.customerName,
          customerSurname: editedTicket.customerSurname,
          customerPhone: editedTicket.customerPhone,
          clientId: client.id,
          vhsCassetteCount: count,
          vhsCassetteCondition: editedTicket.vhsCassetteCondition,
          notes: editedTicket.notes,
        }
      : { ...editedTicket, clientId: client.id, history: newHistory };

    setSelectedTicket((prev) => (prev?.id === editedTicket.id ? merged : prev));
    return merged;
  };

  const handleVhsSave = async (editedTicket) => {
    try {
      const saved = await saveVhsChanges(editedTicket);
      setVhsEditTicket(saved);
      setIsNewVhsTicket(false);
      toast({ title: 'Sačuvano', description: 'VHS prijem ažuriran.', className: 'bg-green-600 text-white border-none' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Greška', description: error.message || 'Neuspešno čuvanje.' });
      throw error;
    }
  };

  const handleVhsPrint = async (payload) => {
    const saveTicket = payload?.saveTicket ?? payload;
    const printTicket = payload?.printTicket ?? payload;
    try {
      const saved = await saveVhsChanges(saveTicket);
      setIsVhsEditOpen(false);
      setIsNewVhsTicket(false);
      setPrintableVhsTicket({ ...printTicket, id: saved.id, clientId: saved.clientId });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Greška', description: error.message || 'Neuspešno čuvanje prije štampe.' });
      throw error;
    }
  };

  const handlePrijemniSave = async (editedTicket) => {
    try {
      const saved = await savePrijemniListChanges(editedTicket);
      setPrijemniEditTicket(saved);
      setIsPrijemniEditOpen(false);
      setIsNewPrijemniTicket(false);
      toast({ title: 'Sačuvano', description: 'Podaci naloga su ažurirani u bazi.', className: 'bg-green-600 text-white border-none' });
    } catch (error) {
      console.error('Error saving prijemni list:', error);
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: error.message || 'Neuspešno čuvanje podataka.',
      });
      throw error;
    }
  };

  const handlePrijemniPrint = async (payload) => {
    const saveTicket = payload?.saveTicket ?? payload;
    const printTicket = payload?.printTicket ?? payload;

    try {
      const saved = await savePrijemniListChanges(saveTicket);
      setIsPrijemniEditOpen(false);
      setIsNewPrijemniTicket(false);

      const ticketForDoc = { ...printTicket, id: saved.id, clientId: saved.clientId };
      const emailJob = payload?.sendEmail && saveTicket.customerEmail?.trim()
        ? {
            type: 'intake',
            to: saveTicket.customerEmail.trim(),
            ticketId: saved.id,
            customerName: `${saveTicket.customerName || ''} ${saveTicket.customerSurname || ''}`.trim(),
            filename: `Prijemnica_${saved.id}.pdf`,
            ticket: ticketForDoc,
          }
        : null;

      await runPrintAndEmailJob({
        document: { type: 'intake', ticket: ticketForDoc },
        emailJob,
        renderForPrint: () => {
          setPrintableDeliveryNote(null);
          setPrintableVhsTicket(null);
          setPrintableTicket(ticketForDoc);
        },
        toastRef,
        successLabel: 'Prijemnica poslata na',
      });

      setTimeout(() => setPrintableTicket(null), 1500);
    } catch (error) {
      console.error('Error saving before print:', error);
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: error.message || 'Neuspešno čuvanje prije štampe.',
      });
      throw error;
    }
  };

  const handleEditTicket = (ticket) => {
    if (!canEditDocuments(isAdmin)) {
      toast({
        variant: 'destructive',
        title: 'Pristup odbijen',
        description: 'Operateri ne mogu uređivati prijemnice i dokumenta.',
      });
      return;
    }
    if (ticket.isVhs) {
      setVhsEditTicket({ ...ticket });
      setIsNewVhsTicket(false);
      setIsVhsEditOpen(true);
      return;
    }
    setPrijemniEditTicket({ ...ticket });
    setIsNewPrijemniTicket(false);
    setPrijemniStartPreview(false);
    setIsPrijemniEditOpen(true);
  };

  const handlePrintTicket = (ticket) => {
    if (!canEditDocuments(isAdmin)) {
      toast({
        variant: 'destructive',
        title: 'Pristup odbijen',
        description: 'Operateri ne mogu štampati ili uređivati prijemnice.',
      });
      return;
    }
    if (ticket.isVhs) {
      setVhsEditTicket({ ...ticket });
      setIsNewVhsTicket(false);
      setIsVhsEditOpen(true);
      return;
    }
    setPrijemniEditTicket({ ...ticket });
    setIsNewPrijemniTicket(false);
    setPrijemniStartPreview(true);
    setIsPrijemniEditOpen(true);
  };

  const handlePrintDeliveryNote = async (ticket, options = {}) => {
    const ticketForDoc = { ...ticket };
    const emailJob = options.sendEmail && ticket.customerEmail?.trim()
      ? {
          type: 'delivery',
          to: ticket.customerEmail.trim(),
          ticketId: ticket.dispatchNoteNumber || ticket.id,
          customerName: `${ticket.customerName || ''} ${ticket.customerSurname || ''}`.trim(),
          filename: `Otpremnica_${ticket.dispatchNoteNumber || ticket.id}.pdf`,
          ticket: ticketForDoc,
        }
      : null;

    await runPrintAndEmailJob({
      document: { type: 'delivery', ticket: ticketForDoc },
      emailJob,
      renderForPrint: () => {
        setPrintableTicket(null);
        setPrintableVhsTicket(null);
        setPrintableDeliveryNote(ticketForDoc);
      },
      toastRef,
      successLabel: 'Otpremnica poslata na',
    });

    setTimeout(() => setPrintableDeliveryNote(null), 1500);
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
      await deleteTicket(ticketToDelete.id, isAdmin, { ...ticketToDelete });
      await Promise.all([loadTickets(), loadDeletedTickets()]);
      
      toast({
        title: "Nalog premješten u korpu",
        description: `Nalog #${ticketToDelete.id} je u korpi. Možete ga vratiti iz taba Korpa.`,
        className: "bg-amber-600 text-white border-none"
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

  const handleRestoreTicket = async (ticket) => {
    if (!isAdmin) return;
    try {
      await restoreTicket(ticket.id, isAdmin, ticket);
      await Promise.all([loadTickets(), loadDeletedTickets()]);
      toast({
        title: 'Nalog vraćen',
        description: `Nalog #${ticket.id} je ponovo aktivan.`,
        className: 'bg-green-600 text-white border-none',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: error.message || 'Neuspešno vraćanje naloga.',
      });
    }
  };

  const handlePermanentDeleteClick = (ticket) => {
    setTicketToPermanentDelete(ticket);
    setIsPermanentDeleteDialogOpen(true);
  };

  const confirmPermanentDeleteTicket = async () => {
    if (!ticketToPermanentDelete || !isAdmin) return;
    try {
      await permanentlyDeleteTicket(ticketToPermanentDelete.id, isAdmin, ticketToPermanentDelete);
      await loadDeletedTickets();
      toast({
        title: 'Trajno obrisano',
        description: `Nalog #${ticketToPermanentDelete.id} je zauvijek uklonjen.`,
        className: 'bg-red-600 text-white border-none',
      });
      setIsPermanentDeleteDialogOpen(false);
      setTicketToPermanentDelete(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: error.message || 'Neuspešno trajno brisanje.',
      });
    }
  };

  const clientTicketCounts = useMemo(() => getClientTicketCounts(regularTickets), [regularTickets]);

  const availableBrands = useMemo(() => getUniqueBrands(regularTickets), [regularTickets]);

  const filteredTickets = useMemo(() => regularTickets.filter(ticket => {
    if (!ticket) return false;

    const matchesSearch = ticketMatchesSearch(ticket, searchTerm);
    const matchesBrandModel = ticketMatchesBrandModel(ticket, filterBrand, filterModel);

    const filterToCheck = filterStatus === 'pending' ? ['pending', 'open'] : [filterStatus];
    const matchesFilter = filterStatus === 'all' || filterToCheck.includes(ticket.status);

    let matchesMonth = true;
    if (filterMonth !== 'all' && ticket.createdAt) {
      const date = new Date(ticket.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      matchesMonth = key === filterMonth;
    } else if (filterMonth !== 'all') {
      matchesMonth = false;
    }

    let matchesDay = true;
    if (filterDay !== 'all' && ticket.createdAt) {
      matchesDay = getDayKey(ticket.createdAt) === filterDay;
    } else if (filterDay !== 'all') {
      matchesDay = false;
    }

    return matchesSearch && matchesBrandModel && matchesFilter && matchesMonth && matchesDay;
  }), [regularTickets, searchTerm, filterBrand, filterModel, filterStatus, filterMonth, filterDay]);

  const stats = {
    total: regularTickets.length,
    pending: regularTickets.filter(t => t?.status === 'pending' || t?.status === 'open').length,
    inProgress: regularTickets.filter(t => t?.status === 'in-progress').length,
    completed: regularTickets.filter(t => t?.status === 'completed').length
  };

  const openAddRegularTicket = () => {
    setAddTicketIsWarranty(false);
    setIsAddDialogOpen(true);
  };

  const openAddWarrantyTicket = () => {
    setAddTicketIsWarranty(true);
    setIsAddDialogOpen(true);
  };

  const openAddVhsTicket = () => {
    setIsAddVhsDialogOpen(true);
  };

  const handleNewServisniPrijem = () => {
    setActiveTab('tickets');
    openAddRegularTicket();
  };

  const handleNewGarantniRok = () => {
    setActiveTab('warranty');
    openAddWarrantyTicket();
  };

  const handleNewVhs = () => {
    setActiveTab('vhs');
    openAddVhsTicket();
  };

  return (
    <>
      <style>{`
        @media print {
          .dashboard-container { display: none !important; }
          .printable-content {
            display: block !important;
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            z-index: 99999;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          [data-pdf-page] {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {printableTicket && (
        <div className="printable-content hidden">
          <PrintableTicket ticket={printableTicket} />
        </div>
      )}
      {printableVhsTicket && (
        <div className="printable-content hidden">
          <PrintableVhsTicket ticket={printableVhsTicket} />
        </div>
      )}
      {printableDeliveryNote && (
        <div className="printable-content hidden">
          <PrintableDeliveryNote ticket={printableDeliveryNote} />
        </div>
      )}

      <div className='min-h-screen p-3 md:p-6 lg:p-8 pb-[max(1rem,env(safe-area-inset-bottom))] dashboard-container overflow-x-hidden md:overflow-x-visible'>
        <div className='app-container'>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
              <div className="overflow-x-auto max-w-full md:overflow-x-visible -mx-1 px-1 pb-1 md:mx-0 md:px-0 md:pb-0">
                <TabsList className="bg-slate-800/80 border border-slate-700 p-1 h-auto w-max min-w-full md:min-w-0 flex-nowrap inline-flex">
                <TabsTrigger value="tickets" className="flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  <LayoutGrid className="w-4 h-4 shrink-0" />
                  Nalozi
                </TabsTrigger>
                <TabsTrigger value="clients" className="flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  <Users className="w-4 h-4 shrink-0" />
                  Klijenti
                </TabsTrigger>
                <TabsTrigger value="warranty" className="flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="hidden md:inline">Garantni </span>Rok
                </TabsTrigger>
                <TabsTrigger value="vhs" className="flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <Film className="w-4 h-4 shrink-0" />
                  VHS
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="finances" className="flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <BarChart3 className="w-4 h-4 shrink-0" />
                    Finansije
                  </TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="recycle" className="flex items-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-red-600 data-[state=active]:text-white">
                    <Trash2 className="w-4 h-4 shrink-0" />
                    Korpa
                    {deletedTickets.length > 0 && (
                      <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {deletedTickets.length}
                      </span>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <NewTicketMenu
                  onServisniPrijem={handleNewServisniPrijem}
                  onGarantniRok={handleNewGarantniRok}
                  onVhs={handleNewVhs}
                />
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

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className='bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-slate-700'>
                <div className='flex flex-col gap-4'>
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className='flex-1 relative min-w-0'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
                      <input type='text' placeholder='Pretraga: ime, telefon, brend, model, serijski broj...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all' />
                    </div>
                    <NewTicketMenu
                      onServisniPrijem={handleNewServisniPrijem}
                      onGarantniRok={handleNewGarantniRok}
                      onVhs={handleNewVhs}
                      className="w-full md:w-auto px-5 py-3 md:hidden"
                    />
                  </div>

                  <div className='flex flex-wrap gap-3'>
                    <div className='relative'>
                      <Laptop className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                      <select
                        value={filterBrand}
                        onChange={e => setFilterBrand(e.target.value)}
                        className='pl-10 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[150px] w-full lg:w-auto'
                      >
                        <option value=''>Svi brendovi</option>
                        {availableBrands.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>

                    <div className='relative min-w-[160px]'>
                      <Cpu className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                      <input
                        type='text'
                        placeholder='Model (npr. XPS 15)'
                        value={filterModel}
                        onChange={e => setFilterModel(e.target.value)}
                        className='w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all'
                      />
                    </div>

                    <div className='relative'>
                      <CalendarDays className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                      <select 
                        value={filterMonth} 
                        onChange={e => handleMonthChange(e.target.value)} 
                        className='pl-10 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[180px] w-full lg:w-auto'
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
                      <CalendarDays className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                      <select
                        value={filterDay}
                        onChange={e => setFilterDay(e.target.value)}
                        disabled={availableDays.length === 0}
                        className='pl-10 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[200px] w-full lg:w-auto disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <option value='all'>Svi Dani</option>
                        {availableDays.map(day => (
                          <option key={day} value={day}>
                            {formatDayKeyDisplay(day)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className='relative'>
                      <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none' />
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className='pl-10 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer min-w-[160px] w-full lg:w-auto'>
                        <option value='all'>Svi Statusi</option>
                        <option value='pending'>Na Čekanju / Otvoreno</option>
                        <option value='in-progress'>U Radu</option>
                        <option value='completed'>Završeno</option>
                      </select>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400">
                    Prikazano <span className="text-white font-semibold">{filteredTickets.length}</span> od {regularTickets.length} naloga
                  </p>

                  {(searchTerm || filterBrand || filterModel || filterStatus !== 'all' || filterMonth !== 'all' || filterDay !== 'all') && (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-400 hover:text-white h-8">
                        Obriši filtere
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>

              <TicketList 
                tickets={filteredTickets} 
                onTicketClick={handleOpenTicketDetails}
                onUpdateStatus={updateTicketStatus} 
                onAddNotes={addRepairNotes} 
                onGenerateInvoice={openInvoiceDialog} 
                onPrintTicket={handlePrintTicket}
                onEditTicket={handleEditTicket}
                onPrintDeliveryNote={handlePrintDeliveryNote}
                onDeleteClick={handleTicketDeleteClick}
                clientTicketCounts={clientTicketCounts}
              />
            </TabsContent>

            <TabsContent value="warranty" className="mt-0">
              <WarrantyTabContent
                tickets={warrantyTickets}
                onNewWarranty={openAddWarrantyTicket}
                onTicketClick={handleOpenTicketDetails}
                onUpdateStatus={updateTicketStatus}
                onAddNotes={addRepairNotes}
                onGenerateInvoice={openInvoiceDialog}
                onPrintTicket={handlePrintTicket}
                onEditTicket={handleEditTicket}
                onPrintDeliveryNote={handlePrintDeliveryNote}
                onDeleteClick={handleTicketDeleteClick}
              />
            </TabsContent>

            <TabsContent value="vhs" className="mt-0">
              <VhsTabContent
                tickets={vhsTickets}
                onNewVhs={openAddVhsTicket}
                onTicketClick={handleOpenTicketDetails}
                onUpdateStatus={updateTicketStatus}
                onAddNotes={addRepairNotes}
                onGenerateInvoice={openInvoiceDialog}
                onPrintTicket={handlePrintTicket}
                onEditTicket={handleEditTicket}
                onPrintDeliveryNote={handlePrintDeliveryNote}
                onDeleteClick={handleTicketDeleteClick}
              />
            </TabsContent>

            <TabsContent value="clients" className="mt-0">
              <CustomerHistoryPanel
                tickets={tickets}
                onTicketClick={handleOpenTicketDetails}
              />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="finances" className="mt-0">
                <FinanceDashboard tickets={tickets} />
              </TabsContent>
            )}

            {isAdmin && (
              <TabsContent value="recycle" className="mt-0">
                <RecycleBinTabContent
                  deletedTickets={deletedTickets}
                  isLoading={isDeletedLoading}
                  recycleBinMode={recycleBinMode}
                  onRestore={handleRestoreTicket}
                  onPermanentDelete={handlePermanentDeleteClick}
                  onRefresh={loadDeletedTickets}
                />
              </TabsContent>
            )}
          </Tabs>

          <AddTicketDialog 
            isOpen={isAddDialogOpen} 
            onClose={() => { setIsAddDialogOpen(false); setAddTicketIsWarranty(false); }} 
            onSubmit={addTicket}
            isWarranty={addTicketIsWarranty}
          />
          
          <TicketSuccessDialog
            isOpen={isSuccessDialogOpen}
            onClose={() => setIsSuccessDialogOpen(false)}
            onPrint={handlePrintFromSuccessDialog}
          />
          
          <AddVhsDialog
            isOpen={isAddVhsDialogOpen}
            onClose={() => setIsAddVhsDialogOpen(false)}
            onSubmit={addVhsTicket}
          />

          <EditVhsReceiptDialog
            isOpen={isVhsEditOpen}
            onClose={() => {
              setIsVhsEditOpen(false);
              setIsNewVhsTicket(false);
            }}
            ticket={vhsEditTicket}
            onSave={handleVhsSave}
            onPrint={handleVhsPrint}
            isNewTicket={isNewVhsTicket}
          />

          <EditPrijemniListDialog
            isOpen={isPrijemniEditOpen}
            onClose={() => {
              setIsPrijemniEditOpen(false);
              setIsNewPrijemniTicket(false);
              setPrijemniStartPreview(false);
            }}
            ticket={prijemniEditTicket}
            onSave={handlePrijemniSave}
            onPrint={handlePrijemniPrint}
            isNewTicket={isNewPrijemniTicket}
            startWithPreview={prijemniStartPreview}
          />

          <TicketDetailsDialog 
            isOpen={isDetailsDialogOpen} 
            onClose={() => setIsDetailsDialogOpen(false)} 
            ticket={selectedTicket}
            onUpdateStatus={updateTicketStatus}
            onAddNotes={addRepairNotes}
            onPrintTicket={handlePrintTicket}
            onEditTicket={handleEditTicket}
            onPrintDeliveryNote={handlePrintDeliveryNote}
            onDeleteClick={handleTicketDeleteClick}
            onOpenTicket={(t) => setSelectedTicket(t)}
          />

          <InvoiceDialog isOpen={isInvoiceDialogOpen} onClose={() => setIsInvoiceDialogOpen(false)} ticket={selectedTicket} />

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-amber-400">Premjesti u korpu?</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-300">
                  Da li želite da obrišete nalog <span className="font-bold text-white">#{ticketToDelete?.id}</span> za klijenta <span className="font-bold text-white">{ticketToDelete?.customerName}</span>?
                  <br/><br/>
                  Nalog ide u <span className="text-amber-300 font-semibold">Korpu za otpatke</span> i možete ga vratiti ako ste obrisali greškom.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">Otkaži</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDeleteTicket} className="bg-amber-600 hover:bg-amber-700 text-white">
                  Premjesti u korpu
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={isPermanentDeleteDialogOpen} onOpenChange={setIsPermanentDeleteDialogOpen}>
            <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-400">Trajno brisanje</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-300">
                  Da li ste sigurni da želite <span className="font-bold text-red-300">trajno</span> obrisati nalog <span className="font-bold text-white">#{ticketToPermanentDelete?.id}</span>?
                  <br/><br/>
                  <span className="text-red-400/80 text-xs">Ova radnja je nepovratna — nalog se više ne može vratiti.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">Otkaži</AlertDialogCancel>
                <AlertDialogAction onClick={confirmPermanentDeleteTicket} className="bg-red-600 hover:bg-red-700 text-white">
                  Obriši trajno
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