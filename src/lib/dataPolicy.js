import { getPrintStrings, getTicketLocale } from '@/lib/printTranslations';

export const resolveKeepData = (ticket) => !!(ticket?.keepData ?? ticket?.keep_data);

export function getDataPolicyLabels(ticket) {
  const t = getPrintStrings(getTicketLocale(ticket));
  const keep = resolveKeepData(ticket);
  return { deleteLabel: t.deleteData, keepLabel: t.keepData, keep };
}

export const dataPolicyPdfStyles = {
  active: {
    fontSize: 11,
    fontFamily: 'NotoSans',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#dc2626',
  },
  struck: {
    fontSize: 9,
    fontFamily: 'NotoSans',
    fontWeight: 700,
    textTransform: 'uppercase',
    textDecoration: 'line-through',
    color: '#9ca3af',
  },
  separator: { fontSize: 10, color: '#9ca3af', fontFamily: 'NotoSans' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
};
