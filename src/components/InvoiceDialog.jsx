import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const InvoiceDialog = ({ isOpen, onClose, ticket }) => {
  const invoiceRef = useRef(null);
  const { toast } = useToast();

  if (!ticket) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const invoiceNumber = `INV-${ticket.id}`;
  const invoiceDate = ticket.completedAt ? formatDate(ticket.completedAt) : formatDate(new Date().toISOString());

  const handleDownload = () => {
    toast({
      title: "Download Started",
      description: "Your invoice is being prepared for download.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='bg-white text-slate-900 max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-full'>
        {/* Action Buttons - Hidden on Print */}
        <div className='print:hidden mb-4 flex justify-end gap-2'>
          <Button
            onClick={handlePrint}
            variant='outline'
            className='flex items-center gap-2'
          >
            <Printer className='w-4 h-4' />
            Print
          </Button>
          <Button
            onClick={handleDownload}
            className='bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center gap-2'
          >
            <Download className='w-4 h-4' />
            Download PDF
          </Button>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className='bg-white p-8 space-y-8'>
          {/* Header */}
          <div className='flex justify-between items-start border-b-2 border-slate-800 pb-6'>
            <div>
              <h1 className='text-4xl font-bold text-slate-900 mb-2'>INVOICE</h1>
              <p className='text-slate-600'>PC Repair Service</p>
              <p className='text-slate-600'>Professional Computer Repairs</p>
            </div>
            <div className='text-right'>
              <p className='text-2xl font-bold text-slate-900'>{invoiceNumber}</p>
              <p className='text-slate-600 mt-1'>Date: {invoiceDate}</p>
            </div>
          </div>

          {/* Customer & Service Details */}
          <div className='grid grid-cols-2 gap-8'>
            <div>
              <h2 className='text-lg font-bold text-slate-900 mb-3'>Bill To:</h2>
              <div className='text-slate-700 space-y-1'>
                <p className='font-semibold'>{ticket.customerName} {ticket.customerSurname}</p>
                <p>{ticket.customerEmail}</p>
              </div>
            </div>
            <div>
              <h2 className='text-lg font-bold text-slate-900 mb-3'>Device Information:</h2>
              <div className='text-slate-700 space-y-1'>
                <p><span className='font-semibold'>Device:</span> {ticket.deviceName}</p>
                <p><span className='font-semibold'>Serial #:</span> {ticket.deviceSerial}</p>
                {ticket.chargerSerial && (
                  <p><span className='font-semibold'>Charger Serial #:</span> {ticket.chargerSerial}</p>
                )}
              </div>
            </div>
          </div>

          {/* Issue Description */}
          {ticket.issueDescription && (
            <div>
              <h2 className='text-lg font-bold text-slate-900 mb-3'>Reported Issue:</h2>
              <p className='text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200'>
                {ticket.issueDescription}
              </p>
            </div>
          )}

          {/* Repair Details */}
          <div>
            <h2 className='text-lg font-bold text-slate-900 mb-3'>Repair Details & Work Performed:</h2>
            <div className='text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap'>
              {ticket.repairDetails || 'No repair details provided.'}
            </div>
          </div>

          {/* Service Timeline */}
          <div>
            <h2 className='text-lg font-bold text-slate-900 mb-3'>Service Timeline:</h2>
            <div className='space-y-2'>
              <div className='flex justify-between text-slate-700 bg-slate-50 p-3 rounded'>
                <span>Service Received:</span>
                <span className='font-semibold'>{formatDate(ticket.createdAt)}</span>
              </div>
              {ticket.completedAt && (
                <div className='flex justify-between text-slate-700 bg-slate-50 p-3 rounded'>
                  <span>Service Completed:</span>
                  <span className='font-semibold'>{formatDate(ticket.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Service Summary Table */}
          <div>
            <h2 className='text-lg font-bold text-slate-900 mb-3'>Service Summary:</h2>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-slate-800 text-white'>
                  <th className='text-left p-3 border border-slate-700'>Description</th>
                  <th className='text-right p-3 border border-slate-700'>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className='p-3 border border-slate-300'>
                    <p className='font-semibold'>Computer Repair Service</p>
                    <p className='text-sm text-slate-600'>{ticket.deviceName}</p>
                  </td>
                  <td className='text-right p-3 border border-slate-300 font-semibold'>
                    $0.00
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className='bg-slate-100 font-bold'>
                  <td className='text-right p-3 border border-slate-300'>Total:</td>
                  <td className='text-right p-3 border border-slate-300'>$0.00</td>
                </tr>
              </tfoot>
            </table>
            <p className='text-sm text-slate-500 mt-2 italic'>
              * Please contact us for pricing details
            </p>
          </div>

          {/* Footer */}
          <div className='border-t-2 border-slate-800 pt-6 space-y-3'>
            <p className='text-slate-700'>
              <span className='font-semibold'>Terms & Conditions:</span> Payment is due within 30 days. 
              All repairs come with a 90-day warranty on parts and labor.
            </p>
            <p className='text-center text-slate-600 text-sm mt-4'>
              Thank you for your business!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;