import { flushSync } from 'react-dom';
import { generateDocumentPdf } from '@/lib/generateTicketPdf.jsx';
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

/** Štampa lijepu HTML prijemnici/otpremnicu (PrintableTicket) preko browser print dijaloga. */
export async function printHtmlDocument(renderForPrint) {
  flushSync(renderForPrint);
  await new Promise((r) => setTimeout(r, 500));
  window.print();
}

/**
 * Email → react-pdf (vektorski PDF).
 * Štampa → HTML prijemnica (PrintableTicket / PrintableDeliveryNote) kao prije.
 */
export async function runPrintAndEmailJob({
  document,
  emailJob,
  renderForPrint,
  toastRef,
  successLabel = 'Dokument poslat na',
}) {
  if (!document?.ticket) {
    throw new Error('Podaci dokumenta nisu proslijeđeni.');
  }

  if (emailJob) {
    try {
      const pdfBlob = await generateDocumentPdf(emailJob.type, emailJob.ticket);
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

  if (renderForPrint) {
    await printHtmlDocument(renderForPrint);
  }
}
