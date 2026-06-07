import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { parseDeviceBrandModel } from '@/lib/ticketUtils';
import { PDF_COLORS, getAssetUrl, formatTicketDate, displayVal } from '@/pdf/pdfAssets';
import { resolveKeepData, dataPolicyPdfStyles, getDataPolicyLabels } from '@/lib/dataPolicy';

const s = StyleSheet.create({
  page: { paddingTop: 18, paddingBottom: 14, paddingHorizontal: 20, fontSize: 8, fontFamily: 'Helvetica', color: '#000', backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1.5, borderBottomColor: '#000', paddingBottom: 6, marginBottom: 8 },
  logo: { width: 48, height: 48, objectFit: 'contain' },
  contactBlock: { width: 165, alignItems: 'flex-end' },
  contactLine: { fontSize: 6.5, color: PDF_COLORS.gray, marginBottom: 1, textAlign: 'right' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  titleMain: { fontSize: 12, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  titleSub: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: PDF_COLORS.greenDark, marginTop: 2, textTransform: 'uppercase' },
  dispatchLine: { fontSize: 7, color: PDF_COLORS.gray, marginTop: 3 },
  dispatchNum: { fontFamily: 'Helvetica-Bold', color: '#000', fontSize: 9 },
  linkedIntake: { fontSize: 6.5, color: PDF_COLORS.grayLight, marginTop: 1 },
  dateLabel: { fontSize: 6, color: PDF_COLORS.grayLight, textTransform: 'uppercase', textAlign: 'right' },
  dateValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  twoCol: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  col: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 3, backgroundColor: '#f9fafb', padding: 6 },
  colTitle: { fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: PDF_COLORS.grayLight, borderBottomWidth: 0.5, borderBottomColor: '#d1d5db', paddingBottom: 3, marginBottom: 4 },
  clientName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  line: { fontSize: 7.5, marginBottom: 1 },
  deviceName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  serialRow: { flexDirection: 'row', marginBottom: 2 },
  serialLabel: { width: 64, fontSize: 6.5, color: PDF_COLORS.gray },
  serialValue: { flex: 1, fontSize: 7, fontFamily: 'Courier-Bold' },
  workSection: { borderTopWidth: 1.5, borderTopColor: '#000', paddingTop: 6, marginBottom: 8 },
  workTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 5 },
  blockTitle: { fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: PDF_COLORS.gray, marginBottom: 2 },
  blockBody: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 3, padding: 5, marginBottom: 6 },
  blockText: { fontSize: 7.5, lineHeight: 1.3 },
  flagsRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 2, marginTop: 4 },
  flagText: { fontSize: 7, fontFamily: 'Helvetica-Bold' },
  flagMuted: { color: PDF_COLORS.grayLight },
  costsTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 4 },
  tableHead: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#e5e7eb', paddingBottom: 3, marginBottom: 1 },
  thLeft: { flex: 2, fontSize: 6, fontFamily: 'Helvetica-Bold', color: PDF_COLORS.gray, textTransform: 'uppercase' },
  thRight: { flex: 1, fontSize: 6, fontFamily: 'Helvetica-Bold', color: PDF_COLORS.gray, textTransform: 'uppercase', textAlign: 'right' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6', paddingVertical: 3 },
  tdLeft: { flex: 2, fontSize: 7.5 },
  tdRight: { flex: 1, fontSize: 7.5, fontFamily: 'Courier', textAlign: 'right' },
  totalRow: { flexDirection: 'row', backgroundColor: '#f9fafb', paddingVertical: 4, borderTopWidth: 2, borderTopColor: '#000', marginTop: 1 },
  totalLabel: { flex: 2, fontSize: 8, fontFamily: 'Helvetica-Bold', paddingLeft: 3 },
  totalValue: { flex: 1, fontSize: 10, fontFamily: 'Courier-Bold', textAlign: 'right', paddingRight: 3 },
  warning: { textAlign: 'center', color: '#dc2626', fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginTop: 8, marginBottom: 8, lineHeight: 1.25 },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 24, paddingHorizontal: 4, marginBottom: 6 },
  signCol: { flex: 1, maxWidth: 180, alignItems: 'center' },
  signLabel: { fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 14 },
  signLine: { borderBottomWidth: 1, borderBottomColor: '#000', width: '100%', marginBottom: 2 },
  signSub: { fontSize: 6, color: PDF_COLORS.grayLight, textTransform: 'uppercase' },
  footer: { textAlign: 'center', fontSize: 6.5, color: PDF_COLORS.grayLight, borderTopWidth: 0.5, borderTopColor: '#f3f4f6', paddingTop: 4, marginTop: 2 },
});

const SerialRow = ({ label, value, none = 'NEMA' }) => (
  <View style={s.serialRow}>
    <Text style={s.serialLabel}>{label}</Text>
    <Text style={s.serialValue}>{displayVal(value, none)}</Text>
  </View>
);

export function DeliveryNotePdfDocument({ ticket, logoSrc }) {
  const partsCost = parseFloat(ticket.partsCost ?? ticket.parts_cost ?? 0) || 0;
  const serviceCost = parseFloat(ticket.serviceCost ?? ticket.service_cost ?? 0) || 0;
  const totalCost = partsCost + serviceCost;
  const dispatchNumber = ticket.dispatchNote_number || ticket.dispatchNoteNumber || ticket.id;
  const { brand, model } = parseDeviceBrandModel(ticket.deviceName || ticket.device_name);
  const deviceLabel = brand ? `${brand}${model ? ` ${model}` : ''}` : (ticket.deviceName || ticket.device_name || '—');
  const customerName = `${ticket.customerName || ticket.clients?.first_name || ''} ${ticket.customerSurname || ticket.clients?.last_name || ''}`.trim();
  const completedAt = ticket.completed_at || ticket.completedAt || new Date().toISOString();
  const hasBag = ticket.hasBag ?? ticket.has_bag;
  const bagDesc = ticket.bagDescription || ticket.bag_description;
  const repairDetails = ticket.repairDetails || ticket.repair_details || 'Nema unesenih detalja o radu.';
  const partsUsed = ticket.partsUsed || ticket.parts_used;
  const keep = resolveKeepData(ticket);
  const ps = dataPolicyPdfStyles;
  const { deleteLabel, keepLabel } = getDataPolicyLabels(ticket);
  const logo = logoSrc || getAssetUrl('/images/logo-delivery.png');

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <Image src={logo} style={s.logo} />
          <View style={s.contactBlock}>
            <Text style={s.contactLine}>Bul. Ibrahima Koristovica bb, Podgorica</Text>
            <Text style={s.contactLine}>068/862-807 · prodaja@computer-doctor.me</Text>
            <Text style={s.contactLine}>Pon–Pet 9h–16h · Sub 10h–13h</Text>
          </View>
        </View>

        <View style={s.titleRow}>
          <View>
            <Text style={s.titleMain}>{ticket.isWarranty ? 'OTPREMNICA — GARANCIJA' : 'OTPREMNICA'}</Text>
            {ticket.isWarranty && (
              <Text style={s.titleSub}>
                Garantni servis
                {ticket.warrantyUntil ? ` · Garancija do: ${formatTicketDate(ticket.warrantyUntil)}` : ''}
                {ticket.warrantyInvoice ? ` · Račun: ${ticket.warrantyInvoice}` : ''}
              </Text>
            )}
            <Text style={s.dispatchLine}>
              Broj Otpremnice: <Text style={s.dispatchNum}>#{dispatchNumber}</Text>
            </Text>
            <Text style={s.linkedIntake}>Vezano za Prijem: #{ticket.id}</Text>
          </View>
          <View>
            <Text style={s.dateLabel}>Datum Završetka</Text>
            <Text style={s.dateValue}>{formatTicketDate(completedAt, 'en-GB')}</Text>
          </View>
        </View>

        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.colTitle}>Klijent</Text>
            <Text style={s.clientName}>{customerName || '—'}</Text>
            <Text style={s.line}>{ticket.customerPhone || ticket.clients?.phone || '—'}</Text>
            <Text style={s.line}>{ticket.customerEmail || ticket.clients?.email || '—'}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.colTitle}>Uređaj</Text>
            <Text style={s.deviceName}>{deviceLabel}</Text>
            <SerialRow label="S/N uređaja:" value={ticket.deviceSerial || ticket.device_serial} />
            <SerialRow label="S/N baterije:" value={ticket.batterySerial || ticket.battery_serial} />
            <SerialRow label="S/N punjača:" value={ticket.chargerSerial || ticket.charger_serial} />
            <SerialRow label="OS Šifra:" value={ticket.osPassword || ticket.os_password} />
          </View>
        </View>

        <View style={s.workSection}>
          <Text style={s.workTitle}>Izvještaj Servisa</Text>
          <Text style={s.blockTitle}>Opis Izvršenih Radova</Text>
          <View style={s.blockBody}>
            <Text style={s.blockText}>{repairDetails}</Text>
          </View>
          {partsUsed ? (
            <>
              <Text style={s.blockTitle}>Ugrađeni Djelovi</Text>
              <View style={s.blockBody}>
                <Text style={s.blockText}>{partsUsed}</Text>
              </View>
            </>
          ) : null}
          <View style={s.flagsRow}>
            <View style={ps.row}>
              <Text style={keep ? ps.struck : ps.active}>{deleteLabel}</Text>
              <Text style={ps.separator}>/</Text>
              <Text style={!keep ? ps.struck : ps.active}>{keepLabel}</Text>
            </View>
            <Text style={[s.flagText, !hasBag && s.flagMuted]}>
              [{hasBag ? 'X' : ' '}] Torba{hasBag && bagDesc ? ` — ${bagDesc}` : ''}
            </Text>
          </View>
        </View>

        <Text style={s.costsTitle}>Pregled Troškova</Text>
        <View style={s.tableHead}>
          <Text style={s.thLeft}>Stavka</Text>
          <Text style={s.thRight}>Iznos (€)</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={s.tdLeft}>Djelovi</Text>
          <Text style={s.tdRight}>{partsCost.toFixed(2)} €</Text>
        </View>
        <View style={s.tableRow}>
          <Text style={s.tdLeft}>Servisna Usluga</Text>
          <Text style={s.tdRight}>{serviceCost.toFixed(2)} €</Text>
        </View>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>UKUPNO ZA NAPLATU</Text>
          <Text style={s.totalValue}>{totalCost.toFixed(2)} €</Text>
        </View>

        <Text style={s.warning}>
          KORISNIK JE DUŽAN DA PROVJERI SVE PRILIKOM PREUZIMANJA UREĐAJA JER NAKANDNE REKLAMACIJE NE VAŽE.
        </Text>

        <View style={s.signRow}>
          <View style={s.signCol}>
            <Text style={s.signLabel}>Servisa predao</Text>
            <View style={s.signLine} />
            <Text style={s.signSub}>M.P.</Text>
          </View>
          <View style={s.signCol}>
            <Text style={s.signLabel}>Korisnik preuzeo sa servisa</Text>
            <View style={s.signLine} />
            <Text style={s.signSub}>Svojeručno potpisao klijent</Text>
          </View>
        </View>

        <Text style={s.footer}>Hvala Vam na ukazanom povjerenju! Vaš Computer Doctor tim.</Text>
      </Page>
    </Document>
  );
}
