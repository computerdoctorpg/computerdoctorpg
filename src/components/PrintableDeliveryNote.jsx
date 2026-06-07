import React from 'react';
import { MapPin, Phone, Mail, Settings, Banknote, Clock, CheckSquare, Square, ShoppingBag } from 'lucide-react';

const PrintableDeliveryNote = ({ ticket }) => {
  if (!ticket) return null;

  const partsCost = parseFloat(ticket.partsCost || 0);
  const serviceCost = parseFloat(ticket.serviceCost || 0);
  const totalCost = partsCost + serviceCost;

  // Prefer Dispatch Note Number if available, else fallback to ID
  const dispatchNumber = ticket.dispatchNote_number || ticket.dispatchNoteNumber || ticket.id;

  return (
    <div 
      className="flex flex-col w-[210mm] h-[297mm] bg-white text-black p-[15mm] font-sans box-border relative overflow-hidden z-50"
      style={{ 
        color: 'black', 
        backgroundColor: 'white',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        colorScheme: 'light'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-black pb-4 mb-6">
        <div className="flex items-center gap-4">
          <img 
            className="h-20 w-auto object-contain" 
            alt="Computer Doctor logo" 
            src="/images/logo-delivery.png" 
          />
        </div>
        <div className="text-right text-[9px] space-y-1.5 text-gray-700">
          <div className="flex items-center justify-end gap-2">
            <span>Bul. Ibrahima Koristovica bb, Podgorica</span>
            <MapPin className="w-3 h-3" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span>068/862-807</span>
            <Phone className="w-3 h-3" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span>prodaja@computer-doctor.me</span>
            <Mail className="w-3 h-3" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <span>Radno vrijeme: Pon-Subota 9h-17h</span>
            <Clock className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Title & Date */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wide">OTPREMNICA</h2>
          <p className="text-sm font-mono text-gray-600 mt-1">
            Broj Otpremnice: <span className="font-bold text-black text-lg">#{dispatchNumber}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Vezano za Prijem: #{ticket.id}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Datum Završetka</p>
          <p className="font-bold text-sm">{new Date(ticket.completed_at || ticket.completedAt || new Date()).toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      {/* Customer & Device Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div 
          className="border border-gray-300 rounded p-4 bg-gray-50"
          style={{ backgroundColor: '#f9fafb', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
          <h3 className="font-bold border-b border-gray-300 pb-2 mb-2 uppercase text-[10px] tracking-wider text-gray-500">Klijent</h3>
          <div className="space-y-1 text-xs">
            <p className="font-bold text-sm">{ticket.customerName || ticket.clients?.first_name} {ticket.customerSurname || ticket.clients?.last_name}</p>
            <p>{ticket.customerPhone || ticket.clients?.phone}</p>
            <p>{ticket.customerEmail || ticket.clients?.email}</p>
          </div>
        </div>
        <div 
          className="border border-gray-300 rounded p-4 bg-gray-50"
          style={{ backgroundColor: '#f9fafb', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
          <h3 className="font-bold border-b border-gray-300 pb-2 mb-2 uppercase text-[10px] tracking-wider text-gray-500">Uređaj</h3>
          <div className="space-y-1.5 text-[11px]">
            <p className="font-bold text-sm mb-1">{ticket.deviceName || ticket.device_name}</p>
            <div className="grid grid-cols-3 gap-1 items-center">
              <span className="text-gray-600 font-medium">S/N uređaja:</span>
              <span className="col-span-2 font-mono font-bold bg-white px-1 border border-gray-200 truncate">{ticket.deviceSerial || ticket.device_serial || 'NEMA'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 items-center">
              <span className="text-gray-600 font-medium">S/N baterije:</span>
              <span className="col-span-2 font-mono font-bold truncate">{ticket.batterySerial || ticket.battery_serial || 'NEMA'}</span>
            </div>
            <div className="grid grid-cols-3 gap-1 items-center">
              <span className="text-gray-600 font-medium">S/N punjača:</span>
              <span className="col-span-2 font-mono font-bold truncate">{ticket.chargerSerial || ticket.charger_serial || 'NEMA'}</span>
            </div>
             <div className="grid grid-cols-3 gap-1 items-center">
              <span className="text-gray-600 font-medium">OS Šifra:</span>
              <span className="col-span-2 font-mono font-bold truncate">{ticket.osPassword || ticket.os_password || 'NEMA'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Work Done Section - Main Content Area */}
      <div className="mb-6 border-t border-black pt-6 flex-grow">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2 uppercase tracking-tight">
          <Settings className="w-4 h-4" />
          Izvještaj Servisa
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-[10px] uppercase text-gray-600 mb-1 tracking-wider">Opis Izvršenih Radova</h4>
            <div className="border border-gray-300 rounded p-3 text-xs whitespace-pre-wrap leading-relaxed min-h-[80px]">
              {ticket.repairDetails || ticket.repair_details || 'Nema unesenih detalja o radu.'}
            </div>
          </div>

          {(ticket.partsUsed || ticket.parts_used) && (
            <div>
              <h4 className="font-bold text-[10px] uppercase text-gray-600 mb-1 tracking-wider">Ugrađeni Djelovi</h4>
              <div className="border border-gray-300 rounded p-3 text-xs whitespace-pre-wrap leading-relaxed">
                {ticket.partsUsed || ticket.parts_used}
              </div>
            </div>
          )}
        </div>

        {/* Checkboxes for accessories/data */}
        <div className="flex gap-8 text-xs pt-6 px-2">
           <div className="flex items-center gap-2">
            {(ticket.keepData || ticket.keep_data) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-gray-300" />}
            <span className={`font-semibold ${(ticket.keepData || ticket.keep_data) ? 'text-black' : 'text-gray-500'}`}>Podaci sačuvani</span>
          </div>
          <div className="flex items-center gap-2">
            {(ticket.hasBag || ticket.has_bag) ? <ShoppingBag className="w-5 h-5 text-black" /> : <ShoppingBag className="w-5 h-5 text-gray-300" />}
            <span className={`font-semibold ${(ticket.hasBag || ticket.has_bag) ? 'text-black' : 'text-gray-500'}`}>
              Torba
              {(ticket.hasBag || ticket.has_bag) && (ticket.bagDescription || ticket.bag_description) && (
                <span className="font-normal text-gray-600 ml-1">
                  - {ticket.bagDescription || ticket.bag_description}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Financials */}
      <div className="mb-8">
        <h3 className="text-sm font-bold mb-2 flex items-center gap-2 uppercase tracking-tight">
          <Banknote className="w-4 h-4" />
          Pregled Troškova
        </h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left">
              <th className="py-2 font-semibold text-gray-600 w-2/3 uppercase text-[10px] tracking-wider">Stavka</th>
              <th className="py-2 font-semibold text-gray-600 text-right uppercase text-[10px] tracking-wider">Iznos (€)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2">Djelovi</td>
              <td className="py-2 text-right font-mono">{partsCost.toFixed(2)} €</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2">Servisna Usluga</td>
              <td className="py-2 text-right font-mono">{serviceCost.toFixed(2)} €</td>
            </tr>
            <tr 
              className="font-bold text-sm bg-gray-50"
              style={{ backgroundColor: '#f9fafb', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              <td className="py-2 pl-2 border-t-2 border-black">UKUPNO ZA NAPLATU</td>
              <td className="py-2 pr-2 text-right border-t-2 border-black font-mono text-lg">{totalCost.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer / Signature Section */}
      <div className="mt-auto">
        {/* Warning Text */}
        <div 
          className="text-center mb-10 uppercase tracking-tight"
          style={{ 
            color: '#FF0000',
            fontWeight: 'bold',
            fontSize: '12px',
            WebkitPrintColorAdjust: 'exact', 
            printColorAdjust: 'exact' 
          }}
        >
          KORISNIK JE DUZAN DA PROVJERI SVE PRILIKOM PREUZIMANJA UREDJAJA JER NAKANDNE REKLAMACIJE NE VAZE.
        </div>

        {/* Signatures Layout */}
        <div className="flex justify-between items-start gap-20 px-4 mb-8">
          <div className="flex flex-col items-center w-full max-w-[200px]">
            <span className="text-[10px] font-bold uppercase tracking-wider mb-12">SERVISA PREDAO</span>
            <div className="border-b border-black w-full"></div>
            <span className="text-[8px] text-gray-500 mt-1 uppercase">M.P.</span>
          </div>
          
          <div className="flex flex-col items-center w-full max-w-[250px]">
            <span className="text-[10px] font-bold uppercase tracking-wider mb-12">KORISNIK PREUZEO SA SERVISA</span>
            <div className="border-b border-black w-full"></div>
            <span className="text-[8px] text-gray-500 mt-1 uppercase">Svojeručno potpisao klijent</span>
          </div>
        </div>

        <div className="text-center text-[9px] text-gray-400 mt-4 border-t border-gray-100 pt-2">
          Hvala Vam na ukazanom povjerenju! Vaš Computer Doctor tim.
        </div>
      </div>
    </div>
  );
};

export default PrintableDeliveryNote;