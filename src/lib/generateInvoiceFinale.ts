// src/lib/generateInvoiceFinale.ts
// Facture finale GLOBALE générée auto quand solde_paye atteint
// Reprend TOUTES les lignes du devis + historique paiements

import jsPDF from 'jspdf';
import { Acompte, getTotalEncaisse, QuoteLine } from './quoteStatusHelpers';

const COLORS = {
  salmon: '#C87F6B',
  palePink: '#FBF0ED',
  text: '#0F172A',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};

const EMETTEUR = {
  nom: 'LUXENT LIMITED',
  ligne1: '2ND FLOOR COLLEGE HOUSE',
  ligne2: '17 KING EDWARDS ROAD',
  ligne3: 'RUISLIP HA4 7AE LONDON',
};

export interface FactureFinaleData {
  numero: string;                 // FA-AAMM-NNN
  devis_numero: string;
  date_emission: string;
  client: {
    nom: string;
    email: string;
    adresse?: string;
    ville?: string;
    cp?: string;
    pays?: string;
  };
  lignes: QuoteLine[];
  total_ht: number;
  acomptes: Acompte[];
  date_solde_paye: string;
}

export async function generateFactureFinalePDF(data: FactureFinaleData): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // HEADER
  doc.setFontSize(18);
  doc.setTextColor(COLORS.salmon);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', margin, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${data.numero}`, margin, y + 12);
  doc.text(`Émise le ${formatDate(data.date_emission)}`, margin, y + 17);
  doc.text(`Devis d'origine : ${data.devis_numero}`, margin, y + 22);

  doc.setFontSize(14);
  doc.setTextColor(COLORS.salmon);
  doc.setFont('helvetica', 'bold');
  doc.text('LUXENT', pageW - margin - 25, y + 8);

  y += 35;

  // BLOCS ÉMETTEUR / CLIENT
  const blocW = (pageW - 2 * margin - 10) / 2;

  doc.setFontSize(9);
  doc.setTextColor(COLORS.textMuted);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉMETTEUR', margin, y);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.text(EMETTEUR.nom, margin, y + 5);
  doc.text(EMETTEUR.ligne1, margin, y + 10);
  doc.text(EMETTEUR.ligne2, margin, y + 15);
  doc.text(EMETTEUR.ligne3, margin, y + 20);

  const clientX = margin + blocW + 10;
  doc.setTextColor(COLORS.textMuted);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', clientX, y);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.text(data.client.nom || '—', clientX, y + 5);
  if (data.client.adresse) doc.text(data.client.adresse, clientX, y + 10);
  if (data.client.cp || data.client.ville) doc.text(`${data.client.cp || ''} ${data.client.ville || ''}`, clientX, y + 15);
  doc.text(data.client.email, clientX, y + 20);

  y += 40;

  // TABLEAU LIGNES (toutes les lignes du devis)
  doc.setFillColor(COLORS.salmon);
  doc.rect(margin, y, pageW - 2 * margin, 8, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉF.', margin + 2, y + 5.5);
  doc.text('DÉSIGNATION', margin + 35, y + 5.5);
  doc.text('PU HT', pageW - margin - 70, y + 5.5);
  doc.text('QTÉ', pageW - margin - 45, y + 5.5);
  doc.text('TOTAL HT', pageW - margin - 25, y + 5.5);
  y += 8;

  doc.setTextColor(COLORS.text);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  for (const l of data.lignes) {
    doc.setDrawColor(COLORS.border);
    doc.rect(margin, y, pageW - 2 * margin, 8, 'S');
    doc.text(l.reference.substring(0, 15), margin + 2, y + 5);
    doc.text((l.nom || '').substring(0, 40), margin + 35, y + 5);
    doc.text(formatMontant(l.prix_unitaire_final), pageW - margin - 70, y + 5);
    doc.text(String(l.quantite), pageW - margin - 45, y + 5);
    doc.text(formatMontant(l.total_ligne), pageW - margin - 25, y + 5);
    y += 8;
    if (y > pageH - 80) { doc.addPage(); y = margin; }
  }

  y += 5;

  // TOTAUX
  doc.setFontSize(10);
  doc.setTextColor(COLORS.textMuted);
  doc.text('Total HT :', pageW - margin - 70, y);
  doc.setTextColor(COLORS.text);
  doc.text(formatMontant(data.total_ht) + ' €', pageW - margin - 35, y);
  y += 5;
  doc.setTextColor(COLORS.textMuted);
  doc.text('TVA (0%) :', pageW - margin - 70, y);
  doc.setTextColor(COLORS.text);
  doc.text('0,00 €', pageW - margin - 35, y);
  y += 6;

  doc.setFillColor(COLORS.palePink);
  doc.rect(pageW - margin - 80, y - 3, 75, 10, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.salmon);
  doc.text('TOTAL TTC :', pageW - margin - 70, y + 4);
  doc.text(formatMontant(data.total_ht) + ' €', pageW - margin - 35, y + 4);
  y += 20;

  // HISTORIQUE PAIEMENTS (détail)
  if (y > pageH - 60) { doc.addPage(); y = margin; }

  doc.setFillColor(COLORS.palePink);
  doc.rect(margin, y, pageW - 2 * margin, 8, 'F');
  doc.setTextColor(COLORS.salmon);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAIL DES PAIEMENTS', margin + 2, y + 5.5);
  y += 10;

  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');

  for (const a of data.acomptes.filter(a => a.encaisse)) {
    const label = a.is_solde ? 'Solde' : `Acompte n°${a.numero}`;
    const refStr = a.reference_virement ? ` (${a.reference_virement})` : '';
    doc.text(`${label.padEnd(15)} : ${formatMontant(a.montant).padStart(10)}€ reçu le ${formatDate(a.date_reception)}${refStr}`, margin + 2, y);
    y += 5;
  }

  y += 3;
  doc.setDrawColor(COLORS.border);
  doc.line(margin + 2, y, pageW - margin - 2, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total payé : ${formatMontant(getTotalEncaisse(data.acomptes))} €`, margin + 2, y);

  // FOOTER — FACTURE PAYÉE
  const footerY = pageH - 20;
  doc.setDrawColor(COLORS.salmon);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageW - margin, footerY - 5);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.salmon);
  doc.text(`FACTURE PAYÉE — Solde reçu le ${formatDate(data.date_solde_paye)}`, pageW / 2, footerY, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textMuted);
  doc.text('TVA non applicable — Art. 293B du CGI (Export DOM-TOM)', pageW / 2, footerY + 5, { align: 'center' });

  return doc.output('blob');
}

function formatMontant(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('fr-FR'); } catch { return iso; }
}
