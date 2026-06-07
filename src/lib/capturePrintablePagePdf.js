import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { blobToBase64 } from '@/lib/generateTicketPdf';

async function waitForImages(root) {
  if (!root) return;
  const images = [...root.querySelectorAll('img')];
  await Promise.all(
    images.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        }),
    ),
  );
}

function prepareCaptureWrapper(wrapper) {
  if (!wrapper) return () => {};

  const prev = {
    className: wrapper.className,
    style: wrapper.getAttribute('style'),
  };

  wrapper.classList.remove('hidden');
  wrapper.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:210mm',
    'height:297mm',
    'overflow:hidden',
    'z-index:-1',
    'opacity:0',
    'pointer-events:none',
    'background:#fff',
  ].join(';');

  return () => {
    wrapper.className = prev.className;
    if (prev.style == null) wrapper.removeAttribute('style');
    else wrapper.setAttribute('style', prev.style);
  };
}

export async function capturePrintablePagePdf() {
  const page = document.querySelector('[data-pdf-page]');
  if (!page) {
    throw new Error('Prijemnica nije pripremljena za PDF.');
  }

  const wrapper = page.closest('.printable-content');
  const restoreWrapper = prepareCaptureWrapper(wrapper);

  try {
    await waitForImages(page);
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: page.offsetWidth,
      height: page.offsetHeight,
      windowWidth: page.scrollWidth,
      windowHeight: page.scrollHeight,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);

    return pdf.output('blob');
  } finally {
    restoreWrapper();
  }
}

export async function capturePrintablePagePdfBase64() {
  const blob = await capturePrintablePagePdf();
  return blobToBase64(blob);
}
