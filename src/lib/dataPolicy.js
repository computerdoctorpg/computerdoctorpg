import { getPrintStrings, getTicketLocale } from '@/lib/printTranslations';

export const resolveKeepData = (ticket) => !!(ticket?.keepData ?? ticket?.keep_data);

export function getDataPolicyLabels(ticket) {
  const t = getPrintStrings(getTicketLocale(ticket));
  const keep = resolveKeepData(ticket);
  return { deleteLabel: t.deleteData, keepLabel: t.keepData, keep };
}

export const dataPolicyPdfStyles = {
  active: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  struck: { fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textDecoration: 'line-through', color: '#9ca3af' },
  separator: { fontSize: 7, color: '#9ca3af' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
};
