import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getPrintStrings, getTicketLocale } from '@/lib/printTranslations';
import { parseDeviceBrandModel } from '@/lib/ticketUtils';
import { PDF_COLORS, getAssetUrl, formatTicketDate, displayVal } from '@/pdf/pdfAssets';
import { resolveKeepData, dataPolicyPdfStyles } from '@/lib/dataPolicy';

const s = StyleSheet.create({
  page: { paddingTop: 18, paddingBottom: 14, paddingHorizontal: 20, fontSize: 8, fontFamily: 'Helvetica', color: '#000', backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#000', paddingBottom: 5, marginBottom: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  logo: { width: 38, height: 38, objectFit: 'contain' },
  brandTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: PDF_COLORS.green },
  tagline: { fontSize: 6.5, color: PDF_COLORS.gray, marginTop: 1 },
  headerRight: { width: 155, alignItems: 'flex-end' },
  contactLine: { fontSize: 6.5, marginBottom: 1, textAlign: 'right' },
  titleBox: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 2, borderColor: '#000', backgroundColor: PDF_COLORS.tint, paddingVertical: 5, paddingHorizontal: 8, marginBottom: 5, borderRadius: 3 },
  titleMain: { fontSize: 10, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  titleSub: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: PDF_COLORS.greenDark, marginTop: 2, textTransform: 'uppercase' },
  intakeLabel: { fontSize: 6, color: PDF_COLORS.grayLight, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  intakeNumber: { fontSize: 17, fontFamily: 'Helvetica-Bold', marginTop: 1, lineHeight: 1 },
  intakeDate: { fontSize: 7, color: PDF_COLORS.gray, marginTop: 1 },
  banner: { borderWidth: 2, borderColor: PDF_COLORS.green, backgroundColor: PDF_COLORS.black, paddingVertical: 4, paddingHorizontal: 6, marginBottom: 5, borderRadius: 3 },
  bannerText: { color: PDF_COLORS.green, fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center', textTransform: 'uppercase' },
  twoCol: { flexDirection: 'row', gap: 6, marginBottom: 5 },
  col: { flex: 1 },
  section: { borderWidth: 1.5, borderColor: '#000', borderRadius: 3 },
  sectionHead: { backgroundColor: PDF_COLORS.greenDark, paddingVertical: 3, paddingHorizontal: 6, borderBottomWidth: 2, borderBottomColor: PDF_COLORS.green },
  sectionHeadDark: { backgroundColor: PDF_COLORS.black },
  sectionHeadText: { color: '#fff', fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  sectionBody: { paddingVertical: 4, paddingHorizontal: 6, backgroundColor: '#fff' },
  fieldRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: PDF_COLORS.line, paddingVertical: 2 },
  fieldLabel: { width: 68, fontSize: 6, fontFamily: 'Helvetica-Bold', color: PDF_COLORS.gray, textTransform: 'uppercase' },
  fieldValue: { flex: 1, fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  fieldMono: { fontFamily: 'Courier-Bold', fontSize: 7 },
  issueBox: { borderWidth: 2, borderColor: '#000', borderRadius: 3, marginBottom: 5 },
  issueHead: { backgroundColor: PDF_COLORS.greenDark, paddingVertical: 3, paddingHorizontal: 6 },
  issueBody: { paddingVertical: 4, paddingHorizontal: 6 },
  issueText: { fontSize: 8, fontFamily: 'Helvetica-Bold', lineHeight: 1.25 },
  notesBox: { borderWidth: 1.5, borderColor: '#000', borderRadius: 3, marginBottom: 5 },
  notesHead: { backgroundColor: PDF_COLORS.black, paddingVertical: 3, paddingHorizontal: 6 },
  notesBody: { paddingVertical: 4, paddingHorizontal: 6, backgroundColor: PDF_COLORS.tint },
  notesText: { fontSize: 7.5, lineHeight: 1.25 },
  flagsRow: { flexDirection: 'row', gap: 16, borderWidth: 1.5, borderColor: '#000', backgroundColor: PDF_COLORS.tint, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 5, borderRadius: 3 },
  flagText: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  flagMuted: { color: PDF_COLORS.grayLight },
  termsWrap: { borderTopWidth: 2, borderTopColor: '#000', paddingTop: 4, marginBottom: 4, flexGrow: 1 },
  termsTitle: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', marginBottom: 2 },
  termsIntro: { fontSize: 6, fontFamily: 'Helvetica-Bold', marginBottom: 2, paddingBottom: 2, borderBottomWidth: 0.5, borderBottomColor: PDF_COLORS.grayLight, lineHeight: 1.2 },
  termsCols: { flexDirection: 'row', gap: 8 },
  termsCol: { flex: 1 },
  termLine: { fontSize: 5.5, lineHeight: 1.15, marginBottom: 0.5, textAlign: 'justify' },
  termBold: { fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  signRow: { flexDirection: 'row', gap: 24, marginTop: 3, paddingTop: 3, borderTopWidth: 0.5, borderTopColor: PDF_COLORS.grayLight },
  signCol: { flex: 1, alignItems: 'center' },
  signLine: { borderBottomWidth: 1.5, borderBottomColor: '#000', height: 16, width: '100%', marginBottom: 2 },
  signLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  signSub: { fontSize: 6, color: PDF_COLORS.gray, marginTop: 1 },
  footer: { backgroundColor: PDF_COLORS.black, paddingVertical: 4, alignItems: 'center', borderRadius: 2, marginTop: 3 },
  footerGreen: { color: PDF_COLORS.green, fontFamily: 'Helvetica-Bold', fontSize: 6 },
  footerWhite: { color: '#fff', fontSize: 6, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
});

const FieldRow = ({ label, value, mono, bold }) => (
  <View style={s.fieldRow}>
    <Text style={s.fieldLabel}>{label}</Text>
    <Text style={[s.fieldValue, mono && s.fieldMono, !bold && { fontFamily: 'Helvetica' }]}>{value || '—'}</Text>
  </View>
);

const SectionBox = ({ title, dark, children }) => (
  <View style={s.section}>
    <View style={[s.sectionHead, dark && s.sectionHeadDark]}>
      <Text style={s.sectionHeadText}>{title}</Text>
    </View>
    <View style={s.sectionBody}>{children}</View>
  </View>
);

const TermsColumns = ({ terms, boldIndices }) => {
  const mid = Math.ceil(terms.length / 2);
  const cols = [terms.slice(0, mid), terms.slice(mid)];
  return (
    <View style={s.termsCols}>
      {cols.map((col, ci) => (
        <View key={ci} style={s.termsCol}>
          {col.map((term, ri) => {
            const idx = ci === 0 ? ri : ri + mid;
            return (
              <Text key={idx} style={[s.termLine, boldIndices.includes(idx) && s.termBold]}>
                {term}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export function IntakeReceiptPdfDocument({ ticket }) {
  const locale = getTicketLocale(ticket);
  const t = getPrintStrings(locale);
  const isWarranty = ticket.isWarranty;
  const { brand, model } = parseDeviceBrandModel(ticket.deviceName);
  const customerName = `${ticket.customerName || ''} ${ticket.customerSurname || ''}`.trim();
  const keepData = resolveKeepData(ticket);
  const ps = dataPolicyPdfStyles;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Image src={getAssetUrl('/images/logo.png')} style={s.logo} />
            <View>
              <Text style={s.brandTitle}>COMPUTER DOCTOR</Text>
              <Text style={s.tagline}>{t.tagline}</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.contactLine}>Bul. Ibrahima Koristovica bb, Podgorica</Text>
            <Text style={s.contactLine}>068/862-807 · prodaja@computer-doctor.me</Text>
            <Text style={s.contactLine}>{t.hours}</Text>
          </View>
        </View>

        <View style={s.titleBox}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={s.titleMain}>{isWarranty ? t.receiptTitleWarranty : t.receiptTitle}</Text>
            {isWarranty && (
              <Text style={s.titleSub}>
                {t.warrantySubtitle}
                {ticket.warrantyUntil ? ` · ${t.warrantyUntil} ${formatTicketDate(ticket.warrantyUntil, t.dateLocale)}` : ''}
                {ticket.warrantyInvoice ? ` · ${t.invoice}: ${ticket.warrantyInvoice}` : ''}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.intakeLabel}>{t.intakeNumber}</Text>
            <Text style={s.intakeNumber}>#{ticket.id}</Text>
            <Text style={s.intakeDate}>{formatTicketDate(ticket.createdAt, t.dateLocale)}</Text>
          </View>
        </View>

        {!isWarranty && (
          <View style={s.banner}>
            <Text style={s.bannerText}>{t.diagnosticsBanner}</Text>
          </View>
        )}

        <View style={s.twoCol}>
          <View style={s.col}>
            <SectionBox title={t.clientSection}>
              <FieldRow label={t.fullName} value={customerName} bold />
              <FieldRow label={t.phone} value={ticket.customerPhone} bold />
              <FieldRow label="Email" value={ticket.customerEmail || '—'} />
            </SectionBox>
          </View>
          <View style={s.col}>
            <SectionBox title={t.deviceSection} dark>
              <FieldRow label={t.brand} value={brand} bold />
              <FieldRow label={t.model} value={model || ticket.deviceName} bold />
              <FieldRow label={t.laptopSn} value={displayVal(ticket.deviceSerial, t.none)} mono />
              <FieldRow label={t.batterySn} value={displayVal(ticket.batterySerial, t.none)} mono />
              <FieldRow label={t.chargerSn} value={displayVal(ticket.chargerSerial, t.none)} mono />
              <FieldRow label={t.osPassword} value={displayVal(ticket.osPassword, t.none)} mono />
            </SectionBox>
          </View>
        </View>

        <View style={s.issueBox}>
          <View style={s.issueHead}>
            <Text style={s.sectionHeadText}>{t.issueSection}</Text>
          </View>
          <View style={s.issueBody}>
            <Text style={s.issueText}>{ticket.issueDescription || '—'}</Text>
          </View>
        </View>

        <View style={s.notesBox}>
          <View style={s.notesHead}>
            <Text style={s.sectionHeadText}>{t.notesSection}</Text>
          </View>
          <View style={s.notesBody}>
            <Text style={s.notesText}>{ticket.notes?.trim() ? ticket.notes : t.noNotes}</Text>
          </View>
        </View>

        <View style={s.flagsRow}>
          <View style={ps.row}>
            <Text style={keepData ? ps.struck : ps.active}>{t.deleteData}</Text>
            <Text style={ps.separator}>/</Text>
            <Text style={!keepData ? ps.struck : ps.active}>{t.keepData}</Text>
          </View>
          <Text style={[s.flagText, !ticket.hasBag && s.flagMuted, { flex: 1 }]}>
            [{ticket.hasBag ? 'X' : ' '}] {t.bag}
            {ticket.hasBag && ticket.bagDescription ? ` (${ticket.bagDescription})` : ''}
          </Text>
        </View>

        <View style={s.termsWrap}>
          <Text style={s.termsTitle}>{t.termsTitle}</Text>
          <Text style={s.termsIntro}>{t.termsIntro}</Text>
          <TermsColumns terms={t.terms} boldIndices={t.boldTerms} />
        </View>

        <View style={s.signRow}>
          <View style={s.signCol}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>{t.signedService}</Text>
            <Text style={s.signSub}>Computer Doctor</Text>
          </View>
          <View style={s.signCol}>
            <View style={s.signLine} />
            <Text style={s.signLabel}>{t.signedClient}</Text>
            <Text style={s.signSub}>{t.clientAgrees}</Text>
          </View>
        </View>

        <View style={s.footer}>
          <Text>
            <Text style={s.footerGreen}>Computer Doctor</Text>
            <Text style={s.footerWhite}> · Profesionalni servis računara · Podgorica</Text>
          </Text>
        </View>
      </Page>
    </Document>
  );
}
