import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const EMAIL_TYPES = {
  intake: {
    subject: (ticketId) => `Computer Doctor — Uređaj primljen na servis (#${ticketId})`,
    intro: (name) =>
      `Poštovani${name ? ` ${name}` : ''},\n\npotvrđujemo da je vaš uređaj primljen na servis u Computer Doctor servisnom centru.`,
    attachment: (ticketId) => `Prijemnica_${ticketId}.pdf`,
  },
  delivery: {
    subject: (ticketId) => `Computer Doctor — Uređaj spreman / otpremnica (#${ticketId})`,
    intro: (name) =>
      `Poštovani${name ? ` ${name}` : ''},\n\nvaš uređaj je završen i spreman za preuzimanje. U prilogu se nalazi otpremnica.`,
    attachment: (ticketId) => `Otpremnica_${ticketId}.pdf`,
  },
};

const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const isEmailConfigured = () => {
  const cfg = getSmtpConfig();
  return Boolean(cfg.host && cfg.auth.user && cfg.auth.pass);
};

async function verifyAuthToken(authHeader) {
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

export async function handleSendTicketEmail(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const user = await verifyAuthToken(req.headers.authorization);
    if (!user) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Morate biti ulogovani da biste slali email.' }));
      return;
    }

    if (!isEmailConfigured()) {
      res.writeHead(503);
      res.end(JSON.stringify({
        error: 'SMTP nije podešen na serveru. Dodajte SMTP_HOST, SMTP_USER i SMTP_PASS u .env.',
      }));
      return;
    }

    const body = await readJsonBody(req);
    const { to, type, ticketId, customerName, pdfBase64, filename } = body;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Neispravna email adresa klijenta.' }));
      return;
    }

    const emailType = EMAIL_TYPES[type] || EMAIL_TYPES.intake;
    const pdfBuffer = pdfBase64 ? Buffer.from(pdfBase64, 'base64') : null;

    if (!pdfBuffer?.length) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'PDF prilog nije proslijeđen.' }));
      return;
    }

    const fromName = process.env.SMTP_FROM_NAME || 'Computer Doctor';
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    const from = `${fromName} <${fromEmail}>`;

    const transporter = nodemailer.createTransport(getSmtpConfig());

    const textBody = `${emailType.intro(customerName || '')}

Broj naloga: #${ticketId || '—'}

Computer Doctor
Bul. Ibrahima Koristovica bb, Podgorica
Tel: 068/862-807
Email: prodaja@computer-doctor.me
Radno vrijeme: Pon–Pet 9h–16h, Sub 10h–13h

Hvala na povjerenju!`;

    await transporter.sendMail({
      from,
      to,
      replyTo: fromEmail,
      subject: emailType.subject(ticketId || ''),
      text: textBody,
      html: textBody.replace(/\n/g, '<br>'),
      attachments: [
        {
          filename: filename || emailType.attachment(ticketId || 'dokument'),
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, message: `Email poslat na ${to}` }));
  } catch (error) {
    console.error('Send ticket email error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message || 'Greška pri slanju emaila.' }));
  }
}
