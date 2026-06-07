import { flushSync } from 'react-dom';
import { sendTicketEmail } from '@/lib/sendTicketEmail';
import { capturePrintablePagePdfBase64 } from '@/lib/capturePrintablePagePdf';

export async function sendDocumentEmail(emailJob) {
  if (!emailJob?.ticket && !emailJob?.pdfBase64) {
    throw new Error('Podaci dokumenta nisu proslijeđeni za email.');
  }

  await sendTicketEmail({
    to: emailJob.to,
    type: emailJob.type,
    ticketId: emailJob.ticketId,
    customerName: emailJob.customerName,
    ticket: emailJob.ticket,
    filename: emailJob.filename,
    pdfBase64: emailJob.pdfBase64,
  });
  return emailJob.to;
}

async function waitForPrintablePage() {
  for (let i = 0; i < 20; i += 1) {
    if (document.querySelector('[data-pdf-page]')) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('Prijemnica nije učitana za štampu.');
}

/** Štampa lijepu HTML prijemnici/otpremnicu (PrintableTicket) preko browser print dijaloga. */
export async function printHtmlDocument() {
  await new Promise((r) => setTimeout(r, 350));
  window.print();
}

/**
 * 1. Render HTML prijemnice (PrintableTicket)
 * 2. Email → isti HTML kao PDF prilog (html2canvas)
 * 3. Štampa → browser print dijalog
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
      const pdfBase64 = await capturePrintablePagePdfBase64();
      const sentTo = await sendDocumentEmail({ ...emailJob, ticket, pdfBase64 });
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
    await printHtmlDocument();
  }
}
