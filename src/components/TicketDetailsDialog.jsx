import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Laptop, User, Wrench, 
  CheckCircle, PlayCircle, Printer, FileOutput, PenTool, 
  History, Save, Smartphone, Calculator, Battery, MessageSquare, Loader2, Trash2, RotateCcw,
  ChevronRight, Pencil, Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { canDeleteTickets, canEditDocuments } from '@/lib/permissions';
import { fetchTicketsByClientId } from '@/lib/db';
import { buildCompletionViberMessage, openViberChat } from '@/lib/viberUtils';

const TicketDetailsDialog = ({ 
  isOpen, 
  onClose, 
  ticket, 
  onUpdateStatus, 
  onAddNotes,
  onPrintTicket,
  onEditTicket,
  onPrintDeliveryNote,
  onDeleteClick,
  onOpenTicket
}) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const canEdit = canEditDocuments(isAdmin);
  const canDelete = canDeleteTickets(isAdmin);
  const [sendDeliveryEmail, setSendDeliveryEmail] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    repairDetails: '',
    partsUsed: '',
    partsCost: '',
    serviceCost: '',
    estimatedCost: '',
    batterySerial: '',
    notes: ''
  });

  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [clientHistory, setClientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const statusTranslations = {
    'pending': 'Na Čekanju',
    'open': 'Otvoreno',
    'in-progress': 'U Radu',
    'completed': 'Završeno'
  };

  // Učitaj formu samo pri otvaranju naloga — ne briši tekst tokom rada
  useEffect(() => {
    if (ticket && isOpen) {
      setFormData({
        repairDetails: ticket.repairDetails || '',
        partsUsed: ticket.partsUsed || '',
        partsCost: ticket.partsCost ?? '',
        serviceCost: ticket.serviceCost ?? '',
        estimatedCost: ticket.estimatedCost ?? '',
        batterySerial: ticket.batterySerial || '',
        notes: ticket.notes || ''
      });
      setSendDeliveryEmail(!!ticket.customerEmail?.trim());
    }
  }, [ticket?.id, isOpen]);

  useEffect(() => {
    if (!ticket?.clientId || !isOpen) {
      setClientHistory([]);
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);

    fetchTicketsByClientId(ticket.clientId)
      .then((data) => {
        if (!cancelled) {
          setClientHistory(data.filter((t) => t.id !== ticket.id));
        }
      })
      .catch(() => {
        if (!cancelled) setClientHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => { cancelled = true; };
  }, [ticket?.clientId, ticket?.id, isOpen]);

  if (!ticket) return null;
  
  const isCompleted = ticket.status === 'completed';

  const handleSave = async () => {
    setIsSavingNotes(true);
    try {
      await onAddNotes(ticket.id, formData);
    } catch {
      // Greška prikazana u addRepairNotes
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSaveNotesOnly = async () => {
    setIsSavingNotes(true);
    try {
      await onAddNotes(ticket.id, { notes: formData.notes });
      toast({
        title: "Napomena Sačuvana",
        description: "Napomena je uspešno ažurirana u bazi.",
        className: "bg-green-600 text-white border-none"
      });
    } catch (error) {
      toast({
        title: "Greška",
        description: "Došlo je do greške pri čuvanju napomene.",
        variant: "destructive"
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'completed') {
      if (!formData.repairDetails.trim()) {
        toast({
          title: "Obavezno Polje",
          description: "Molimo unesite opis izvršenih radova pre završetka.",
          variant: "destructive"
        });
        return;
      }
      onUpdateStatus(ticket.id, newStatus, formData);
      onClose();
      return;
    }

    if (newStatus === 'in-progress') {
      const marker = 'Pristupio na popravku.';
      const existing = formData.repairDetails.trim();
      const alreadyMarked = existing.toLowerCase().includes('pristupio na popravku');
      const repairDetails = alreadyMarked
        ? existing
        : existing
          ? `${marker}\n\n${existing}`
          : marker;

      const payload = { ...formData, repairDetails };
      setFormData(payload);
      onUpdateStatus(ticket.id, newStatus, payload);
      return;
    }

    onUpdateStatus(ticket.id, newStatus, formData);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViberClick = async (e) => {
    e.stopPropagation();

    const message = buildCompletionViberMessage(ticket, {
      partsCost: formData.partsCost,
      serviceCost: formData.serviceCost,
      estimatedCost: formData.estimatedCost,
    });

    const result = await openViberChat(ticket.customerPhone, message);
    if (!result.ok) {
      toast({
        variant: 'destructive',
        title: 'Greška',
        description: 'Broj telefona nije dostupan.',
      });
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

  const totalActual = (parseFloat(formData.partsCost) || 0) + (parseFloat(formData.serviceCost) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white w-[calc(100vw-1.5rem)] sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3 border-b border-slate-700 pb-4">
            <div className="bg-blue-600/20 p-2 rounded-lg">
              <Laptop className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span>{ticket.deviceName}</span>
              <span className="text-sm font-normal text-slate-400 flex items-center gap-2">
                Nalog #{ticket.id} • 
                <span className={`capitalize ${
                  ticket.status === 'completed' ? 'text-green-400' : 
                  ticket.status === 'in-progress' ? 'text-purple-400' : 'text-yellow-400'
                }`}>
                  {statusTranslations[ticket.status] || ticket.status}
                </span>
              </span>
              {ticket.dispatchNoteNumber && (
                <span className="text-xs text-green-400/80 font-mono mt-0.5">
                  Otpremnica: #{ticket.dispatchNoteNumber}
                </span>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* Admin Reopen Action */}
              {isCompleted && isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('open')}
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-900/30 hover:text-yellow-300"
                  title="Ponovo Otvori Nalog"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Otvori Ponovo
                </Button>
              )}

              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditTicket?.(ticket)}
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-900/30 hover:text-amber-300"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Uredi podatke
                </Button>
              )}

              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPrintTicket(ticket)}
                  className="border-slate-600 hover:bg-slate-700 text-slate-300"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Štampaj prijemni list
                </Button>
              )}
              {isCompleted && (
                <>
                  <label className="flex items-center gap-2 text-xs text-slate-400 px-1">
                    <input
                      type="checkbox"
                      checked={sendDeliveryEmail}
                      onChange={(e) => setSendDeliveryEmail(e.target.checked)}
                      disabled={!ticket.customerEmail?.trim()}
                      className="h-4 w-4 rounded"
                    />
                    <Mail className="w-3.5 h-3.5" />
                    Pošalji otpremnicu na email
                    {ticket.customerEmail?.trim() && (
                      <span className="text-slate-500">({ticket.customerEmail})</span>
                    )}
                  </label>
                  {!ticket.customerEmail?.trim() && (
                    <p className="text-[11px] text-amber-400 px-1">
                      Unesite email klijenta u prijemnici da biste mogli slati otpremnicu.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPrintDeliveryNote(ticket, {
                      sendEmail: sendDeliveryEmail && !!ticket.customerEmail?.trim(),
                    })}
                    className="border-slate-600 hover:bg-slate-700 text-slate-300"
                  >
                    <FileOutput className="w-4 h-4 mr-2" />
                    Otpremnica
                  </Button>
                </>
              )}
               <Button
                  size="sm"
                  onClick={handleViberClick}
                  className='bg-[#7360f2] hover:bg-[#5e4ad1] text-white shadow-lg border border-[#5e4ad1]'
                  title="Pošalji Viber poruku"
                >
                  <Smartphone className='w-4 h-4 mr-2' />
                  Pošalji Viber
                </Button>

                {/* Role-based delete button strictly for Admin */}
                {canDelete && onDeleteClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(); // close dialog before deleting to prevent UI jump
                      onDeleteClick(ticket);
                    }}
                    className="border-red-500/50 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    title="Premjesti u korpu"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    U korpu
                  </Button>
                )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          {/* Left Column: Info & Editable Notes */}
          <div className="space-y-6">
            {/* Customer Card */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Klijent
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Ime i Prezime</p>
                  <p className="font-medium">{ticket.customerName} {ticket.customerSurname}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Kontakt</p>
                  <p className="font-medium">{ticket.customerPhone}</p>
                  <p className="text-slate-300 text-xs">{ticket.customerEmail || '-'}</p>
                </div>
                {(clientHistory.length > 0 || loadingHistory) && (
                  <div className="pt-2 border-t border-slate-700/50">
                    <p className="text-slate-400 text-xs mb-2 flex items-center gap-1">
                      <History className="w-3 h-3" />
                      Prethodni nalozi ({loadingHistory ? '...' : clientHistory.length})
                    </p>
                    {loadingHistory ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="w-3 h-3 animate-spin" /> Učitavanje...
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                        {clientHistory.map((prev) => (
                          <button
                            key={prev.id}
                            type="button"
                            onClick={() => onOpenTicket?.(prev)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg bg-slate-800/80 border border-slate-700/50 hover:border-blue-500/40 text-left transition-colors group"
                          >
                            <span className="font-mono text-xs text-blue-400 shrink-0">#{prev.id}</span>
                            <span className="text-xs text-slate-300 truncate flex-1">{prev.deviceName}</span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(prev.createdAt).toLocaleDateString('sr-RS')}
                            </span>
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Device Specs */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Laptop className="w-4 h-4" /> Specifikacije Uređaja
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Serijski Broj Laptopa</p>
                  <p className="font-mono text-xs bg-slate-800 p-1 rounded">{ticket.deviceSerial || 'NEMA'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Serijski Broj Baterije</p>
                  <p className="font-mono text-xs bg-slate-800 p-1 rounded">{ticket.batterySerial || 'NEMA'}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Serijski Broj Punjača</p>
                  <p className="font-mono text-xs bg-slate-800 p-1 rounded">{ticket.chargerSerial || 'NEMA'}</p>
                </div>
                {ticket.osPassword && (
                   <div>
                     <p className="text-slate-400 text-xs">OS Lozinka / Šifra</p>
                     <p className="font-mono text-xs bg-slate-800 p-1 rounded text-yellow-300">{ticket.osPassword}</p>
                   </div>
                )}
              </div>
            </div>

            {/* Original Issue */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">
                Prijavljeni Kvar
              </h3>
              <p className="text-sm text-slate-300 italic whitespace-pre-wrap">"{ticket.issueDescription}"</p>
            </div>

            {/* Editable Notes Section */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 flex flex-col">
              <Label className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Napomena
              </Label>
              <textarea
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white min-h-[100px] focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y"
                placeholder="Unesite napomene ovde (vidljivo na štampi)..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                disabled={isCompleted || isSavingNotes}
              />
              {!isCompleted && (
                <div className="mt-3 flex justify-end">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={handleSaveNotesOnly}
                    disabled={isSavingNotes || formData.notes === ticket.notes}
                    className="bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 border border-purple-500/30"
                  >
                    {isSavingNotes ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Sačuvaj Napomenu
                  </Button>
                </div>
              )}
            </div>

            {/* Checkboxes display */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
               <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Podaci</p>
                    <div className={`px-3 py-2 rounded border ${ticket.keepData ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-slate-700 bg-slate-800 text-slate-500"} font-bold text-sm text-center`}>
                      {ticket.keepData ? "ČUVATI PODATKE" : "BRISATI"}
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Torba</p>
                    <div className={`px-3 py-2 rounded border ${ticket.hasBag ? "border-purple-500/50 bg-purple-500/10 text-purple-400" : "border-slate-700 bg-slate-800 text-slate-500"} font-bold text-sm text-center`}>
                      {ticket.hasBag ? "DA" : "NE"}
                      {ticket.hasBag && ticket.bagDescription && <span className="font-normal ml-2 text-slate-300">({ticket.bagDescription})</span>}
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* Middle & Right: Editing Zone */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Report Form */}
            <div className="bg-slate-900/30 rounded-xl p-6 border border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-green-500" />
                  Servisni Izveštaj i Troškovi
                </h3>
                {!isCompleted && (
                  <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 h-8">
                    <Save className="w-4 h-4 mr-2" /> Sačuvaj Sve Izmene
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Additional Battery Field Edit Option (If they need to change it later) */}
                <div className="pt-2 border-b border-slate-800 pb-4">
                   <Label className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                     <Battery className="w-3 h-3 text-green-400" />
                     Ažuriraj Serijski Baterije (Opciono)
                   </Label>
                   <input
                      type="text"
                      className="w-full md:w-1/2 bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      placeholder="NEMA"
                      value={formData.batterySerial}
                      onChange={(e) => setFormData({...formData, batterySerial: e.target.value})}
                      disabled={isCompleted}
                    />
                </div>

                <div>
                  <Label className="text-slate-300 mb-1.5 block">Opis Rada / Dijagnostika</Label>
                  <textarea
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                    placeholder="Opišite izvršene tehničke radove..."
                    value={formData.repairDetails}
                    onChange={(e) => setFormData({...formData, repairDetails: e.target.value})}
                    disabled={isCompleted}
                  />
                </div>

                <div>
                  <Label className="text-slate-300 mb-1.5 block">Korišćeni Delovi</Label>
                  <div className="relative">
                    <PenTool className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <textarea
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pl-10 text-sm text-white min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Navedite zamenjene delove..."
                      value={formData.partsUsed}
                      onChange={(e) => setFormData({...formData, partsUsed: e.target.value})}
                      disabled={isCompleted}
                    />
                  </div>
                </div>
                
                {/* Financial Inputs — samo admin */}
                {isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                     <Label className="text-slate-300 mb-1.5 block flex items-center gap-1">
                       <Calculator className="w-3 h-3 text-yellow-400" /> Procena (€)
                     </Label>
                     <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-8 text-yellow-200/80 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                        placeholder="0.00"
                        value={formData.estimatedCost}
                        onChange={(e) => setFormData({...formData, estimatedCost: e.target.value})}
                        disabled={isCompleted}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-1.5 block">Cena Delova (€)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-8 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                        placeholder="0.00"
                        value={formData.partsCost}
                        onChange={(e) => setFormData({...formData, partsCost: e.target.value})}
                        disabled={isCompleted}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 mb-1.5 block">Cena Usluge (€)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 pl-8 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                        placeholder="0.00"
                        value={formData.serviceCost}
                        onChange={(e) => setFormData({...formData, serviceCost: e.target.value})}
                        disabled={isCompleted}
                      />
                    </div>
                  </div>
                </div>
                )}

                {isAdmin && (
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-500">
                    {formData.estimatedCost > 0 && (
                      <span>
                        Razlika: <span className={totalActual > formData.estimatedCost ? "text-red-400" : "text-green-400"}>
                          {(totalActual - formData.estimatedCost) > 0 ? '+' : ''}
                          {(totalActual - formData.estimatedCost).toFixed(2)} €
                        </span> od Procene
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-medium">Ukupno</span>
                    <span className="text-2xl font-bold text-green-400">
                      € {totalActual.toFixed(2)}
                    </span>
                  </div>
                </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            {!isCompleted && (
               <div className="grid grid-cols-2 gap-4">
                {(ticket.status === 'pending' || ticket.status === 'open') ? (
                   <Button 
                    onClick={() => handleStatusChange('in-progress')}
                    className="col-span-2 bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                   >
                     <PlayCircle className="w-5 h-5 mr-2" /> Započni Popravku
                   </Button>
                ) : (
                  <Button 
                    onClick={() => handleStatusChange('completed')}
                    className="col-span-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 h-12 text-lg shadow-lg shadow-green-900/20"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" /> Završi i Štampaj
                  </Button>
                )}
               </div>
            )}

            {/* History Log */}
            <div className="border-t border-slate-700 pt-6">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="w-4 h-4" /> Istorija Promena
              </h4>
              <div className="space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                {ticket.history && ticket.history.slice().reverse().map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                      {i !== ticket.history.length - 1 && <div className="w-0.5 h-full bg-slate-800 my-1"></div>}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs text-slate-400">{formatDate(entry.date)}</p>
                      <p className="text-sm font-medium text-slate-200">{entry.action}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{entry.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailsDialog;