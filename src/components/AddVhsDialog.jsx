import React, { useState, useMemo } from 'react';
import { Film, User, Phone, Loader2, Hash, ClipboardList, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export const VHS_PRICE_PER_CASSETTE = 30;

const emptyForm = {
  customerName: '',
  customerSurname: '',
  customerPhone: '',
  vhsCassetteCount: '1',
  vhsCassetteCondition: '',
  notes: '',
};

const AddVhsDialog = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const count = parseInt(formData.vhsCassetteCount, 10) || 0;
  const totalPrice = useMemo(() => count * VHS_PRICE_PER_CASSETTE, [count]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!formData.customerName.trim()) next.customerName = 'Ime je obavezno';
    if (!formData.customerSurname.trim()) next.customerSurname = 'Prezime je obavezno';
    if (!formData.customerPhone.trim()) next.customerPhone = 'Telefon je obavezan';
    if (!count || count < 1) next.vhsCassetteCount = 'Unesite broj kaseta (min. 1)';
    if (!formData.vhsCassetteCondition.trim()) next.vhsCassetteCondition = 'Opišite stanje kaseta';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        vhsCassetteCount: count,
        vhsPricePerCassette: VHS_PRICE_PER_CASSETTE,
        estimatedCost: totalPrice,
        serviceCost: totalPrice,
      });
      setFormData(emptyForm);
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isSubmitting ? onClose : undefined}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Film className="w-6 h-6 text-amber-400" />
            Prijem Snimaka
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="p-3 rounded-lg bg-blue-900/25 border border-blue-600/30 text-sm text-blue-200">
            Cena po kaseti: <strong className="text-white">{VHS_PRICE_PER_CASSETTE} €</strong>
            {' '}— u cenu je uključen USB sa snimcima u <strong className="text-white">MP4</strong> formatu.
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
              <User className="w-4 h-4" /> Klijent
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Ime *</Label>
                <input name="customerName" value={formData.customerName} onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 outline-none" />
                {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName}</p>}
              </div>
              <div>
                <Label className="text-slate-300">Prezime *</Label>
                <input name="customerSurname" value={formData.customerSurname} onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 outline-none" />
                {errors.customerSurname && <p className="text-red-400 text-xs mt-1">{errors.customerSurname}</p>}
              </div>
            </div>
            <div>
              <Label className="text-slate-300 flex items-center gap-1"><Phone className="w-4 h-4" /> Telefon *</Label>
              <input name="customerPhone" value={formData.customerPhone} onChange={handleChange}
                className="w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 outline-none" />
              {errors.customerPhone && <p className="text-red-400 text-xs mt-1">{errors.customerPhone}</p>}
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-amber-900/20 border border-amber-600/30">
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <Film className="w-4 h-4" /> Kasete
            </h3>
            <div>
              <Label className="text-slate-300 flex items-center gap-1"><Hash className="w-4 h-4" /> Broj kaseta *</Label>
              <input name="vhsCassetteCount" type="number" min="1" value={formData.vhsCassetteCount} onChange={handleChange}
                className="w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 outline-none" />
              {errors.vhsCassetteCount && <p className="text-red-400 text-xs mt-1">{errors.vhsCassetteCount}</p>}
            </div>
            <div>
              <Label className="text-slate-300 flex items-center gap-1"><ClipboardList className="w-4 h-4" /> Stanje kaseta *</Label>
              <textarea name="vhsCassetteCondition" value={formData.vhsCassetteCondition} onChange={handleChange} rows={3}
                placeholder="npr. Dobro stanje, etikete vidljive, 3 kasete bez kutije..."
                className="w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 outline-none resize-y" />
              {errors.vhsCassetteCondition && <p className="text-red-400 text-xs mt-1">{errors.vhsCassetteCondition}</p>}
            </div>
            <div>
              <Label className="text-slate-300 flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Napomena</Label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2}
                className="w-full mt-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 outline-none resize-y" />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-amber-700/40">
              <span className="text-slate-300 text-sm">Ukupno ({count || 0} × {VHS_PRICE_PER_CASSETTE} €)</span>
              <span className="text-2xl font-bold text-amber-300">{totalPrice} €</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="border-slate-600 text-slate-300">
              Otkaži
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Film className="w-4 h-4 mr-2" />}
              Kreiraj prijem
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVhsDialog;
