import jsPDF from 'jspdf';

// Couleurs
const SALMON = '#C87F6B';
const SALMON_LIGHT = '#FBF0ED';
const BORDER = '#E5E5E5';
const NAVY = '#1E3A5F';

interface Emetteur {
  nom: string;
  adresse: string;
  ville: string;
  pays: string;
  company_number: string;
  email: string;
  tel_cn: string;
  tel_fr: string;
  iban: string;
  swift: string;
  banque: string;
}

interface LigneDevis {
  ref: string;
  nom_fr: string;
  qte: number;
  prix_unitaire: number;
  total: number;
}

interface Devis {
  numero: string;
  client_nom: string;
  client_email: string;
  client_tel: string;
  client_adresse: string;
  client_siret: string;
  lignes: LigneDevis[];
  total_ht: number;
  acompte_pct: number;
  destination: string;
  createdAt: any;
}

const DEFAULT_EMETTEUR: Emetteur = {
  nom: 'LUXENT LIMITED',
  adresse: '2ND FLOOR COLLEGE HOUSE, 17 KING EDWARDS ROAD',
  ville: 'RUISLIP HA4 7AE — LONDON',
  pays: 'UNITED KINGDOM',
  company_number: '14852122',
  email: 'luxent@ltd-uk.eu',
  tel_cn: '+86 135 6627 1902',
  tel_fr: '+33 620 607 448',
  iban: 'DE76 2022 0800 0059 5688 30',
  swift: 'SXPYDEHH',
  banque: 'Banking Circle S.A.',
};

// Générer un devis PDF
export const generateDevis = (quote: Devis, emetteur: Emetteur = DEFAULT_EMETTEUR): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Logo placeholder (à remplacer par image base64)
  doc.setFontSize(24);
  doc.setTextColor(NAVY);
  doc.text('LUXENT', pageWidth - 50, y);

  // Titre
  doc.setFontSize(20);
  doc.setTextColor(SALMON);
  doc.text('DEVIS', 20, y);

  y += 10;
  doc.setFontSize(12);
  doc.setTextColor('#333333');
  doc.text(quote.numero, 20, y);

  y += 15;

  // Emetteur
  doc.setFontSize(10);
  doc.setTextColor('#666666');
  doc.text(emetteur.nom, 20, y);
  doc.text(emetteur.adresse, 20, y + 5);
  doc.text(`${emetteur.ville} — ${emetteur.pays}`, 20, y + 10);
  doc.text(`Company N° ${emetteur.company_number}`, 20, y + 15);
  doc.text(`Email: ${emetteur.email}`, 20, y + 20);
  doc.text(`Tél FR: ${emetteur.tel_fr} | CN: ${emetteur.tel_cn}`, 20, y + 25);

  // Destinataire
  doc.text('DESTINATAIRE', pageWidth - 80, y);
  doc.setTextColor('#333333');
  doc.text(quote.client_nom || '-', pageWidth - 80, y + 7);
  doc.text(quote.client_email || '', pageWidth - 80, y + 12);
  doc.text(quote.client_tel || '', pageWidth - 80, y + 17);
  if (quote.client_siret) {
    doc.text(`SIRET: ${quote.client_siret}`, pageWidth - 80, y + 22);
  }

  y += 45;

  // Tableau
  const tableTop = y;
  const colWidths = [25, 75, 20, 30, 30];
  const headers = ['Réf', 'Désignation', 'Qté', 'PU HT', 'Total HT'];

  // En-tête tableau
  doc.setFillColor(SALMON_LIGHT);
  doc.rect(20, tableTop, 170, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(SALMON);
  let x = 22;
  headers.forEach((h, i) => {
    doc.text(h, x, tableTop + 5.5);
    x += colWidths[i];
  });

  y = tableTop + 12;

  // Lignes
  doc.setTextColor('#333333');
  quote.lignes.forEach((ligne) => {
    x = 22;
    doc.text(ligne.ref?.substring(0, 12) || '', x, y);
    x += colWidths[0];
    doc.text(ligne.nom_fr?.substring(0, 40) || '', x, y);
    x += colWidths[1];
    doc.text(String(ligne.qte), x, y);
    x += colWidths[2];
    doc.text(`${ligne.prix_unitaire?.toLocaleString('fr-FR')} €`, x, y);
    x += colWidths[3];
    doc.text(`${ligne.total?.toLocaleString('fr-FR')} €`, x, y);
    y += 7;
  });

  // Total
  y += 5;
  doc.setDrawColor(BORDER);
  doc.line(20, y, 190, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(NAVY);
  doc.text('Total HT', 130, y);
  doc.text(`${quote.total_ht?.toLocaleString('fr-FR')} €`, 170, y);

  y += 10;
  doc.setTextColor(SALMON);
  doc.text(`Acompte demandé (${quote.acompte_pct}%)`, 130, y);
  doc.text(`${(quote.total_ht * quote.acompte_pct / 100)?.toLocaleString('fr-FR')} €`, 170, y);

  // Pied de page
  y += 25;
  doc.setFontSize(9);
  doc.setTextColor('#666666');
  doc.text('Validité du devis : 30 jours', 20, y);
  doc.text(`Destination : ${quote.destination}`, 20, y + 5);

  y += 15;
  doc.text('Coordonnées bancaires :', 20, y);
  doc.text(`IBAN: ${emetteur.iban}`, 20, y + 5);
  doc.text(`SWIFT/BIC: ${emetteur.swift} — ${emetteur.banque}`, 20, y + 10);

  return doc;
};

// Générer une facture d'acompte
export const generateFactureAcompte = (
  quote: Devis,
  acompte: { montant: number; ref_fa: string; date: string },
  emetteur: Emetteur = DEFAULT_EMETTEUR
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(24);
  doc.setTextColor(NAVY);
  doc.text('LUXENT', pageWidth - 50, y);

  doc.setFontSize(20);
  doc.setTextColor(SALMON);
  doc.text('FACTURE D\'ACOMPTE', 20, y);

  y += 10;
  doc.setFontSize(12);
  doc.setTextColor('#333333');
  doc.text(acompte.ref_fa, 20, y);
  doc.text(`Date: ${new Date(acompte.date).toLocaleDateString('fr-FR')}`, 100, y);

  y += 20;

  // Emetteur/Destinataire (même layout que devis)
  doc.setFontSize(10);
  doc.setTextColor('#666666');
  doc.text(emetteur.nom, 20, y);
  doc.text(emetteur.adresse, 20, y + 5);
  doc.text(`${emetteur.ville} — ${emetteur.pays}`, 20, y + 10);

  doc.text(quote.client_nom || '-', pageWidth - 80, y);
  doc.text(quote.client_email || '', pageWidth - 80, y + 5);

  y += 35;

  // Référence devis
  doc.setTextColor('#333333');
  doc.text(`Devis de référence : ${quote.numero}`, 20, y);
  doc.text(`Montant total du devis : ${quote.total_ht?.toLocaleString('fr-FR')} €`, 20, y + 7);

  y += 25;

  // Montant acompte
  doc.setFillColor(SALMON_LIGHT);
  doc.rect(20, y, 170, 25, 'F');
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(NAVY);
  doc.text('Montant de l\'acompte', 30, y);
  doc.setFontSize(16);
  doc.text(`${acompte.montant.toLocaleString('fr-FR')} €`, 150, y);

  y += 10;
  doc.setFontSize(10);
  doc.setTextColor('#666666');
  const solde = quote.total_ht - acompte.montant;
  doc.text(`Solde restant dû : ${solde.toLocaleString('fr-FR')} €`, 30, y);

  // Coordonnées bancaires
  y += 30;
  doc.setTextColor('#666666');
  doc.text('Paiement reçu sur :', 20, y);
  doc.text(`IBAN: ${emetteur.iban}`, 20, y + 5);
  doc.text(`SWIFT/BIC: ${emetteur.swift} — ${emetteur.banque}`, 20, y + 10);

  return doc;
};

// Générer une facture finale
export const generateFactureFinale = (
  quote: Devis,
  numero: string,
  emetteur: Emetteur = DEFAULT_EMETTEUR
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(24);
  doc.setTextColor(NAVY);
  doc.text('LUXENT', pageWidth - 50, y);

  doc.setFontSize(20);
  doc.setTextColor(SALMON);
  doc.text('FACTURE', 20, y);

  y += 10;
  doc.setFontSize(12);
  doc.setTextColor('#333333');
  doc.text(numero, 20, y);

  y += 20;

  // En-têtes
  doc.setFontSize(10);
  doc.setTextColor('#666666');
  doc.text(emetteur.nom, 20, y);
  doc.text(emetteur.adresse, 20, y + 5);
  doc.text(`${emetteur.ville} — ${emetteur.pays}`, 20, y + 10);

  doc.text(quote.client_nom || '-', pageWidth - 80, y);
  doc.text(quote.client_email || '', pageWidth - 80, y + 5);
  if (quote.client_siret) {
    doc.text(`SIRET: ${quote.client_siret}`, pageWidth - 80, y + 10);
  }

  y += 35;

  // Tableau des lignes (même que devis)
  const tableTop = y;
  const colWidths = [25, 75, 20, 30, 30];
  const headers = ['Réf', 'Désignation', 'Qté', 'PU HT', 'Total HT'];

  doc.setFillColor(SALMON_LIGHT);
  doc.rect(20, tableTop, 170, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(SALMON);
  let x = 22;
  headers.forEach((h, i) => {
    doc.text(h, x, tableTop + 5.5);
    x += colWidths[i];
  });

  y = tableTop + 12;
  doc.setTextColor('#333333');
  quote.lignes.forEach((ligne) => {
    x = 22;
    doc.text(ligne.ref?.substring(0, 12) || '', x, y);
    x += colWidths[0];
    doc.text(ligne.nom_fr?.substring(0, 40) || '', x, y);
    x += colWidths[1];
    doc.text(String(ligne.qte), x, y);
    x += colWidths[2];
    doc.text(`${ligne.prix_unitaire?.toLocaleString('fr-FR')} €`, x, y);
    x += colWidths[3];
    doc.text(`${ligne.total?.toLocaleString('fr-FR')} €`, x, y);
    y += 7;
  });

  y += 10;
  doc.setDrawColor(BORDER);
  doc.line(20, y, 190, y);
  y += 8;

  // Totaux
  doc.setFontSize(10);
  doc.text('Total HT', 130, y);
  doc.text(`${quote.total_ht?.toLocaleString('fr-FR')} €`, 170, y);

  // Mention TVA non applicable
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor('#666666');
  doc.text('TVA non applicable — article 259B du CGI', 20, y);

  return doc;
};

// Download helper
export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};
