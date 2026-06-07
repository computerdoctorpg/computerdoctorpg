import { readFileSync } from 'node:fs';
import nodemailer from 'nodemailer';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    })
);

const config = {
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT || 465),
  secure: env.SMTP_SECURE !== 'false',
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
};

try {
  const transporter = nodemailer.createTransport(config);
  await transporter.verify();
  console.log('OK: SMTP konekcija uspješna');
  console.log('Host:', config.host, 'User:', config.auth.user);
} catch (error) {
  console.error('GREŠKA:', error.message);
  process.exit(1);
}
