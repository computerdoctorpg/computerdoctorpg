import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  User, Phone, Laptop, Hash, Battery, Lock, MessageSquare,
  ShoppingBag, Printer, Save, Loader2, FileText, Shield, Calendar, Languages, Mail
} from 'lucide-react';
import PrintableTicket from '@/components/PrintableTicket';
import { DeviceBrandFields } from '@/components/DeviceBrandFields';
import { DataPolicyFields } from '@/components/DataPolicyFields';
import { prepareServiceTicketForEnglishPrint } from '@/lib/translateForPrint';
import {
  DEVICE_BRANDS,
  OTHER_BRAND_LABEL,
  splitDeviceFields,
  combineDeviceName,
} from '@/lib/deviceBrands';

const emptyForm = {
  customerName: '',
  customerSurname: '',
  customerPhone: '',
  customerEmail: '',
  deviceBrand: '',
  deviceModel: '',
  customBrand: '',
  deviceSerial: '',
  chargerSerial: '',
  batterySerial: '',
  osPassword: '',
  issueDescription: '',
  notes: '',
  keepData: false,
  hasBag: false,
  bagDescription: '',
  warrantyUntil: '',
  warrantyInvoice: '',
};

const EditPrijemniListDialog = ({
  isOpen,
  onClose,
  ticket,
  onSave,
  onPrint,
  isNewTicket = false,
  startWithPreview = false,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printInEnglish, setPrintInEnglish] = useState(false);
  const [englishPreview, setEnglishPreview] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [sendEmailToCustomer, setSendEmailToCustomer] = useState(true);

  const buildTicket = () => {
    const resolvedBrand = formData.deviceBrand === OTHER_BRAND_LABEL
      ? formData.customBrand.trim()
      : formData.deviceBrand.trim();

    return {
      ...ticket,
      ...formData,
      deviceName: combineDeviceName(resolvedBrand, formData.deviceModel),
    };
  };

  useEffect(() => {
    if (!ticket || !isOpen) return;
    const split = splitDeviceFields(ticket.deviceName || '');
    const isKnownBrand = DEVICE_BRANDS.some((b) => b.label === split.deviceBrand);

    setFormData({
      customerName: ticket.customerName || '',
      customerSurname: ticket.customerSurname || '',
      customerPhone: ticket.customerPhone || '',
      customerEmail: ticket.customerEmail || '',
      deviceBrand: isKnownBrand ? split.deviceBrand : (split.deviceBrand ? OTHER_BRAND_LABEL : ''),
      deviceModel: split.deviceModel,
      customBrand: isKnownBrand ? '' : split.deviceBrand,
      deviceSerial: ticket.deviceSerial || '',
      chargerSerial: ticket.chargerSerial || '',
      batterySerial: ticket.batterySerial || '',
      osPassword: ticket.osPassword || '',
      issueDescription: ticket.issueDescription || '',
      notes: ticket.notes || '',
      keepData: !!ticket.keepData,
      hasBag: !!ticket.hasBag,
      bagDescription: ticket.bagDescription || '',
      warrantyUntil: ticket.warrantyUntil ? String(ticket.warrantyUntil).slice(0, 10) : '',
      warrantyInvoice: ticket.warrantyInvoice || '',
    });
    setShowPreview(startWithPreview);
    setPrintInEnglish(false);
    setEnglishPreview(null);
    setSendEmailToCustomer(true);
  }, [ticket?.id, isOpen, startWithPreview]);

  useEffect(() => {
    if (!ticket || !printInEnglish) {
      setEnglishPreview(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setIsTranslating(true);
      try {
        const translated = await prepareServiceTicketForEnglishPrint(buildTicket());
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (name === 'customerEmail' && value.trim()) {
      setSendEmailToCustomer(true);
    }
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
        ? (englishPreview || await prepareServiceTicketForEnglishPrint(base))
        : { ...base, printLocale: 'sr' };
      await onPrint({
        saveTicket: base,
        printTicket,
        sendEmail: sendEmailToCustomer && !!base.customerEmail?.trim(),
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const inputClass = 'w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const previewTicket = printInEnglish
    ? (englishPreview || { ...buildTicket(), printLocale: 'en' })
    : { ...buildTicket(), printLocale: 'sr' };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSaving && !isPrinting) onClose(); }}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white w-[calc(100vw-1.5rem)] sm:max-w-3xl lg:max-w-4xl max-h-[92dvh] sm:max-h-[92vh] overflow-hidden flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Uredi Prijemni List {ticket.id ? `#${ticket.id}` : ''}
          </DialogTitle>
          <p className="text-sm text-slate-400">
            {isNewTicket
              ? 'Proverite podatke pre štampe. Izmene se čuvaju u bazi.'
              : 'Izmenite podatke naloga — klijent, uređaj, kvar, napomene. Sačuvajte promene u bazi.'}
          </p>
        </DialogHeader>

        <div className="flex gap-2 border-b border-slate-700 pb-2">
          <Button
            type="button"
            size="sm"
            variant={!showPreview ? 'default' : 'outline'}
            onClick={() => setShowPreview(false)}
            className={!showPreview ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
          >
            Uredi podatke
          </Button>
          <Button
            type="button"
            size="sm"
            variant={showPreview ? 'default' : 'outline'}
            onClick={() => setShowPreview(true)}
            className={showPreview ? 'bg-blue-600' : 'border-slate-600 text-slate-300'}
          >
            Pregled prijemnice
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {showPreview ? (
            <div className="bg-slate-900/50 rounded-lg p-4 overflow-auto">
              {isTranslating && printInEnglish && (
                <p className="text-center text-sm text-slate-400 mb-2 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Prevodim prijemnici na engleski...
                </p>
              )}
              <div className="origin-top-left scale-[0.45] sm:scale-[0.55] md:scale-[0.6] mx-auto w-[210mm]">
                <PrintableTicket ticket={previewTicket} />
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                  <User className="w-4 h-4" /> Klijent
                </h3>
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
                  <div className="sm:col-span-2">
                    <Label className="text-slate-300 text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email klijenta</Label>
                    <input
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      placeholder="npr. klijent@email.com"
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                  <Laptop className="w-4 h-4" /> Uređaj
                </h3>
                <DeviceBrandFields
                  brand={formData.deviceBrand}
                  model={formData.deviceModel}
                  customBrand={formData.customBrand}
                  onBrandChange={(value) => setFormData((prev) => ({ ...prev, deviceBrand: value }))}
                  onModelChange={(value) => setFormData((prev) => ({ ...prev, deviceModel: value }))}
                  onCustomBrandChange={(value) => setFormData((prev) => ({ ...prev, customBrand: value }))}
                  inputClass={inputClass}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-slate-300 text-xs flex items-center gap-1"><Hash className="w-3 h-3" /> S/N laptopa</Label>
                    <input name="deviceSerial" value={formData.deviceSerial} onChange={handleChange} className={`${inputClass} font-mono`} />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs flex items-center gap-1"><Battery className="w-3 h-3" /> S/N baterije</Label>
                    <input name="batterySerial" value={formData.batterySerial} onChange={handleChange} className={`${inputClass} font-mono`} placeholder="NEMA" />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-xs flex items-center gap-1"><Hash className="w-3 h-3" /> S/N punjača</Label>
                    <input name="chargerSerial" value={formData.chargerSerial} onChange={handleChange} className={`${inputClass} font-mono`} placeholder="NEMA" />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300 text-xs flex items-center gap-1"><Lock className="w-3 h-3" /> OS šifra</Label>
                  <input name="osPassword" value={formData.osPassword} onChange={handleChange} className={`${inputClass} font-mono`} placeholder="NEMA" />
                </div>
              </section>

              {ticket.isWarranty && (
                <section className="space-y-3 p-3 rounded-lg bg-emerald-900/20 border border-emerald-600/30">
                  <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Garancija
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Garancija do</Label>
                      <input name="warrantyUntil" type="date" value={formData.warrantyUntil} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-xs flex items-center gap-1"><FileText className="w-3 h-3" /> Broj računa</Label>
                      <input name="warrantyInvoice" value={formData.warrantyInvoice} onChange={handleChange} className={inputClass} placeholder="npr. RA-123/2025" />
                    </div>
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <div>
                  <Label className="text-slate-300 text-xs">Opis kvara</Label>
                  <textarea name="issueDescription" value={formData.issueDescription} onChange={handleChange} rows={3} className={`${inputClass} resize-y`} />
                </div>
                <div>
                  <Label className="text-slate-300 text-xs flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Napomena</Label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className={`${inputClass} resize-y`} />
                </div>
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DataPolicyFields
                  keepData={formData.keepData}
                  onChange={(value) => setFormData((prev) => ({ ...prev, keepData: value }))}
                  disabled={isSaving || isPrinting}
                />
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-700 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="hasBag" checked={formData.hasBag} onChange={handleChange} className="h-4 w-4" />
                    <ShoppingBag className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-slate-300">Torba</span>
                  </label>
                  {formData.hasBag && (
                    <input
                      name="bagDescription"
                      value={formData.bagDescription}
                      onChange={handleChange}
                      placeholder="Opis torbe"
                      className={inputClass}
                    />
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 border-t border-slate-700 pb-[env(safe-area-inset-bottom)]">
          <div className="flex flex-col gap-2 mr-auto">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input
                type="checkbox"
                checked={printInEnglish}
                onChange={(e) => setPrintInEnglish(e.target.checked)}
                className="h-4 w-4 rounded"
                disabled={isSaving || isPrinting}
              />
              <Languages className="w-4 h-4 text-blue-400" />
              Štampaj na engleskom
              {isTranslating && (
                <span className="text-xs text-blue-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> prevod...
                </span>
              )}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
              <input
                type="checkbox"
                checked={sendEmailToCustomer}
                onChange={(e) => setSendEmailToCustomer(e.target.checked)}
                className="h-4 w-4 rounded"
                disabled={isSaving || isPrinting || !formData.customerEmail?.trim()}
              />
              <Mail className="w-4 h-4 text-emerald-400" />
              Pošalji prijemnici na email
              {!formData.customerEmail?.trim() && (
                <span className="text-xs text-slate-500">(unesite email)</span>
              )}
            </label>
          </div>

          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving || isPrinting} className="border-slate-600 text-slate-300">
            Otkaži
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isPrinting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Sačuvaj izmene
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            disabled={isSaving || isPrinting || (printInEnglish && isTranslating)}
            className="border-blue-500/50 text-blue-300 hover:bg-blue-900/20"
          >
            {isPrinting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
            {printInEnglish ? 'Sačuvaj i Štampaj (EN)' : 'Sačuvaj i Štampaj'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPrijemniListDialog;
