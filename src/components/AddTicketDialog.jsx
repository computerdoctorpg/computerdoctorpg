import React, { useState } from 'react';
import { Laptop, User, Phone, Hash, Lock, Database, ShoppingBag, AlertCircle, Battery, Loader2, MessageSquare, Shield, FileText, Calendar, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const AddTicketDialog = ({ isOpen, onClose, onSubmit, isWarranty = false }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerSurname: '',
    customerPhone: '',
    customerEmail: '',
    deviceName: '',
    deviceSerial: '',
    chargerSerial: '',
    batterySerial: '',
    issueDescription: '',
    notes: '',
    additionalDescription: '',
    osPassword: '',
    keepData: false,
    hasBag: false,
    bagDescription: '',
    warrantyUntil: '',
    warrantyInvoice: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Ime je obavezno';
    }
    if (!formData.customerSurname.trim()) {
      newErrors.customerSurname = 'Prezime je obavezno';
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Broj telefona je obavezan za kontakt';
    }
    if (!formData.deviceName.trim()) {
      newErrors.deviceName = 'Naziv uređaja je obavezan';
    }
    if (!formData.deviceSerial.trim()) {
      newErrors.deviceSerial = 'Serijski broj je obavezan';
    }
    if (!formData.issueDescription.trim()) {
      newErrors.issueDescription = 'Opis kvara je obavezan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted. Validating...", formData);
    
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        console.log("Validation passed, calling onSubmit...");
        await onSubmit(formData);
        
        // Reset form on success
        setFormData({
          customerName: '',
          customerSurname: '',
          customerPhone: '',
          customerEmail: '',
          deviceName: '',
          deviceSerial: '',
          chargerSerial: '',
          batterySerial: '',
          issueDescription: '',
          notes: '',
          additionalDescription: '',
          osPassword: '',
          keepData: false,
          hasBag: false,
          bagDescription: '',
          warrantyUntil: '',
          warrantyInvoice: '',
        });
        setErrors({});
      } catch (error) {
        console.error("Error during submission in dialog:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log("Validation failed:", errors);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isSubmitting ? onClose : undefined}>
      <DialogContent className='bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-white flex items-center gap-2'>
            {isWarranty ? (
              <>
                <Shield className='w-6 h-6 text-emerald-400' />
                Novi Garantni Nalog
              </>
            ) : (
              <>
                <Laptop className='w-6 h-6 text-blue-400' />
                Novi Servisni Nalog
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6 mt-4'>
          {isWarranty && (
            <div className='space-y-4 p-4 rounded-lg bg-emerald-900/20 border border-emerald-600/30'>
              <h3 className='text-lg font-semibold text-emerald-400 flex items-center gap-2'>
                <Shield className='w-5 h-5' />
                Podaci o Garanciji
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='warrantyUntil' className='text-slate-300 flex items-center gap-1'>
                    <Calendar className='w-4 h-4' /> Garancija do
                  </Label>
                  <input
                    id='warrantyUntil'
                    name='warrantyUntil'
                    type='date'
                    value={formData.warrantyUntil}
                    onChange={handleChange}
                    className='w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'
                  />
                </div>
                <div>
                  <Label htmlFor='warrantyInvoice' className='text-slate-300 flex items-center gap-1'>
                    <FileText className='w-4 h-4' /> Broj računa / fakture
                  </Label>
                  <input
                    id='warrantyInvoice'
                    name='warrantyInvoice'
                    type='text'
                    value={formData.warrantyInvoice}
                    onChange={handleChange}
                    placeholder='npr. RA-123/2025'
                    className='w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                  />
                </div>
              </div>
            </div>
          )}
          {/* Customer Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-blue-400 flex items-center gap-2'>
              <User className='w-5 h-5' />
              Informacije o Klijentu
            </h3>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='customerName' className='text-slate-300'>Ime *</Label>
                <input
                  id='customerName'
                  name='customerName'
                  type='text'
                  value={formData.customerName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full mt-1 px-4 py-2 bg-slate-900/50 border ${errors.customerName ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder='Marko'
                />
                {errors.customerName && (
                  <p className='text-red-400 text-sm mt-1'>{errors.customerName}</p>
                )}
              </div>

              <div>
                <Label htmlFor='customerSurname' className='text-slate-300'>Prezime *</Label>
                <input
                  id='customerSurname'
                  name='customerSurname'
                  type='text'
                  value={formData.customerSurname}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full mt-1 px-4 py-2 bg-slate-900/50 border ${errors.customerSurname ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder='Marković'
                />
                {errors.customerSurname && (
                  <p className='text-red-400 text-sm mt-1'>{errors.customerSurname}</p>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4'>
              <div>
                <Label htmlFor='customerPhone' className='text-slate-300 flex items-center gap-2'>
                  <Phone className='w-4 h-4' />
                  Broj Telefona *
                </Label>
                <input
                  id='customerPhone'
                  name='customerPhone'
                  type='tel'
                  value={formData.customerPhone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full mt-1 px-4 py-2 bg-slate-900/50 border ${errors.customerPhone ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder='067 123 456'
                />
                {errors.customerPhone && (
                  <p className='text-red-400 text-sm mt-1'>{errors.customerPhone}</p>
                )}
              </div>
              <div>
                <Label htmlFor='customerEmail' className='text-slate-300 flex items-center gap-2'>
                  <Mail className='w-4 h-4' />
                  Email klijenta
                </Label>
                <input
                  id='customerEmail'
                  name='customerEmail'
                  type='email'
                  value={formData.customerEmail}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className='w-full mt-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                  placeholder='klijent@email.com (opciono)'
                />
              </div>
            </div>
          </div>

          {/* Device Information */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-blue-400 flex items-center gap-2'>
              <Laptop className='w-5 h-5' />
              Informacije o Uređaju
            </h3>

            <div>
              <Label htmlFor='deviceName' className='text-slate-300'>Naziv/Model Uređaja *</Label>
              <input
                id='deviceName'
                name='deviceName'
                type='text'
                value={formData.deviceName}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full mt-1 px-4 py-2 bg-slate-900/50 border ${errors.deviceName ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                placeholder='Dell XPS 15, MacBook Pro, itd.'
              />
              {errors.deviceName && (
                <p className='text-red-400 text-sm mt-1'>{errors.deviceName}</p>
              )}
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <Label htmlFor='deviceSerial' className='text-slate-300 flex items-center gap-2'>
                  <Hash className='w-4 h-4' />
                  Serijski broj laptopa *
                </Label>
                <input
                  id='deviceSerial'
                  name='deviceSerial'
                  type='text'
                  value={formData.deviceSerial}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full mt-1 px-4 py-2 bg-slate-900/50 border ${errors.deviceSerial ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder='Unesite serijski broj laptopa'
                />
                {errors.deviceSerial && (
                  <p className='text-red-400 text-sm mt-1'>{errors.deviceSerial}</p>
                )}
              </div>

              <div>
                <Label htmlFor='chargerSerial' className='text-slate-300 flex items-center gap-2'>
                  <Hash className='w-4 h-4' />
                  Serijski broj punjača
                </Label>
                <input
                  id='chargerSerial'
                  name='chargerSerial'
                  type='text'
                  value={formData.chargerSerial}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className='w-full mt-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                  placeholder='Opciono'
                />
              </div>

              <div>
                <Label htmlFor='batterySerial' className='text-slate-300 flex items-center gap-2'>
                  <Battery className='w-4 h-4 text-green-400' />
                  Serijski broj baterije
                </Label>
                <input
                  id='batterySerial'
                  name='batterySerial'
                  type='text'
                  value={formData.batterySerial}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className='w-full mt-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                  placeholder='Opciono'
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor='osPassword' className='text-slate-300 flex items-center gap-2'>
                <Lock className='w-4 h-4' />
                Lozinka Operativnog Sistema
              </Label>
              <input
                id='osPassword'
                name='osPassword'
                type='text'
                value={formData.osPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                className='w-full mt-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all'
                placeholder='Lozinka za prijavu ili PIN (ako je potrebno za testiranje)'
              />
            </div>

            <div>
              <Label htmlFor='issueDescription' className='text-slate-300'>Opis Kvara *</Label>
              <textarea
                id='issueDescription'
                name='issueDescription'
                value={formData.issueDescription}
                onChange={handleChange}
                disabled={isSubmitting}
                rows={3}
                className={`w-full mt-1 px-4 py-2 bg-slate-900/50 border ${errors.issueDescription ? 'border-red-500' : 'border-slate-600'} rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none`}
                placeholder='Opišite primarni problem...'
              />
              {errors.issueDescription && (
                <p className='text-red-400 text-sm mt-1'>{errors.issueDescription}</p>
              )}
            </div>

            <div>
              <Label htmlFor='notes' className='text-slate-300 flex items-center gap-2'>
                <MessageSquare className='w-4 h-4 text-purple-400' />
                Napomena
              </Label>
              <textarea
                id='notes'
                name='notes'
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting}
                rows={2}
                className='w-full mt-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none'
                placeholder='Važne napomene...'
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`flex items-center space-x-2 bg-slate-900/30 p-3 rounded-lg border border-slate-700 h-full ${isSubmitting ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  id="keepData"
                  name="keepData"
                  checked={formData.keepData}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:cursor-not-allowed"
                />
                <Label 
                  htmlFor="keepData" 
                  className={`text-slate-300 flex items-center gap-2 select-none ${!isSubmitting ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <Database className='w-4 h-4 text-yellow-500' />
                  <span className='font-medium'>Sačuvati Podatke (Bez Formatiranja)</span>
                </Label>
              </div>

              <div className={`flex items-center space-x-3 bg-slate-900/30 p-3 rounded-lg border border-slate-700 h-full ${isSubmitting ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="checkbox"
                    id="hasBag"
                    name="hasBag"
                    checked={formData.hasBag}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 disabled:cursor-not-allowed"
                  />
                  <Label 
                    htmlFor="hasBag" 
                    className={`text-slate-300 flex items-center gap-2 select-none ${!isSubmitting ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    <ShoppingBag className='w-4 h-4 text-purple-500' />
                    <span className='font-medium uppercase'>TORBA</span>
                  </Label>
                </div>
                
                {formData.hasBag && (
                  <input
                    type="text"
                    name="bagDescription"
                    value={formData.bagDescription}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="Opis (npr. Crna HP)"
                    className='flex-1 min-w-0 px-3 py-1 bg-slate-900/50 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                    autoFocus
                  />
                )}
              </div>
            </div>

          </div>

          <div className='bg-slate-900/50 p-4 rounded-lg border border-slate-700 mt-6'>
            <h4 className='text-sm font-semibold text-slate-400 flex items-center gap-2 mb-2'>
              <AlertCircle className='w-4 h-4' />
              Pravila i Uslovi
            </h4>
            <div className='text-xs text-slate-500 space-y-1 h-24 overflow-y-auto pr-2 custom-scrollbar'>
              <p>1. Servis ne odgovara za gubitak podataka. Molimo vas da napravite backup podataka pre predaje, osim ako opcija "Sačuvati Podatke" nije eksplicitno zatražena i tehnički izvodljiva.</p>
              <p>2. Uređaji koji se ne preuzmu u roku od 30 dana od obaveštenja o završetku mogu biti reciklirani radi naplate troškova.</p>
              <p>3. Minimalna dijagnostika se naplaćuje ako se odustane od popravke nakon dijagnostike.</p>
              <p>4. Garancija pokriva samo zamenjene delove i rad za specifičnu popravku u trajanju od 90 dana.</p>
              <p>5. Popravke fizičkih oštećenja ili oštećenja od tečnosti nemaju garanciju osim ako nije drugačije navedeno.</p>
              <p>6. Potpisivanjem ili predajom ovog naloga, slažete se sa ovim uslovima i ovlašćujete servisne radove.</p>
            </div>
          </div>

          <div className='mt-8 flex justify-end px-4'>
            <div className='flex flex-col items-center w-64'>
              <div className='w-full border-b border-slate-500 mb-2'></div>
              <p className='text-xs font-bold text-slate-400 uppercase tracking-wider'>
                PREDAO/LA NA SERVIS
              </p>
            </div>
          </div>

          <div className='flex gap-3 pt-2'>
            <Button
              type='button'
              onClick={onClose}
              variant='outline'
              disabled={isSubmitting}
              className='flex-1 bg-slate-700 hover:bg-slate-600 text-white border-slate-600 disabled:opacity-50'
            >
              Otkaži
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='w-5 h-5 mr-2 animate-spin' />
                  Kreiranje...
                </>
              ) : (
                'Kreiraj Nalog'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTicketDialog;