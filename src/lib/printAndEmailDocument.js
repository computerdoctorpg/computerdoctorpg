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

async function waitForImages(root) {
  const images = [...root.querySelectorAll('img')];
  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        }),
    ),
  );
}

/** Štampa preko skrivenog iframe-a — radi i posle async save/email (browser ne blokira). */
export async function printPrintablePage() {
  const page = document.querySelector('.printable-content [data-pdf-page]');
  if (!page) {
    throw new Error('Prijemnica nije učitana za štampu.');
  }

  await waitForImages(page);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    throw new Error('Štampa nije dostupna u browseru.');
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="utf-8" />
  ${styles}
  <style>
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  </style>
</head>
<body>${page.outerHTML}</body>
</html>`);
  doc.close();

  await new Promise((resolve) => {
    const printFrame = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          iframe.remove();
          resolve();
        }, 500);
      }
    };

    setTimeout(printFrame, 350);
  });
}

/**
 * 1. Render HTML prijemnice
 * 2. Štampa (iframe — pouzdano posle async operacija)
 * 3. Email u pozadini
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

  if (renderForPrint) {
    flushSync(renderForPrint);
    await printPrintablePage();
  }

  if (emailJob) {
    const ticket = emailJob.ticket ?? docData.ticket;
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
}

/** Direktna HTML štampa (za postojeće pozive). */
export async function printHtmlDocument(renderForPrint) {
  if (renderForPrint) {
    flushSync(renderForPrint);
  }
  await printPrintablePage();
}
