import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getPrintStrings, getTicketLocale } from '@/lib/printTranslations';
import { parseDeviceBrandModel } from '@/lib/ticketUtils';
import { PDF_COLORS, getAssetUrl, formatTicketDate, displayVal } from '@/pdf/pdfAssets';
import { resolveKeepData, dataPolicyPdfStyles } from '@/lib/dataPolicy';

import { PDF_FONT, pdfBold } from '@/pdf/pdfFonts';

const B = pdfBold;

const s = StyleSheet.create({
  page: { paddingTop: 22, paddingBottom: 16, paddingHorizontal: 24, fontSize: 8, fontFamily: PDF_FONT, color: '#000', backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: '#000', paddingBottom: 6, marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  logo: { width: 48, height: 48, objectFit: 'contain' },
  brandTitle: { fontSize: 16, ...B, color: PDF_COLORS.green },
  tagline: { fontSize: 7.5, color: PDF_COLORS.gray, marginTop: 2, ...B },
  headerRight: { width: 160, alignItems: 'flex-end' },
  contactLine: { fontSize: 7, marginBottom: 2, textAlign: 'right' },
  titleBox: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 2.5, borderColor: '#000', backgroundColor: PDF_COLORS.tint, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 6, borderRadius: 3 },
  titleMain: { fontSize: 11, ...B, textTransform: 'uppercase' },
  titleSub: { fontSize: 6.5, ...B, color: PDF_COLORS.greenDark, marginTop: 2, textTransform: 'uppercase' },
  intakeLabel: { fontSize: 6.5, color: PDF_COLORS.grayLight, textTransform: 'uppercase', ...B },
  intakeNumber: { fontSize: 20, ...B, marginTop: 1, lineHeight: 1 },
  intakeDate: { fontSize: 7.5, color: PDF_COLORS.gray, marginTop: 2, ...B },
  banner: { borderWidth: 2.5, borderColor: PDF_COLORS.green, backgroundColor: PDF_COLORS.black, paddingVertical: 5, paddingHorizontal: 8, marginBottom: 6, borderRadius: 3 },
  bannerCompact: { marginTop: 4, marginBottom: 4, paddingVertical: 4 },
  bannerText: { color: PDF_COLORS.green, fontSize: 8, ...B, textAlign: 'center', textTransform: 'uppercase' },
  bannerTextCompact: { fontSize: 7 },
  twoCol: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  col: { flex: 1 },
  section: { borderWidth: 1.5, borderColor: '#000', borderRadius: 3 },
  sectionHead: { backgroundColor: PDF_COLORS.greenDark, paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 3, borderBottomColor: PDF_COLORS.green },
  sectionHeadDark: { backgroundColor: PDF_COLORS.black, borderBottomColor: PDF_COLORS.green },
  sectionHeadText: { color: '#fff', fontSize: 7, ...B, textTransform: 'uppercase' },
  sectionBody: { paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#fff' },
  fieldRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: PDF_COLORS.line, paddingVertical: 3 },
  fieldLabel: { width: 72, fontSize: 6.5, ...B, color: PDF_COLORS.gray, textTransform: 'uppercase' },
  fieldValue: { flex: 1, fontSize: 8, ...B },
  fieldMono: { fontFamily: 'Courier-Bold', fontSize: 7.5 },
  issueBox: { borderWidth: 2, borderColor: '#000', borderRadius: 3, marginBottom: 6 },
  issueHead: { backgroundColor: PDF_COLORS.greenDark, paddingVertical: 4, paddingHorizontal: 8 },
  issueBody: { paddingVertical: 6, paddingHorizontal: 8 },
  issueText: { fontSize: 9, ...B, lineHeight: 1.3 },
  notesBox: { borderWidth: 1.5, borderColor: '#000', borderRadius: 3, marginBottom: 6 },
  notesHead: { backgroundColor: PDF_COLORS.black, paddingVertical: 4, paddingHorizontal: 8 },
  notesBody: { paddingVertical: 5, paddingHorizontal: 8, backgroundColor: PDF_COLORS.tint },
  notesText: { fontSize: 8, lineHeight: 1.3, ...B },
  flagsRow: { flexDirection: 'row', gap: 12, borderWidth: 2, borderColor: '#000', backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 10, marginBottom: 6, borderRadius: 3, alignItems: 'center' },
  flagText: { fontSize: 7.5, ...B, textTransform: 'uppercase' },
  flagMuted: { color: PDF_COLORS.grayLight },
  termsWrap: { borderTopWidth: 2.5, borderTopColor: '#000', paddingTop: 5, marginBottom: 4 },
  termsTitle: { fontSize: 7, ...B, textTransform: 'uppercase', marginBottom: 3 },
  termsIntro: { fontSize: 6.5, ...B, marginBottom: 3, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: PDF_COLORS.grayLight, lineHeight: 1.2 },
  termsCols: { flexDirection: 'row', gap: 10 },
  termsCol: { flex: 1 },
  termLine: { fontSize: 6, lineHeight: 1.2, marginBottom: 1, textAlign: 'justify' },
  termBold: { ...B, textTransform: 'uppercase' },
  signRow: { flexDirection: 'row', gap: 28, marginTop: 4, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: PDF_COLORS.grayLight },
  signCol: { flex: 1, alignItems: 'center' },
  signLine: { borderBottomWidth: 1.5, borderBottomColor: '#000', height: 22, width: '100%', marginBottom: 3 },
  signLabel: { fontSize: 7, ...B, textTransform: 'uppercase' },
  signSub: { fontSize: 6.5, color: PDF_COLORS.gray, marginTop: 1 },
  footer: { backgroundColor: PDF_COLORS.black, paddingVertical: 5, alignItems: 'center', borderRadius: 2, marginTop: 4 },
  footerGreen: { color: PDF_COLORS.green, ...B, fontSize: 6.5 },
  footerWhite: { color: '#fff', fontSize: 6.5, ...B, textTransform: 'uppercase' },
});

const FieldRow = ({ label, value, mono, bold }) => (
  <View style={s.fieldRow}>
    <Text style={s.fieldLabel}>{label}</Text>
    <Text style={[s.fieldValue, mono && s.fieldMono, !bold && { fontFamily: PDF_FONT }]}>{value || '—'}</Text>
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

export function IntakeReceiptPdfDocument({ ticket, logoSrc }) {
  const locale = getTicketLocale(ticket);
  const t = getPrintStrings(locale);
  const isWarranty = ticket.isWarranty;
  const { brand, model } = parseDeviceBrandModel(ticket.deviceName);
  const customerName = `${ticket.customerName || ''} ${ticket.customerSurname || ''}`.trim();
  const keepData = resolveKeepData(ticket);
  const ps = dataPolicyPdfStyles;
  const logo = logoSrc || getAssetUrl('/images/logo.png');

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <View style={s.headerLeft}>
            <Image src={logo} style={s.logo} />
            <View>
              <Text style={s.brandTitle}>COMPUTER DOCTOR</Text>
              <Text style={s.tagline}>{t.tagline}</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.contactLine}>Bul. Ibrahima Koristovica bb, Podgorica</Text>
            <Text style={s.contactLine}>068/862-807</Text>
            <Text style={s.contactLine}>prodaja@computer-doctor.me</Text>
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

        {!isWarranty && (
          <View style={[s.banner, s.bannerCompact]}>
            <Text style={[s.bannerText, s.bannerTextCompact]}>{t.diagnosticsBanner}</Text>
          </View>
        )}

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
