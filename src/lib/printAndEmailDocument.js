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

function getPrintablePageNode() {
  return document.querySelector('.printable-content [data-pdf-page]');
}

/** window.print() na glavnoj stranici — koristi postojeći @media print CSS. */
export function triggerBrowserPrint() {
  const page = getPrintablePageNode();
  if (!page) {
    throw new Error('Dokument nije učitan za štampu.');
  }

  return new Promise((resolve, reject) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          window.print();
          setTimeout(resolve, 400);
        } catch (error) {
          reject(error);
        }
      });
    });
  });
}

function queueBackgroundEmail(emailJob, toastRef, successLabel) {
  if (!emailJob) return;

  const ticket = emailJob.ticket;
  sendDocumentEmail({ ...emailJob, ticket })
    .then((sentTo) => {
      toastRef?.current?.({
        title: 'Email poslat',
        description: `${successLabel} ${sentTo}`,
        className: 'bg-emerald-600 text-white border-none',
      });
    })
    .catch((error) => {
      console.error('[email] Greška:', error);
      toastRef?.current?.({
        variant: 'destructive',
        title: 'Email nije poslat',
        description: error.message || 'Proverite SMTP podešavanja na serveru.',
      });
    });
}

/**
 * 1. Render HTML dokumenta (flushSync)
 * 2. Štampa odmah (pre async save — browser zadržava user gesture)
 * 3. Opciono sačuvaj u bazi
 * 4. Email u pozadini
 */
export async function runPrintAndEmailJob({
  emailJob,
  renderForPrint,
  toastRef,
  successLabel = 'Dokument poslat na',
  saveAfterPrint,
}) {
  if (renderForPrint) {
    flushSync(renderForPrint);
    await triggerBrowserPrint();
  }

  let savedResult = null;
  if (saveAfterPrint) {
    savedResult = await saveAfterPrint();
  }

  const resolvedEmailJob =
    typeof emailJob === 'function' ? emailJob(savedResult) : emailJob;
  queueBackgroundEmail(resolvedEmailJob, toastRef, successLabel);
}

/** Direktna HTML štampa (npr. automatska otpremnica posle statusa). */
export async function printHtmlDocument(renderForPrint) {
  if (renderForPrint) {
    flushSync(renderForPrint);
  }
  await triggerBrowserPrint();
}
