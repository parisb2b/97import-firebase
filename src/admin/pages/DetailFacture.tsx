import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, Button, Pill, InfoRow, IconButton, FileIcon, DownloadIcon } from '../components/Icons';
import { generateDevis, generateFactureAcompte, generateFactureFinale, downloadPDF } from '../../lib/pdf-generator';

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
    const pdfDoc = inv.type === 'acompte'
      ? generateFactureAcompte(quoteData, { montant: inv.montant, numero: inv.numero, createdAt: inv.createdAt }, emetteurData)
      : generateFactureFinale(quoteData, inv.numero, emetteurData);
    downloadPDF(pdfDoc, `${inv.numero}.pdf`);
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
