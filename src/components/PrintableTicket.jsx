import React from 'react';
import { MapPin, Phone, Mail, Clock, CheckSquare, Square, ShoppingBag } from 'lucide-react';

const PrintableTicket = ({ ticket }) => {
  if (!ticket) return null;

  return (
    <div 
      className="flex flex-col w-[210mm] h-[297mm] bg-white text-black p-[10mm] font-sans box-border relative overflow-hidden" 
      style={{ 
        color: 'black', 
        backgroundColor: 'white',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        colorScheme: 'light'
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-[1.5px] border-black pb-2 mb-2">
        <div className="flex items-center gap-3">
          <img 
            className="h-14 w-auto object-contain" 
            alt="Computer Doctor logo" 
            src="/images/logo.png" 
          />
          <div>
            <h1 
              className="text-xl font-bold tracking-tight leading-none text-[#22c55e]"
              style={{ color: '#22c55e', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              COMPUTER DOCTOR
            </h1>
            <p className="text-[10px] text-gray-800 mt-1 font-medium">Profesionalni Servis Računara</p>
          </div>
        </div>
        <div className="text-right text-[9px] space-y-1 text-black font-medium">
          <div className="flex items-center justify-end gap-1.5">
            <span>Bul. Ibrahima Koristovica bb, Podgorica</span>
            <MapPin className="w-3 h-3" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span>068/862-807</span>
            <Phone className="w-3 h-3" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span>prodaja@computer-doctor.me</span>
            <Mail className="w-3 h-3" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span>Radno vrijeme: Pon-Subota 9h-17h</span>
            <Clock className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Title & Date */}
      <div className="flex justify-between items-end mb-3">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-black">PRIJEMNI LIST</h2>
          <p className="text-xs font-mono text-gray-800 mt-0.5">
            Broj Prijema: <span className="font-bold text-black text-lg ml-1">#{ticket.id}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-600 uppercase tracking-wider font-bold mb-0.5">Datum Prijema</p>
          <p className="font-bold text-sm text-black">{new Date(ticket.createdAt).toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      {/* Info Grid - Compact Layout */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* Customer Info */}
        <div 
          className="border-[1.5px] border-black rounded-lg p-2 bg-gray-50"
          style={{ backgroundColor: '#f9fafb', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
          <h3 className="font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-[10px] tracking-wider text-black flex items-center gap-2">
            Klijent
          </h3>
          <div className="space-y-1 text-[11px] text-black">
            <div className="grid grid-cols-3 items-center">
              <span className="text-gray-700 font-medium">Ime i Prezime:</span>
              <span className="col-span-2 font-bold uppercase">{ticket.customerName} {ticket.customerSurname}</span>
            </div>
            <div className="grid grid-cols-3 items-center">
              <span className="text-gray-700 font-medium">Telefon:</span>
              <span className="col-span-2 font-bold">{ticket.customerPhone}</span>
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div 
          className="border-[1.5px] border-black rounded-lg p-2 bg-gray-50"
          style={{ backgroundColor: '#f9fafb', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
          <h3 className="font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-[10px] tracking-wider text-black flex items-center gap-2">
            Uređaj
          </h3>
          <div className="space-y-1 text-[11px] text-black">
            <div className="grid grid-cols-4 items-center">
              <span className="text-gray-700 font-medium">Model:</span>
              <span className="col-span-3 font-bold uppercase truncate">{ticket.deviceName}</span>
            </div>
            <div className="grid grid-cols-4 items-center">
              <span className="text-gray-700 font-medium">S/N laptopa:</span>
              <span className="col-span-3 font-mono font-bold bg-white px-1 border border-gray-200 truncate">{ticket.deviceSerial || 'NEMA'}</span>
            </div>
            <div className="grid grid-cols-4 items-center">
              <span className="text-gray-700 font-medium">S/N baterije:</span>
              <span className="col-span-3 font-mono font-bold truncate">{ticket.batterySerial || 'NEMA'}</span>
            </div>
            <div className="grid grid-cols-4 items-center">
              <span className="text-gray-700 font-medium">S/N punjača:</span>
              <span className="col-span-3 font-mono font-bold truncate">{ticket.chargerSerial || 'NEMA'}</span>
            </div>
             <div className="grid grid-cols-4 items-center">
              <span className="text-gray-700 font-medium">OS Šifra:</span>
              <span className="col-span-3 font-mono font-bold truncate">{ticket.osPassword || 'NEMA'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issues & Notes - Flexible Height with Prominent Problem Description */}
      <div className="flex-grow flex flex-col gap-3 mb-3">
        
        {/* ENHANCED PROBLEM DESCRIPTION SECTION */}
        <div 
          className="border-[2.5px] border-black rounded-lg p-3 flex-1 flex flex-col bg-gray-100 shadow-sm"
          style={{ 
            backgroundColor: '#f3f4f6', 
            borderColor: '#000000',
            WebkitPrintColorAdjust: 'exact', 
            printColorAdjust: 'exact' 
          }}
        >
          <h3 className="font-extrabold border-b-[2px] border-gray-300 pb-1.5 mb-2 uppercase text-[12px] tracking-wider text-black">
            Opis Kvara / Prijavljeni Problemi
          </h3>
          <p className="text-[13px] whitespace-pre-wrap leading-relaxed font-bold text-black flex-1">
            {ticket.issueDescription}
          </p>
        </div>

        {/* ENHANCED NOTES SECTION */}
        <div 
          className="border-2 border-gray-400 rounded-lg py-2 px-3 min-h-[80px] flex flex-col bg-gray-50 shadow-sm"
          style={{ 
            backgroundColor: '#f9fafb', 
            borderColor: '#9ca3af',
            WebkitPrintColorAdjust: 'exact', 
            printColorAdjust: 'exact' 
          }}
        >
          <h3 className="font-extrabold border-b-[2px] border-gray-300 pb-1.5 mb-2 uppercase text-[12px] tracking-wider text-black">
            NAPOMENA
          </h3>
          <p className="text-[13px] whitespace-pre-wrap leading-relaxed font-bold text-black flex-1">
            {ticket.notes || 'Nema napomena'}
          </p>
        </div>

        {/* Checkboxes */}
        <div 
          className="flex gap-6 text-[11px] py-2 px-3 border-[1.5px] border-black rounded-lg bg-gray-50 mt-auto"
          style={{ backgroundColor: '#f9fafb', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
           <div className="flex items-center gap-2">
            {ticket.keepData ? <CheckSquare className="w-5 h-5 text-black" /> : <Square className="w-5 h-5 text-gray-400" />}
            <span className={`font-bold uppercase tracking-wide ${ticket.keepData ? 'text-black' : 'text-gray-500'}`}>Sačuvati podatke</span>
          </div>
          <div className="flex items-center gap-2">
            {ticket.hasBag ? <ShoppingBag className="w-5 h-5 text-black" /> : <ShoppingBag className="w-5 h-5 text-gray-400" />}
            <span className={`font-bold uppercase tracking-wide ${ticket.hasBag ? 'text-black' : 'text-gray-500'}`}>
              Torba
              {ticket.hasBag && ticket.bagDescription && (
                <span className="font-semibold text-gray-700 ml-1 normal-case">
                  ({ticket.bagDescription})
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Section - Fixed at bottom */}
      <div className="mt-auto pt-2 border-t-[2px] border-black">
        {/* Rules */}
        <div className="mb-2">
          <h4 className="text-[9px] font-extrabold uppercase mb-1 text-black tracking-widest">USLOVI SERVISIRANJA</h4>
          
          <div className="text-[7.5px] font-bold mb-1.5 leading-tight text-black border-b border-gray-300 pb-1.5">
            PREUZIMANJEM I POTPISIVANJEM OVOG DOKUMENTA PODRAZUMIJEVА SE DA JE KORISNIK SAGLASAN SA UNIJETIM PODACIMA, DA JE PAŽLJIVO PROČITAO I DA JE UPOZNAT SA SLJEDEĆIM USLOVIMA:
          </div>

          <div className="text-[7px] leading-[9.5px] text-gray-800 text-justify columns-2 gap-6 space-y-1 font-medium">
            <p>1. Servis ne obavještava korisnika o servisnim uslugama na uređaju koje su do 10€.</p>
            <p>2. Servis je obavezan da prije početka servisiranja i po završenom servisu uredno obavijesti korisnika SMS porukom, e-mailom ili telefonskim pozivom.</p>
            <p>3. Servis je dužan da u roku od 48h (isključujući vikend) konstatuje kvar na uređaju i obavijesti korisnika.</p>
            <p>4. Dijagnostika uređaja se naplaćuje 40€ samo u slučaju da korisnik NE želi da odobri popravku nakon utvrđivanja kvara. Ukoliko korisnik odobri popravku, dijagnostika se ne naplaćuje.</p>
            <p>5. Korisnik je dužan da izmiri troškove servisiranja prije preuzimanja uređaja.</p>
            <p className="font-extrabold text-black uppercase">6. SERVIS NE ODGOVARA ZA PODATKE NA UREĐAJU. KORISNIK JE OBAVEZAN DA URADI REZERVNU KOPIJU (BACKUP) PRIJE DONOŠENJA UREĐAJA NA SERVIS.</p>
            <p>7. Korisnik je dužan da preuzme uređaj u roku od 15 dana. Nakon isteka roka uređaj ostaje u servisu do daljnjeg, ali servis ne snosi odgovornost za eventualnu štetu ili gubitak.</p>
            <p>8. Dopunjavanjem kertridža gubi se garancija na štampač.</p>
            <p>9. Uređaj se preuzima isključivo uz servisnu prijemnicu.</p>
            <p>10. Korisnik gubi pravo na reklamaciju ukoliko je uređaj oštećen, pokvaren ili ima mehanička oštećenja nastala greškom korisnika.</p>
            <p>11. Softverske greške ne ulaze u garanciju; garancija se ne odnosi na operativni sistem i programe.</p>
            <p>12. Prilikom popunjavanja prijemnog lista obavezan je detaljan pregled uređaja radi evidencije postojećih nedostataka.</p>
            <p>13. U okviru procedure "čuvanja podataka" podrazumijevaju se slike, muzika i tekstualni fajlovi. Ne podrazumijevaju se programi i šifre.</p>
            <p>14. Servis ne radi vikendom.</p>
          </div>
        </div>
        
        <div 
          className="text-center font-extrabold text-[15px] mt-2 mb-3 uppercase tracking-widest text-[#ef4444] border-[1.5px] border-[#ef4444] py-1.5 bg-gray-50"
          style={{ 
            color: '#ef4444', 
            borderColor: '#ef4444', 
            backgroundColor: '#f9fafb',
            WebkitPrintColorAdjust: 'exact', 
            printColorAdjust: 'exact' 
          }}
        >
          DIJAGNOSTIKA SE NAPLAĆUJE 30 EURA
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-1">
          <div className="text-center">
             <div className="border-b-[1.5px] border-black mb-1 h-8 w-full"></div>
             <p className="font-bold text-[10px] uppercase tracking-wider text-black">Preuzeo (Servis)</p>
             <p className="text-[8px] text-gray-600 font-medium mt-0.5">Computer Doctor</p>
          </div>
          <div className="text-center">
             <div className="border-b-[1.5px] border-black mb-1 h-8 w-full"></div>
             <p className="font-bold text-[10px] uppercase tracking-wider text-black">Predao (Klijent)</p>
             <p className="text-[8px] text-gray-600 font-medium mt-0.5">Saglasan/na sa uslovima servisa</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableTicket;