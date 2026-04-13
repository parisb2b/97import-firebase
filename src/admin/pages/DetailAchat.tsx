import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, Button, Pill, InfoRow } from '../components/Icons';

export default function DetailAchat() {
  const [, params] = useRoute('/admin/achats/:id');
  const [, setLocation] = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      const snap = await getDoc(doc(db, 'purchase_lists', params.id));
      if (snap.exists()) setData({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    load();
  }, [params?.id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  if (!data) return <div className="alert rd">Liste d'achat non trouvée</div>;

  return (
    <>
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div className="ct" style={{ fontSize: 18 }}>{data.reference || data.id}</div>
        <Button variant="out" onClick={() => setLocation('/admin/achats')}>← Retour</Button>
      </div>

      <Card title="Liste d'achat">
        <div style={{ padding: 16 }}>
          <InfoRow label="Référence" value={<strong>{data.reference || data.id}</strong>} />
          <InfoRow label="Date" value={data.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} />
          <InfoRow label="Statut" value={<Pill variant={data.statut === 'complete' ? 'gr' : 'or'}>{data.statut || 'En cours'}</Pill>} />
          <InfoRow label="Conteneur lié" value={data.conteneur_id || '—'} />
        </div>
      </Card>

      {data.lignes && data.lignes.length > 0 && (
        <Card title="Produits commandés">
          <table className="admin-table">
            <thead><tr><th>Réf.</th><th>Produit FR</th><th>Produit ZH</th><th style={{textAlign:'right'}}>Qté</th><th style={{textAlign:'right'}}>Prix (¥)</th><th style={{textAlign:'right'}}>Total (¥)</th></tr></thead>
            <tbody>
              {data.lignes.map((l: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700 }}>{l.ref || '—'}</td>
                  <td>{l.nom_fr || '—'}</td>
                  <td>{l.nom_zh || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{l.qte || 0}</td>
                  <td style={{ textAlign: 'right' }}>¥{(l.prix_achat || 0).toLocaleString('fr-FR')}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>¥{((l.prix_achat || 0) * (l.qte || 0)).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
