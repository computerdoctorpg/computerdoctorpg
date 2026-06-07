import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generatePdfFromElement(element) {
  if (!element) {
    throw new Error('Element za PDF nije pronađen.');
  }

  const hadHiddenClass = element.classList.contains('hidden');
  const prev = {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    visibility: element.style.visibility,
    display: element.style.display,
    zIndex: element.style.zIndex,
  };

  element.classList.remove('hidden');
  element.style.position = 'fixed';
  element.style.left = '-10000px';
  element.style.top = '0';
  element.style.visibility = 'visible';
  element.style.display = 'block';
  element.style.zIndex = '-1';

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    // Uvijek jedna A4 stranica — skaliraj ako je sadržaj nešto viši
    if (imgHeight > pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    } else {
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);
    }

    return pdf.output('blob');
  } finally {
    if (hadHiddenClass) element.classList.add('hidden');
    element.style.position = prev.position;
    element.style.left = prev.left;
    element.style.top = prev.top;
    element.style.visibility = prev.visibility;
    element.style.display = prev.display;
    element.style.zIndex = prev.zIndex;
  }
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result?.split(',')[1];
      if (!base64) reject(new Error('Neuspješno kodiranje PDF-a.'));
      else resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
