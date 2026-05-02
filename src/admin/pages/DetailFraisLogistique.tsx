import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { doc, getDoc } from 'firebase/firestore';
import { adminDb as db } from '../../lib/firebase';
import { Card, Button, Pill, InfoRow } from '../components/Icons';

export default function DetailFraisLogistique() {
  const [, params] = useRoute('/admin/frais/:id');
  const [, setLocation] = useLocation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      // Try logistics_invoices first, fallback to conteneurs (V52 CP C)
      let snap = await getDoc(doc(db, 'logistics_invoices', params.id));
      if (!snap.exists()) snap = await getDoc(doc(db, 'conteneurs', params.id));
      if (snap.exists()) setData({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    load();
  }, [params?.id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  if (!data) return <div className="alert rd">Facture logistique non trouvée</div>;

  return (
    <>
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div className="ct" style={{ fontSize: 18, color: 'var(--tl)' }}>FM-{data.numero || data.id}</div>
        <Button variant="out" onClick={() => setLocation('/admin/frais')}>← Retour</Button>
      </div>

      <Card title="Facture logistique">
        <div style={{ padding: 16 }}>
          <InfoRow label="N° FM" value={<strong>FM-{data.numero || data.id}</strong>} />
          <InfoRow label="Conteneur" value={
            <a onClick={() => setLocation(`/admin/conteneurs/${data.id}`)} style={{ color: 'var(--bl)', cursor: 'pointer' }}>
              {data.numero || data.id}
            </a>
          } />
          <InfoRow label="Client" value={data.client_nom || '—'} />
          <InfoRow label="Destination" value={<Pill variant="tl">{data.destination || '—'}</Pill>} />
          <InfoRow label="Statut" value={<Pill variant={data.statut_frais === 'payee' ? 'gr' : 'or'}>{data.statut_frais || 'En attente'}</Pill>} />
        </div>
      </Card>

      <Card title="Informations conteneur">
        <div style={{ padding: 16, background: 'var(--tl-bg, #E0F2F1)', borderRadius: 8, margin: 12 }}>
          <InfoRow label="Type" value={data.type || '40HC'} />
          <InfoRow label="Port chargement" value={data.port_chargement || '—'} />
          <InfoRow label="Port destination" value={data.port_destination || '—'} />
        </div>
      </Card>
    </>
  );
}
