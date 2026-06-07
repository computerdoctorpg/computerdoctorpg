import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { IntakeReceiptPdfDocument } from '@/pdf/IntakeReceiptPdfDocument';
import { DeliveryNotePdfDocument } from '@/pdf/DeliveryNotePdfDocument';

export async function generateDocumentPdf(type, ticket) {
  if (!ticket) {
    throw new Error('Podaci dokumenta nisu proslijeđeni.');
  }

  let doc;
  if (type === 'delivery') {
    doc = <DeliveryNotePdfDocument ticket={ticket} />;
  } else if (type === 'intake') {
    doc = <IntakeReceiptPdfDocument ticket={ticket} />;
  } else {
    throw new Error(`Nepoznat tip PDF dokumenta: ${type}`);
  }

  return pdf(doc).toBlob();
}

export function printPdfBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
    iframe.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      iframe.remove();
    };

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          cleanup();
          resolve();
        }, 1000);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error('PDF nije učitan za štampu.'));
    };

    document.body.appendChild(iframe);
  });
}

export async function printDocumentPdf(type, ticket) {
  const pdfBlob = await generateDocumentPdf(type, ticket);
  await printPdfBlob(pdfBlob);
  return pdfBlob;
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.split(',')[1];
      if (!base64) reject(new Error('Neuspešno kodiranje PDF-a.'));
      else resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
