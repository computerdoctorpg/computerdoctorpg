import React from 'react';
import { Printer, CheckCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const TicketSuccessDialog = ({ isOpen, onClose, onPrint }) => {
  const handlePrintClick = () => {
    onPrint(); // This will trigger the print action
    // onClose() is now handled within RepairTicketsDashboard after print initiates
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='bg-slate-800 border-slate-700 text-white max-w-md text-center sm:rounded-xl'>
        <div className="flex flex-col items-center p-4 space-y-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <DialogTitle className='text-2xl font-bold text-white'>
            Nalog Uspešno Kreiran!
          </DialogTitle>
          
          <p className="text-slate-400">
            Servisni nalog je registrovan u sistemu. Da li želite da odštampate prijemni list?
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
            <Button
              onClick={onClose}
              variant='outline'
              className='flex-1 bg-slate-700 hover:bg-slate-600 text-white border-slate-600 h-12'
            >
              Zatvori
            </Button>
            <Button
              onClick={handlePrintClick}
              className='flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg flex items-center justify-center gap-2 h-12 text-lg'
            >
              <Printer className='w-5 h-5' />
              Štampaj Prijemni List
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketSuccessDialog;