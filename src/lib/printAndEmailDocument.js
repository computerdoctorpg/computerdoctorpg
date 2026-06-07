import { flushSync } from 'react-dom';
import { sendTicketEmail } from '@/lib/sendTicketEmail';
import { slimTicketForEmail } from '@/lib/slimTicketForEmail';

export async function sendDocumentEmail(emailJob) {
  if (!emailJob?.ticket) {
    throw new Error('Podaci dokumenta nisu proslijeđeni za email.');
  }

  console.log('[email] Slanje na:', emailJob.to, '| ticket id:', emailJob.ticketId);

  await sendTicketEmail({
    to: emailJob.to,
    type: emailJob.type,
    ticketId: emailJob.ticketId,
    customerName: emailJob.customerName,
    ticket: slimTicketForEmail(emailJob.ticket),
    filename: emailJob.filename,
  });

  console.log('[email] Poslato uspješno na:', emailJob.to);
  return emailJob.to;
}

async function waitForPrintContent(ms = 800) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Štampa lijepu HTML prijemnici/otpremnicu preko browser print dijaloga. */
export async function printHtmlDocument() {
  window.print();
}

/**
 * 1. Email → server generiše PDF (odmah, ne čeka render)
 * 2. Render HTML prijemnice za štampu
 * 3. Browser print dijalog
 */
export async function runPrintAndEmailJob({
  document: docData,
  emailJob,
  renderForPrint,
  toastRef,
  successLabel = 'Dokument poslat na',
}) {
  if (!docData?.ticket) {
    throw new Error('Podaci dokumenta nisu proslijeđeni.');
  }

  // Email šaljemo ODMAH — ne čekamo render
  if (emailJob) {
    const ticket = emailJob.ticket ?? docData.ticket;
    console.log('[email] emailJob:', { to: emailJob.to, type: emailJob.type, ticketId: emailJob.ticketId });
    try {
      const sentTo = await sendDocumentEmail({ ...emailJob, ticket });
      toastRef?.current?.({
        title: 'Email poslat',
        description: `${successLabel} ${sentTo}`,
        className: 'bg-emerald-600 text-white border-none',
      });
    } catch (error) {
      console.error('[email] Greška:', error);
      toastRef?.current?.({
        variant: 'destructive',
        title: 'Email nije poslat',
        description: error.message || 'Proverite SMTP podešavanja na serveru.',
      });
    }
  } else {
    console.log('[email] emailJob je null — email se ne šalje (sendEmail=false ili nema adrese)');
  }

  // Render za štampu
  if (renderForPrint) {
    flushSync(renderForPrint);
    await waitForPrintContent(400);
    window.print();
  }
}
