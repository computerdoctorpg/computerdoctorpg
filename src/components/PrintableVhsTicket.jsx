import React from 'react';
import { MapPin, Phone, Mail, Clock, Film } from 'lucide-react';
import { getPrintStrings, getTicketLocale } from '@/lib/printTranslations';

const printExact = {
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
};

const VHS_PRICE = 30;

const PrintableVhsTicket = ({ ticket }) => {
  if (!ticket) return null;

  const locale = getTicketLocale(ticket);
  const t = getPrintStrings(locale);
  const count = parseInt(ticket.vhsCassetteCount, 10) || 1;
  const pricePer = parseFloat(ticket.vhsPricePerCassette) || VHS_PRICE;
  const total = count * pricePer;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(t.dateLocale, {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

  return (
    <div
      className="flex flex-col w-[210mm] min-h-[297mm] bg-white text-black p-[10mm] font-sans box-border"
      style={{ color: 'black', backgroundColor: 'white', colorScheme: 'light', ...printExact }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3">
        <div className="flex items-center gap-3">
          <img className="h-16 w-auto object-contain" alt="Computer Doctor logo" src="/images/logo.png" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight leading-none" style={{ color: '#16a34a', ...printExact }}>
              COMPUTER DOCTOR
            </h1>
            <p className="text-[10px] text-gray-700 mt-1 font-semibold">{t.vhsTagline}</p>
          </div>
        </div>
        <div className="text-right text-[9px] space-y-1 text-black font-medium leading-snug">
          <div className="flex items-center justify-end gap-1.5">
            <span>Bul. Ibrahima Koristovica bb</span>
            <MapPin className="w-3 h-3 shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span>068/862-807</span>
            <Phone className="w-3 h-3 shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span>prodaja@computer-doctor.me</span>
            <Mail className="w-3 h-3 shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span>{t.hours}</span>
            <Clock className="w-3 h-3 shrink-0" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div
        className="flex justify-between items-center mb-4 px-4 py-3 rounded-lg border-2 border-black"
        style={{ backgroundColor: '#fef3c7', ...printExact }}
      >
        <div className="flex items-center gap-3">
          <Film className="w-8 h-8" style={{ color: '#92400e', ...printExact }} />
          <div>
            <h2 className="text-xl font-extrabold uppercase tracking-wide text-black">{t.vhsTitle}</h2>
            <p className="text-[10px] font-semibold text-amber-900 mt-0.5">{t.vhsSubtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">{t.intakeNumber}</p>
          <p className="font-mono font-extrabold text-2xl text-black leading-none">#{ticket.id}</p>
          <p className="text-[9px] text-gray-600 mt-1 font-semibold">{formatDate(ticket.createdAt)}</p>
        </div>
      </div>

      {/* USB / MP4 info — istaknuto */}
      <div
        className="mb-4 px-4 py-3 rounded-lg border-[3px] text-center"
        style={{
          backgroundColor: '#eff6ff',
          borderColor: '#2563eb',
          ...printExact,
        }}
      >
        <p
          className="font-extrabold uppercase leading-snug tracking-wide"
          style={{ color: '#1d4ed8', fontSize: '13px', ...printExact }}
        >
          {t.usbNotice}
        </p>
      </div>

      {/* Klijent */}
      <div
        className="mb-3 rounded-lg overflow-hidden border-[1.5px] border-black"
        style={printExact}
      >
        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white" style={{ backgroundColor: '#1e40af', ...printExact }}>
          {t.clientSection}
        </div>
        <div className="p-3 grid grid-cols-2 gap-3 text-[11px]" style={{ backgroundColor: '#f9fafb', ...printExact }}>
          <div>
            <span className="text-gray-600 font-semibold text-[10px] uppercase">{t.fullName}</span>
            <p className="font-bold uppercase text-black mt-0.5">{ticket.customerName} {ticket.customerSurname}</p>
          </div>
          <div>
            <span className="text-gray-600 font-semibold text-[10px] uppercase">{t.phone}</span>
            <p className="font-bold text-black mt-0.5">{ticket.customerPhone}</p>
          </div>
        </div>
      </div>

      {/* Kasete — glavni sadržaj */}
      <div
        className="mb-3 rounded-lg overflow-hidden border-2 border-black flex-1"
        style={printExact}
      >
        <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white" style={{ backgroundColor: '#92400e', ...printExact }}>
          {t.cassetteSection}
        </div>
        <div className="p-4 space-y-4" style={{ backgroundColor: '#fffbeb', ...printExact }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-amber-700 rounded-lg p-3 text-center" style={{ ...printExact }}>
              <p className="text-[10px] font-bold uppercase text-amber-900 tracking-wider">{t.cassetteCount}</p>
              <p className="text-4xl font-extrabold text-black mt-1">{count}</p>
            </div>
            <div className="border-2 border-amber-700 rounded-lg p-3 text-center" style={{ ...printExact }}>
              <p className="text-[10px] font-bold uppercase text-amber-900 tracking-wider">{t.pricePerCassette}</p>
              <p className="text-3xl font-extrabold text-black mt-1">{pricePer.toFixed(0)} €</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-extrabold uppercase text-amber-900 tracking-wider mb-1.5 border-b border-amber-300 pb-1">
              {t.cassetteCondition}
            </p>
            <p className="text-[13px] whitespace-pre-wrap leading-relaxed font-semibold text-black min-h-[60px]">
              {ticket.vhsCassetteCondition || '—'}
            </p>
          </div>

          {ticket.notes && (
            <div>
              <p className="text-[10px] font-extrabold uppercase text-gray-600 tracking-wider mb-1">{t.notesSection}</p>
              <p className="text-[12px] whitespace-pre-wrap font-medium text-black">{ticket.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Ukupna cijena */}
      <div
        className="mb-4 px-4 py-3 rounded-lg border-[3px] flex justify-between items-center"
        style={{ backgroundColor: '#f0fdf4', borderColor: '#16a34a', ...printExact }}
      >
        <span className="text-sm font-extrabold uppercase text-green-900 tracking-wide">
          {t.totalPrice} ({count} × {pricePer.toFixed(0)} €)
        </span>
        <span className="text-3xl font-extrabold" style={{ color: '#15803d', ...printExact }}>
          {total.toFixed(0)} €
        </span>
      </div>

      {/* Uslovi */}
      <div className="mb-3 text-[7px] leading-[10px] text-gray-800 columns-2 gap-4 font-medium">
        {t.vhsTerms.map((term, i) => (
          <p key={i} className={t.vhsBoldTerms.includes(i) ? 'font-bold text-black' : ''}>{term}</p>
        ))}
      </div>

      <div className="mt-auto pt-2 border-t-2 border-black grid grid-cols-2 gap-12">
        <div className="text-center">
          <div className="border-b-[1.5px] border-black mb-1 h-10 w-full" />
          <p className="font-bold text-[10px] uppercase tracking-wider text-black">{t.signedService}</p>
          <p className="text-[8px] text-gray-600 font-medium mt-0.5">Computer Doctor</p>
        </div>
        <div className="text-center">
          <div className="border-b-[1.5px] border-black mb-1 h-10 w-full" />
          <p className="font-bold text-[10px] uppercase tracking-wider text-black">{t.signedClient}</p>
          <p className="text-[8px] text-gray-600 font-medium mt-0.5">{t.clientAgreesShort}</p>
        </div>
      </div>
    </div>
  );
};

export default PrintableVhsTicket;
