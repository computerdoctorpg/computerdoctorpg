import { getPrintStrings } from '@/lib/printTranslations';

const translationCache = new Map();
const TRANSLATE_API = import.meta.env.DEV
  ? '/api/translate/get'
  : 'https://api.mymemory.translated.net/get';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchTranslation(text, langPair) {
  const q = encodeURIComponent(text);
  const res = await fetch(`${TRANSLATE_API}?q=${q}&langpair=${langPair}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || 'Translation API error');
  }
  const translated = data.responseData?.translatedText?.trim();
  if (!translated) throw new Error('Empty translation');
  return translated;
}

export async function translateText(text, from = 'sr', to = 'en') {
  const trimmed = text?.trim();
  if (!trimmed) return text || '';

  const cacheKey = `${from}|${to}|${trimmed}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const langPairs = [`${from}|${to}`, 'sr-RS|en-GB', 'sr|en-GB', 'bs|en'];
  const chunks = [];
  const maxLen = 450;
  let remaining = trimmed;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, maxLen));
    remaining = remaining.slice(maxLen);
  }

  try {
    const translatedParts = [];
    for (const chunk of chunks) {
      let translated = null;
      let lastError = null;
      for (const langPair of langPairs) {
        try {
          translated = await fetchTranslation(chunk, langPair);
          if (translated.toLowerCase() !== chunk.toLowerCase()) break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!translated) throw lastError || new Error('Translation failed');
      translatedParts.push(translated);
      if (chunks.length > 1) await delay(350);
    }

    const result = translatedParts.join('');
    translationCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn('Translation fallback to original:', error);
    return trimmed;
  }
}

async function translateFields(ticket, fieldNames) {
  const entries = await Promise.all(
    fieldNames.map(async (field) => {
      const value = ticket[field];
      if (!value?.trim()) return [field, value];
      return [field, await translateText(value)];
    })
  );
  return Object.fromEntries(entries);
}

export async function prepareServiceTicketForEnglishPrint(ticket) {
  const fields = ['issueDescription', 'notes', 'deviceName'];
  if (ticket.hasBag && ticket.bagDescription) fields.push('bagDescription');

  const translated = await translateFields(ticket, fields);
  const en = getPrintStrings('en');

  return {
    ...ticket,
    ...translated,
    notes: translated.notes?.trim() ? translated.notes : en.noNotes,
    printLocale: 'en',
  };
}

export async function prepareVhsTicketForEnglishPrint(ticket) {
  const fields = ['vhsCassetteCondition'];
  if (ticket.notes?.trim()) fields.push('notes');

  const translated = await translateFields(ticket, fields);

  return {
    ...ticket,
    ...translated,
    printLocale: 'en',
  };
}
