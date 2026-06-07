import { generateDocumentPdf, printPdfBlob } from '@/lib/generateTicketPdf.jsx';
import { sendTicketEmail } from '@/lib/sendTicketEmail';

export async function sendDocumentEmail(emailJob, pdfBlob) {
  if (!emailJob?.ticket) {
    throw new Error('Podaci dokumenta nisu proslijeđeni za PDF.');
  }

  const blob = pdfBlob ?? await generateDocumentPdf(emailJob.type, emailJob.ticket);
  await sendTicketEmail({
    to: emailJob.to,
    type: emailJob.type,
    ticketId: emailJob.ticketId,
    customerName: emailJob.customerName,
    pdfBlob: blob,
    filename: emailJob.filename,
  });
  return emailJob.to;
}

export async function printDocument({ type, ticket }) {
  await printDocumentPdf(type, ticket);
}

/**
 * Generiše react-pdf, opciono šalje email, zatim otvara dijalog za štampu PDF-a.
 */
export async function runPrintAndEmailJob({
  document,
  emailJob,
  toastRef,
  successLabel = 'Dokument poslat na',
}) {
  if (!document?.ticket) {
    throw new Error('Podaci dokumenta nisu proslijeđeni.');
  }

  const pdfBlob = await generateDocumentPdf(document.type, document.ticket);

  if (emailJob) {
    try {
      const sentTo = await sendDocumentEmail(emailJob, pdfBlob);
      toastRef?.current?.({
        title: 'Email poslat',
        description: `${successLabel} ${sentTo}`,
        className: 'bg-emerald-600 text-white border-none',
      });
    } catch (error) {
      console.error('Email send failed:', error);
      toastRef?.current?.({
        variant: 'destructive',
        title: 'Email nije poslat',
        description: error.message || 'Provjerite SMTP podešavanja na serveru.',
      });
    }
  }

  await printPdfBlob(pdfBlob);
}
