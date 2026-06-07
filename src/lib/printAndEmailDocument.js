import { flushSync } from 'react-dom';
import { sendTicketEmail } from '@/lib/sendTicketEmail';

export async function sendDocumentEmail(emailJob) {
  if (!emailJob?.ticket) {
    throw new Error('Podaci dokumenta nisu proslijeđeni za email.');
  }

  await sendTicketEmail({
    to: emailJob.to,
    type: emailJob.type,
    ticketId: emailJob.ticketId,
    customerName: emailJob.customerName,
    ticket: emailJob.ticket,
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
 * Email → server generiše PDF i šalje SMTP.
 * Štampa → HTML prijemnica (PrintableTicket / PrintableDeliveryNote).
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
    const ticket = emailJob.ticket ?? document.ticket;
    try {
      const sentTo = await sendDocumentEmail({ ...emailJob, ticket });
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
