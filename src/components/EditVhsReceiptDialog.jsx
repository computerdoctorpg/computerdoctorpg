import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User, Phone, Film, Hash, ClipboardList, MessageSquare, Printer, Save, Loader2, FileText, Languages } from 'lucide-react';
import PrintableVhsTicket from '@/components/PrintableVhsTicket';
import { VHS_PRICE_PER_CASSETTE } from '@/components/AddVhsDialog';
import { prepareVhsTicketForEnglishPrint } from '@/lib/translateForPrint';

const emptyForm = {
  customerName: '',
  customerSurname: '',
  customerPhone: '',
  vhsCassetteCount: '1',
  vhsCassetteCondition: '',
  notes: '',
};

const EditVhsReceiptDialog = ({ isOpen, onClose, ticket, onSave, onPrint, isNewTicket = false }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printInEnglish, setPrintInEnglish] = useState(false);
  const [englishPreview, setEnglishPreview] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const count = parseInt(formData.vhsCassetteCount, 10) || 0;
  const totalPrice = count * (ticket?.vhsPricePerCassette || VHS_PRICE_PER_CASSETTE);

  const buildTicket = () => ({
    ...ticket,
    ...formData,
    vhsCassetteCount: count,
    vhsPricePerCassette: VHS_PRICE_PER_CASSETTE,
    estimatedCost: totalPrice,
    serviceCost: totalPrice,
    deviceName: `VHS digitalizacija (${count} kaseta)`,
  });

  useEffect(() => {
    if (!ticket || !isOpen) return;
    setFormData({
      customerName: ticket.customerName || '',
      customerSurname: ticket.customerSurname || '',
      customerPhone: ticket.customerPhone || '',
      vhsCassetteCount: String(ticket.vhsCassetteCount || 1),
      vhsCassetteCondition: ticket.vhsCassetteCondition || '',
      notes: ticket.notes || '',
    });
    setShowPreview(false);
    setPrintInEnglish(false);
    setEnglishPreview(null);
  }, [ticket?.id, isOpen]);

  useEffect(() => {
    if (!ticket || !printInEnglish) {
      setEnglishPreview(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setIsTranslating(true);
      try {
        const translated = await prepareVhsTicketForEnglishPrint(buildTicket());
        if (!cancelled) setEnglishPreview(translated);
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [printInEnglish, formData, ticket]);

  if (!ticket) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(buildTicket());
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const base = buildTicket();
      const printTicket = printInEnglish
        ? (englishPreview || await prepareVhsTicketForEnglishPrint(base))
        : { ...base, printLocale: 'sr' };
      await onPrint({ saveTicket: base, printTicket });
    } finally {
      setIsPrinting(false);
    }
  };

  const inputClass = 'w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
  const previewTicket = printInEnglish
    ? (englishPreview || { ...buildTicket(), printLocale: 'en' })
    : { ...buildTicket(), printLocale: 'sr' };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSaving && !isPrinting) onClose(); }}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Prijem VHS Kaseta {ticket.id ? `#${ticket.id}` : ''}
          </DialogTitle>
          <p className="text-sm text-slate-400">
            {isNewTicket ? 'Provjerite podatke prije štampe.' : 'Izmijenite podatke i sačuvajte u bazi.'}
          </p>
        </DialogHeader>

        <div className="flex gap-2 border-b border-slate-700 pb-2">
          <Button type="button" size="sm" variant={!showPreview ? 'default' : 'outline'} onClick={() => setShowPreview(false)}
            className={!showPreview ? 'bg-amber-600' : 'border-slate-600 text-slate-300'}>
            Uredi podatke
          </Button>
          <Button type="button" size="sm" variant={showPreview ? 'default' : 'outline'} onClick={() => setShowPreview(true)}
            className={showPreview ? 'bg-amber-600' : 'border-slate-600 text-slate-300'}>
            Pregled prijemnice
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {showPreview ? (
            <div className="bg-slate-900/50 rounded-lg p-4 overflow-auto">
              {isTranslating && printInEnglish && (
                <p className="text-center text-sm text-slate-400 mb-2 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Prevodim prijemnici na engleski...
                </p>
              )}
              <div className="origin-top-left scale-[0.45] sm:scale-[0.55] md:scale-[0.6] mx-auto w-[210mm]">
                <PrintableVhsTicket ticket={previewTicket} />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2"><User className="w-4 h-4" /> Klijent</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-300 text-xs">Ime</Label>
                    <input name="customerName" value={formData.customerName} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs">Prezime</Label>
                    <input name="customerSurname" value={formData.customerSurname} onChange={handleChange} className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-slate-300 text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</Label>
                    <input name="customerPhone" value={formData.customerPhone} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
              </section>

              <section className="space-y-3 p-3 rounded-lg bg-amber-900/20 border border-amber-600/30">
                <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2"><Film className="w-4 h-4" /> Kasete</h3>
                <div>
                  <Label className="text-slate-300 text-xs flex items-center gap-1"><Hash className="w-3 h-3" /> Broj kaseta</Label>
                  <input name="vhsCassetteCount" type="number" min="1" value={formData.vhsCassetteCount} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Stanje kaseta</Label>
                  <textarea name="vhsCassetteCondition" value={formData.vhsCassetteCondition} onChange={handleChange} rows={3} className={`${inputClass} resize-y`} />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Napomena</Label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className={`${inputClass} resize-y`} />
                </div>
                <p className="text-sm text-slate-400 pt-1 border-t border-amber-700/40">
                  Cijena: <span className="text-amber-300 font-bold">{VHS_PRICE_PER_CASSETTE} €/kaseta</span>
                  {' · '}Ukupno: <span className="text-white font-bold">{totalPrice} €</span>
                  {' · '}USB + MP4 uključeni
                </p>
              </section>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 mr-auto">
            <input
              type="checkbox"
              checked={printInEnglish}
              onChange={(e) => setPrintInEnglish(e.target.checked)}
              className="h-4 w-4 rounded"
              disabled={isSaving || isPrinting}
            />
            <Languages className="w-4 h-4 text-amber-400" />
            Štampaj na engleskom
            {isTranslating && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> prevod...
              </span>
            )}
          </label>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving || isPrinting} className="border-slate-600 text-slate-300">
            Otkaži
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || isPrinting} className="bg-green-600 hover:bg-green-700">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Sačuvaj
          </Button>
          <Button type="button" variant="outline" onClick={handlePrint} disabled={isSaving || isPrinting || (printInEnglish && isTranslating)}
            className="border-amber-500/50 text-amber-300 hover:bg-amber-900/20">
            {isPrinting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
            {printInEnglish ? 'Sačuvaj i Štampaj (EN)' : 'Sačuvaj i Štampaj'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditVhsReceiptDialog;
