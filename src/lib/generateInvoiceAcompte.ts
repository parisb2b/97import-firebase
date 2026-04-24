// src/lib/generateInvoiceAcompte.ts
// Génère un PDF de facture d'acompte conforme à la charte Luxent Limited

import jsPDF from 'jspdf';
import { Acompte, getTotalEncaisse, getSoldeRestant, estEntierementPaye } from './quoteStatusHelpers';

// Charte graphique
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
  iban: 'DE76 2022 0800 0059 5688 30',
  swift: 'SXPYDEMMXXX',
  banque: 'Banking Circle S.A.',
};

export interface FactureAcompteData {
  numero: string;                    // FA-AC-2604-001
  devis_numero: string;              // DVS-2604-001
  date_emission: string;             // ISO
  acompte_numero: number;            // 1, 2, 3 ou 0 (solde)
  acompte_est_solde: boolean;
  montant: number;
  total_devis: number;
  client: {
    nom: string;
    email: string;
    adresse?: string;
    ville?: string;
    cp?: string;
    pays?: string;
  };
  historique_acomptes: Acompte[];    // Tous les paiements précédents + celui-ci
  devis_lignes: Array<{              // Les lignes du devis original
    description?: string;
    nom_fr?: string;
    ref?: string;
    prix_unitaire: number;
    qte: number;
    total_ht?: number;
    total?: number;
  }>;
  logo_url?: string;                 // /images/luxent.png
}

export async function generateFactureAcomptePDF(data: FactureAcompteData): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  let y = margin;

  // ═══ HEADER ═══
  // Titre + date top-left
  doc.setFontSize(18);
  doc.setTextColor(COLORS.salmon);
  doc.setFont('helvetica', 'bold');
  doc.text(data.acompte_est_solde ? 'FACTURE SOLDE' : `FACTURE ACOMPTE N°${data.acompte_numero}/3`, margin, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${data.numero}`, margin, y + 12);
  doc.text(`Émise le ${formatDate(data.date_emission)}`, margin, y + 17);
  doc.text(`Concerne devis : ${data.devis_numero}`, margin, y + 22);

  // Logo top-right
  doc.setFontSize(14);
  doc.setTextColor(COLORS.salmon);
  doc.setFont('helvetica', 'bold');
  doc.text('LUXENT', pageW - margin - 25, y + 8);

  y += 35;

  // ═══ BLOCS ÉMETTEUR / CLIENT ═══
  const blocW = (pageW - 2 * margin - 10) / 2;

  // Émetteur (gauche)
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

  // Client (droite)
  const clientX = margin + blocW + 10;
  doc.setTextColor(COLORS.textMuted);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', clientX, y);

  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.text(data.client.nom || '—', clientX, y + 5);
  if (data.client.adresse) doc.text(data.client.adresse, clientX, y + 10);
  if (data.client.cp || data.client.ville) {
    doc.text(`${data.client.cp || ''} ${data.client.ville || ''}`, clientX, y + 15);
  }
  if (data.client.pays) doc.text(data.client.pays, clientX, y + 20);
  doc.text(data.client.email, clientX, y + 25);

  y += 40;

  // ═══ TABLEAU LIGNE UNIQUE ACOMPTE ═══
  // En-tête tableau
  doc.setFillColor(COLORS.salmon);
  doc.rect(margin, y, pageW - 2 * margin, 8, 'F');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉSIGNATION', margin + 2, y + 5.5);
  doc.text('MONTANT HT', pageW - margin - 35, y + 5.5);

  y += 8;

  // Ligne acompte
  doc.setFillColor('#FFFFFF');
  doc.setDrawColor(COLORS.border);
  doc.rect(margin, y, pageW - 2 * margin, 12, 'S');
  doc.setTextColor(COLORS.text);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const designation = data.acompte_est_solde
    ? `Solde sur devis ${data.devis_numero}`
    : `Acompte n°${data.acompte_numero} sur devis ${data.devis_numero}`;
  doc.text(designation, margin + 2, y + 7);
  doc.text(formatMontant(data.montant) + ' €', pageW - margin - 35, y + 7);

  y += 15;

  // ═══ TOTAUX ═══
  doc.setFontSize(10);
  doc.setTextColor(COLORS.textMuted);
  doc.text('Total HT :', pageW - margin - 70, y);
  doc.setTextColor(COLORS.text);
  doc.text(formatMontant(data.montant) + ' €', pageW - margin - 35, y);
  y += 5;
  doc.setTextColor(COLORS.textMuted);
  doc.text('TVA (0%) :', pageW - margin - 70, y);
  doc.setTextColor(COLORS.text);
  doc.text('0,00 €', pageW - margin - 35, y);
  y += 6;

  // Total TTC (fond rose)
  doc.setFillColor(COLORS.palePink);
  doc.rect(pageW - margin - 80, y - 3, 75, 10, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.salmon);
  doc.text('TOTAL TTC :', pageW - margin - 70, y + 4);
  doc.text(formatMontant(data.montant) + ' €', pageW - margin - 35, y + 4);

  y += 20;

  // ═══ HISTORIQUE DES PAIEMENTS ═══
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

  for (const a of data.historique_acomptes) {
    const label = a.is_solde ? 'Solde' : `Acompte n°${a.numero}`;
    const ligne = `${label.padEnd(15)} : ${formatMontant(a.montant).padStart(10)} € reçu le ${formatDate(a.date_reception)}${a.reference_virement ? ` (${a.reference_virement})` : ''}`;
    doc.text(ligne, margin + 2, y);
    y += 5;
  }

  // Total payé
  const totalPaye = getTotalEncaisse(data.historique_acomptes);
  const restant = getSoldeRestant(data.total_devis, data.historique_acomptes);

  y += 3;
  doc.setDrawColor(COLORS.border);
  doc.line(margin + 2, y, pageW - margin - 2, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.text(`Total payé  : ${formatMontant(totalPaye)} €`, margin + 2, y);
  y += 5;
  doc.text(`Reste à payer : ${formatMontant(restant)} €`, margin + 2, y);
  y += 5;
  doc.text(`Total devis   : ${formatMontant(data.total_devis)} €`, margin + 2, y);

  y += 15;

  // ═══ INFOS BANCAIRES (si reste à payer > 0) ═══
  if (restant > 0.01) {
    doc.setFontSize(9);
    doc.setTextColor(COLORS.textMuted);
    doc.setFont('helvetica', 'bold');
    doc.text('Coordonnées bancaires pour le paiement restant :', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text);
    doc.text(`Bénéficiaire : ${EMETTEUR.nom}`, margin, y);
    y += 4;
    doc.text(`IBAN : ${EMETTEUR.iban}`, margin, y);
    y += 4;
    doc.text(`SWIFT : ${EMETTEUR.swift}`, margin, y);
    y += 4;
    doc.text(`Banque : ${EMETTEUR.banque}`, margin, y);
  }

  // ═══ FOOTER DYNAMIQUE (bas de page) ═══
  const footerY = pageH - 20;
  doc.setDrawColor(COLORS.salmon);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageW - margin, footerY - 5);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.salmon);

  const entierementPaye = estEntierementPaye(data.total_devis, data.historique_acomptes);
  let footerText = '';
  if (entierementPaye) {
    footerText = `FACTURE PAYÉE — Solde reçu le ${formatDate(data.date_emission)}`;
  } else if (data.acompte_est_solde) {
    footerText = `FACTURE SOLDE — Reçu le ${formatDate(data.date_emission)}`;
  } else {
    footerText = `FACTURE ACOMPTE N°${data.acompte_numero}/3 — Reçue le ${formatDate(data.date_emission)}`;
  }

  doc.text(footerText, pageW / 2, footerY, { align: 'center' });

  // Mentions légales sous le footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textMuted);
  doc.text('TVA non applicable — Article 293B du CGI (Export DOM-TOM)', pageW / 2, footerY + 5, { align: 'center' });

  return doc.output('blob');
}

function formatMontant(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}
