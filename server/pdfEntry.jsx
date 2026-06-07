import React from 'react';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToBuffer } from '@react-pdf/renderer';
import { IntakeReceiptPdfDocument } from '@/pdf/IntakeReceiptPdfDocument.jsx';
import { DeliveryNotePdfDocument } from '@/pdf/DeliveryNotePdfDocument.jsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function readLogoDataUrl(filename) {
  const filePath = join(projectRoot, 'public', 'images', filename);
  if (!existsSync(filePath)) return null;
  return `data:image/png;base64,${readFileSync(filePath).toString('base64')}`;
}

let logos = null;
function getLogos() {
  if (!logos) {
    logos = {
      logoSrc: readLogoDataUrl('logo.png'),
      deliveryLogoSrc: readLogoDataUrl('logo-delivery.png'),
    };
  }
  return logos;
}

export async function generateDocumentPdfBuffer(type, ticket) {
  if (!ticket) throw new Error('Podaci dokumenta nisu proslijeđeni.');

  const { logoSrc, deliveryLogoSrc } = getLogos();

  let element;
  if (type === 'delivery') {
    element = React.createElement(DeliveryNotePdfDocument, {
      ticket,
      logoSrc: deliveryLogoSrc || logoSrc,
    });
  } else {
    element = React.createElement(IntakeReceiptPdfDocument, {
      ticket,
      logoSrc,
    });
  }

  return renderToBuffer(element);
}
