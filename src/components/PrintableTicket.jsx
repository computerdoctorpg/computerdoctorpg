import React from 'react';
import {
  MapPin, Phone, Mail, Clock, CheckSquare, Square, ShoppingBag, AlertTriangle,
} from 'lucide-react';
import { getPrintStrings, getTicketLocale } from '@/lib/printTranslations';

const BRAND = {
  green: '#16a34a',
  greenDark: '#14532d',
  black: '#111111',
  tint: '#f0faf4',
  line: '#cbd5e1',
};

const printExact = {
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
};

const SectionBox = ({ title, children, dark = false, className = '' }) => (
  <div className={`rounded-md overflow-hidden border-[1.5px] border-black flex flex-col h-full ${className}`} style={printExact}>
    <div
      className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white shrink-0"
      style={{
        backgroundColor: dark ? BRAND.black : BRAND.greenDark,
        borderBottom: `3px solid ${BRAND.green}`,
        ...printExact,
      }}
    >
      {title}
    </div>
    <div className="px-3 py-2.5 text-[11px] text-black bg-white flex-1 flex flex-col justify-center" style={printExact}>
      {children}
    </div>
  </div>
);

const FieldRow = ({ label, value, mono, bold }) => (
  <div
    className="grid grid-cols-[108px_1fr] gap-x-3 items-center py-[5px] border-b last:border-0 min-h-[7mm]"
    style={{ borderColor: BRAND.line }}
  >
    <span className="text-gray-600 font-bold text-[9px] uppercase leading-tight">{label}</span>
    <span
      className={`text-[11px] text-black break-words leading-snug ${mono ? 'font-mono font-bold' : ''} ${bold ? 'font-bold' : 'font-semibold'}`}
    >
      {value || '—'}
    </span>
  </div>
);

const DiagnosticsBanner = ({ text, compact = false }) => (
  <div
    className={`px-4 rounded-md border-[2.5px] flex items-center gap-3 ${compact ? 'py-2 mb-2' : 'py-3 mb-3'}`}
    style={{ backgroundColor: BRAND.black, borderColor: BRAND.green, ...printExact }}
  >
    <AlertTriangle className={`shrink-0 ${compact ? 'w-5 h-5' : 'w-7 h-7'}`} style={{ color: BRAND.green, ...printExact }} />
    <p
      className="font-extrabold uppercase leading-tight tracking-wide text-center flex-1"
      style={{
        color: BRAND.green,
        fontSize: compact ? '11px' : '13px',
        letterSpacing: '0.04em',
        ...printExact,
      }}
    >
      {text}
    </p>
  </div>
);

const PrintableTicket = ({ ticket }) => {
  if (!ticket) return null;

  const locale = getTicketLocale(ticket);
  const t = getPrintStrings(locale);
  const isWarranty = ticket.isWarranty;

  const displayVal = (v) => {
    if (!v || v === 'NEMA' || v === '-') return t.none;
    return v;
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString(t.dateLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <div
      className="flex flex-col w-[210mm] h-[297mm] max-h-[297mm] overflow-hidden bg-white text-black font-sans box-border"
      style={{ padding: '9mm 10mm 8mm', colorScheme: 'light', ...printExact }}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b-[2.5px] border-black pb-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <img className="h-[18mm] w-auto object-contain" alt="Computer Doctor logo" src="/images/logo.png" />
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight leading-none" style={{ color: BRAND.green, ...printExact }}>
              COMPUTER DOCTOR
            </h1>
            <p className="text-[10px] text-gray-700 mt-1 font-semibold tracking-wide">{t.tagline}</p>
          </div>
        </div>
        <div className="text-right text-[9px] space-y-1 text-black font-medium leading-relaxed">
          <div className="flex items-center justify-end gap-1.5">
            <span>Bul. Ibrahima Koristovica bb, Podgorica</span>
            <MapPin className="w-3.5 h-3.5 shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span>068/862-807</span>
            <Phone className="w-3.5 h-3.5 shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span>prodaja@computer-doctor.me</span>
            <Mail className="w-3.5 h-3.5 shrink-0" />
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span>{t.hours}</span>
            <Clock className="w-3.5 h-3.5 shrink-0" />
          </div>
        </div>
      </div>

      {/* Naslov */}
      <div
        className="flex justify-between items-center mb-3 px-4 py-2.5 rounded-md border-[2.5px] border-black shrink-0"
        style={{ backgroundColor: BRAND.tint, ...printExact }}
      >
        <div>
          <h2 className="text-lg font-extrabold uppercase tracking-wide text-black">
            {isWarranty ? t.receiptTitleWarranty : t.receiptTitle}
          </h2>
          {isWarranty && (
            <p className="text-[9px] font-bold mt-1 uppercase" style={{ color: BRAND.greenDark }}>
              {t.warrantySubtitle}
              {ticket.warrantyUntil && ` · ${t.warrantyUntil} ${formatDate(ticket.warrantyUntil)}`}
              {ticket.warrantyInvoice && ` · ${t.invoice}: ${ticket.warrantyInvoice}`}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[8px] text-gray-500 uppercase tracking-wider font-bold">{t.intakeNumber}</p>
          <p className="font-mono font-extrabold text-[26px] text-black leading-none">#{ticket.id}</p>
          <p className="text-[10px] text-gray-600 mt-1 font-semibold">{formatDate(ticket.createdAt)}</p>
        </div>
      </div>

      {!isWarranty && <DiagnosticsBanner text={t.diagnosticsBanner} />}

      {/* Glavni sadržaj — popunjava stranicu */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="grid grid-cols-2 gap-3 min-h-[48mm]">
          <SectionBox title={t.clientSection}>
            <FieldRow label={t.fullName} value={`${ticket.customerName || ''} ${ticket.customerSurname || ''}`.trim()} bold />
            <FieldRow label={t.phone} value={ticket.customerPhone} bold />
            <FieldRow label="Email" value={ticket.customerEmail || '—'} />
          </SectionBox>
          <SectionBox title={t.deviceSection} dark>
            <FieldRow label={t.model} value={ticket.deviceName} bold />
            <FieldRow label={t.laptopSn} value={displayVal(ticket.deviceSerial)} mono />
            <FieldRow label={t.batterySn} value={displayVal(ticket.batterySerial)} mono />
            <FieldRow label={t.chargerSn} value={displayVal(ticket.chargerSerial)} mono />
            <FieldRow label={t.osPassword} value={displayVal(ticket.osPassword)} mono />
          </SectionBox>
        </div>

        <div className="rounded-md overflow-hidden border-[2px] border-black flex flex-col min-h-[28mm] flex-1" style={printExact}>
          <div
            className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white shrink-0"
            style={{ backgroundColor: BRAND.greenDark, ...printExact }}
          >
            {t.issueSection}
          </div>
          <div className="px-3 py-3 flex-1 flex items-start" style={{ backgroundColor: '#fff', ...printExact }}>
            <p className="text-[12px] whitespace-pre-wrap leading-relaxed font-bold text-black w-full">
              {ticket.issueDescription || '—'}
            </p>
          </div>
        </div>

        <div className="rounded-md overflow-hidden border-[1.5px] border-black min-h-[18mm]" style={printExact}>
          <div
            className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-white"
            style={{ backgroundColor: BRAND.black, ...printExact }}
          >
            {t.notesSection}
          </div>
          <div className="px-3 py-2.5 min-h-[12mm]" style={{ backgroundColor: BRAND.tint, ...printExact }}>
            <p className="text-[11px] whitespace-pre-wrap leading-relaxed font-semibold text-black">
              {ticket.notes?.trim() ? ticket.notes : t.noNotes}
            </p>
          </div>
        </div>

        <div
          className="flex gap-8 text-[10px] py-2.5 px-4 border-[1.5px] border-black rounded-md shrink-0"
          style={{ backgroundColor: BRAND.tint, ...printExact }}
        >
          <div className="flex items-center gap-2">
            {ticket.keepData ? (
              <CheckSquare className="w-5 h-5" style={{ color: BRAND.greenDark }} />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
            <span className={`font-bold uppercase tracking-wide ${ticket.keepData ? 'text-black' : 'text-gray-500'}`}>
              {t.keepData}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <ShoppingBag className={`w-5 h-5 shrink-0 ${ticket.hasBag ? 'text-black' : 'text-gray-400'}`} />
            <span className={`font-bold uppercase tracking-wide ${ticket.hasBag ? 'text-black' : 'text-gray-500'}`}>
              {t.bag}
              {ticket.hasBag && ticket.bagDescription ? (
                <span className="font-semibold text-gray-700 ml-1 normal-case">({ticket.bagDescription})</span>
              ) : null}
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-[52mm] flex flex-col pt-2 border-t-[2.5px] border-black">
          <h4 className="text-[9px] font-extrabold uppercase mb-1.5 text-black tracking-widest">{t.termsTitle}</h4>
          <p className="text-[8px] font-bold mb-2 leading-snug text-black border-b border-gray-400 pb-1.5">
            {t.termsIntro}
          </p>
          <div className="text-[7.5px] leading-[11px] text-gray-800 text-justify columns-2 gap-5 font-medium flex-1">
            {t.terms.map((term, i) => (
              <p
                key={i}
                className={`mb-1 break-inside-avoid ${t.boldTerms.includes(i) ? 'font-extrabold text-black uppercase' : ''}`}
              >
                {term}
              </p>
            ))}
          </div>
        </div>
      </div>

      {!isWarranty && <DiagnosticsBanner text={t.diagnosticsBanner} compact />}

      {/* Potpisi */}
      <div className="grid grid-cols-2 gap-12 pt-2 mt-2 shrink-0 border-t border-gray-400">
        <div className="text-center">
          <div className="border-b-[1.5px] border-black mb-1 h-[14mm] w-full" />
          <p className="font-bold text-[10px] uppercase tracking-wider text-black">{t.signedService}</p>
          <p className="text-[8px] text-gray-600 font-medium mt-1">Computer Doctor</p>
        </div>
        <div className="text-center">
          <div className="border-b-[1.5px] border-black mb-1 h-[14mm] w-full" />
          <p className="font-bold text-[10px] uppercase tracking-wider text-black">{t.signedClient}</p>
          <p className="text-[8px] text-gray-600 font-medium mt-1">{t.clientAgrees}</p>
        </div>
      </div>

      {/* Footer traka */}
      <div
        className="mt-2 py-1.5 text-center text-[8px] font-bold uppercase tracking-[0.2em] text-white shrink-0 rounded-sm"
        style={{ backgroundColor: BRAND.black, ...printExact }}
      >
        <span style={{ color: BRAND.green }}>Computer Doctor</span>
        <span className="text-white"> · Profesionalni servis računara · Podgorica</span>
      </div>
    </div>
  );
};

export default PrintableTicket;
