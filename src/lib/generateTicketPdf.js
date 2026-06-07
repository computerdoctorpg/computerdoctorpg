import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/** A4 at 96dpi — html2canvas radi pouzdanije sa px nego sa mm */
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

function waitForImages(root) {
  const imgs = [...root.querySelectorAll('img')];
  if (imgs.length === 0) return Promise.resolve();

  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 4000);
        }),
    ),
  );
}

function captureStyles(el) {
  return {
    position: el.style.position,
    left: el.style.left,
    top: el.style.top,
    visibility: el.style.visibility,
    display: el.style.display,
    opacity: el.style.opacity,
    zIndex: el.style.zIndex,
    width: el.style.width,
    height: el.style.height,
    maxHeight: el.style.maxHeight,
    overflow: el.style.overflow,
    boxSizing: el.style.boxSizing,
    pointerEvents: el.style.pointerEvents,
    background: el.style.background,
    hadHidden: el.classList.contains('hidden'),
  };
}

function restoreStyles(el, prev) {
  if (prev.hadHidden) el.classList.add('hidden');
  else el.classList.remove('hidden');
  el.style.position = prev.position;
  el.style.left = prev.left;
  el.style.top = prev.top;
  el.style.visibility = prev.visibility;
  el.style.display = prev.display;
  el.style.opacity = prev.opacity;
  el.style.zIndex = prev.zIndex;
  el.style.width = prev.width;
  el.style.height = prev.height;
  el.style.maxHeight = prev.maxHeight;
  el.style.overflow = prev.overflow;
  el.style.boxSizing = prev.boxSizing;
  el.style.pointerEvents = prev.pointerEvents;
  el.style.background = prev.background;
}

function prepareForCapture(wrapper, page) {
  wrapper.classList.remove('hidden');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '0';
  wrapper.style.top = '0';
  wrapper.style.visibility = 'visible';
  wrapper.style.display = 'block';
  wrapper.style.opacity = '0';
  wrapper.style.zIndex = '-1';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.background = '#ffffff';
  wrapper.style.width = `${A4_WIDTH_PX}px`;
  wrapper.style.height = `${A4_HEIGHT_PX}px`;
  wrapper.style.overflow = 'hidden';

  page.style.width = `${A4_WIDTH_PX}px`;
  page.style.height = `${A4_HEIGHT_PX}px`;
  page.style.maxHeight = `${A4_HEIGHT_PX}px`;
  page.style.minHeight = `${A4_HEIGHT_PX}px`;
  page.style.overflow = 'hidden';
  page.style.boxSizing = 'border-box';
  page.style.background = '#ffffff';
}

function fixCloneForPdf(clonedPage) {
  clonedPage.style.width = `${A4_WIDTH_PX}px`;
  clonedPage.style.height = `${A4_HEIGHT_PX}px`;
  clonedPage.style.maxHeight = `${A4_HEIGHT_PX}px`;
  clonedPage.style.overflow = 'hidden';
  clonedPage.style.boxSizing = 'border-box';
  clonedPage.style.background = '#ffffff';

  clonedPage.querySelectorAll('*').forEach((node) => {
    const style = node.style;
    if (style.columnCount || style.columns) {
      style.columnCount = '';
      style.columns = '';
    }
  });
}

export async function generatePdfFromElement(element) {
  if (!element) {
    throw new Error('Element za PDF nije pronađen.');
  }

  const page = element.querySelector('[data-pdf-page]') || element.firstElementChild || element;
  const wrapperPrev = captureStyles(element);
  const pagePrev = page !== element ? captureStyles(page) : null;

  prepareForCapture(element, page);

  try {
    if (document.fonts?.ready) {
      await document.fonts.ready.catch(() => {});
    }
    await waitForImages(page);
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      windowWidth: A4_WIDTH_PX,
      windowHeight: A4_HEIGHT_PX,
      scrollX: 0,
      scrollY: 0,
      foreignObjectRendering: false,
      onclone: (_doc, clonedPage) => {
        fixCloneForPdf(clonedPage);
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.94);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

    return pdf.output('blob');
  } finally {
    restoreStyles(element, wrapperPrev);
    if (pagePrev) restoreStyles(page, pagePrev);
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
