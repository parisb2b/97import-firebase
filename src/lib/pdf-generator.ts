import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============ TYPES (conservés pour rétrocompatibilité) ============
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

// ============ HELPERS ============

/**
 * Formatage sécurisé des dates (Firestore Timestamp ou String ISO)
 */
export function formatDateSafe(v: any): string {
  if (!v) return new Date().toLocaleDateString('fr-FR');
  try {
    if (v.toDate) return v.toDate().toLocaleDateString('fr-FR');
    if (v.seconds) return new Date(v.seconds * 1000).toLocaleDateString('fr-FR');
    if (v._seconds) return new Date(v._seconds * 1000).toLocaleDateString('fr-FR');
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date().toLocaleDateString('fr-FR') : d.toLocaleDateString('fr-FR');
  } catch (e) { return new Date().toLocaleDateString('fr-FR'); }
}

/**
 * Mappage des lignes : Priorité absolue au prix VIP négocié
 */
export function mapLignesToItems(lignes: any[], prixNegocies?: Record<string, number>, isVip?: boolean) {
  return (lignes || []).map((l: any) => {
    const ref = (l.ref || l.reference || '').trim();
    const publicPrice = Number(l.prix_unitaire) || 0;
    let finalPrice = publicPrice;

    if (isVip && prixNegocies && prixNegocies[ref] !== undefined) {
      finalPrice = Number(prixNegocies[ref]);
    }

    return {
      ref,
      qt: Number(l.qte) || 1,
      desc: l.nom_fr || l.description || ref,
      publicPrice,
      vipPrice: finalPrice,
      total: finalPrice * (Number(l.qte) || 1)
    };
  });
}

/**
 * V133 — Logique de nomenclature des documents
 */
function formatDocNumber(numero: string, type: string, isVip: boolean): string {
  const baseNumber = numero.replace(/^[A-Z-]+/, '');

  switch (type) {
    case 'DEVIS':
      return isVip ? `DV-${baseNumber}-VIP` : `DV-${baseNumber}`;
    case 'COMMANDE':
      return `DC-${baseNumber}`;
    case 'FACTURE_ACOMPTE':
      return `FAC-${baseNumber}`;
    case 'FACTURE_FINALE':
      return `FA-${baseNumber}`;
    case 'AVOIR':
      return `AF-${baseNumber}`;
    case 'NOTE_COMMISSION':
      return `NC-${baseNumber}`;
    case 'LOGISTIQUE':
      return `FL-${baseNumber}`;
    case 'ACHAT':
      return `AI-${baseNumber}`;
    case 'LIVRAISON':
      return `BL-${baseNumber}`;
    default:
      return numero;
  }
}

/**
 * Moteur de génération de document PDF générique
 */
const generateDocument = (devis: any, type: string, title: string) => {
  const doc = new jsPDF();
  const isVip = devis.is_vip === true;
  const items = mapLignesToItems(devis.lignes, devis.prix_negocies, isVip);
  const formattedNumber = formatDocNumber(devis.numero, type, isVip);

  // En-tête
  doc.setFontSize(22);
  doc.setTextColor(isVip && type === 'DEVIS' ? 120 : 0, isVip && type === 'DEVIS' ? 80 : 0, isVip && type === 'DEVIS' ? 200 : 0);
  doc.text(isVip && type === 'DEVIS' ? "DEVIS VIP" : title, 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`N° ${formattedNumber}`, 20, 30);
  doc.text(`Date : ${formatDateSafe(devis.date || devis.createdAt)}`, 20, 35);

  // Tableau des articles
  autoTable(doc, {
    startY: 50,
    head: [['RÉF', 'QT', 'DÉSIGNATION', 'PRIX UNIT.', 'TOTAL HT']],
    body: items.map(i => [
      i.ref,
      i.qt,
      i.desc,
      `${(isVip ? i.vipPrice : i.publicPrice).toLocaleString('fr-FR')} €`,
      `${i.total.toLocaleString('fr-FR')} €`
    ]),
    headStyles: { fillColor: [200, 200, 200], textColor: [50, 50, 50], fontStyle: 'bold' },
    styles: { fontSize: 9 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalHT = items.reduce((acc: number, curr: any) => acc + curr.total, 0);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL HT : ${totalHT.toLocaleString('fr-FR')} €`, 130, finalY);

  if (isVip && type === 'DEVIS') {
    doc.setFontSize(9);
    doc.setTextColor(120, 80, 200);
    doc.text("Tarification VIP appliquée - Document en lecture seule.", 20, finalY + 15);
  }

  return doc;
};

// --- EXPORTS POUR UTILISATION DANS L'ADMIN ---
export const generateDevis = (devis: any, _emetteur?: any) => generateDocument(devis, 'DEVIS', 'DEVIS');
export const generateFactureFinale = (devis: any, _numero?: string, _emetteur?: any) => generateDocument(devis, 'FACTURE_FINALE', 'FACTURE');
export const generateFactureAcompte = (devis: any) => generateDocument(devis, 'FACTURE_ACOMPTE', 'FACTURE D\'ACOMPTE');
export const generateNoteCommission = (devis: any, _emetteur?: any) => generateDocument(devis, 'NOTE_COMMISSION', 'NOTE DE COMMISSION');
export const generateFactureLogistique = (devis: any, _fraisLignes?: any[], _emetteur?: any) => { void _fraisLignes; return generateDocument(devis, 'LOGISTIQUE', 'FACTURE LOGISTIQUE'); };
export const generateBonLivraison = (devis: any) => generateDocument(devis, 'LIVRAISON', 'BON DE LIVRAISON');

// --- DOWNLOAD PDF ---
export const downloadPDF = (doc: jsPDF, filename: string) => {
  doc.save(`${filename}.pdf`);
};

// --- API V3 ---
export function generateDocumentPDF(data: PdfData): string {
  const doc = new jsPDF('p', 'mm', 'a4');
  const devis = { ...data, lignes: data.items, prix_negocies: {}, is_vip: data.type === 'DV_VIP' };
  generateDocument(devis, 'DEVIS', 'DEVIS');
  return doc.output('bloburl') as unknown as string;
}

export function downloadDocumentPDF(data: PdfData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const devis = { ...data, lignes: data.items, prix_negocies: {}, is_vip: data.type === 'DV_VIP' };
  generateDocument(devis, 'DEVIS', 'DEVIS');
  doc.save(`${data.number}.pdf`);
}
