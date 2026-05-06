import jsPDF from 'jspdf';
import autoTable, { CellHookData, UserOptions } from 'jspdf-autotable';
import { formatDateCourt } from './dateHelpers';

export type PdfDocumentType = 'DV' | 'DV_VIP' | 'DC' | 'FAC' | 'FA' | 'AF' | 'NC' | 'FL' | 'AI' | 'BL';

export interface PdfItem {
  ref?: string;
  qt?: number | string;
  desc: string;
  publicPrice?: number;
  vipPrice?: number;
  unitPrice?: number;
  floorPrice?: number;
  commissionUnit?: number;
  total?: number;
  amount?: number;
}

export interface PdfPayment {
  label: string;
  amount: number;
  date?: string;
}

export interface PdfData {
  type: PdfDocumentType;
  number: string;
  ref?: string;
  date: string;
  items: PdfItem[];
  totalHT?: number;
  totalTTC?: number;
  totalOrder?: number;
  totalCredit?: number;
  totalLogistics?: number;
  totalPurchase?: number;
  totalCommission?: number;
  totalSale?: number;
  totalFloor?: number;
  marginPercent?: number;
  status?: string;
  note?: string;
  payments?: PdfPayment[];
  quoteNumber?: string;
  invoiceNumber?: string;
  orderNumber?: string;
  containerNumber?: string;
  deliveryEstimate?: string;
  supplierName?: string;
  supplierPort?: string;
  incoterm?: string;
  logisticsCarrier?: string;
  customsLocation?: string;
}

const COLORS = {
  blue: '#1E88E5', blueBg: '#E3F2FD',
  orange: '#F5924A', orangeBg: '#FFF3E8',
  violet: '#A78BFA', violetBg: '#F3EFFF',
  green: '#4ADE80', greenBg: '#ECFDF5',
  red: '#F87171', redBg: '#FEF2F2',
  dark: '#334155', title: '#2C3E50', text: '#495057', textStrong: '#1F2937',
  mediumGray: '#94A3B8', softGray: '#9CA3AF', lightGray: '#CBD5E1', veryLightGray: '#F8FAFC',
  border: '#E2E8F0', white: '#FFFFFF',
  logisticsBrown: '#7D6608', logisticsBg: '#FEF9E7',
  deliveryBlue: '#1A5276', deliveryBg: '#E8F0FE'
};

const EMETTEUR_LINES = [
  'LUXENT LIMITED',
  '2ND FLOOR COLLEGE HOUSE 17 KING',
  'EDWARDS ROAD RUISLIP',
  'HA4 7AE LONDON ROYAUME UNI',
  'SIRET 14852122',
  'luxent@ltd-uk.eu'
];

const RIB_LINES = [
  'LUXENT LIMITED',
  'IBAN : DE76 2022 0800 0059 5688 30',
  'SWIFT / BIC : SXPYDEHH',
  'Banque : Banking Circle S.A., Munich',
  '',
  'MICHEL CHEN',
  'TEL & WHATSAPP : +33 6 20 60 74 48',
  'WeChat : +86 135 66 27 19 02'
];

const CLIENT_FACT_LINES = [
  'Michel Chen',
  '12 Rue Port',
  '97200 Fort-de-France',
  'Martinique',
  'mc@sasfr.com'
];

const CLIENT_LIV_LINES = [
  'Michel Chen',
  '12 Rue Port',
  '97200 Fort-de-France',
  'Martinique'
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [parseInt(clean.substring(0, 2), 16), parseInt(clean.substring(2, 4), 16), parseInt(clean.substring(4, 6), 16)];
}

function setFill(doc: jsPDF, hex: string): void { doc.setFillColor(...hexToRgb(hex)); }
function setDraw(doc: jsPDF, hex: string): void { doc.setDrawColor(...hexToRgb(hex)); }
function setText(doc: jsPDF, hex: string): void { doc.setTextColor(...hexToRgb(hex)); }

function euro(value?: number): string {
  return (typeof value === 'number' ? value : 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function getDocConfig(type: PdfDocumentType) {
  const configs = {
    DV: { title: 'DEVIS', color: COLORS.blue, bg: COLORS.blueBg, secondaryTitle: 'RIB / IBAN', secondaryColor: COLORS.orange, secondaryBg: COLORS.orangeBg },
    DV_VIP: { title: 'DEVIS VIP', color: COLORS.blue, bg: COLORS.blueBg, secondaryTitle: 'RIB / IBAN', secondaryColor: COLORS.orange, secondaryBg: COLORS.orangeBg },
    DC: { title: 'MES COMMANDES', color: COLORS.orange, bg: COLORS.orangeBg, secondaryTitle: 'COMMANDE', secondaryColor: COLORS.orange, secondaryBg: COLORS.orangeBg },
    FAC: { title: 'FACTURE ACOMPTE', color: COLORS.orange, bg: COLORS.orangeBg, secondaryTitle: 'RIB / IBAN', secondaryColor: COLORS.orange, secondaryBg: COLORS.orangeBg },
    FA: { title: 'FACTURE', color: COLORS.green, bg: COLORS.greenBg, secondaryTitle: 'RIB / IBAN', secondaryColor: COLORS.orange, secondaryBg: COLORS.orangeBg },
    AF: { title: 'AVOIR SUR FACTURE', color: COLORS.red, bg: COLORS.redBg, secondaryTitle: 'AVOIR', secondaryColor: COLORS.red, secondaryBg: COLORS.redBg },
    NC: { title: 'NOTE DE COMMISSION', color: COLORS.violet, bg: COLORS.violetBg, secondaryTitle: 'PARTENAIRE', secondaryColor: COLORS.violet, secondaryBg: COLORS.violetBg },
    FL: { title: 'FACTURE LOGISTIQUE', color: COLORS.logisticsBrown, bg: COLORS.logisticsBg, secondaryTitle: 'LOGISTIQUE', secondaryColor: COLORS.logisticsBrown, secondaryBg: COLORS.logisticsBg },
    AI: { title: 'ACHAT IMPORT', color: COLORS.orange, bg: COLORS.orangeBg, secondaryTitle: 'FOURNISSEUR', secondaryColor: COLORS.orange, secondaryBg: COLORS.orangeBg },
    BL: { title: 'BON DE LIVRAISON', color: COLORS.deliveryBlue, bg: COLORS.deliveryBg, secondaryTitle: 'LIVRAISON', secondaryColor: COLORS.deliveryBlue, secondaryBg: COLORS.deliveryBg }
  } as const;
  return configs[type];
}

function getSecondaryLines(data: PdfData): string[] {
  switch (data.type) {
    case 'DC': return [`N° ${data.number}`, `Statut : ${data.status || 'Confirmée'}`, `Livraison estimée : ${data.deliveryEstimate || 'Juillet 2026'}`];
    case 'AF': return ['Remboursement partiel', `Facture liée : ${data.invoiceNumber || data.ref || '-'}`, 'Motif : Erreur de facturation'];
    case 'NC': return ['97IMPORT (IMP)', '97importcom@gmail.com', `Devis lié : ${data.quoteNumber || data.ref || '-'}`];
    case 'FL': return [`Transporteur : ${data.logisticsCarrier || 'Maritime Express'}`, `Dédouanement : ${data.customsLocation || 'Fort-de-France'}`, `Devis lié : ${data.quoteNumber || data.ref || '-'}`];
    case 'AI': return [data.supplierName || 'Shandong Machinery Co.', `Port : ${data.supplierPort || 'Yantian, Chine'}`, `Incoterm : ${data.incoterm || 'FOB Yantian'}`];
    case 'BL': return [`Conteneur : ${data.containerNumber || 'CTN-2605001'}`, 'Destinataire : Michel Chen', `Commande liée : ${data.orderNumber || data.ref || '-'}`];
    default: return RIB_LINES;
  }
}

function drawHeader(doc: jsPDF, data: PdfData): void {
  const config = getDocConfig(data.type);
  setFill(doc, config.color);
  doc.roundedRect(15, 15, 18, 18, 3.2, 3.2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); setText(doc, COLORS.white);
  doc.text('LUXENT', 24, 25, { align: 'center' });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); setText(doc, COLORS.title);
  doc.text(config.title, 38, 23);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); setText(doc, COLORS.softGray);
  doc.text(`N° ${data.number}${data.ref ? ` · ${data.ref}` : ''}`, 38, 31);

  setFill(doc, config.bg);
  doc.roundedRect(160, 15, 35, 12, 6, 6, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); setText(doc, COLORS.mediumGray);
  doc.text('DATE D\'EMISSION', 177.5, 19, { align: 'center' });
  doc.setFontSize(8.8); setText(doc, config.color);
  doc.text(data.date, 177.5, 24, { align: 'center' });
}

function drawInfoBox(doc: jsPDF, options: { x: number; y: number; w: number; h: number; title: string; lines: string[]; borderColor: string; bgColor?: string; titleColor?: string; thickLeft?: boolean; }) {
  const { x, y, w, h, title, lines, borderColor, bgColor = COLORS.white, titleColor = borderColor, thickLeft = false } = options;
  setFill(doc, bgColor); setDraw(doc, thickLeft ? COLORS.border : borderColor);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, w, h, 4.3, 4.3, 'FD');

  if (thickLeft) {
    setDraw(doc, borderColor); doc.setLineWidth(1.3);
    doc.line(x, y + 3.5, x, y + h - 3.5);
  }

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); setText(doc, titleColor);
  doc.text(title.toUpperCase(), x + 5, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); setText(doc, COLORS.text);

  let currentY = y + 14;
  lines.forEach((line, index) => {
    doc.setFont('helvetica', index === 0 ? 'bold' : 'normal');
    const split = doc.splitTextToSize(line, w - 10);
    doc.text(split, x + 5, currentY);
    currentY += split.length * 4.2;
  });
}

function drawCommonBlocks(doc: jsPDF, data: PdfData): void {
  const config = getDocConfig(data.type);
  drawInfoBox(doc, { x: 15, y: 45, w: 88, h: 58, title: data.type === 'AI' ? 'ACHETEUR' : 'EMETTEUR', lines: EMETTEUR_LINES, borderColor: COLORS.blue, bgColor: '#FAFDFF' });
  drawInfoBox(doc, { x: 107, y: 45, w: 88, h: 58, title: config.secondaryTitle, lines: getSecondaryLines(data), borderColor: config.secondaryColor, bgColor: config.secondaryBg });

  if (data.type !== 'NC' && data.type !== 'AI') {
    drawInfoBox(doc, { x: 15, y: 108, w: 88, h: 42, title: 'ADRESSE DE FACTURATION', lines: CLIENT_FACT_LINES, borderColor: COLORS.blue, bgColor: COLORS.white, titleColor: COLORS.mediumGray, thickLeft: true });
    drawInfoBox(doc, { x: 107, y: 108, w: 88, h: 42, title: 'ADRESSE DE LIVRAISON', lines: CLIENT_LIV_LINES, borderColor: COLORS.orange, bgColor: COLORS.white, titleColor: COLORS.mediumGray, thickLeft: true });
  }
}

function drawNote(doc: jsPDF, data: PdfData): number {
  if (!data.note && !['DV_VIP', 'DC', 'NC', 'AI'].includes(data.type)) return 158;
  let text = data.note || '';
  if (data.type === 'DV_VIP') text = 'Prix VIP validé — Ce devis est en lecture seule. Les prix négociés sont définitifs.';
  if (data.type === 'DC') text = `Confirmation de commande — Ce document confirme votre acceptation du devis ${data.quoteNumber || data.ref || '-'}. N° de Commande : ${data.number}`;
  if (data.type === 'NC') text = `Détail de la commission — Généré automatiquement après encaissement total du devis ${data.quoteNumber || data.ref || '-'}`;
  if (data.type === 'AI') text = 'Document interne — Non destiné au client final. Commande fournisseur étranger. Les prix d\'achat sont strictement confidentiels.';

  setFill(doc, data.type === 'AI' ? COLORS.orangeBg : COLORS.blueBg);
  doc.roundedRect(15, 108, 180, 13, 3.2, 3.2, 'F');
  setDraw(doc, data.type === 'AI' ? COLORS.orange : COLORS.blue); doc.setLineWidth(1.2);
  doc.line(15, 108 + 2, 15, 121 - 2);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); setText(doc, COLORS.dark);
  doc.text(doc.splitTextToSize(text, 170), 20, 116);
  return ['NC', 'AI'].includes(data.type) ? 130 : 158;
}

function getTableDefinition(data: PdfData): { head: string[][]; body: any[][]; columnStyles: UserOptions['columnStyles']; } {
  switch (data.type) {
    case 'DV': case 'DV_VIP': case 'DC': case 'FA':
      return {
        head: [['RÉF.', 'QT', 'DÉSIGNATION', 'PRIX PUBLIC', 'PRIX VIP', 'TOTAL HT']],
        body: data.items.map(i => [i.ref || '—', String(i.qt || ''), i.desc, euro(i.publicPrice), euro(i.vipPrice), euro(i.total)]),
        columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 12, halign: 'center' }, 2: { cellWidth: 62 }, 3: { cellWidth: 28, halign: 'right' }, 4: { cellWidth: 28, halign: 'right' }, 5: { cellWidth: 28, halign: 'right' } }
      };
    case 'FAC': case 'AF': case 'FL':
      return {
        head: [['RÉF.', 'QT', 'DÉSIGNATION', 'MONTANT HT']],
        body: data.items.map(i => [i.ref || '—', String(i.qt || ''), i.desc, euro(i.amount ?? i.total)]),
        columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 14, halign: 'center' }, 2: { cellWidth: 94 }, 3: { cellWidth: 48, halign: 'right' } }
      };
    case 'NC':
      return {
        head: [['RÉF.', 'QT', 'DÉSIGNATION', 'PRIX VENTE', 'PRIX PLANCHER', 'COMM. UNIT.', 'COMM. TOTALE']],
        body: data.items.map(i => [i.ref || '—', String(i.qt || ''), i.desc, euro(i.vipPrice ?? i.unitPrice), euro(i.floorPrice), euro(i.commissionUnit), euro(i.total ?? i.amount)]),
        columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 45 }, 3: { cellWidth: 28, halign: 'right' }, 4: { cellWidth: 27, halign: 'right' }, 5: { cellWidth: 25, halign: 'right' }, 6: { cellWidth: 25, halign: 'right' } }
      };
    case 'AI':
      return {
        head: [['RÉF.', 'QT', 'DÉSIGNATION', 'PRIX ACHAT', 'TOTAL']],
        body: data.items.map(i => [i.ref || '—', String(i.qt || ''), i.desc, euro(i.unitPrice ?? i.amount), euro(i.total)]),
        columnStyles: { 0: { cellWidth: 24 }, 1: { cellWidth: 14, halign: 'center' }, 2: { cellWidth: 82 }, 3: { cellWidth: 30, halign: 'right' }, 4: { cellWidth: 30, halign: 'right' } }
      };
    case 'BL':
      return {
        head: [['RÉF.', 'QT', 'DÉSIGNATION']],
        body: data.items.map(i => [i.ref || '—', String(i.qt || ''), i.desc]),
        columnStyles: { 0: { cellWidth: 28 }, 1: { cellWidth: 18, halign: 'center' }, 2: { cellWidth: 134 } }
      };
  }
}

function drawTable(doc: jsPDF, data: PdfData, startY: number): number {
  const config = getDocConfig(data.type);
  const table = getTableDefinition(data);

  autoTable(doc, {
    startY, head: table.head, body: table.body, theme: 'grid', margin: { left: 15, right: 15 }, tableWidth: 180,
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2, lineColor: hexToRgb(COLORS.border), lineWidth: 0.15, textColor: hexToRgb(COLORS.text) },
    headStyles: { fillColor: hexToRgb(config.color), textColor: hexToRgb(COLORS.white), fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 7.5 },
    alternateRowStyles: { fillColor: hexToRgb(COLORS.veryLightGray) },
    columnStyles: table.columnStyles,
    didParseCell: (hook) => {
      if (hook.section !== 'body') return;
      if (['DV', 'DV_VIP', 'DC', 'FA'].includes(data.type)) {
        if (hook.column.index === 3) hook.cell.styles.textColor = hexToRgb(COLORS.lightGray);
        if (hook.column.index === 4) { hook.cell.styles.textColor = hexToRgb(COLORS.violet); hook.cell.styles.fontStyle = 'bold'; }
        if (hook.column.index === 5) { hook.cell.styles.textColor = hexToRgb(COLORS.textStrong); hook.cell.styles.fontStyle = 'bold'; }
      }
      if (['FAC', 'AF', 'FL', 'AI', 'NC'].includes(data.type) && hook.column.index === hook.table.columns.length - 1) {
        hook.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawCell: (hook: CellHookData) => {
      if (hook.section === 'body' && ['DV', 'DV_VIP', 'DC', 'FA'].includes(data.type) && hook.column.index === 3) {
        setDraw(doc, COLORS.lightGray); doc.setLineWidth(0.2);
        const y = hook.cell.y + hook.cell.height / 2;
        doc.line(hook.cell.x + 2, y, hook.cell.x + hook.cell.width - 2, y);
      }
    }
  });
  return (doc as any).lastAutoTable.finalY || startY;
}

function drawPaidStamp(doc: jsPDF): void {
  doc.saveGraphicsState();
  setText(doc, COLORS.red); setDraw(doc, COLORS.red); doc.setLineWidth(1.8); doc.setFont('helvetica', 'bold'); doc.setFontSize(30);
  doc.setGState(new (doc as any).GState({ opacity: 0.22 }));
  doc.text('PAYEE', 105, 210, { align: 'center', angle: -12 });
  doc.restoreGraphicsState();
}

function drawPayments(doc: jsPDF, data: PdfData, y: number): number {
  if (!data.payments || data.payments.length === 0) return y;
  const sy = Math.min(y + 10, 232);
  setFill(doc, COLORS.blueBg); doc.roundedRect(15, sy, 180, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); setText(doc, COLORS.blue);
  doc.text('RECAPITULATIF DES PAIEMENTS', 20, sy + 6.5);
  autoTable(doc, {
    startY: sy + 13, head: [['Paiement','Montant','Date']], body: data.payments.map(p => [p.label, euro(p.amount), p.date||'']),
    theme: 'grid', margin: { left: 15, right: 15 }, tableWidth: 180,
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, lineColor: hexToRgb(COLORS.border), lineWidth: 0.15 },
    headStyles: { fillColor: hexToRgb(COLORS.blue), textColor: hexToRgb(COLORS.white), fontStyle: 'bold' },
    columnStyles: { 0:{cellWidth:90},1:{cellWidth:45,halign:'right'},2:{cellWidth:45} }
  });
  return (doc as any).lastAutoTable.finalY || y;
}

function drawTotals(doc: jsPDF, data: PdfData, y: number): void {
  if (data.type === 'BL') return;
  const config = getDocConfig(data.type);
  let currentY = Math.max(y + 8, 235);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); setText(doc, COLORS.text);

  function line(label: string, value: string, strong = false, color = COLORS.textStrong) {
    doc.setFont('helvetica', strong ? 'bold' : 'normal'); doc.setFontSize(strong ? 10 : 8.5); setText(doc, color);
    doc.text(label, 125, currentY); doc.text(value, 195, currentY, { align: 'right' }); currentY += strong ? 7 : 5;
  }

  if (data.type === 'NC') {
    line('Total Prix Vente :', euro(data.totalSale)); line('Total Prix Plancher :', `- ${euro(data.totalFloor).replace('-', '')}`); line('Marge :', `${data.marginPercent ?? 0}%`);
    drawGrandTotal(doc, currentY, 'COMMISSION TOTALE :', euro(data.totalCommission), config.color, config.bg); return;
  }
  if (data.type === 'AF') { drawGrandTotal(doc, currentY, 'TOTAL AVOIR :', `- ${euro(Math.abs(data.totalCredit || 0))}`, COLORS.red, COLORS.redBg); return; }
  if (data.type === 'FL') { drawGrandTotal(doc, currentY, 'TOTAL LOGISTIQUE :', euro(data.totalLogistics ?? data.totalTTC), config.color, config.bg); return; }
  if (data.type === 'AI') { drawGrandTotal(doc, currentY, 'TOTAL ACHAT :', euro(data.totalPurchase ?? data.totalTTC), config.color, config.bg); return; }
  if (data.type === 'DC') { drawGrandTotal(doc, currentY, 'TOTAL COMMANDE :', euro(data.totalOrder ?? data.totalTTC), config.color, config.bg); return; }

  line('Total HT :', euro(data.totalHT)); line('TVA (0%) :', euro(0));
  drawGrandTotal(doc, currentY, 'TOTAL TTC :', euro(data.totalTTC), config.color, config.bg);
}

function drawGrandTotal(doc: jsPDF, y: number, label: string, value: string, color: string, bg: string): void {
  setFill(doc, bg); doc.roundedRect(125, y, 70, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); setText(doc, color); doc.text(label, 130, y + 7);
  doc.setFontSize(11.5); doc.text(value, 192, y + 7, { align: 'right' });
}

function drawFooter(doc: jsPDF, data: PdfData): void {
  let footer = 'TVA non applicable — Art. 293B du CGI (Export DOM-TOM) · LUXENT LIMITED · Londres UK';
  if (data.type === 'DC') footer = `Cette commande confirme votre acceptation du devis ${data.quoteNumber || data.ref || '-'} · TVA non applicable`;
  if (data.type === 'AF') footer = 'Avoir déduit de votre prochaine facture · TVA non applicable — Art. 293B du CGI';
  if (data.type === 'NC') footer = 'Généré automatiquement après encaissement total · LUXENT LIMITED · N° 14852122';
  if (data.type === 'AI') footer = 'Document interne · LUXENT LIMITED · N° 14852122';
  if (data.type === 'BL') footer = 'Bon de Livraison · TVA non applicable — Art. 293B du CGI';
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7); setText(doc, COLORS.softGray);
  doc.text(footer, 105, 285, { align: 'center' });
}

function renderDocument(doc: jsPDF, data: PdfData): void {
  drawHeader(doc, data);
  if (data.type === 'FA') drawPaidStamp(doc);
  if (['NC', 'AI'].includes(data.type)) drawNote(doc, data);
  drawCommonBlocks(doc, data);
  const tableStartY = ['NC', 'AI'].includes(data.type) ? 130 : drawNote(doc, data);
  const tableFinalY = drawTable(doc, data, tableStartY);
  const afterPaymentsY = data.type === 'FA' ? drawPayments(doc, data, tableFinalY) : tableFinalY;
  drawTotals(doc, data, afterPaymentsY);
  drawFooter(doc, data);
}

export function generateDocumentPDF(data: PdfData): string {
  const doc = new jsPDF('p', 'mm', 'a4');
  renderDocument(doc, data);
  return doc.output('bloburl') as unknown as string;
}

export function downloadDocumentPDF(data: PdfData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  renderDocument(doc, data);
  doc.save(`${data.number}.pdf`);
}

// ============ BACKWARD-COMPATIBLE WRAPPERS ============
// Conservés pour ne pas casser les fichiers importateurs existants

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

function formatDateSafe(v: any): string {
  try { return formatDateCourt(v); } catch { return String(v || ''); }
}

function mapLignesToItems(lignes: any[], prixNegocies?: Record<string, number>, isVip?: boolean): PdfItem[] {
  return (lignes || []).map((l: any) => {
    const qte = l.qte || 1;
    const publicPrice = l.prix_unitaire || 0;
    const vipPrice = isVip && prixNegocies?.[l.ref || l.reference] !== undefined
      ? prixNegocies[l.ref || l.reference] : publicPrice;
    return {
      ref: l.ref || l.reference || '',
      qt: qte,
      desc: l.nom_fr || l.description || l.ref || '',
      publicPrice,
      vipPrice,
      total: vipPrice * qte,
    };
  });
}

export function generateDevis(quote: any, _emetteur?: any): jsPDF {
  const isVip = quote.is_vip === true;
  const lignes = quote.lignes || [];
  const prixNegocies = quote.prix_negocies || {};
  const items = mapLignesToItems(lignes, prixNegocies, isVip);
  const date = formatDateSafe(quote.createdAt);
  const totalHT = quote.total_ht || items.reduce((s, i) => s + (i.total || 0), 0);

  const data: PdfData = {
    type: isVip ? 'DV_VIP' : 'DV',
    number: quote.numero || quote.id,
    ref: quote.numero ? `Devis Réf. ${quote.numero}` : undefined,
    date,
    items,
    totalHT,
    totalTTC: totalHT,
    note: isVip ? 'Prix VIP validé — Ce devis est en lecture seule.' : undefined,
  };

  const doc = new jsPDF('p', 'mm', 'a4');
  renderDocument(doc, data);
  return doc;
}

export function generateFactureFinale(quote: any, numero: string, _emetteur?: any): jsPDF {
  const lignes = quote.lignes || [];
  const items = mapLignesToItems(lignes);
  const date = formatDateSafe(new Date());
  const totalHT = quote.total_ht || items.reduce((s, i) => s + (i.total || 0), 0);

  const acomptes = (quote.acomptes || []).filter((a: any) => a.encaisse === true);
  const payments: PdfPayment[] = acomptes.map((a: any) => ({
    label: a.reference || a.numero || 'Acompte',
    amount: a.montant || 0,
    date: a.date_encaissement ? formatDateSafe(a.date_encaissement) : undefined,
  }));

  const data: PdfData = {
    type: 'FA',
    number: numero,
    date,
    items,
    totalHT,
    totalTTC: totalHT,
    payments: payments.length > 0 ? payments : undefined,
  };

  const doc = new jsPDF('p', 'mm', 'a4');
  renderDocument(doc, data);
  return doc;
}

export function generateNoteCommission(note: any, _emetteur?: any): jsPDF {
  const items: PdfItem[] = [];
  const totalCommission = note.total_commission || 0;
  let totalSale = 0;
  let totalFloor = 0;

  const devisList = note.devis || [];
  if (devisList.length > 0) {
    for (const devis of devisList) {
      for (const l of (devis.lignes || [])) {
        const pn = l.prix_negocie || 0;
        const pp = l.prix_partenaire || 0;
        totalSale += pn;
        totalFloor += pp;
        items.push({
          ref: l.ref || '',
          qt: 1,
          desc: l.nom_fr || l.description || '',
          vipPrice: pn,
          floorPrice: pp,
          commissionUnit: pn - pp,
          total: pn - pp,
        });
      }
    }
  } else if (note.lignes) {
    for (const l of note.lignes) {
      const montant = l.montant_ht || 0;
      const comm = l.commission || 0;
      totalSale += montant;
      totalFloor += montant - comm;
      items.push({
        ref: l.ref || '',
        qt: 1,
        desc: l.nom_fr || l.description || '',
        vipPrice: montant,
        floorPrice: montant - comm,
        commissionUnit: comm,
        total: comm,
      });
    }
  }

  const data: PdfData = {
    type: 'NC',
    number: note.numero || note.id,
    date: formatDateSafe(note.createdAt),
    items: items.length > 0 ? items : [{ ref: '-', qt: 1, desc: 'Commission', vipPrice: totalCommission, floorPrice: 0, commissionUnit: totalCommission, total: totalCommission }],
    totalCommission,
    totalSale: totalSale || totalCommission,
    totalFloor,
    marginPercent: totalFloor > 0 ? Math.round((totalCommission / totalFloor) * 100) : 100,
    quoteNumber: note.devis_numero || note.quoteNumber || undefined,
    note: 'Généré automatiquement après encaissement total',
  };

  const doc = new jsPDF('p', 'mm', 'a4');
  renderDocument(doc, data);
  return doc;
}

export function generateFactureLogistique(container: any, fraisLignes: any[], _emetteur?: any): jsPDF {
  const items: PdfItem[] = (fraisLignes || []).map((l: any) => ({
    ref: l.ref || '',
    qt: l.qte || 1,
    desc: l.description || l.nom_fr || '',
    amount: l.total || l.montant || 0,
    total: l.total || l.montant || 0,
  }));
  const totalLog = items.reduce((s, i) => s + (i.total || 0), 0);

  const data: PdfData = {
    type: 'FL',
    number: container.numero_fm || `FM-${container.numero || container.id}`,
    date: formatDateSafe(container.createdAt || new Date()),
    items,
    totalLogistics: totalLog,
    totalTTC: totalLog,
    containerNumber: container.numero || undefined,
    quoteNumber: container.devis_ref || undefined,
  };

  const doc = new jsPDF('p', 'mm', 'a4');
  renderDocument(doc, data);
  return doc;
}
