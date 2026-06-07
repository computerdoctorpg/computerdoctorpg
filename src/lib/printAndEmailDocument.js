import { flushSync } from 'react-dom';
import { generatePdfFromElement } from '@/lib/generateTicketPdf';
import { sendTicketEmail } from '@/lib/sendTicketEmail';

const waitForPrintElement = (type, timeoutMs = 8000) =>
  new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      const el = document.querySelector(`[data-print-type="${type}"]`);
      if (el) resolve(el);
      else if (Date.now() > deadline) reject(new Error('PDF dokument nije spreman za slanje.'));
      else requestAnimationFrame(check);
    };
    check();
  });

export async function sendDocumentEmail(emailJob) {
  const el = await waitForPrintElement(emailJob.type);
  const pdfBlob = await generatePdfFromElement(el);
  await sendTicketEmail({
    to: emailJob.to,
    type: emailJob.type,
    ticketId: emailJob.ticketId,
    customerName: emailJob.customerName,
    pdfBlob,
    filename: emailJob.filename,
  });
  return emailJob.to;
}

/**
 * Renderuje dokument u DOM, opciono šalje email, zatim otvara dijalog za štampu.
 */
export async function runPrintAndEmailJob({
  render,
  emailJob,
  toastRef,
  skipPrintEffectRef,
  successLabel = 'Dokument poslat na',
}) {
  if (skipPrintEffectRef) skipPrintEffectRef.current = true;

  flushSync(render);

  if (emailJob) {
    try {
      const sentTo = await sendDocumentEmail(emailJob);
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

  await new Promise((r) => setTimeout(r, emailJob ? 400 : 300));
  window.print();
}
