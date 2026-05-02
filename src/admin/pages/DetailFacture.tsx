import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { adminDb as db } from '../../lib/firebase';
import { Card, Button, Pill, InfoRow, IconButton, FileIcon, DownloadIcon } from '../components/Icons';
import { generateDevis, generateFactureFinale, downloadPDF } from '../../lib/pdf-generator';
import { generateFactureAcomptePDF } from '../../lib/generateInvoiceAcompte';

export default function DetailFacture() {
  const [, params] = useRoute('/admin/factures/:id');
  const [, setLocation] = useLocation();
  const [inv, setInv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emetteurData, setEmetteurData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      const snap = await getDoc(doc(db, 'invoices', params.id));
      if (snap.exists()) setInv({ id: snap.id, ...snap.data() });
      const emSnap = await getDoc(doc(db, 'admin_params', 'emetteur'));
      if (emSnap.exists()) setEmetteurData(emSnap.data());
      setLoading(false);
    };
    load();
  }, [params?.id]);

  const handleTogglePaid = async () => {
    if (!inv) return;
    const newStatut = inv.statut === 'payee' ? 'finalisee' : 'payee';
    await updateDoc(doc(db, 'invoices', inv.id), { statut: newStatut });
    setInv({ ...inv, statut: newStatut });
  };

  const handleFacturePDF = async () => {
    if (!inv) return;
    const snap = await getDoc(doc(db, 'quotes', inv.quote_id));
    if (!snap.exists()) return;
    const quoteData = snap.data();

    if (inv.type === 'acompte') {
      // Trouver l'acompte correspondant dans le devis
      const acompte = (quoteData.acomptes || []).find((a: any) =>
        a.facture_acompte_numero === inv.numero || a.montant === inv.montant
      );

      if (!acompte) {
        alert('Acompte introuvable dans le devis');
        return;
      }

      const pdfBlob = await generateFactureAcomptePDF({
        numero: inv.numero,
        devis_numero: quoteData.numero,
        statut_devis: quoteData.statut || 'nouveau',
        date_emission: acompte.date_reception || acompte.created_at,
        acompte_numero: acompte.numero || 1,
        acompte_est_solde: acompte.is_solde || false,
        montant: acompte.montant,
        total_devis: quoteData.total_ht || quoteData.total || 0,
        client: {
          nom: quoteData.client_nom || '',
          email: quoteData.client_email || '',
          adresse: quoteData.client_adresse,
          ville: quoteData.client_ville,
          cp: quoteData.client_cp,
        },
        historique_acomptes: quoteData.acomptes || [],
        reference_virement: acompte.reference_virement,
      });

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const pdfDoc = generateFactureFinale(quoteData, inv.numero, emetteurData);
      downloadPDF(pdfDoc, `${inv.numero}.pdf`);
    }
  };

  const handleDevisPDF = async () => {
    if (!inv) return;
    const snap = await getDoc(doc(db, 'quotes', inv.quote_id));
    if (!snap.exists()) return;
    const pdfDoc = generateDevis(snap.data(), emetteurData);
    downloadPDF(pdfDoc, `${inv.quote_id}.pdf`);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  if (!inv) return <div className="alert rd">Facture non trouvée</div>;

  return (
    <>
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div className="ct" style={{ fontSize: 18 }}>{inv.numero}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="out" onClick={() => setLocation('/admin/factures')}>← Retour</Button>
          <Button variant={inv.statut === 'payee' ? 'o' : 's'} onClick={handleTogglePaid}>
            {inv.statut === 'payee' ? 'Marquer non payée' : 'Marquer payée'}
          </Button>
        </div>
      </div>

      <Card title="Informations facture">
        <div style={{ padding: 16 }}>
          <InfoRow label="N° facture" value={<strong>{inv.numero}</strong>} />
          <InfoRow label="Type" value={<Pill variant={inv.type === 'acompte' ? 'tl' : 'bl'}>{inv.type === 'acompte' ? 'Acompte' : 'Finale'}</Pill>} />
          <InfoRow label="Date" value={inv.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} />
          <InfoRow label="Statut" value={<Pill variant={inv.statut === 'payee' ? 'gr' : 'or'}>{inv.statut === 'payee' ? 'Payée' : 'Finalisée'}</Pill>} />
          <InfoRow label="Devis lié" value={
            <a onClick={() => setLocation(`/admin/devis/${inv.quote_id}`)} style={{ color: 'var(--bl)', cursor: 'pointer' }}>
              {inv.quote_id}
            </a>
          } />
          <InfoRow label="Client" value={inv.client_nom || '—'} />
          <InfoRow label="Montant" value={<strong style={{ color: 'var(--tl)' }}>{(inv.montant || 0).toLocaleString('fr-FR')} €</strong>} />
        </div>
      </Card>

      <Card title="Documents">
        <div style={{ display: 'flex', gap: 12, padding: 16 }}>
          <IconButton icon={<FileIcon />} tooltip="Devis PDF" variant="eye" size="lg" onClick={handleDevisPDF} />
          <IconButton icon={<DownloadIcon />} tooltip="Facture PDF" variant="dl" size="lg" onClick={handleFacturePDF} />
        </div>
      </Card>
    </>
  );
}
