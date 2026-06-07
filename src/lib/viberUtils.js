export const formatPhoneForViber = (phone) => {
  if (!phone) return null;
  let clean = phone.replace(/\D/g, '');
  if (!clean) return null;
  if (clean.startsWith('0')) clean = clean.substring(1);
  if (!clean.startsWith('382')) clean = '382' + clean;
  return clean;
};

export const getTicketServicePrice = (ticket, overrides = {}) => {
  const partsCost = parseFloat(overrides.partsCost ?? ticket.partsCost) || 0;
  const serviceCost = parseFloat(overrides.serviceCost ?? ticket.serviceCost) || 0;
  const total = partsCost + serviceCost;

  if (total > 0) return total.toFixed(2);

  const estimated = parseFloat(overrides.estimatedCost ?? ticket.estimatedCost) || 0;
  if (estimated > 0) return estimated.toFixed(2);

  return null;
};

/** Tačan tekst poruke — ne mijenjati format (razmaci, emoji, tab prije linka). */
export const buildCompletionViberMessage = (ticket, overrides = {}) => {
  const price = getTicketServicePrice(ticket, overrides);
  const priceSuffix = price ? ` ${price}` : '';

  return `Poštovani,

🔧 Vaš uređaj je uspješno završen i spreman za preuzimanje.

🕘 Preuzimanje: svakim radnim danom od 09:00 do 17:00h

📄 Obavezno ponijeti prijemni list (bez njega nije moguće preuzimanje uređaja)

💵 Plaćanje karticom nije moguće

💰 Cijena ukupnog servisa iznosi: €${priceSuffix}

Hvala na povjerenju.   

COMPUTER DOCTOR
💻 Vaš izabrani IT 				https://computer-doctor.me/`;
};

const copyTextToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
};

/**
 * Viber draft u URL-u s emoji/š/đ/č znakovima često kida slova (limit URL-a).
 * Poruka se kopira u clipboard u punom obliku, Viber se otvara samo na broj.
 */
export const openViberChat = async (phone, message) => {
  const cleanPhone = formatPhoneForViber(phone);
  if (!cleanPhone) return { ok: false, copied: false };

  const copied = await copyTextToClipboard(message);
  window.location.href = `viber://chat?number=%2B${cleanPhone}`;

  return { ok: true, copied };
};
