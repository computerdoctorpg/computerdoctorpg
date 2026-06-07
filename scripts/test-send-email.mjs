import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const to = env.SMTP_USER;
const fromName = env.SMTP_FROM_NAME || 'Computer Doctor';
const fromEmail = env.SMTP_FROM || env.SMTP_USER;

const pdf = new jsPDF();
pdf.setFontSize(14);
pdf.text('Computer Doctor — TEST prijemnica', 20, 25);
pdf.setFontSize(11);
pdf.text('Nalog: #TEST/6', 20, 40);
pdf.text('Klijent: Test Klijent', 20, 50);
pdf.text('Uredjaj: Dell XPS 15', 20, 60);
pdf.text('Datum: ' + new Date().toLocaleString('sr-RS'), 20, 70);
pdf.text('Ovo je test email iz servisne aplikacije.', 20, 85);

const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT || 465),
  secure: env.SMTP_SECURE !== 'false',
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

try {
  const info = await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    replyTo: fromEmail,
    subject: 'Computer Doctor — TEST: Uređaj primljen na servis (#TEST/6)',
    text: `Poštovani,

ovo je test poruka iz servisne aplikacije.
U prilogu je test PDF prijemnica.

Computer Doctor`,
    html: `<p>Poštovani,</p><p>ovo je <strong>test poruka</strong> iz servisne aplikacije.<br>U prilogu je test PDF prijemnica.</p><p>Computer Doctor</p>`,
    attachments: [
      {
        filename: 'Prijemnica_TEST-6.pdf',
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  console.log('OK: Test email poslat');
  console.log('Prima:', to);
  console.log('MessageId:', info.messageId);
} catch (error) {
  console.error('GREŠKA:', error.message);
  process.exit(1);
}
