// server/pdfEntry.jsx
import React3 from "react";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToBuffer } from "@react-pdf/renderer";

// src/pdf/IntakeReceiptPdfDocument.jsx
import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

// src/lib/printTranslations.js
var SERVICE_TERMS_SR = [
  "1. Servis ne obavje\u0161tava korisnika o servisnim uslugama na ure\u0111aju koje su do 10\u20AC.",
  "2. Servis je obavezan da pre po\u010Detka servisiranja i po zavr\u0161enom servisu uredno obavesti korisnika SMS porukom, e-mailom ili telefonskim pozivom.",
  "3. Servis je du\u017Ean da u roku od 48h (isklju\u010Duju\u0107i vikend) konstatuje kvar na ure\u0111aju i obavesti korisnika.",
  "4. Dijagnostika ure\u0111aja se napla\u0107uje 30\u20AC samo u slu\u010Daju da korisnik NE \u017Eeli da odobri popravku nakon utvr\u0111ivanja kvara. Ukoliko korisnik odobri popravku, dijagnostika se ne napla\u0107uje.",
  "5. Korisnik je du\u017Ean da izmiri tro\u0161kove servisiranja pre preuzimanja ure\u0111aja.",
  "6. SERVIS NE ODGOVARA ZA PODATKE NA URE\u0110AJU. KORISNIK JE OBAVEZAN DA URADI REZERVNU KOPIJU (BACKUP) PRE DONO\u0160ENJA URE\u0110AJA NA SERVIS.",
  "7. Korisnik je du\u017Ean da preuzme ure\u0111aj u roku od 15 dana. Nakon isteka roka ure\u0111aj ostaje u servisu do daljnjeg, ali servis ne snosi odgovornost za eventualnu \u0161tetu ili gubitak.",
  "8. Dopunjavanjem kertrid\u017Ea gubi se garancija na \u0161tampa\u010D.",
  "9. Ure\u0111aj se preuzima isklju\u010Divo uz servisnu prijemnicu.",
  "10. Korisnik gubi pravo na reklamaciju ukoliko je ure\u0111aj o\u0161te\u0107en, pokvaren ili ima mehani\u010Dka o\u0161te\u0107enja nastala gre\u0161kom korisnika.",
  "11. Softverske gre\u0161ke ne ulaze u garanciju; garancija se ne odnosi na operativni sistem i programe.",
  "12. Prilikom popunjavanja prijemnog lista obavezan je detaljan pregled ure\u0111aja radi evidencije postoje\u0107ih nedostataka.",
  '13. U okviru procedure "\u010Duvanja podataka" podrazumijevaju se slike, muzika i tekstualni fajlovi. Ne podrazumijevaju se programi i \u0161ifre.',
  "14. Servis ne radi vikendom."
];
var SERVICE_TERMS_EN = [
  "1. The service will not notify the customer about repair services on the device that cost up to \u20AC10.",
  "2. The service is obliged to notify the customer by SMS, email, or phone call before and after the repair is completed.",
  "3. The service must diagnose the fault within 48 hours (excluding weekends) and notify the customer.",
  "4. Device diagnostics costs \u20AC30 only if the customer does NOT approve the repair after the fault is identified. If the customer approves the repair, diagnostics is not charged.",
  "5. The customer must settle repair costs before collecting the device.",
  "6. THE SERVICE IS NOT RESPONSIBLE FOR DATA ON THE DEVICE. THE CUSTOMER MUST BACK UP DATA BEFORE BRINGING THE DEVICE FOR SERVICE.",
  "7. The customer must collect the device within 15 days. After this period the device remains in the service, but the service is not liable for damage or loss.",
  "8. Refilling cartridges voids the printer warranty.",
  "9. The device can only be collected with this service receipt.",
  "10. The customer loses the right to complain if the device was damaged or has mechanical damage caused by the user.",
  "11. Software errors are not covered by warranty; warranty does not apply to the operating system and programs.",
  "12. When filling in this receipt, a detailed inspection of the device is required to record existing defects.",
  '13. The "keep data" procedure covers images, music, and text files. It does not cover programs and passwords.',
  "14. The service is closed on weekends."
];
var VHS_TERMS_SR = [
  "1. Rok digitalizacije zavisi od broja kaseta i stanja snimka.",
  "2. Klijent preuzima gotov USB sa MP4 fajlovima po zavr\u0161etku posla.",
  "3. Originalne VHS kasete vra\u0107aju se klijentu po preuzimanju USB-a.",
  "4. Klijent je du\u017Ean preuzeti materijal u roku od 15 dana od obavje\u0161tenja.",
  "5. Ure\u0111aj/kasete se preuzimaju isklju\u010Divo uz ovaj prijemni list.",
  "6. Computer Doctor ne odgovara za kasete o\u0161te\u0107ene pre prijema ili usled lo\u0161eg stanja magnetne trake."
];
var VHS_TERMS_EN = [
  "1. Digitization time depends on the number of cassettes and recording condition.",
  "2. The customer collects the finished USB with MP4 files upon completion.",
  "3. Original VHS cassettes are returned to the customer when collecting the USB.",
  "4. The customer must collect the material within 15 days of notification.",
  "5. Cassettes can only be collected with this receipt.",
  "6. Computer Doctor is not responsible for cassettes damaged before intake or due to poor magnetic tape condition."
];
var PRINT_I18N = {
  sr: {
    tagline: "Profesionalni Servis Ra\u010Dunara \xB7 Podgorica",
    hours: "Pon\u2013Pet 9h\u201316h \xB7 Sub 10h\u201313h",
    receiptTitle: "Prijemni List",
    receiptTitleWarranty: "Prijemni List \u2014 Garancija",
    warrantySubtitle: "Ure\u0111aj primljen u garantnom roku",
    warrantyUntil: "do",
    invoice: "Ra\u010Dun",
    intakeNumber: "Broj prijema",
    diagnosticsBanner: "DIJAGNOSTIKA URE\u0110AJA SE NAPLA\u0106UJE 30 EURA",
    clientSection: "Podaci o klijentu",
    deviceSection: "Podaci o ure\u0111aju",
    fullName: "Ime i prezime",
    phone: "Telefon",
    brand: "Brend",
    model: "Model",
    laptopSn: "S/N laptopa",
    batterySn: "S/N baterije",
    chargerSn: "S/N punja\u010Da",
    osPassword: "OS \u0161ifra",
    issueSection: "Opis kvara / prijavljeni problemi",
    notesSection: "Napomena",
    noNotes: "Nema napomena",
    deleteData: "BRISATI",
    keepData: "SA\u010CUVATI",
    bag: "Torba",
    termsTitle: "Uslovi servisiranja",
    termsIntro: "PREUZIMANJEM I POTPISIVANJEM OVOG DOKUMENTA KORISNIK JE SAGLASAN SA UNIJETIM PODACIMA I SLJEDE\u0106IM USLOVIMA:",
    terms: SERVICE_TERMS_SR,
    boldTerms: [5],
    signedService: "Preuzeo (Servis)",
    signedClient: "Predao (Klijent)",
    clientAgrees: "Saglasan/na sa uslovima servisa",
    none: "NEMA",
    dateLocale: "sr-RS",
    vhsTagline: "Digitalizacija snimaka \xB7 Podgorica",
    vhsTitle: "Prijem Snimaka",
    vhsSubtitle: "Digitalizacija u MP4 format \xB7 USB uklju\u010Den u cenu",
    usbNotice: "U cenu je uklju\u010Den USB na koji se skladi\u0161te podaci u MP4 formatu",
    cassetteSection: "Podaci o kasetama",
    cassetteCount: "Broj kaseta",
    pricePerCassette: "Cena po kaseti",
    cassetteCondition: "Stanje kaseta",
    totalPrice: "Ukupna cena",
    vhsTerms: VHS_TERMS_SR,
    vhsBoldTerms: [5],
    clientAgreesShort: "Saglasan/na sa uslovima"
  },
  en: {
    tagline: "Professional Computer Service \xB7 Podgorica",
    hours: "Mon\u2013Fri 9am\u20134pm \xB7 Sat 10am\u20131pm",
    receiptTitle: "Intake Receipt",
    receiptTitleWarranty: "Intake Receipt \u2014 Warranty",
    warrantySubtitle: "Device received under warranty",
    warrantyUntil: "until",
    invoice: "Invoice",
    intakeNumber: "Intake No.",
    diagnosticsBanner: "DEVICE DIAGNOSTICS COSTS 30 EUR",
    clientSection: "Customer details",
    deviceSection: "Device details",
    fullName: "Full name",
    phone: "Phone",
    brand: "Brand",
    model: "Model",
    laptopSn: "Laptop S/N",
    batterySn: "Battery S/N",
    chargerSn: "Charger S/N",
    osPassword: "OS password",
    issueSection: "Fault description / reported issues",
    notesSection: "Notes",
    noNotes: "No notes",
    deleteData: "DELETE",
    keepData: "KEEP",
    bag: "Bag",
    termsTitle: "Service terms",
    termsIntro: "BY COLLECTING AND SIGNING THIS DOCUMENT, THE CUSTOMER AGREES TO THE ENTERED DATA AND THE FOLLOWING TERMS:",
    terms: SERVICE_TERMS_EN,
    boldTerms: [5],
    signedService: "Received by (Service)",
    signedClient: "Handed over by (Customer)",
    clientAgrees: "Agrees to service terms",
    none: "N/A",
    dateLocale: "en-GB",
    vhsTagline: "VHS Cassette Digitization \xB7 Podgorica",
    vhsTitle: "VHS Cassette Intake",
    vhsSubtitle: "MP4 digitization \xB7 USB included in price",
    usbNotice: "Price includes a USB drive with data stored in MP4 format",
    cassetteSection: "Cassette details",
    cassetteCount: "Number of cassettes",
    pricePerCassette: "Price per cassette",
    cassetteCondition: "Cassette condition",
    totalPrice: "Total price",
    vhsTerms: VHS_TERMS_EN,
    vhsBoldTerms: [5],
    clientAgreesShort: "Agrees to terms"
  }
};
var getPrintStrings = (locale = "sr") => PRINT_I18N[locale] || PRINT_I18N.sr;
var getTicketLocale = (ticket) => ticket?.printLocale === "en" ? "en" : "sr";

// src/lib/deviceBrands.js
var DEVICE_BRANDS = [
  { id: "apple", label: "Apple", iconSlug: "apple", aliases: ["macbook"] },
  { id: "asus", label: "Asus", iconSlug: "asus" },
  { id: "dell", label: "Dell", iconSlug: "dell" },
  { id: "hp", label: "HP", iconSlug: "hp", aliases: ["hewlett-packard"] },
  { id: "lenovo", label: "Lenovo", iconSlug: "lenovo", aliases: ["thinkpad", "ideapad", "legion"] },
  { id: "acer", label: "Acer", iconSlug: "acer", aliases: ["predator", "aspire", "travelmate"] },
  { id: "msi", label: "MSI", iconSlug: "msi" },
  { id: "microsoft", label: "Microsoft", iconSlug: "microsoft", aliases: ["surface"] },
  { id: "samsung", label: "Samsung", iconSlug: "samsung" },
  { id: "toshiba", label: "Toshiba", iconSlug: "toshiba", aliases: ["satellite", "portege"] },
  { id: "huawei", label: "Huawei", iconSlug: "huawei" },
  { id: "honor", label: "Honor", iconSlug: "honor" },
  { id: "lg", label: "LG", iconSlug: "lg" },
  { id: "gigabyte", label: "Gigabyte", iconSlug: "gigabyte" },
  { id: "razer", label: "Razer", iconSlug: "razer" },
  { id: "sony", label: "Sony", iconSlug: "sony", aliases: ["vaio"] },
  { id: "fujitsu", label: "Fujitsu", iconSlug: "fujitsu" }
];
function splitDeviceFields(deviceName) {
  if (!deviceName?.trim()) {
    return { deviceBrand: "", deviceModel: "" };
  }
  const normalized = deviceName.trim();
  const lower = normalized.toLowerCase();
  for (const brand of DEVICE_BRANDS) {
    const labelLower = brand.label.toLowerCase();
    if (lower === labelLower || lower.startsWith(`${labelLower} `)) {
      return {
        deviceBrand: brand.label,
        deviceModel: normalized.slice(brand.label.length).trim()
      };
    }
    for (const alias of brand.aliases || []) {
      if (lower === alias || lower.startsWith(`${alias} `)) {
        const aliasLen = normalized.toLowerCase().indexOf(alias) === 0 ? alias.length : brand.label.length;
        return {
          deviceBrand: brand.label,
          deviceModel: normalized.slice(aliasLen).trim()
        };
      }
    }
  }
  const parts = normalized.split(/\s+/);
  return {
    deviceBrand: parts[0] || "",
    deviceModel: parts.slice(1).join(" ")
  };
}

// src/lib/ticketUtils.js
var parseDeviceBrandModel = (deviceName) => {
  const { deviceBrand, deviceModel } = splitDeviceFields(deviceName);
  return { brand: deviceBrand, model: deviceModel };
};

// src/pdf/pdfAssets.js
var PDF_COLORS = {
  green: "#16a34a",
  greenDark: "#14532d",
  black: "#111111",
  tint: "#f0faf4",
  line: "#cbd5e1",
  gray: "#4b5563",
  grayLight: "#6b7280"
};
function getAssetUrl(path) {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  }
  return path;
}
function formatTicketDate(dateStr, locale = "sr-RS") {
  if (!dateStr)
    return "\u2014";
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch {
    return "\u2014";
  }
}
function displayVal(value, noneLabel = "NEMA") {
  if (!value || value === "NEMA" || value === "-")
    return noneLabel;
  return String(value);
}

// src/lib/dataPolicy.js
var resolveKeepData = (ticket) => !!(ticket?.keepData ?? ticket?.keep_data);
function getDataPolicyLabels(ticket) {
  const t = getPrintStrings(getTicketLocale(ticket));
  const keep = resolveKeepData(ticket);
  return { deleteLabel: t.deleteData, keepLabel: t.keepData, keep };
}
var dataPolicyPdfStyles = {
  active: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  struck: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", textDecoration: "line-through", color: "#9ca3af" },
  separator: { fontSize: 7, color: "#9ca3af" },
  row: { flexDirection: "row", alignItems: "center", gap: 4 }
};

// src/pdf/IntakeReceiptPdfDocument.jsx
import { jsx, jsxs } from "react/jsx-runtime";
var s = StyleSheet.create({
  page: { paddingTop: 22, paddingBottom: 16, paddingHorizontal: 24, fontSize: 8, fontFamily: "Helvetica", color: "#000", backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 2.5, borderBottomColor: "#000", paddingBottom: 6, marginBottom: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  logo: { width: 48, height: 48, objectFit: "contain" },
  brandTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: PDF_COLORS.green },
  tagline: { fontSize: 7.5, color: PDF_COLORS.gray, marginTop: 2, fontFamily: "Helvetica-Bold" },
  headerRight: { width: 160, alignItems: "flex-end" },
  contactLine: { fontSize: 7, marginBottom: 2, textAlign: "right" },
  titleBox: { flexDirection: "row", justifyContent: "space-between", borderWidth: 2.5, borderColor: "#000", backgroundColor: PDF_COLORS.tint, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 6, borderRadius: 3 },
  titleMain: { fontSize: 11, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  titleSub: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.greenDark, marginTop: 2, textTransform: "uppercase" },
  intakeLabel: { fontSize: 6.5, color: PDF_COLORS.grayLight, textTransform: "uppercase", fontFamily: "Helvetica-Bold" },
  intakeNumber: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 1, lineHeight: 1 },
  intakeDate: { fontSize: 7.5, color: PDF_COLORS.gray, marginTop: 2, fontFamily: "Helvetica-Bold" },
  banner: { borderWidth: 2.5, borderColor: PDF_COLORS.green, backgroundColor: PDF_COLORS.black, paddingVertical: 5, paddingHorizontal: 8, marginBottom: 6, borderRadius: 3 },
  bannerCompact: { marginTop: 4, marginBottom: 4, paddingVertical: 4 },
  bannerText: { color: PDF_COLORS.green, fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "center", textTransform: "uppercase" },
  bannerTextCompact: { fontSize: 7 },
  twoCol: { flexDirection: "row", gap: 8, marginBottom: 6 },
  col: { flex: 1 },
  section: { borderWidth: 1.5, borderColor: "#000", borderRadius: 3 },
  sectionHead: { backgroundColor: PDF_COLORS.greenDark, paddingVertical: 4, paddingHorizontal: 8, borderBottomWidth: 3, borderBottomColor: PDF_COLORS.green },
  sectionHeadDark: { backgroundColor: PDF_COLORS.black, borderBottomColor: PDF_COLORS.green },
  sectionHeadText: { color: "#fff", fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  sectionBody: { paddingVertical: 5, paddingHorizontal: 8, backgroundColor: "#fff" },
  fieldRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: PDF_COLORS.line, paddingVertical: 3 },
  fieldLabel: { width: 72, fontSize: 6.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.gray, textTransform: "uppercase" },
  fieldValue: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold" },
  fieldMono: { fontFamily: "Courier-Bold", fontSize: 7.5 },
  issueBox: { borderWidth: 2, borderColor: "#000", borderRadius: 3, marginBottom: 6 },
  issueHead: { backgroundColor: PDF_COLORS.greenDark, paddingVertical: 4, paddingHorizontal: 8 },
  issueBody: { paddingVertical: 6, paddingHorizontal: 8 },
  issueText: { fontSize: 9, fontFamily: "Helvetica-Bold", lineHeight: 1.3 },
  notesBox: { borderWidth: 1.5, borderColor: "#000", borderRadius: 3, marginBottom: 6 },
  notesHead: { backgroundColor: PDF_COLORS.black, paddingVertical: 4, paddingHorizontal: 8 },
  notesBody: { paddingVertical: 5, paddingHorizontal: 8, backgroundColor: PDF_COLORS.tint },
  notesText: { fontSize: 8, lineHeight: 1.3, fontFamily: "Helvetica-Bold" },
  flagsRow: { flexDirection: "row", gap: 12, borderWidth: 1.5, borderColor: "#000", backgroundColor: PDF_COLORS.tint, paddingVertical: 5, paddingHorizontal: 10, marginBottom: 6, borderRadius: 3, alignItems: "center" },
  flagText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  flagMuted: { color: PDF_COLORS.grayLight },
  termsWrap: { borderTopWidth: 2.5, borderTopColor: "#000", paddingTop: 5, marginBottom: 4 },
  termsTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 3 },
  termsIntro: { fontSize: 6.5, fontFamily: "Helvetica-Bold", marginBottom: 3, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: PDF_COLORS.grayLight, lineHeight: 1.2 },
  termsCols: { flexDirection: "row", gap: 10 },
  termsCol: { flex: 1 },
  termLine: { fontSize: 6, lineHeight: 1.2, marginBottom: 1, textAlign: "justify" },
  termBold: { fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  signRow: { flexDirection: "row", gap: 28, marginTop: 4, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: PDF_COLORS.grayLight },
  signCol: { flex: 1, alignItems: "center" },
  signLine: { borderBottomWidth: 1.5, borderBottomColor: "#000", height: 22, width: "100%", marginBottom: 3 },
  signLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  signSub: { fontSize: 6.5, color: PDF_COLORS.gray, marginTop: 1 },
  footer: { backgroundColor: PDF_COLORS.black, paddingVertical: 5, alignItems: "center", borderRadius: 2, marginTop: 4 },
  footerGreen: { color: PDF_COLORS.green, fontFamily: "Helvetica-Bold", fontSize: 6.5 },
  footerWhite: { color: "#fff", fontSize: 6.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase" }
});
var FieldRow = ({ label, value, mono, bold }) => /* @__PURE__ */ jsxs(View, { style: s.fieldRow, children: [
  /* @__PURE__ */ jsx(Text, { style: s.fieldLabel, children: label }),
  /* @__PURE__ */ jsx(Text, { style: [s.fieldValue, mono && s.fieldMono, !bold && { fontFamily: "Helvetica" }], children: value || "\u2014" })
] });
var SectionBox = ({ title, dark, children }) => /* @__PURE__ */ jsxs(View, { style: s.section, children: [
  /* @__PURE__ */ jsx(View, { style: [s.sectionHead, dark && s.sectionHeadDark], children: /* @__PURE__ */ jsx(Text, { style: s.sectionHeadText, children: title }) }),
  /* @__PURE__ */ jsx(View, { style: s.sectionBody, children })
] });
var TermsColumns = ({ terms, boldIndices }) => {
  const mid = Math.ceil(terms.length / 2);
  const cols = [terms.slice(0, mid), terms.slice(mid)];
  return /* @__PURE__ */ jsx(View, { style: s.termsCols, children: cols.map((col, ci) => /* @__PURE__ */ jsx(View, { style: s.termsCol, children: col.map((term, ri) => {
    const idx = ci === 0 ? ri : ri + mid;
    return /* @__PURE__ */ jsx(Text, { style: [s.termLine, boldIndices.includes(idx) && s.termBold], children: term }, idx);
  }) }, ci)) });
};
function IntakeReceiptPdfDocument({ ticket, logoSrc }) {
  const locale = getTicketLocale(ticket);
  const t = getPrintStrings(locale);
  const isWarranty = ticket.isWarranty;
  const { brand, model } = parseDeviceBrandModel(ticket.deviceName);
  const customerName = `${ticket.customerName || ""} ${ticket.customerSurname || ""}`.trim();
  const keepData = resolveKeepData(ticket);
  const ps = dataPolicyPdfStyles;
  const logo = logoSrc || getAssetUrl("/images/logo.png");
  return /* @__PURE__ */ jsx(Document, { children: /* @__PURE__ */ jsxs(Page, { size: "A4", style: s.page, children: [
    /* @__PURE__ */ jsxs(View, { style: s.headerRow, children: [
      /* @__PURE__ */ jsxs(View, { style: s.headerLeft, children: [
        /* @__PURE__ */ jsx(Image, { src: logo, style: s.logo }),
        /* @__PURE__ */ jsxs(View, { children: [
          /* @__PURE__ */ jsx(Text, { style: s.brandTitle, children: "COMPUTER DOCTOR" }),
          /* @__PURE__ */ jsx(Text, { style: s.tagline, children: t.tagline })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s.headerRight, children: [
        /* @__PURE__ */ jsx(Text, { style: s.contactLine, children: "Bul. Ibrahima Koristovica bb, Podgorica" }),
        /* @__PURE__ */ jsx(Text, { style: s.contactLine, children: "068/862-807" }),
        /* @__PURE__ */ jsx(Text, { style: s.contactLine, children: "prodaja@computer-doctor.me" }),
        /* @__PURE__ */ jsx(Text, { style: s.contactLine, children: t.hours })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s.titleBox, children: [
      /* @__PURE__ */ jsxs(View, { style: { flex: 1, paddingRight: 8 }, children: [
        /* @__PURE__ */ jsx(Text, { style: s.titleMain, children: isWarranty ? t.receiptTitleWarranty : t.receiptTitle }),
        isWarranty && /* @__PURE__ */ jsxs(Text, { style: s.titleSub, children: [
          t.warrantySubtitle,
          ticket.warrantyUntil ? ` \xB7 ${t.warrantyUntil} ${formatTicketDate(ticket.warrantyUntil, t.dateLocale)}` : "",
          ticket.warrantyInvoice ? ` \xB7 ${t.invoice}: ${ticket.warrantyInvoice}` : ""
        ] })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: { alignItems: "flex-end" }, children: [
        /* @__PURE__ */ jsx(Text, { style: s.intakeLabel, children: t.intakeNumber }),
        /* @__PURE__ */ jsxs(Text, { style: s.intakeNumber, children: [
          "#",
          ticket.id
        ] }),
        /* @__PURE__ */ jsx(Text, { style: s.intakeDate, children: formatTicketDate(ticket.createdAt, t.dateLocale) })
      ] })
    ] }),
    !isWarranty && /* @__PURE__ */ jsx(View, { style: s.banner, children: /* @__PURE__ */ jsx(Text, { style: s.bannerText, children: t.diagnosticsBanner }) }),
    /* @__PURE__ */ jsxs(View, { style: s.twoCol, children: [
      /* @__PURE__ */ jsx(View, { style: s.col, children: /* @__PURE__ */ jsxs(SectionBox, { title: t.clientSection, children: [
        /* @__PURE__ */ jsx(FieldRow, { label: t.fullName, value: customerName, bold: true }),
        /* @__PURE__ */ jsx(FieldRow, { label: t.phone, value: ticket.customerPhone, bold: true }),
        /* @__PURE__ */ jsx(FieldRow, { label: "Email", value: ticket.customerEmail || "\u2014" })
      ] }) }),
      /* @__PURE__ */ jsx(View, { style: s.col, children: /* @__PURE__ */ jsxs(SectionBox, { title: t.deviceSection, dark: true, children: [
        /* @__PURE__ */ jsx(FieldRow, { label: t.brand, value: brand, bold: true }),
        /* @__PURE__ */ jsx(FieldRow, { label: t.model, value: model || ticket.deviceName, bold: true }),
        /* @__PURE__ */ jsx(FieldRow, { label: t.laptopSn, value: displayVal(ticket.deviceSerial, t.none), mono: true }),
        /* @__PURE__ */ jsx(FieldRow, { label: t.batterySn, value: displayVal(ticket.batterySerial, t.none), mono: true }),
        /* @__PURE__ */ jsx(FieldRow, { label: t.chargerSn, value: displayVal(ticket.chargerSerial, t.none), mono: true }),
        /* @__PURE__ */ jsx(FieldRow, { label: t.osPassword, value: displayVal(ticket.osPassword, t.none), mono: true })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s.issueBox, children: [
      /* @__PURE__ */ jsx(View, { style: s.issueHead, children: /* @__PURE__ */ jsx(Text, { style: s.sectionHeadText, children: t.issueSection }) }),
      /* @__PURE__ */ jsx(View, { style: s.issueBody, children: /* @__PURE__ */ jsx(Text, { style: s.issueText, children: ticket.issueDescription || "\u2014" }) })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s.notesBox, children: [
      /* @__PURE__ */ jsx(View, { style: s.notesHead, children: /* @__PURE__ */ jsx(Text, { style: s.sectionHeadText, children: t.notesSection }) }),
      /* @__PURE__ */ jsx(View, { style: s.notesBody, children: /* @__PURE__ */ jsx(Text, { style: s.notesText, children: ticket.notes?.trim() ? ticket.notes : t.noNotes }) })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s.flagsRow, children: [
      /* @__PURE__ */ jsxs(View, { style: ps.row, children: [
        /* @__PURE__ */ jsx(Text, { style: keepData ? ps.struck : ps.active, children: t.deleteData }),
        /* @__PURE__ */ jsx(Text, { style: ps.separator, children: "/" }),
        /* @__PURE__ */ jsx(Text, { style: !keepData ? ps.struck : ps.active, children: t.keepData })
      ] }),
      /* @__PURE__ */ jsxs(Text, { style: [s.flagText, !ticket.hasBag && s.flagMuted, { flex: 1 }], children: [
        "[",
        ticket.hasBag ? "X" : " ",
        "] ",
        t.bag,
        ticket.hasBag && ticket.bagDescription ? ` (${ticket.bagDescription})` : ""
      ] })
    ] }),
    /* @__PURE__ */ jsxs(View, { style: s.termsWrap, children: [
      /* @__PURE__ */ jsx(Text, { style: s.termsTitle, children: t.termsTitle }),
      /* @__PURE__ */ jsx(Text, { style: s.termsIntro, children: t.termsIntro }),
      /* @__PURE__ */ jsx(TermsColumns, { terms: t.terms, boldIndices: t.boldTerms })
    ] }),
    !isWarranty && /* @__PURE__ */ jsx(View, { style: [s.banner, s.bannerCompact], children: /* @__PURE__ */ jsx(Text, { style: [s.bannerText, s.bannerTextCompact], children: t.diagnosticsBanner }) }),
    /* @__PURE__ */ jsxs(View, { style: s.signRow, children: [
      /* @__PURE__ */ jsxs(View, { style: s.signCol, children: [
        /* @__PURE__ */ jsx(View, { style: s.signLine }),
        /* @__PURE__ */ jsx(Text, { style: s.signLabel, children: t.signedService }),
        /* @__PURE__ */ jsx(Text, { style: s.signSub, children: "Computer Doctor" })
      ] }),
      /* @__PURE__ */ jsxs(View, { style: s.signCol, children: [
        /* @__PURE__ */ jsx(View, { style: s.signLine }),
        /* @__PURE__ */ jsx(Text, { style: s.signLabel, children: t.signedClient }),
        /* @__PURE__ */ jsx(Text, { style: s.signSub, children: t.clientAgrees })
      ] })
    ] }),
    /* @__PURE__ */ jsx(View, { style: s.footer, children: /* @__PURE__ */ jsxs(Text, { children: [
      /* @__PURE__ */ jsx(Text, { style: s.footerGreen, children: "Computer Doctor" }),
      /* @__PURE__ */ jsx(Text, { style: s.footerWhite, children: " \xB7 Profesionalni servis ra\u010Dunara \xB7 Podgorica" })
    ] }) })
  ] }) });
}

// src/pdf/DeliveryNotePdfDocument.jsx
import React2 from "react";
import { Document as Document2, Page as Page2, View as View2, Text as Text2, Image as Image2, StyleSheet as StyleSheet2 } from "@react-pdf/renderer";
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var s2 = StyleSheet2.create({
  page: { paddingTop: 18, paddingBottom: 14, paddingHorizontal: 20, fontSize: 8, fontFamily: "Helvetica", color: "#000", backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1.5, borderBottomColor: "#000", paddingBottom: 6, marginBottom: 8 },
  logo: { width: 48, height: 48, objectFit: "contain" },
  contactBlock: { width: 165, alignItems: "flex-end" },
  contactLine: { fontSize: 6.5, color: PDF_COLORS.gray, marginBottom: 1, textAlign: "right" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 },
  titleMain: { fontSize: 12, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  titleSub: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: PDF_COLORS.greenDark, marginTop: 2, textTransform: "uppercase" },
  dispatchLine: { fontSize: 7, color: PDF_COLORS.gray, marginTop: 3 },
  dispatchNum: { fontFamily: "Helvetica-Bold", color: "#000", fontSize: 9 },
  linkedIntake: { fontSize: 6.5, color: PDF_COLORS.grayLight, marginTop: 1 },
  dateLabel: { fontSize: 6, color: PDF_COLORS.grayLight, textTransform: "uppercase", textAlign: "right" },
  dateValue: { fontSize: 8, fontFamily: "Helvetica-Bold", textAlign: "right" },
  twoCol: { flexDirection: "row", gap: 6, marginBottom: 8 },
  col: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 3, backgroundColor: "#f9fafb", padding: 6 },
  colTitle: { fontSize: 6, fontFamily: "Helvetica-Bold", textTransform: "uppercase", color: PDF_COLORS.grayLight, borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", paddingBottom: 3, marginBottom: 4 },
  clientName: { fontSize: 8.5, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  line: { fontSize: 7.5, marginBottom: 1 },
  deviceName: { fontSize: 8.5, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  serialRow: { flexDirection: "row", marginBottom: 2 },
  serialLabel: { width: 64, fontSize: 6.5, color: PDF_COLORS.gray },
  serialValue: { flex: 1, fontSize: 7, fontFamily: "Courier-Bold" },
  workSection: { borderTopWidth: 1.5, borderTopColor: "#000", paddingTop: 6, marginBottom: 8 },
  workTitle: { fontSize: 8.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 5 },
  blockTitle: { fontSize: 6, fontFamily: "Helvetica-Bold", textTransform: "uppercase", color: PDF_COLORS.gray, marginBottom: 2 },
  blockBody: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 3, padding: 5, marginBottom: 6 },
  blockText: { fontSize: 7.5, lineHeight: 1.3 },
  flagsRow: { flexDirection: "row", gap: 16, paddingHorizontal: 2, marginTop: 4 },
  flagText: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  flagMuted: { color: PDF_COLORS.grayLight },
  costsTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 4 },
  tableHead: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: "#e5e7eb", paddingBottom: 3, marginBottom: 1 },
  thLeft: { flex: 2, fontSize: 6, fontFamily: "Helvetica-Bold", color: PDF_COLORS.gray, textTransform: "uppercase" },
  thRight: { flex: 1, fontSize: 6, fontFamily: "Helvetica-Bold", color: PDF_COLORS.gray, textTransform: "uppercase", textAlign: "right" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6", paddingVertical: 3 },
  tdLeft: { flex: 2, fontSize: 7.5 },
  tdRight: { flex: 1, fontSize: 7.5, fontFamily: "Courier", textAlign: "right" },
  totalRow: { flexDirection: "row", backgroundColor: "#f9fafb", paddingVertical: 4, borderTopWidth: 2, borderTopColor: "#000", marginTop: 1 },
  totalLabel: { flex: 2, fontSize: 8, fontFamily: "Helvetica-Bold", paddingLeft: 3 },
  totalValue: { flex: 1, fontSize: 10, fontFamily: "Courier-Bold", textAlign: "right", paddingRight: 3 },
  warning: { textAlign: "center", color: "#dc2626", fontSize: 7, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginTop: 8, marginBottom: 8, lineHeight: 1.25 },
  signRow: { flexDirection: "row", justifyContent: "space-between", gap: 24, paddingHorizontal: 4, marginBottom: 6 },
  signCol: { flex: 1, maxWidth: 180, alignItems: "center" },
  signLabel: { fontSize: 6, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 14 },
  signLine: { borderBottomWidth: 1, borderBottomColor: "#000", width: "100%", marginBottom: 2 },
  signSub: { fontSize: 6, color: PDF_COLORS.grayLight, textTransform: "uppercase" },
  footer: { textAlign: "center", fontSize: 6.5, color: PDF_COLORS.grayLight, borderTopWidth: 0.5, borderTopColor: "#f3f4f6", paddingTop: 4, marginTop: 2 }
});
var SerialRow = ({ label, value, none = "NEMA" }) => /* @__PURE__ */ jsxs2(View2, { style: s2.serialRow, children: [
  /* @__PURE__ */ jsx2(Text2, { style: s2.serialLabel, children: label }),
  /* @__PURE__ */ jsx2(Text2, { style: s2.serialValue, children: displayVal(value, none) })
] });
function DeliveryNotePdfDocument({ ticket, logoSrc }) {
  const partsCost = parseFloat(ticket.partsCost ?? ticket.parts_cost ?? 0) || 0;
  const serviceCost = parseFloat(ticket.serviceCost ?? ticket.service_cost ?? 0) || 0;
  const totalCost = partsCost + serviceCost;
  const dispatchNumber = ticket.dispatchNote_number || ticket.dispatchNoteNumber || ticket.id;
  const { brand, model } = parseDeviceBrandModel(ticket.deviceName || ticket.device_name);
  const deviceLabel = brand ? `${brand}${model ? ` ${model}` : ""}` : ticket.deviceName || ticket.device_name || "\u2014";
  const customerName = `${ticket.customerName || ticket.clients?.first_name || ""} ${ticket.customerSurname || ticket.clients?.last_name || ""}`.trim();
  const completedAt = ticket.completed_at || ticket.completedAt || (/* @__PURE__ */ new Date()).toISOString();
  const hasBag = ticket.hasBag ?? ticket.has_bag;
  const bagDesc = ticket.bagDescription || ticket.bag_description;
  const repairDetails = ticket.repairDetails || ticket.repair_details || "Nema unesenih detalja o radu.";
  const partsUsed = ticket.partsUsed || ticket.parts_used;
  const keep = resolveKeepData(ticket);
  const ps = dataPolicyPdfStyles;
  const { deleteLabel, keepLabel } = getDataPolicyLabels(ticket);
  const logo = logoSrc || getAssetUrl("/images/logo-delivery.png");
  return /* @__PURE__ */ jsx2(Document2, { children: /* @__PURE__ */ jsxs2(Page2, { size: "A4", style: s2.page, children: [
    /* @__PURE__ */ jsxs2(View2, { style: s2.headerRow, children: [
      /* @__PURE__ */ jsx2(Image2, { src: logo, style: s2.logo }),
      /* @__PURE__ */ jsxs2(View2, { style: s2.contactBlock, children: [
        /* @__PURE__ */ jsx2(Text2, { style: s2.contactLine, children: "Bul. Ibrahima Koristovica bb, Podgorica" }),
        /* @__PURE__ */ jsx2(Text2, { style: s2.contactLine, children: "068/862-807 \xB7 prodaja@computer-doctor.me" }),
        /* @__PURE__ */ jsx2(Text2, { style: s2.contactLine, children: "Pon\u2013Pet 9h\u201316h \xB7 Sub 10h\u201313h" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2(View2, { style: s2.titleRow, children: [
      /* @__PURE__ */ jsxs2(View2, { children: [
        /* @__PURE__ */ jsx2(Text2, { style: s2.titleMain, children: ticket.isWarranty ? "OTPREMNICA \u2014 GARANCIJA" : "OTPREMNICA" }),
        ticket.isWarranty && /* @__PURE__ */ jsxs2(Text2, { style: s2.titleSub, children: [
          "Garantni servis",
          ticket.warrantyUntil ? ` \xB7 Garancija do: ${formatTicketDate(ticket.warrantyUntil)}` : "",
          ticket.warrantyInvoice ? ` \xB7 Ra\u010Dun: ${ticket.warrantyInvoice}` : ""
        ] }),
        /* @__PURE__ */ jsxs2(Text2, { style: s2.dispatchLine, children: [
          "Broj Otpremnice: ",
          /* @__PURE__ */ jsxs2(Text2, { style: s2.dispatchNum, children: [
            "#",
            dispatchNumber
          ] })
        ] }),
        /* @__PURE__ */ jsxs2(Text2, { style: s2.linkedIntake, children: [
          "Vezano za Prijem: #",
          ticket.id
        ] })
      ] }),
      /* @__PURE__ */ jsxs2(View2, { children: [
        /* @__PURE__ */ jsx2(Text2, { style: s2.dateLabel, children: "Datum Zavr\u0161etka" }),
        /* @__PURE__ */ jsx2(Text2, { style: s2.dateValue, children: formatTicketDate(completedAt, "en-GB") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2(View2, { style: s2.twoCol, children: [
      /* @__PURE__ */ jsxs2(View2, { style: s2.col, children: [
        /* @__PURE__ */ jsx2(Text2, { style: s2.colTitle, children: "Klijent" }),
        /* @__PURE__ */ jsx2(Text2, { style: s2.clientName, children: customerName || "\u2014" }),
        /* @__PURE__ */ jsx2(Text2, { style: s2.line, children: ticket.customerPhone || ticket.clients?.phone || "\u2014" }),
        /* @__PURE__ */ jsx2(Text2, { style: s2.line, children: ticket.customerEmail || ticket.clients?.email || "\u2014" })
      ] }),
      /* @__PURE__ */ jsxs2(View2, { style: s2.col, children: [
        /* @__PURE__ */ jsx2(Text2, { style: s2.colTitle, children: "Ure\u0111aj" }),
        /* @__PURE__ */ jsx2(Text2, { style: s2.deviceName, children: deviceLabel }),
        /* @__PURE__ */ jsx2(SerialRow, { label: "S/N ure\u0111aja:", value: ticket.deviceSerial || ticket.device_serial }),
        /* @__PURE__ */ jsx2(SerialRow, { label: "S/N baterije:", value: ticket.batterySerial || ticket.battery_serial }),
        /* @__PURE__ */ jsx2(SerialRow, { label: "S/N punja\u010Da:", value: ticket.chargerSerial || ticket.charger_serial }),
        /* @__PURE__ */ jsx2(SerialRow, { label: "OS \u0160ifra:", value: ticket.osPassword || ticket.os_password })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2(View2, { style: s2.workSection, children: [
      /* @__PURE__ */ jsx2(Text2, { style: s2.workTitle, children: "Izvje\u0161taj Servisa" }),
      /* @__PURE__ */ jsx2(Text2, { style: s2.blockTitle, children: "Opis Izvr\u0161enih Radova" }),
      /* @__PURE__ */ jsx2(View2, { style: s2.blockBody, children: /* @__PURE__ */ jsx2(Text2, { style: s2.blockText, children: repairDetails }) }),
      partsUsed ? /* @__PURE__ */ jsxs2(Fragment, { children: [
        /* @__PURE__ */ jsx2(Text2, { style: s2.blockTitle, children: "Ugra\u0111eni Djelovi" }),
        /* @__PURE__ */ jsx2(View2, { style: s2.blockBody, children: /* @__PURE__ */ jsx2(Text2, { style: s2.blockText, children: partsUsed }) })
      ] }) : null,
      /* @__PURE__ */ jsxs2(View2, { style: s2.flagsRow, children: [
        /* @__PURE__ */ jsxs2(View2, { style: ps.row, children: [
          /* @__PURE__ */ jsx2(Text2, { style: keep ? ps.struck : ps.active, children: deleteLabel }),
          /* @__PURE__ */ jsx2(Text2, { style: ps.separator, children: "/" }),
          /* @__PURE__ */ jsx2(Text2, { style: !keep ? ps.struck : ps.active, children: keepLabel })
        ] }),
        /* @__PURE__ */ jsxs2(Text2, { style: [s2.flagText, !hasBag && s2.flagMuted], children: [
          "[",
          hasBag ? "X" : " ",
          "] Torba",
          hasBag && bagDesc ? ` \u2014 ${bagDesc}` : ""
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx2(Text2, { style: s2.costsTitle, children: "Pregled Tro\u0161kova" }),
    /* @__PURE__ */ jsxs2(View2, { style: s2.tableHead, children: [
      /* @__PURE__ */ jsx2(Text2, { style: s2.thLeft, children: "Stavka" }),
      /* @__PURE__ */ jsx2(Text2, { style: s2.thRight, children: "Iznos (\u20AC)" })
    ] }),
    /* @__PURE__ */ jsxs2(View2, { style: s2.tableRow, children: [
      /* @__PURE__ */ jsx2(Text2, { style: s2.tdLeft, children: "Djelovi" }),
      /* @__PURE__ */ jsxs2(Text2, { style: s2.tdRight, children: [
        partsCost.toFixed(2),
        " \u20AC"
      ] })
    ] }),
    /* @__PURE__ */ jsxs2(View2, { style: s2.tableRow, children: [
      /* @__PURE__ */ jsx2(Text2, { style: s2.tdLeft, children: "Servisna Usluga" }),
      /* @__PURE__ */ jsxs2(Text2, { style: s2.tdRight, children: [
        serviceCost.toFixed(2),
        " \u20AC"
      ] })
    ] }),
    /* @__PURE__ */ jsxs2(View2, { style: s2.totalRow, children: [
      /* @__PURE__ */ jsx2(Text2, { style: s2.totalLabel, children: "UKUPNO ZA NAPLATU" }),
      /* @__PURE__ */ jsxs2(Text2, { style: s2.totalValue, children: [
        totalCost.toFixed(2),
        " \u20AC"
      ] })
    ] }),
    /* @__PURE__ */ jsx2(Text2, { style: s2.warning, children: "KORISNIK JE DU\u017DAN DA PROVJERI SVE PRILIKOM PREUZIMANJA URE\u0110AJA JER NAKANDNE REKLAMACIJE NE VA\u017DE." }),
    /* @__PURE__ */ jsxs2(View2, { style: s2.signRow, children: [
      /* @__PURE__ */ jsxs2(View2, { style: s2.signCol, children: [
        /* @__PURE__ */ jsx2(Text2, { style: s2.signLabel, children: "Servisa predao" }),
        /* @__PURE__ */ jsx2(View2, { style: s2.signLine }),
        /* @__PURE__ */ jsx2(Text2, { style: s2.signSub, children: "M.P." })
      ] }),
      /* @__PURE__ */ jsxs2(View2, { style: s2.signCol, children: [
        /* @__PURE__ */ jsx2(Text2, { style: s2.signLabel, children: "Korisnik preuzeo sa servisa" }),
        /* @__PURE__ */ jsx2(View2, { style: s2.signLine }),
        /* @__PURE__ */ jsx2(Text2, { style: s2.signSub, children: "Svojeru\u010Dno potpisao klijent" })
      ] })
    ] }),
    /* @__PURE__ */ jsx2(Text2, { style: s2.footer, children: "Hvala Vam na ukazanom povjerenju! Va\u0161 Computer Doctor tim." })
  ] }) });
}

// server/pdfEntry.jsx
var __dirname = dirname(fileURLToPath(import.meta.url));
var projectRoot = join(__dirname, "..");
function readLogoDataUrl(filename) {
  const filePath = join(projectRoot, "public", "images", filename);
  if (!existsSync(filePath))
    return null;
  return `data:image/png;base64,${readFileSync(filePath).toString("base64")}`;
}
var logos = null;
function getLogos() {
  if (!logos) {
    logos = {
      logoSrc: readLogoDataUrl("logo.png"),
      deliveryLogoSrc: readLogoDataUrl("logo-delivery.png")
    };
  }
  return logos;
}
async function generateDocumentPdfBuffer(type, ticket) {
  if (!ticket)
    throw new Error("Podaci dokumenta nisu proslije\u0111eni.");
  const { logoSrc, deliveryLogoSrc } = getLogos();
  let element;
  if (type === "delivery") {
    element = React3.createElement(DeliveryNotePdfDocument, {
      ticket,
      logoSrc: deliveryLogoSrc || logoSrc
    });
  } else {
    element = React3.createElement(IntakeReceiptPdfDocument, {
      ticket,
      logoSrc
    });
  }
  return renderToBuffer(element);
}
export {
  generateDocumentPdfBuffer
};
