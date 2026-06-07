import { flushSync } from 'react-dom';
import { sendTicketEmail } from '@/lib/sendTicketEmail';
import { slimTicketForEmail } from '@/lib/slimTicketForEmail';

export async function sendDocumentEmail(emailJob) {
  if (!emailJob?.ticket) {
    throw new Error('Podaci dokumenta nisu proslijeđeni za email.');
  }

  await sendTicketEmail({
    to: emailJob.to,
    type: emailJob.type,
    ticketId: emailJob.ticketId,
    customerName: emailJob.customerName,
    ticket: slimTicketForEmail(emailJob.ticket),
    filename: emailJob.filename,
  });
  return emailJob.to;
}

async function waitForPrintablePage() {
  for (let i = 0; i < 20; i += 1) {
    if (document.querySelector('.printable-content [data-pdf-page]')) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('Prijemnica nije učitana za štampu.');
}

/** Štampa lijepu HTML prijemnici/otpremnicu preko browser print dijaloga. */
export async function printHtmlDocument() {
  await new Promise((r) => setTimeout(r, 350));
  window.print();
}

/**
 * 1. Render HTML prijemnice za štampu
 * 2. Email → server generiše PDF i šalje SMTP (isti put kao test skripta)
 * 3. Browser print dijalog
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

  if (renderForPrint) {
    flushSync(renderForPrint);
    await waitForPrintablePage();
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
        description: error.message || 'Proverite SMTP podešavanja na serveru.',
      });
    }
  }

  if (renderForPrint) {
    await printHtmlDocument();
  }
}
