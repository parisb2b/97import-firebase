import jsPDF from 'jspdf';
import autoTable, { CellHookData } from 'jspdf-autotable';

export type PdfDocumentType = 'DV' | 'DV_VIP' | 'DC' | 'FAC' | 'FA' | 'AF' | 'NC' | 'FL' | 'AI' | 'BL';

export interface PdfItem {
  ref?: string; qt?: number | string; desc: string;
  publicPrice?: number; vipPrice?: number; unitPrice?: number;
  floorPrice?: number; commissionUnit?: number; total?: number; amount?: number;
  id?: string; photoUrl?: string;
}

export interface PdfPayment { label: string; amount: number; date?: string; }

export interface PdfData {
  type: PdfDocumentType; number: string; ref?: string; date: string; items: PdfItem[];
  totalHT?: number; totalTTC?: number; totalOrder?: number; totalCredit?: number;
  totalLogistics?: number; totalPurchase?: number; totalCommission?: number;
  totalSale?: number; totalFloor?: number; marginPercent?: number;
  status?: string; note?: string; payments?: PdfPayment[];
  quoteNumber?: string; invoiceNumber?: string; orderNumber?: string;
  containerNumber?: string; deliveryEstimate?: string; supplierName?: string;
  supplierPort?: string; incoterm?: string; logisticsCarrier?: string; customsLocation?: string;
}

const COLORS = {
  blue: '#1E88E5', blueBg: '#E3F2FD',
  orange: '#F5924A', orangeBg: '#FFF3E8',
  violet: '#A78BFA', violetBg: '#F3EFFF',
  green: '#4ADE80', greenBg: '#ECFDF5',
  red: '#F87171', redBg: '#FEF2F2',
  dark: '#334155', title: '#2C3E50', text: '#334155', textStrong: '#1F2937',
  mediumGray: '#94A3B8', softGray: '#A3AFBE', lightGray: '#CBD5E1', veryLightGray: '#F8FAFC',
  border: '#E2E8F0', white: '#FFFFFF',
  gold: '#7D6608', goldBg: '#FEF9E7',
  navy: '#1A5276', navyBg: '#E8F0FE'
};

const EMETTEUR_LINES = [
  'LUXENT LIMITED', '2ND FLOOR COLLEGE HOUSE 17 KING', 'EDWARDS ROAD RUISLIP',
  'HA4 7AE LONDON', 'ROYAUME UNI', 'SIRET 14852122', 'luxent@ltd-uk.eu'
];

const RIB_LINES = [
  'LUXENT LIMITED', 'IBAN : DE76 2022 0800 0059 5688 30',
  'SWIFT / BIC : SXPYDEHH', 'Banque : Banking Circle S.A., Munich',
  '', 'MICHEL CHEN', 'TEL & WHATSAPP : +33 6 20 60 74 48', 'WeChat : +86 135 66 27 19 02'
];

const CLIENT_FACT_LINES = ['Michel Chen', '12 Rue Port', '97200 Fort-de-France', 'Martinique', 'mc@sasfr.com'];
const CLIENT_LIV_LINES = ['Michel Chen', '12 Rue Port', '97200 Fort-de-France', 'Martinique'];

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [parseInt(c.substring(0,2),16), parseInt(c.substring(2,4),16), parseInt(c.substring(4,6),16)];
}
function setFill(doc: jsPDF, hex: string): void { doc.setFillColor(...hexToRgb(hex)); }
function setDraw(doc: jsPDF, hex: string): void { doc.setDrawColor(...hexToRgb(hex)); }
function setText(doc: jsPDF, hex: string): void { doc.setTextColor(...hexToRgb(hex)); }

function euro(value?: number): string {
  if (typeof value !== 'number') return '0,00 €';
  const p = value.toFixed(2).split('.');
  return `${p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${p[1]} €`;
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
    FL: { title: 'FACTURE LOGISTIQUE', color: COLORS.gold, bg: COLORS.goldBg, secondaryTitle: 'LOGISTIQUE', secondaryColor: COLORS.gold, secondaryBg: COLORS.goldBg },
    AI: { title: 'ACHAT IMPORT', color: COLORS.orange, bg: COLORS.orangeBg, secondaryTitle: 'FOURNISSEUR', secondaryColor: COLORS.orange, secondaryBg: COLORS.orangeBg },
    BL: { title: 'BON DE LIVRAISON', color: COLORS.navy, bg: COLORS.navyBg, secondaryTitle: 'LIVRAISON', secondaryColor: COLORS.navy, secondaryBg: COLORS.navyBg }
  } as const;
  return configs[type];
}

function getSecondaryLines(data: PdfData): string[] {
  switch (data.type) {
    case 'DC': return [`N° ${data.number}`, `Statut : ${data.status || 'Confirmée'}`, `Livraison : Juillet 2026`];
    default: return RIB_LINES;
  }
}

function drawHeader(doc: jsPDF, data: PdfData): void {
  const c = getDocConfig(data.type);
  setFill(doc, c.color);
  doc.roundedRect(22, 15, 17.2, 17.2, 3.2, 3.2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.3); setText(doc, COLORS.white);
  doc.text('LUXENT', 30.6, 25, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18.75); setText(doc, '#293649');
  doc.text(c.title, 43.5, 23);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setText(doc, COLORS.softGray);
  const dn = (data.number || '').replace('DVS-', 'DV-');
  doc.text(`N° ${dn}${data.ref ? ` · ${data.ref.replace('DVS-', 'DV-')}` : ''}`, 43.5, 31);
  setFill(doc, c.bg);
  doc.roundedRect(151, 14.9, 31.5, 10.8, 10, 10, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.3); setText(doc, c.color);
  doc.text(data.date, 166.75, 21.8, { align: 'center' });
}

function drawInfoBox(doc: jsPDF, o: { x: number; y: number; w: number; h: number; title: string; lines: string[]; borderColor: string; bgColor?: string; titleColor?: string; thickLeft?: boolean; }) {
  const { x, y, w, h, title, lines, borderColor, bgColor = COLORS.white, titleColor = borderColor, thickLeft = false } = o;
  setFill(doc, bgColor); setDraw(doc, thickLeft ? COLORS.border : borderColor);
  doc.setLineWidth(0.45); doc.roundedRect(x, y, w, h, 4.3, 4.3, 'FD');
  if (thickLeft) { setDraw(doc, borderColor); doc.setLineWidth(1.15); doc.line(x, y + 3.5, x, y + h - 3.5); }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.4); setText(doc, titleColor);
  doc.text(title.toUpperCase(), x + 5.2, y + 7.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.2); setText(doc, COLORS.text);
  let cy = y + 15;
  lines.forEach((line, i) => {
    doc.setFont('helvetica', (i === 0 || line.includes('IBAN') || line.includes('SWIFT') || line.includes('MICHEL')) ? 'bold' : 'normal');
    const s = doc.splitTextToSize(line, w - 10.4);
    doc.text(s, x + 5.2, cy); cy += s.length * 4.8;
  });
}

function drawCommonBlocks(doc: jsPDF, data: PdfData): void {
  const c = getDocConfig(data.type);
  drawInfoBox(doc, { x: 22, y: 46, w: 82.5, h: 58, title: 'EMETTEUR', lines: EMETTEUR_LINES, borderColor: '#53B7E7', bgColor: '#F8FCFF' });
  drawInfoBox(doc, { x: 108, y: 46, w: 80, h: 58, title: c.secondaryTitle, lines: getSecondaryLines(data), borderColor: '#F2B174', bgColor: '#FFF7EE' });
  if (data.type !== 'NC' && data.type !== 'AI') {
    drawInfoBox(doc, { x: 22, y: 128, w: 82.5, h: 42, title: 'ADRESSE DE FACTURATION', lines: CLIENT_FACT_LINES, borderColor: COLORS.border, bgColor: COLORS.white, titleColor: COLORS.softGray, thickLeft: true });
    drawInfoBox(doc, { x: 108, y: 128, w: 82.5, h: 42, title: 'ADRESSE DE LIVRAISON', lines: CLIENT_LIV_LINES, borderColor: COLORS.border, bgColor: COLORS.white, titleColor: COLORS.softGray, thickLeft: true });
  }
}

function drawNote(doc: jsPDF, data: PdfData): number {
  if (!data.note && !['DV_VIP'].includes(data.type)) return 178;
  const text = data.note || 'Prix VIP validé — Ce devis est en lecture seule.';
  setFill(doc, COLORS.blueBg); doc.roundedRect(22, 109.8, 166, 12.6, 3.2, 3.2, 'F');
  setDraw(doc, COLORS.blue); doc.setLineWidth(1.15); doc.line(22, 110.5, 22, 121.7);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10.7); setText(doc, '#2F3B4B');
  doc.text(text, 27.8, 117.8);
  return 178;
}

function drawTable(doc: jsPDF, data: PdfData, startY: number): number {
  const c = getDocConfig(data.type);
  autoTable(doc, {
    startY,
    head: [['RÉF.', 'QT', 'DÉSIGNATION', 'PRIX PUBLIC', 'PRIX VIP', 'TOTAL HT']],
    body: data.items.map(i => [i.ref || '—', String(i.qt || ''), i.desc, euro(i.publicPrice), euro(i.vipPrice), euro(i.total)]),
    theme: 'grid', margin: { left: 22, right: 22 }, tableWidth: 166,
    styles: { font: 'helvetica', fontSize: 9.25, cellPadding: 3, lineColor: [226,232,240], lineWidth: 0.22, textColor: [51,65,85] },
    headStyles: { fillColor: hexToRgb(c.color), textColor: [255,255,255], fontStyle: 'bold', halign: 'center', fontSize: 9.25 },
    columnStyles: { 0: { cellWidth: 22 }, 1: { cellWidth: 11, halign: 'center' }, 2: { cellWidth: 62 }, 3: { cellWidth: 24, halign: 'right' }, 4: { cellWidth: 24, halign: 'right' }, 5: { cellWidth: 23, halign: 'right' } },
    didDrawCell: (hook: CellHookData) => {
      if (hook.section === 'body' && hook.column.index === 3) {
        setDraw(doc, COLORS.lightGray); doc.setLineWidth(0.26);
        const y = hook.cell.y + hook.cell.height / 2;
        doc.line(hook.cell.x + 3, y, hook.cell.x + hook.cell.width - 2.2, y);
      }
    }
  });
  return (doc as any).lastAutoTable.finalY || startY;
}

function drawTotals(doc: jsPDF, _data: PdfData, y: number): void {
  let cy = Math.max(y + 8, 237.6);
  const c = getDocConfig(_data.type);
  const line = (label: string, value: string, color = COLORS.text) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); setText(doc, color);
    doc.text(label, 118, cy); doc.text(value, 188, cy, { align: 'right' }); cy += 8;
  };
  line('Total HT :', euro(_data.totalHT));
  line('TVA (0%) :', euro(0));
  line('Total TTC :', euro(_data.totalTTC), c.color);
}

function drawFooter(doc: jsPDF, _data: PdfData): void {
  const footer = 'TVA non applicable - Art. 293B du CGI (Export DOM-TOM) ·\nLUXENT LIMITED · Londres UK';
  doc.setFont('helvetica', 'italic'); doc.setFontSize(6.6); setText(doc, '#B8C2CF');
  doc.text(footer, 105, 287.5, { align: 'center' });
}

function renderDocument(doc: jsPDF, data: PdfData): void {
  drawHeader(doc, data);
  if (data.type === 'FA') {
    doc.saveGraphicsState();
    setText(doc, COLORS.red); setDraw(doc, COLORS.red); doc.setLineWidth(1.8);
    doc.setGState(new (doc as any).GState({ opacity: 0.25 }));
    doc.roundedRect(80, 200, 50, 15, 3, 3, 'D');
    doc.setFontSize(24); doc.text('PAYÉE', 105, 210, { align: 'center', angle: -12 });
    doc.restoreGraphicsState();
  }
  drawCommonBlocks(doc, data);
  const tsy = drawNote(doc, data);
  drawTotals(doc, data, drawTable(doc, data, tsy));
  drawFooter(doc, data);
}

// ============ API ============
export function generateDocumentPDF(data: PdfData): string {
  const doc = new jsPDF('p', 'mm', 'a4'); renderDocument(doc, data);
  return doc.output('bloburl') as unknown as string;
}
export function downloadDocumentPDF(data: PdfData): void {
  const doc = new jsPDF('p', 'mm', 'a4'); renderDocument(doc, data);
  doc.save(`${data.number}.pdf`);
}

// ============ WRAPPERS RÉTROCOMPATIBLES ============
export function downloadPDF(doc: jsPDF, filename: string): void {
  const blob = doc.output('blob'); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function formatDateSafe(v: any): string {
  if (!v) return new Date().toLocaleDateString('fr-FR');
  try {
    if (typeof v.toDate === 'function') return v.toDate().toLocaleDateString('fr-FR');
    if (v && typeof v.seconds === 'number') return new Date(v.seconds * 1000).toLocaleDateString('fr-FR');
    if (v && typeof v._seconds === 'number') return new Date(v._seconds * 1000).toLocaleDateString('fr-FR');
    const d = new Date(v); return isNaN(d.getTime()) ? new Date().toLocaleDateString('fr-FR') : d.toLocaleDateString('fr-FR');
  } catch (e) { return new Date().toLocaleDateString('fr-FR'); }
}

// V126 — mapLignesToItems verrouillé : prix_negocies[ref] !== undefined
export function mapLignesToItems(lignes: any[], prixNegocies?: Record<string, number>, isVip?: boolean): PdfItem[] {
  return (lignes || []).map((l: any) => {
    const ref = l.ref || l.reference || '';
    const publicPrice = l.prix_unitaire || 0;
    let finalVipPrice = publicPrice;
    if (isVip) {
      if (prixNegocies && prixNegocies[ref] !== undefined) {
        finalVipPrice = prixNegocies[ref];
      } else if (l.prix_negocie && l.prix_negocie > 0) {
        finalVipPrice = l.prix_negocie;
      }
    }
    return { ref, qt: l.qte || 1, desc: l.nom_fr || l.description || ref, publicPrice, vipPrice: finalVipPrice, total: finalVipPrice * (l.qte || 1) };
  });
}

export function generateDevis(quote: any, _emetteur?: any): jsPDF {
  const isVip = quote.is_vip === true;
  const items = mapLignesToItems(quote.lignes || [], quote.prix_negocies, isVip);
  const data: PdfData = {
    type: isVip ? 'DV_VIP' : 'DV',
    number: (quote.numero || quote.id || '').replace('DVS-', 'DV-'),
    date: formatDateSafe(quote.createdAt),
    items,
    totalHT: items.reduce((s, i) => s + (i.total || 0), 0),
    totalTTC: items.reduce((s, i) => s + (i.total || 0), 0)
  };
  const doc = new jsPDF('p', 'mm', 'a4'); renderDocument(doc, data); return doc;
}

export function generateFactureFinale(quote: any, numero: string, _emetteur?: any): jsPDF {
  const items = mapLignesToItems(quote.lignes || []);
  const data: PdfData = {
    type: 'FA', number: numero, date: formatDateSafe(new Date()), items,
    totalHT: items.reduce((s, i) => s + (i.total || 0), 0),
    totalTTC: items.reduce((s, i) => s + (i.total || 0), 0)
  };
  const doc = new jsPDF('p', 'mm', 'a4'); renderDocument(doc, data); return doc;
}

export function generateNoteCommission(note: any, _emetteur?: any): jsPDF {
  const data: PdfData = {
    type: 'NC', number: note.numero || note.id, date: formatDateSafe(note.createdAt),
    items: [], totalCommission: note.total_commission || 0
  };
  const doc = new jsPDF('p', 'mm', 'a4'); renderDocument(doc, data); return doc;
}

export function generateFactureLogistique(container: any, fraisLignes: any[], _emetteur?: any): jsPDF {
  void fraisLignes;
  const data: PdfData = {
    type: 'FL', number: container.numero_fm || `FM-${container.id}`,
    date: formatDateSafe(new Date()), items: []
  };
  const doc = new jsPDF('p', 'mm', 'a4'); renderDocument(doc, data); return doc;
}
