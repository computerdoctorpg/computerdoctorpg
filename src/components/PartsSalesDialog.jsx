import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const PartsSalesDialog = ({ part, isOpen, onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Reset form when opened with a new part
  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setLastName('');
      setPhone('');
    }
  }, [isOpen]);

  if (!part) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Sva polja su obavezna.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Koristimo parts_sales_new tabelu koja ima ispravne relacije prema zadatku
      const { error } = await supabase
        .from('parts_sales_new')
        .insert([{
          part_id: part.id,
          customer_name: firstName,
          customer_surname: lastName,
          phone_number: phone,
          sale_price: part.price || 0,
          sale_date: new Date().toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Uspješno prodato",
        description: `Deo ${part.name} je uspešno evidentiran kao prodat.`,
        className: "bg-green-600 text-white border-none"
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error recording sale:', error);
      toast({
        variant: "destructive",
        title: "Greška pri prodaji",
        description: "Došlo je do greške prilikom evidencije prodaje.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="w-5 h-5 text-blue-400" />
            Prodaja dela
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Unesite podatke o kupcu za dio: <strong className="text-white">{part.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-slate-900/50 p-3 rounded-lg mb-4 text-sm border border-slate-700">
          <div className="flex justify-between mb-1">
            <span className="text-slate-400">Proizvođač:</span>
            <span className="text-white font-medium">{part.manufacturer || '-'}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-slate-400">Part Number:</span>
            <span className="text-white font-mono">{part.part_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Cena:</span>
            <span className="text-green-400 font-bold">€{part.price || '0.00'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-slate-300">Ime kupca</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-slate-900 border-slate-600 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-slate-300">Prezime kupca</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-slate-900 border-slate-600 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-300">Broj telefona</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-slate-900 border-slate-600 text-white"
              placeholder="+382 6X XXX XXX"
              required
            />
          </div>
          
          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
              Otkaži
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
              Prodato
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PartsSalesDialog;