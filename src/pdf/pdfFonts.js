import { Font } from '@react-pdf/renderer';

export const PDF_FONT = 'NotoSans';

let registered = false;

export function registerPdfFonts({ regularSrc, boldSrc } = {}) {
  if (registered) return;

  const regular = regularSrc || '/fonts/NotoSans-Regular.ttf';
  const bold = boldSrc || '/fonts/NotoSans-Bold.ttf';

  Font.register({
    family: PDF_FONT,
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  });

  registered = true;
}

export const pdfBold = { fontFamily: PDF_FONT, fontWeight: 700 };
