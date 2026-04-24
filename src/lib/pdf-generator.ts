import { jsPDF } from 'jspdf';

// ============ LOGO LUXENT EN BASE64 ============
const LUXENT_LOGO_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAqACoAAD/4RDuRXhpZgAATU0AKgAAAAgABAE7AAIAAAAMAAAISodpAAQAAAABAAAIVpydAAEAAAAYAAAQzuocAAcAAAgMAAAAPgAAAAAc6gAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE1JQ0hFTCBDSEVOAAAFkAMAAgAAABQAABCkkAQAAgAAABQAABC4kpEAAgAAAAMyOAAAkpIAAgAAAAMyOAAA6hwABwAACAwAAAiYAAAAABzqAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAyMzowNToxMiAyMjowOTo1NQAyMDIzOjA1OjEyIDIyOjA5OjU1AAAATQBJAEMASABFAEwAIABDAEgARQBOAAAA/+ELHmh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4NCjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iPjxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+PHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9InV1aWQ6ZmFmNWJkZDUtYmEzZC0xMWRhLWFkMzEtZDMzZDc1MTgyZjFiIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iLz48cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0idXVpZDpmYWY1YmRkNS1iYTNkLTExZGEtYWQzMS1kMzNkNzUxODJmMWIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyI+PHhtcDpDcmVhdGVEYXRlPjIwMjMtMDUtMTJUMjI6MDk6NTUuMjgwPC94bXA6Q3JlYXRlRGF0ZT48L3JkZjpEZXNjcmlwdGlvbj48cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0idXVpZDpmYWY1YmRkNS1iYTNkLTExZGEtYWQzMS1kMzNkNzUxODJmMWIiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyI+PGRjOmNyZWF0b3I+PHJkZjpTZXEgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj48cmRmOmxpPk1JQ0hFTCBDSEVOPC9yZGY6bGk+PC9yZGY6U2VxPg0KCQkJPC9kYzpjcmVhdG9yPjwvcmRmOkRlc2NyaXB0aW9uPjwvcmRmOlJERj48L3g6eG1wbWV0YT4NCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgPD94cGFja2V0IGVuZD0ndyc/Pv/bAEMABwUFBgUEBwYFBggHBwgKEQsKCQkKFQ8QDBEYFRoZGBUYFxseJyEbHSUdFxgiLiIlKCkrLCsaIC8zLyoyJyorKv/bAEMBBwgICgkKFAsLFCocGBwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKv/AABEIAKQCPgMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APpGiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiig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';

// ============ COULEURS ============
const C = {
  salmon: [200, 127, 107] as const,
  salmonLight: [251, 240, 237] as const,
  violet: [124, 58, 237] as const,
  violetLight: [237, 233, 254] as const,
  teal: [0, 137, 123] as const,
  tealLight: [224, 242, 241] as const,
  grayText: [102, 102, 102] as const,
  black: [51, 51, 51] as const,
  grayLight: [245, 245, 245] as const,
  grayLine: [229, 229, 229] as const,
  grayStrike: [153, 153, 153] as const,
  white: [255, 255, 255] as const,
};

// ============ ÉMETTEUR PRO (LUXENT) ============
const EMETTEUR_PRO = {
  type: 'pro' as const,
  nom: 'LUXENT LIMITED',
  label: 'Société',
  adresse: ['2ND FLOOR COLLEGE HOUSE,', '17 KING EDWARDS ROAD', 'RUISLIP HA47AE LONDON'],
  pays: 'Royaume-Uni',
  companyNumber: '14852122',
  email: 'luxent@ltd-uk.eu',
};
const BANK_PRO = {
  titulaire: 'LUXENT LIMITED',
  iban: 'DE76202208000059568830',
  swift: 'SXPYDEHH',
  banque: 'Banking Circle S.A.',
  pays: 'Germany',
  adresse: 'Maximilianstr. 54',
  ville: 'Munich',
  codePostal: 'D-80538',
};

// ============ ÉMETTEUR PRIVÉ ============
const EMETTEUR_PRIVE = {
  type: 'prive' as const,
  nom: 'Michel Chen',
  label: 'Nom',
  adresse: ['2ND FLOOR COLLEGE HOUSE,', '17 KING EDWARDS ROAD', 'RUISLIP HA47AE LONDON'],
  pays: 'Royaume-Uni',
  email: 'luxent@ltd-uk.eu',
};
const BANK_PRIVE = {
  titulaire: 'Michel Chen',
  iban: 'DE93 1001 1001 2625 2584 23',
  swift: 'NTSBDEB1XXX',
  banque: 'N26 Bank GmbH',
  pays: 'Germany',
  adresse: 'Klosterstr. 62',
  ville: '10179, Berlin',
  codePostal: '',
};

// ============ CONFIG PRO/PRIVÉ ============
function getConfig(emetteur?: any) {
  const isPrive = emetteur?.type === 'prive';
  return {
    showLogo: !isPrive,
    emetteurInfo: isPrive ? EMETTEUR_PRIVE : EMETTEUR_PRO,
    bankInfo: isPrive ? BANK_PRIVE : BANK_PRO,
  };
}

// ============ FORMAT HELPERS ============
function formatEUR(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '0,00 €';
  const parts = amount.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${intPart},${parts[1]} €`;
}

function formatDate(date: any): string {
  if (!date) return new Date().toLocaleDateString('fr-FR');
  if (date.toDate) return date.toDate().toLocaleDateString('fr-FR');
  if (date instanceof Date) return date.toLocaleDateString('fr-FR');
  return String(date);
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (doc.getTextWidth(test) <= maxWidth) {
      currentLine = test;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// ============ DRAW: LOGO ============
function drawLogo(doc: jsPDF, showLogo: boolean) {
  if (showLogo && LUXENT_LOGO_BASE64) {
    try {
      doc.addImage(LUXENT_LOGO_BASE64, 'JPEG', 145, 12, 45, 13);
    } catch (_) { /* logo optional */ }
  }
}

// ============ DRAW: HEADER ============
function drawHeader(doc: jsPDF, docType: string, numero: string, dateStr: string, color: readonly [number, number, number]) {
  doc.setFontSize(22);
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.text(docType, 20, 25);

  doc.setFontSize(11);
  doc.setTextColor(...C.grayText);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${numero}`, 20, 33);
  doc.text(`Date : ${dateStr}`, 190, 33, { align: 'right' });

  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.line(20, 36, 190, 36);
}

// ============ DRAW: ÉMETTEUR / DESTINATAIRE ============
function drawEmetteurDestinataire(
  doc: jsPDF,
  emInfo: typeof EMETTEUR_PRO | typeof EMETTEUR_PRIVE,
  dest: any,
  startY: number,
  color: readonly [number, number, number],
  destLabel = 'Destinataire'
): number {
  let y = startY;

  // Émetteur title
  doc.setFontSize(14);
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.text('Émetteur', 20, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Label + Nom
  doc.setTextColor(...C.grayText);
  doc.text(`${emInfo.label} :`, 20, y);
  doc.setTextColor(...C.black);
  doc.setFont('helvetica', 'bold');
  doc.text(emInfo.nom, 50, y);
  doc.setFont('helvetica', 'normal');
  y += 5;

  // Adresse
  doc.setTextColor(...C.grayText);
  doc.text('Adresse :', 20, y);
  doc.setTextColor(...C.black);
  for (const line of emInfo.adresse) {
    doc.text(line, 50, y);
    y += 4;
  }

  // Pays
  doc.setTextColor(...C.grayText);
  doc.text('Pays :', 20, y);
  doc.setTextColor(...C.black);
  doc.text(emInfo.pays, 50, y);
  y += 5;

  // Company number (PRO only)
  if ('companyNumber' in emInfo) {
    doc.setTextColor(...C.grayText);
    doc.text("N° d'entreprise :", 20, y);
    doc.setTextColor(...C.black);
    doc.text((emInfo as typeof EMETTEUR_PRO).companyNumber, 55, y);
    y += 5;
  }

  // Email
  doc.setTextColor(...C.grayText);
  doc.text('Email :', 20, y);
  doc.setTextColor(...C.black);
  doc.text(emInfo.email, 50, y);
  y += 5;

  // Destinataire (right column at ~110mm)
  const dx = 110;
  let dy = startY;

  doc.setFontSize(14);
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.text(destLabel, dx, dy);
  dy += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.setTextColor(...C.grayText);
  doc.text('Nom :', dx, dy);
  doc.setTextColor(...C.black);
  doc.setFont('helvetica', 'bold');
  doc.text(dest.nom || 'Client', dx + 25, dy);
  doc.setFont('helvetica', 'normal');
  dy += 5;

  if (dest.adresse) {
    doc.setTextColor(...C.grayText);
    doc.text('Adresse :', dx, dy);
    doc.setTextColor(...C.black);
    const addrLines = wrapText(doc, dest.adresse, 55);
    for (const line of addrLines) {
      doc.text(line, dx + 25, dy);
      dy += 4;
    }
  }

  if (dest.pays) {
    doc.setTextColor(...C.grayText);
    doc.text('Pays :', dx, dy);
    doc.setTextColor(...C.black);
    doc.text(dest.pays, dx + 25, dy);
    dy += 5;
  }

  if (dest.email) {
    doc.setTextColor(...C.grayText);
    doc.text('Email :', dx, dy);
    doc.setTextColor(...C.black);
    doc.text(dest.email, dx + 25, dy);
    dy += 5;
  }

  if (dest.tel) {
    doc.setTextColor(...C.grayText);
    doc.text('Tél :', dx, dy);
    doc.setTextColor(...C.black);
    doc.text(dest.tel, dx + 25, dy);
    dy += 5;
  }

  return Math.max(y, dy) + 3;
}

// ============ DRAW: BANK INFO ============
function drawBankInfo(doc: jsPDF, bank: typeof BANK_PRO | typeof BANK_PRIVE, startY: number): number {
  let y = startY;
  doc.setFontSize(8);

  const lines = [
    ['Account Name / Titulaire :', bank.titulaire],
    ['IBAN :', bank.iban],
    ['SWIFT / BIC :', bank.swift],
    ['Bank Name / Banque :', bank.banque],
    ['Country / Pays :', bank.pays],
    ['Bank Address / Adresse :', bank.adresse],
    ['City / Ville :', bank.ville],
  ];
  if (bank.codePostal) {
    lines.push(['Postal Code :', bank.codePostal]);
  }

  for (const [label, value] of lines) {
    doc.setTextColor(...C.grayText);
    doc.text(label, 20, y);
    doc.setTextColor(...C.black);
    doc.text(value, 65, y);
    y += 4;
  }
  return y + 3;
}

// ============ DRAW: PRODUCT TABLE ============
function drawProductTable(
  doc: jsPDF,
  lignes: any[],
  startY: number,
  options?: { headerColor?: readonly [number, number, number]; isVip?: boolean; prixNegocies?: Record<string, number> }
): number {
  const hColor = options?.headerColor || C.salmon;
  const isVip = options?.isVip || false;
  const prixNegocies = options?.prixNegocies || {};
  let y = startY;

  // Column positions (prix élargi à 32mm pour gros montants)
  const colRef = 20;
  const colDesc = 45;
  const colPrix = 126;
  const colQte = 158;
  const tableRight = 190;
  const descWidth = colPrix - colDesc - 2;

  // Header
  doc.setFillColor(...hColor);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.text('Réf.', colRef + 2, y + 6);
  doc.text('Description', colDesc + 2, y + 6);
  doc.text('Prix unit. HT', colPrix, y + 6, { align: 'right' });
  doc.text('Qté', colQte + 5, y + 6, { align: 'center' });
  doc.text('Total HT', tableRight - 2, y + 6, { align: 'right' });
  y += 8;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  (lignes || []).forEach((ligne, i) => {
    const desc = ligne.nom_fr || ligne.ref || ligne.description || '';
    const descLines = wrapText(doc, desc, descWidth);
    const baseRowH = isVip ? 11 : 7;
    const rowH = Math.max(baseRowH, descLines.length * 4 + 3);

    // Alternating background
    if (i % 2 === 0) {
      doc.setFillColor(...C.grayLight);
      doc.rect(20, y, 170, rowH, 'F');
    }

    // Bottom border
    doc.setDrawColor(...C.grayLine);
    doc.line(20, y + rowH, 190, y + rowH);

    // Ref
    doc.setTextColor(...C.black);
    doc.text((ligne.ref || ligne.reference || '').substring(0, 12), colRef + 2, y + 5);

    // Description (wrapped)
    for (let l = 0; l < descLines.length; l++) {
      doc.text(descLines[l], colDesc + 2, y + 5 + l * 4);
    }

    const ref = ligne.ref || ligne.reference || '';
    const prixPublic = ligne.prix_unitaire || 0;
    const prixNegocie = isVip && prixNegocies[ref] !== undefined ? prixNegocies[ref] : prixPublic;
    const estNegocie = isVip && prixNegocie !== prixPublic;

    if (estNegocie) {
      // VIP: prix public barré + prix négocié en violet
      doc.setTextColor(...C.grayStrike);
      const pubText = formatEUR(prixPublic);
      doc.text(pubText, colPrix, y + 5, { align: 'right' });
      const pubW = doc.getTextWidth(pubText);
      doc.setDrawColor(...C.grayStrike);
      doc.line(colPrix - pubW, y + 4, colPrix, y + 4);

      doc.setTextColor(...C.violet);
      doc.setFont('helvetica', 'bold');
      doc.text(formatEUR(prixNegocie), colPrix, y + 10, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      // Total VIP
      const totalPub = prixPublic * (ligne.qte || 1);
      const totalNeg = prixNegocie * (ligne.qte || 1);
      doc.setTextColor(...C.grayStrike);
      const totPubText = formatEUR(totalPub);
      doc.text(totPubText, tableRight - 2, y + 5, { align: 'right' });
      const totPubW = doc.getTextWidth(totPubText);
      doc.line(tableRight - 2 - totPubW, y + 4, tableRight - 2, y + 4);

      doc.setTextColor(...C.violet);
      doc.setFont('helvetica', 'bold');
      doc.text(formatEUR(totalNeg), tableRight - 2, y + 10, { align: 'right' });
      doc.setFont('helvetica', 'normal');
    } else {
      // Normal
      doc.setTextColor(...C.black);
      doc.text(formatEUR(ligne.prix_unitaire), colPrix, y + 5, { align: 'right' });
      doc.text(formatEUR(ligne.total || (ligne.prix_unitaire || 0) * (ligne.qte || 1)), tableRight - 2, y + 5, { align: 'right' });
    }

    // Qty
    doc.setTextColor(...C.black);
    doc.text(String(ligne.qte || 1), colQte + 5, y + 5, { align: 'center' });

    y += rowH;
  });

  return y;
}

// ============ DRAW: TOTALS ============
function drawTotals(doc: jsPDF, totalHT: number, y: number, color: readonly [number, number, number]): number {
  // TVA mention
  doc.setFontSize(8);
  doc.setTextColor(...C.grayText);
  doc.text('TVA non applicable, art. 293 B du CGI', 190, y + 5, { align: 'right' });
  y += 10;

  // Total box
  const lightColor: readonly [number, number, number] = color === C.salmon ? C.salmonLight : color === C.violet ? C.violetLight : C.tealLight;
  doc.setFillColor(...lightColor);
  doc.rect(120, y, 70, 12, 'F');
  doc.setFontSize(12);
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 125, y + 8);
  doc.setTextColor(...C.black);
  doc.text(formatEUR(totalHT), 186, y + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  return y + 17;
}

// ============ DRAW: TOTALS VIP ============
function drawTotalsVIP(doc: jsPDF, totalPublic: number, totalNegocie: number, y: number): number {
  doc.setFontSize(8);
  doc.setTextColor(...C.grayText);
  doc.text('TVA non applicable, art. 293 B du CGI', 190, y + 5, { align: 'right' });
  y += 10;

  doc.setFillColor(...C.violetLight);
  doc.rect(100, y, 90, 20, 'F');

  // Struck public price
  doc.setFontSize(10);
  doc.setTextColor(...C.grayStrike);
  const pubText = `Prix public : ${formatEUR(totalPublic)}`;
  doc.text(pubText, 105, y + 7);
  const pubW = doc.getTextWidth(pubText);
  doc.setDrawColor(...C.grayStrike);
  doc.line(105, y + 6, 105 + pubW, y + 6);

  // Negotiated
  doc.setFontSize(12);
  doc.setTextColor(...C.violet);
  doc.setFont('helvetica', 'bold');
  doc.text('Total négocié', 105, y + 15);
  doc.setTextColor(...C.black);
  doc.text(formatEUR(totalNegocie), 186, y + 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  return y + 25;
}

// ============ DRAW: ACOMPTE BLOCK ============

// ============ DRAW: CONDITIONS + SIGNATURE ============
function drawConditionsSignature(doc: jsPDF, y: number, color: readonly [number, number, number], signe_le?: any) {
  doc.setDrawColor(...C.grayLine);
  doc.line(20, y, 190, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.text('Conditions', 20, y);
  doc.text('Acceptation du client', 120, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.grayText);
  doc.text('Règlement : À réception', 20, y);

  // Si signé, afficher la date de signature
  if (signe_le) {
    const dateSignature = signe_le?.toDate ? signe_le.toDate() : new Date(signe_le);
    const dateStr = dateSignature.toLocaleDateString('fr-FR');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(`Signé le ${dateStr}`, 120, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.grayText);
  } else {
    doc.text('À _______, le __/__/____', 120, y);
  }

  y += 4;
  doc.text('Mode : Virement bancaire', 20, y);

  if (signe_le) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text('✓ Devis signé électroniquement', 120, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.grayText);
  } else {
    doc.text('Signature :', 120, y);
    y += 4;
    doc.text('Nom et qualité :', 120, y);
  }
}

// ============ DRAW: FOOTER ============
function drawFooter(doc: jsPDF, docType: string, numero: string, color: readonly [number, number, number], pageNum = 1, totalPages = 1) {
  const y = 285;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  doc.setFontSize(7);
  doc.setTextColor(...C.grayText);
  doc.text(`${docType} ${numero}`, 20, y + 4);
  doc.text(`Page ${pageNum} sur ${totalPages}`, 190, y + 4, { align: 'right' });
}

// ============================================================
// EXPORT: GÉNÉRER DEVIS PDF
// ============================================================
export function generateDevis(quote: any, emetteur?: any): jsPDF {
  const doc = new jsPDF();
  const cfg = getConfig(emetteur);
  const date = formatDate(quote.createdAt);
  const numero = quote.numero || quote.id;
  const isVip = quote.is_vip === true;
  const color = isVip ? C.violet : C.salmon;

  drawLogo(doc, cfg.showLogo);
  drawHeader(doc, isVip ? 'Devis VIP' : 'Devis', numero, date, color);

  let y = drawEmetteurDestinataire(doc, cfg.emetteurInfo, {
    nom: quote.client_nom,
    adresse: quote.client_adresse,
    pays: 'France',
    email: quote.client_email,
    tel: quote.client_tel,
  }, 42, color);

  y = drawBankInfo(doc, cfg.bankInfo, y);
  y = drawProductTable(doc, quote.lignes || [], y + 2, {
    headerColor: color,
    isVip,
    prixNegocies: quote.prix_negocies || {}
  });

  if (isVip) {
    const totalPublic = quote.total_ht_public || (quote.lignes || []).reduce((s: number, l: any) => s + ((l.prix_unitaire || 0) * (l.qte || 1)), 0);
    const totalNegocie = quote.total_ht || totalPublic;
    y = drawTotalsVIP(doc, totalPublic, totalNegocie, y);
  } else {
    y = drawTotals(doc, quote.total_ht || 0, y, color);
  }

  drawConditionsSignature(doc, y + 5, color, quote.signe_le);
  drawFooter(doc, 'Devis', numero, color);

  return doc;
}

// ============================================================
// EXPORT: GÉNÉRER FACTURE FINALE PDF
// ============================================================
export function generateFactureFinale(quote: any, numero: string, emetteur?: any): jsPDF {
  const doc = new jsPDF();
  const cfg = getConfig(emetteur);
  const date = formatDate(new Date());

  drawLogo(doc, cfg.showLogo);
  drawHeader(doc, 'Facture', numero, date, C.salmon);

  let y = drawEmetteurDestinataire(doc, cfg.emetteurInfo, {
    nom: quote.client_nom,
    adresse: quote.client_adresse,
    pays: 'France',
    email: quote.client_email,
    tel: quote.client_tel,
  }, 42, C.salmon);

  y = drawBankInfo(doc, cfg.bankInfo, y);
  y = drawProductTable(doc, quote.lignes || [], y + 2);
  y = drawTotals(doc, quote.total_ht || 0, y, C.salmon);

  drawFooter(doc, 'Facture', numero, C.salmon);

  return doc;
}

// ============================================================
// EXPORT: GÉNÉRER NOTE DE COMMISSION PDF
// ============================================================
export function generateNoteCommission(note: any, emetteur?: any): jsPDF {
  const doc = new jsPDF();
  const cfg = getConfig(emetteur);
  const date = formatDate(note.createdAt);
  const numero = note.numero || note.id;

  // Rétrocompatibilité : ancien format avec lignes plates → grouper par devis
  if (!note.devis && note.lignes) {
    const grouped = new Map<string, any>();
    for (const l of note.lignes) {
      const key = l.quote_id || 'inconnu';
      if (!grouped.has(key)) {
        grouped.set(key, { numero: key, client: l.client || '', destination: '', lignes: [] });
      }
      grouped.get(key)!.lignes.push({
        ref: l.ref || '',
        nom_fr: l.nom_fr || l.description || '',
        prix_negocie: l.montant_ht || 0,
        prix_partenaire: (l.montant_ht || 0) - (l.commission || 0),
      });
    }
    note.devis = Array.from(grouped.values());
  }

  drawLogo(doc, cfg.showLogo);
  drawHeader(doc, 'Note de Commission', numero, date, C.violet);

  // Partenaire (droite)
  let y = drawEmetteurDestinataire(doc, cfg.emetteurInfo, {
    nom: note.partenaire_nom || 'Partenaire',
    email: note.partenaire_email,
    tel: note.partenaire_tel,
  }, 42, C.violet, 'Partenaire');

  // Coordonnées bancaires
  y = drawBankInfo(doc, cfg.bankInfo, y);

  // Section title
  doc.setFontSize(14);
  doc.setTextColor(...C.violet);
  doc.setFont('helvetica', 'bold');
  doc.text('Détail des commissions', 20, y);
  doc.setFont('helvetica', 'normal');
  y += 7;

  // Column positions (6 colonnes)
  const L = 20;   // left edge
  const R = 190;  // right edge
  const colRef = 45;
  const colDesc = 70;
  const colPrixNeg = 128;
  const colPrixPart = 158;

  // Table header
  doc.setFillColor(...C.violet);
  doc.rect(L, y, R - L, 8, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.text('N° Devis', L + 2, y + 6);
  doc.text('Réf.', colRef, y + 6);
  doc.text('Description', colDesc, y + 6);
  doc.text('Prix négocié', colPrixNeg, y + 6, { align: 'right' });
  doc.text('Prix part.', colPrixPart, y + 6, { align: 'right' });
  doc.text('Commission', R - 2, y + 6, { align: 'right' });
  y += 8;

  // Rows grouped by devis
  const devisList = note.devis || [];
  for (const devis of devisList) {
    // Devis header row — violet clair
    doc.setFillColor(...C.violetLight);
    doc.rect(L, y, R - L, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...C.violet);
    doc.setFont('helvetica', 'bold');
    const headerText = `${devis.numero}${devis.client ? ' — Client : ' + devis.client : ''}${devis.destination ? ' — ' + devis.destination : ''}`;
    doc.text(headerText, L + 2, y + 5);
    doc.setFont('helvetica', 'normal');
    y += 7;

    let sousTotal_negocie = 0;
    let sousTotal_partenaire = 0;
    let sousTotal_commission = 0;

    // Product lines
    (devis.lignes || []).forEach((ligne: any, i: number) => {
      const desc = ligne.nom_fr || '';
      const descLines = wrapText(doc, desc, colPrixNeg - colDesc - 5);
      const rowH = Math.max(7, descLines.length * 4 + 3);

      if (i % 2 === 0) {
        doc.setFillColor(...C.grayLight);
        doc.rect(L, y, R - L, rowH, 'F');
      }
      doc.setDrawColor(...C.grayLine);
      doc.line(L, y + rowH, R, y + rowH);

      doc.setFontSize(8);
      // Ref
      doc.setTextColor(...C.black);
      doc.text((ligne.ref || '').substring(0, 12), colRef, y + 5);

      // Description (wrapped)
      for (let li = 0; li < descLines.length; li++) {
        doc.text(descLines[li], colDesc, y + 5 + li * 4);
      }

      // Prix négocié
      const pn = ligne.prix_negocie || 0;
      const pp = ligne.prix_partenaire || 0;
      const comm = pn - pp;
      sousTotal_negocie += pn;
      sousTotal_partenaire += pp;
      sousTotal_commission += comm;

      doc.setTextColor(...C.black);
      doc.text(formatEUR(pn), colPrixNeg, y + 5, { align: 'right' });
      doc.text(formatEUR(pp), colPrixPart, y + 5, { align: 'right' });

      // Commission en violet bold
      doc.setTextColor(...C.violet);
      doc.setFont('helvetica', 'bold');
      doc.text(formatEUR(comm), R - 2, y + 5, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      y += rowH;
    });

    // Sous-total row
    doc.setFillColor(...C.grayLight);
    doc.rect(L, y, R - L, 7, 'F');
    doc.setDrawColor(...C.grayLine);
    doc.line(L, y + 7, R, y + 7);
    doc.setFontSize(8);
    doc.setTextColor(...C.black);
    doc.setFont('helvetica', 'bold');
    doc.text(`Sous-total ${devis.numero}`, L + 2, y + 5);
    doc.text(formatEUR(sousTotal_negocie), colPrixNeg, y + 5, { align: 'right' });
    doc.text(formatEUR(sousTotal_partenaire), colPrixPart, y + 5, { align: 'right' });
    doc.setTextColor(...C.violet);
    doc.text(formatEUR(sousTotal_commission), R - 2, y + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 9;
  }

  // Total dû — pleine largeur
  y += 3;
  doc.setDrawColor(...C.violet);
  doc.setFillColor(...C.violetLight);
  doc.rect(L, y, R - L, 14, 'FD');
  doc.setFontSize(13);
  doc.setTextColor(...C.violet);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total dû au partenaire ${note.partenaire_code || note.partenaire_nom || ''}`, L + 5, y + 10);
  doc.text(formatEUR(note.total_commission), R - 5, y + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 20;

  // Conditions
  doc.setDrawColor(...C.grayLine);
  doc.line(20, y, 190, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...C.violet);
  doc.setFont('helvetica', 'bold');
  doc.text('Conditions', 20, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.grayText);
  doc.text('Règlement : À réception de la note de commission', 20, y);
  y += 4;
  doc.text('Mode : Virement bancaire aux coordonnées ci-dessus', 20, y);

  drawFooter(doc, 'Note de commission', numero, C.violet);

  return doc;
}

// ============================================================
// EXPORT: GÉNÉRER FACTURE LOGISTIQUE PDF
// ============================================================
export function generateFactureLogistique(container: any, fraisLignes: any[], emetteur?: any): jsPDF {
  const doc = new jsPDF();
  const cfg = getConfig(emetteur);
  const numero = container.numero_fm || `FM-${container.numero || container.id}`;
  const date = formatDate(container.createdAt || new Date());

  drawLogo(doc, cfg.showLogo);
  drawHeader(doc, 'Facture Logistique', numero, date, C.teal);

  let y = drawEmetteurDestinataire(doc, cfg.emetteurInfo, {
    nom: container.client_nom || 'Client',
    adresse: container.client_adresse,
    pays: 'France',
    email: container.client_email,
  }, 42, C.teal);

  // Container info block
  doc.setFillColor(...C.tealLight);
  doc.rect(20, y, 170, 20, 'F');
  doc.setFontSize(9);
  const infoY = y + 6;
  doc.setTextColor(...C.grayText);
  doc.text('Conteneur :', 25, infoY);
  doc.setTextColor(...C.black);
  doc.setFont('helvetica', 'bold');
  doc.text(container.numero || '', 60, infoY);
  doc.setFont('helvetica', 'normal');

  doc.setTextColor(...C.grayText);
  doc.text('Type :', 110, infoY);
  doc.setTextColor(...C.black);
  doc.text(container.type || '40HC', 130, infoY);

  doc.setTextColor(...C.grayText);
  doc.text('Port chargement :', 25, infoY + 6);
  doc.setTextColor(...C.black);
  doc.text(container.port_chargement || 'Ningbo', 65, infoY + 6);

  doc.setTextColor(...C.grayText);
  doc.text('Port destination :', 110, infoY + 6);
  doc.setTextColor(...C.black);
  doc.text(container.port_destination || '', 150, infoY + 6);

  if (container.devis_ref) {
    doc.setTextColor(...C.grayText);
    doc.text('Devis lié :', 25, infoY + 12);
    doc.setTextColor(...C.black);
    doc.text(container.devis_ref, 60, infoY + 12);
  }

  y += 25;

  // Frais table
  doc.setFillColor(...C.teal);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 25, y + 6);
  doc.text('Volume / Poids', 100, y + 6);
  doc.text('Prix unit.', 145, y + 6, { align: 'right' });
  doc.text('Total', 186, y + 6, { align: 'right' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let totalFrais = 0;
  (fraisLignes || []).forEach((ligne, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...C.grayLight);
      doc.rect(20, y, 170, 7, 'F');
    }
    doc.setDrawColor(...C.grayLine);
    doc.line(20, y + 7, 190, y + 7);

    doc.setTextColor(...C.black);
    doc.text(ligne.description || '', 25, y + 5);
    doc.text(ligne.volume_poids || '', 100, y + 5);
    doc.text(formatEUR(ligne.prix_unitaire), 145, y + 5, { align: 'right' });
    doc.text(formatEUR(ligne.total), 186, y + 5, { align: 'right' });
    totalFrais += ligne.total || 0;
    y += 7;
  });

  // Total
  y += 5;
  doc.setFillColor(...C.tealLight);
  doc.rect(20, y, 170, 12, 'F');
  doc.setFontSize(12);
  doc.setTextColor(...C.teal);
  doc.setFont('helvetica', 'bold');
  doc.text('Total frais logistiques', 25, y + 8);
  doc.setTextColor(...C.black);
  doc.text(formatEUR(totalFrais), 186, y + 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 17;

  // TVA
  doc.setFontSize(8);
  doc.setTextColor(...C.grayText);
  doc.text('TVA non applicable, art. 293 B du CGI', 190, y, { align: 'right' });

  // Bank info
  y += 8;
  y = drawBankInfo(doc, cfg.bankInfo, y);

  drawFooter(doc, 'Facture logistique', numero, C.teal);

  return doc;
}

// ============================================================
// EXPORT: TÉLÉCHARGER PDF
// ============================================================
export function downloadPDF(doc: jsPDF, filename: string): void {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
