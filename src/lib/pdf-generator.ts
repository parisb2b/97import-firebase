import { jsPDF } from 'jspdf';

// ============ COULEURS DE RÉFÉRENCE (RGB) ============
const COLORS = {
  salmon: [200, 127, 107] as const,      // #C87F6B - titres, sections
  violet: [200, 127, 107] as const,      // salmon comme dans les templates validés
  violetLight: [240, 237, 245] as const, // #F0EDF5 - fond acompte
  gris: [102, 102, 102] as const,        // #666666 - labels
  noir: [51, 51, 51] as const,           // #333333 - valeurs
  blanc: [255, 255, 255] as const,       // #FFFFFF
  grisClair: [245, 245, 245] as const,   // #F5F5F5 - lignes alternées
  grisBordure: [204, 204, 204] as const, // #CCCCCC - bordures
};

// ============ HELPER : Émetteur par défaut ============
function getEmetteur(emetteur?: any) {
  return {
    nom: emetteur?.nom || 'LUXENT LIMITED',
    adresse: emetteur?.adresse || '2ND FLOOR COLLEGE HOUSE, 17 KING EDWARDS ROAD',
    ville: emetteur?.ville || 'RUISLIP HA4 7AE — LONDON',
    pays: emetteur?.pays || 'UNITED KINGDOM',
    company_number: emetteur?.company_number || '14852122',
    email: emetteur?.email || 'luxent@ltd-uk.eu',
    tel_cn: emetteur?.tel_cn || '+86 135 6627 1902',
    tel_fr: emetteur?.tel_fr || '+33 620 607 448',
    iban: emetteur?.iban || 'DE76 2022 0800 0059 5688 30',
    swift: emetteur?.swift || 'SXPYDEHH',
    banque: emetteur?.banque || 'Banking Circle S.A.',
  };
}

// ============ HELPER : Header commun ============
function drawHeader(doc: jsPDF, title: string, numero: string, date: string) {
  // Titre
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.salmon);
  doc.text(title, 105, 25, { align: 'center' });

  // Numéro et date
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.gris);
  doc.text(`N° ${numero}`, 20, 35);
  doc.text(`Date : ${date}`, 190, 35, { align: 'right' });

  // Ligne séparatrice
  doc.setDrawColor(...COLORS.salmon);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);
}

// ============ HELPER : Bloc émetteur/destinataire ============
function drawParties(doc: jsPDF, emetteur: any, destinataire: any, startY: number) {
  const y = startY;

  // ÉMETTEUR (gauche)
  doc.setFillColor(...COLORS.violetLight);
  doc.rect(20, y, 80, 8, 'F');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.salmon);
  doc.setFont('helvetica', 'bold');
  doc.text('Émetteur', 25, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.noir);
  doc.setFontSize(9);
  let ey = y + 14;
  doc.setFont('helvetica', 'bold');
  doc.text(emetteur.nom, 25, ey); ey += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(emetteur.adresse, 25, ey); ey += 4;
  doc.text(emetteur.ville, 25, ey); ey += 4;
  doc.text(emetteur.pays, 25, ey); ey += 4;
  doc.setTextColor(...COLORS.gris);
  doc.text(`N° entreprise: ${emetteur.company_number}`, 25, ey); ey += 4;
  doc.text(`Email: ${emetteur.email}`, 25, ey);

  // DESTINATAIRE (droite)
  doc.setFillColor(...COLORS.violetLight);
  doc.rect(110, y, 80, 8, 'F');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.salmon);
  doc.setFont('helvetica', 'bold');
  doc.text('Destinataire', 115, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.noir);
  doc.setFontSize(9);
  let dy = y + 14;
  doc.setFont('helvetica', 'bold');
  doc.text(destinataire.nom || 'Client', 115, dy); dy += 5;
  doc.setFont('helvetica', 'normal');
  if (destinataire.adresse) { doc.text(destinataire.adresse, 115, dy); dy += 4; }
  if (destinataire.pays) { doc.text(`Pays: ${destinataire.pays}`, 115, dy); dy += 4; }
  if (destinataire.email) { doc.text(`Email: ${destinataire.email}`, 115, dy); dy += 4; }
  if (destinataire.tel) { doc.text(`Tel: ${destinataire.tel}`, 115, dy); }

  return ey + 10;
}

// ============ HELPER : Bloc bancaire ============
function drawBankInfo(doc: jsPDF, emetteur: any, startY: number) {
  let y = startY;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gris);
  doc.text('Account Name: ' + emetteur.nom, 25, y); y += 4;
  doc.text('IBAN: ' + emetteur.iban, 25, y); y += 4;
  doc.text('SWIFT: ' + emetteur.swift + ' | Bank: ' + emetteur.banque, 25, y);
  return y + 8;
}

// ============ HELPER : Tableau produits ============
function drawProductTable(doc: jsPDF, lignes: any[], startY: number) {
  let y = startY;

  // Header violet
  doc.setFillColor(...COLORS.violet);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.blanc);
  doc.setFont('helvetica', 'bold');
  doc.text('Type', 25, y + 6);
  doc.text('Description', 50, y + 6);
  doc.text('Prix HT', 125, y + 6);
  doc.text('Qté', 150, y + 6);
  doc.text('Total HT', 165, y + 6);
  y += 8;

  // Lignes
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.noir);
  (lignes || []).forEach((ligne, i) => {
    // Fond alterné
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.grisClair);
      doc.rect(20, y, 170, 7, 'F');
    }
    // Bordure basse
    doc.setDrawColor(...COLORS.grisBordure);
    doc.line(20, y + 7, 190, y + 7);

    doc.setFontSize(8);
    doc.text('Produit', 25, y + 5);
    doc.text((ligne.nom_fr || ligne.ref || '').substring(0, 35), 50, y + 5);
    doc.text(formatEUR(ligne.prix_unitaire), 125, y + 5);
    doc.text(String(ligne.qte || 1), 150, y + 5);
    doc.text(formatEUR(ligne.total || ligne.prix_unitaire * (ligne.qte || 1)), 165, y + 5);
    y += 7;
  });

  return y;
}

// ============ HELPER : Totaux ============
function drawTotals(doc: jsPDF, quote: any, startY: number) {
  let y = startY + 5;

  // TVA
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gris);
  doc.text('TVA non applicable, art. 293 B du CGI', 105, y, { align: 'center' });
  y += 8;

  // Box total
  doc.setFillColor(...COLORS.violetLight);
  doc.rect(120, y, 70, 10, 'F');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.salmon);
  doc.setFont('helvetica', 'bold');
  doc.text('Total', 125, y + 7);
  doc.text(formatEUR(quote.total_ht), 185, y + 7, { align: 'right' });

  return y + 15;
}

// ============ HELPER : Footer devis ============
function drawDevisFooter(doc: jsPDF, numero: string, startY: number) {
  let y = startY;

  // Conditions
  doc.setDrawColor(...COLORS.grisBordure);
  doc.line(20, y, 190, y);
  y += 6;

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gris);
  doc.setFont('helvetica', 'bold');
  doc.text('Conditions', 25, y);
  doc.text('Acceptation du client', 120, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.text('Règlement: À réception', 25, y);
  doc.text('A _______, le __/__/__', 120, y);
  y += 4;
  doc.text('Mode: Virement bancaire', 25, y);
  doc.text('Signature', 120, y);
  y += 4;
  doc.text('Nom et qualité', 120, y);

  // Pied de page
  y = 285;
  doc.setDrawColor(...COLORS.salmon);
  doc.line(20, y, 190, y);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gris);
  doc.text(`Devis ${numero}`, 25, y + 4);
  doc.text('Page 1 sur 1', 185, y + 4, { align: 'right' });
}

// ============ FORMAT HELPERS ============
function formatEUR(amount: number | undefined) {
  if (!amount && amount !== 0) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(date: any) {
  if (!date) return new Date().toLocaleDateString('fr-FR');
  if (date.toDate) return date.toDate().toLocaleDateString('fr-FR');
  if (date instanceof Date) return date.toLocaleDateString('fr-FR');
  return String(date);
}

// ============================================================
// FONCTION PRINCIPALE : GÉNÉRER DEVIS PDF
// ============================================================
export function generateDevis(quote: any, emetteur?: any) {
  const doc = new jsPDF();
  const em = getEmetteur(emetteur);
  const date = formatDate(quote.createdAt);

  // Header
  drawHeader(doc, 'Devis', quote.numero || quote.id, date);

  // Émetteur / Destinataire
  let y = drawParties(doc, em, {
    nom: quote.client_nom,
    adresse: quote.client_adresse,
    pays: 'France',
    email: quote.client_email,
    tel: quote.client_tel,
  }, 42);

  // Info bancaire
  y = drawBankInfo(doc, em, y);

  // Tableau produits
  y = drawProductTable(doc, quote.lignes || [], y + 5);

  // Totaux
  y = drawTotals(doc, quote, y);

  // Footer devis
  drawDevisFooter(doc, quote.numero || quote.id, y + 10);

  return doc;
}

// ============================================================
// FONCTION : GÉNÉRER FACTURE ACOMPTE PDF
// ============================================================
export function generateFactureAcompte(quote: any, acompte: any, emetteur?: any) {
  const doc = new jsPDF();
  const em = getEmetteur(emetteur);
  const numero = acompte?.numero || 'FA-' + (quote.numero || '').replace('DVS-', '');
  const date = formatDate(acompte?.createdAt || quote.createdAt);

  // Header
  drawHeader(doc, "Facture d'Acompte", numero, date);

  // Émetteur / Destinataire
  let y = drawParties(doc, em, {
    nom: quote.client_nom,
    adresse: quote.client_adresse,
    pays: 'France',
    email: quote.client_email,
    tel: quote.client_tel,
  }, 42);

  // Info bancaire
  y = drawBankInfo(doc, em, y);

  // Référence devis
  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.gris);
  doc.text(`Référence devis : ${quote.numero || quote.id}`, 25, y);
  y += 8;

  // Montant acompte
  doc.setFillColor(...COLORS.violetLight);
  doc.rect(20, y, 170, 30, 'F');

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.noir);
  doc.text('Total devis HT :', 30, y + 8);
  doc.text(formatEUR(quote.total_ht), 180, y + 8, { align: 'right' });

  doc.text(`Acompte (${quote.acompte_pct || 30}%) :`, 30, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.salmon);
  doc.text(formatEUR(acompte?.montant || quote.total_encaisse), 180, y + 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.noir);
  doc.text('Solde restant :', 30, y + 24);
  doc.text(formatEUR(quote.solde_restant), 180, y + 24, { align: 'right' });

  y += 35;

  // TVA
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gris);
  doc.text('TVA non applicable, art. 293 B du CGI', 105, y, { align: 'center' });

  // Footer
  y = 285;
  doc.setDrawColor(...COLORS.salmon);
  doc.line(20, y, 190, y);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gris);
  doc.text(`Facture ${numero}`, 25, y + 4);
  doc.text('Page 1 sur 1', 185, y + 4, { align: 'right' });

  return doc;
}

// ============================================================
// FONCTION : GÉNÉRER FACTURE FINALE PDF
// ============================================================
export function generateFactureFinale(quote: any, numero: string, emetteur?: any) {
  const doc = new jsPDF();
  const em = getEmetteur(emetteur);
  const date = formatDate(new Date());

  // Header
  drawHeader(doc, 'Facture', numero, date);

  // Champ "Votre contact"
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gris);
  doc.text('Votre contact :', 20, 40);
  doc.setTextColor(...COLORS.noir);
  doc.text(em.email + ' | ' + em.tel_fr, 55, 40);

  // Émetteur / Destinataire
  let y = drawParties(doc, em, {
    nom: quote.client_nom,
    adresse: quote.client_adresse,
    pays: 'France',
    email: quote.client_email,
    tel: quote.client_tel,
  }, 45);

  // Info bancaire
  y = drawBankInfo(doc, em, y);

  // Tableau produits
  y = drawProductTable(doc, quote.lignes || [], y + 5);

  // Totaux
  y = drawTotals(doc, quote, y);

  // Mention TVA
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gris);
  doc.text('TVA non applicable, art. 293 B du CGI', 105, y, { align: 'center' });

  // Footer
  y = 285;
  doc.setDrawColor(...COLORS.salmon);
  doc.line(20, y, 190, y);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gris);
  doc.text(`Facture ${numero}`, 25, y + 4);
  doc.text('Page 1 sur 1', 185, y + 4, { align: 'right' });

  return doc;
}

// ============================================================
// FONCTION : GÉNÉRER NOTE DE COMMISSION PDF
// ============================================================
export function generateNoteCommission(note: any, emetteur?: any) {
  const doc = new jsPDF();
  const em = getEmetteur(emetteur);
  const date = formatDate(note.createdAt);

  // Header
  drawHeader(doc, 'Note de Commission', note.numero || note.id, date);

  // Info partenaire
  let y = 45;
  doc.setFillColor(...COLORS.violetLight);
  doc.rect(20, y, 170, 12, 'F');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.salmon);
  doc.setFont('helvetica', 'bold');
  doc.text('Partenaire', 25, y + 5);
  doc.setTextColor(...COLORS.noir);
  doc.text(note.partenaire_nom || 'Partenaire', 25, y + 10);
  doc.setFont('helvetica', 'normal');
  y += 18;

  // Tableau commissions
  // Header
  doc.setFillColor(...COLORS.violet);
  doc.rect(20, y, 170, 8, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.blanc);
  doc.setFont('helvetica', 'bold');
  doc.text('Devis', 25, y + 6);
  doc.text('Client', 60, y + 6);
  doc.text('Montant HT', 105, y + 6);
  doc.text('Taux', 140, y + 6);
  doc.text('Commission', 165, y + 6);
  y += 8;

  // Lignes
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.noir);
  doc.setFontSize(8);
  (note.lignes || []).forEach((ligne: any, i: number) => {
    if (i % 2 === 0) {
      doc.setFillColor(...COLORS.grisClair);
      doc.rect(20, y, 170, 7, 'F');
    }
    doc.setDrawColor(...COLORS.grisBordure);
    doc.line(20, y + 7, 190, y + 7);

    doc.text(ligne.quote_id || '', 25, y + 5);
    doc.text((ligne.client || '').substring(0, 20), 60, y + 5);
    doc.text(formatEUR(ligne.montant_ht), 105, y + 5);
    doc.text(`${ligne.taux || 0}%`, 140, y + 5);
    doc.text(formatEUR(ligne.commission), 165, y + 5);
    y += 7;
  });

  // Total commission
  y += 5;
  doc.setFillColor(...COLORS.violetLight);
  doc.rect(120, y, 70, 10, 'F');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.salmon);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Commission', 125, y + 7);
  doc.text(formatEUR(note.total_commission), 185, y + 7, { align: 'right' });

  // Bank info
  y += 20;
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gris);
  doc.text('Paiement à effectuer sur :', 25, y);
  doc.text('IBAN: ' + em.iban, 25, y + 4);
  doc.text('SWIFT: ' + em.swift + ' | Bank: ' + em.banque, 25, y + 8);

  // Footer
  y = 285;
  doc.setDrawColor(...COLORS.salmon);
  doc.line(20, y, 190, y);
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gris);
  doc.text(`Note de commission ${note.numero || note.id}`, 25, y + 4);
  doc.text('Page 1 sur 1', 185, y + 4, { align: 'right' });

  return doc;
}

// ============================================================
// HELPER : Télécharger le PDF
// ============================================================
export function downloadPDF(doc: jsPDF, filename: string) {
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
