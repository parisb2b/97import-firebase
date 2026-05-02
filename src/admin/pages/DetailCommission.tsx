import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '../../lib/firebase';
import { Card, Button, Pill, InfoRow, IconButton, DownloadIcon, SendIcon } from '../components/Icons';
import { generateNoteCommission, downloadPDF } from '../../lib/pdf-generator';
import ModalMarquerPayee from '@/admin/components/commission/ModalMarquerPayee';

export default function DetailCommission() {
  const [, params] = useRoute('/admin/commissions/:id');
  const [, setLocation] = useLocation();
  const [comm, setComm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emetteurData, setEmetteurData] = useState<any>(null);
  const [showPayeeModal, setShowPayeeModal] = useState(false);

  const loadCommission = async () => {
    if (!params?.id) return;
    const snap = await getDoc(doc(db, 'commissions', params.id));
    if (snap.exists()) setComm({ id: snap.id, ...snap.data() });
  };

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      await loadCommission();
      const emSnap = await getDoc(doc(db, 'admin_params', 'emetteur'));
      if (emSnap.exists()) setEmetteurData(emSnap.data());
      setLoading(false);
    };
    load();
  // loadCommission définie dans le composant — ajout = boucle infinie
  }, [params?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancelPaiement = async () => {
    if (!comm) return;
    if (!confirm('Annuler le marquage comme payée ?')) return;
    await updateDoc(doc(db, 'commissions', comm.id), {
      statut: 'en_attente',
      paiement: null,
      updated_at: serverTimestamp(),
    });
    await loadCommission();
  };

  const handleNCPDF = () => {
    if (!comm) return;
    const pdfDoc = generateNoteCommission(comm, emetteurData);
    downloadPDF(pdfDoc, `${comm.numero}.pdf`);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  if (!comm) return <div className="alert rd">Note de commission non trouvée</div>;

  return (
    <>
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div className="ct" style={{ fontSize: 18, color: 'var(--pu)' }}>{comm.numero}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="out" onClick={() => setLocation('/admin/commissions')}>← Retour</Button>
        </div>
      </div>

      <Card title="Note de commission">
        <div style={{ padding: 16 }}>
          <InfoRow label="N° NC" value={<strong>{comm.numero}</strong>} />
          <InfoRow label="Date" value={comm.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} />
          <InfoRow label="Statut" value={<Pill variant={comm.statut === 'payee' ? 'gr' : 'or'}>{comm.statut === 'payee' ? 'Payée' : 'En attente'}</Pill>} />
          <InfoRow label="Partenaire" value={<><Pill variant="pu">{comm.partenaire_code || '—'}</Pill> {comm.partenaire_nom}</>} />
          <InfoRow label="Total commission" value={<strong style={{ color: 'var(--pu)' }}>{(comm.total_commission || 0).toLocaleString('fr-FR')} €</strong>} />

          {comm.statut === 'payee' ? (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: '#D1FAE5',
              borderRadius: 10,
              border: '1px solid #6EE7B7',
            }}>
              <div style={{ fontWeight: 600, color: '#065F46', marginBottom: 6 }}>
                ✓ Commission payée
              </div>
              {comm.paiement && (
                <div style={{ fontSize: 13, color: '#065F46' }}>
                  {comm.paiement.date && (
                    <div>Date : {new Date(comm.paiement.date).toLocaleDateString('fr-FR')}</div>
                  )}
                  {comm.paiement.methode && (
                    <div>Méthode : {comm.paiement.methode}</div>
                  )}
                  {comm.paiement.reference && (
                    <div>Référence : {comm.paiement.reference}</div>
                  )}
                  {comm.paiement.note && (
                    <div style={{ marginTop: 6, fontStyle: 'italic' }}>
                      Note : {comm.paiement.note}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleCancelPaiement}
                style={{
                  marginTop: 10, background: 'transparent',
                  border: '1px solid #10B981', color: '#065F46',
                  padding: '6px 12px', borderRadius: 8, fontSize: 12,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Annuler paiement
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPayeeModal(true)}
              style={{
                marginTop: 16,
                padding: '10px 20px', background: '#10B981',
                color: '#fff', border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              ✓ Marquer comme payée
            </button>
          )}
        </div>
      </Card>

      {comm.lignes && comm.lignes.length > 0 && (
        <Card title="Détail des devis">
          <table className="admin-table">
            <thead><tr><th>Devis</th><th>Client</th><th style={{textAlign:'right'}}>Prix négocié</th><th style={{textAlign:'right'}}>Prix partenaire</th><th style={{textAlign:'right'}}>Commission</th></tr></thead>
            <tbody>
              {comm.lignes.map((l: any, i: number) => {
                const prixPart = (l.montant_ht || 0) - (l.commission || 0);
                return (
                  <tr key={i} className="cl">
                    <td><a onClick={() => setLocation(`/admin/devis/${l.quote_id}`)} style={{ color: 'var(--bl)', cursor: 'pointer' }}>{l.quote_id}</a></td>
                    <td>{l.client || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{(l.montant_ht || 0).toLocaleString('fr-FR')} €</td>
                    <td style={{ textAlign: 'right' }}>{prixPart.toLocaleString('fr-FR')} €</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--pu)' }}>{(l.commission || 0).toLocaleString('fr-FR')} €</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Card title="Documents">
        <div style={{ display: 'flex', gap: 12, padding: 16 }}>
          <IconButton icon={<DownloadIcon />} tooltip="NC PDF" variant="dl" size="lg" onClick={handleNCPDF} />
          <IconButton icon={<SendIcon />} tooltip="Envoyer" variant="send" size="lg" onClick={() => alert(`Envoi NC ${comm.numero}`)} />
        </div>
      </Card>

      {showPayeeModal && comm && (
        <ModalMarquerPayee
          commission={comm}
          onClose={() => setShowPayeeModal(false)}
          onSuccess={() => {
            setShowPayeeModal(false);
            loadCommission();
          }}
        />
      )}
    </>
  );
}
