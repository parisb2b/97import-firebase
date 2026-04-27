import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, Button, Pill, InfoRow } from '../components/Icons';
import PromouvoirPartenaireModal from '../components/PromouvoirPartenaireModal';

export default function DetailClient() {
  const [, params] = useRoute('/admin/clients/:id');
  const [, setLocation] = useLocation();
  const [client, setClient] = useState<any>(null);
  const [devis, setDevis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPromouvoirModal, setShowPromouvoirModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      // Try profiles first, then users
      let snap = await getDoc(doc(db, 'profiles', params.id));
      if (!snap.exists()) snap = await getDoc(doc(db, 'users', params.id));
      if (snap.exists()) setClient({ id: snap.id, ...snap.data() });

      // Load client's quotes
      try {
        const q = query(collection(db, 'quotes'), where('client_id', '==', params.id));
        const qSnap = await getDocs(q);
        setDevis(qSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (_) { /* no quotes */ }

      setLoading(false);
    };
    load();
  }, [params?.id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  if (!client) return <div className="alert rd">Client non trouvé</div>;

  return (
    <>
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div className="ct" style={{ fontSize: 18 }}>{client.nom || client.displayName || client.email}</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {client.role !== 'partner' ? (
            <button
              onClick={() => setShowPromouvoirModal(true)}
              style={{
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ⭐ Promouvoir partenaire
            </button>
          ) : (
            <span style={{
              padding: '6px 12px', background: '#EDE9FE', color: '#6D28D9',
              borderRadius: 20, fontSize: 12, fontWeight: 700,
            }}>
              ✓ Partenaire actif
            </span>
          )}
          <Button variant="out" onClick={() => setLocation('/admin/clients')}>← Retour</Button>
        </div>
      </div>

      <Card title="Informations client">
        <div style={{ padding: 16 }}>
          <InfoRow label="Nom" value={<strong>{client.nom || client.displayName || '—'}</strong>} />
          <InfoRow label="Email" value={client.email || '—'} />
          <InfoRow label="Téléphone" value={client.tel || client.phone || '—'} />
          <InfoRow label="Adresse" value={client.adresse || '—'} />
          <InfoRow label="Pays" value={client.pays || 'France'} />
          <InfoRow label="Rôle" value={<Pill variant={client.role === 'vip' ? 'pu' : client.role === 'partner' ? 'tl' : 'bl'}>{client.role || 'user'}</Pill>} />
          <InfoRow label="Inscription" value={client.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} />
        </div>
      </Card>

      {showPromouvoirModal && (
        <PromouvoirPartenaireModal
          client={client}
          onClose={() => setShowPromouvoirModal(false)}
          onSuccess={() => {
            setShowPromouvoirModal(false);
            window.location.reload();
          }}
        />
      )}

      {devis.length > 0 && (
        <Card title={`Devis du client (${devis.length})`}>
          <table className="admin-table">
            <thead><tr><th>N° Devis</th><th>Date</th><th style={{textAlign:'right'}}>Montant</th><th>Statut</th></tr></thead>
            <tbody>
              {devis.map((d) => (
                <tr key={d.id} className="cl">
                  <td><a onClick={() => setLocation(`/admin/devis/${d.id}`)} style={{ color: 'var(--bl)', cursor: 'pointer', fontWeight: 700 }}>{d.numero || d.id}</a></td>
                  <td style={{ color: 'var(--tx3)' }}>{d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{(d.total_ht || 0).toLocaleString('fr-FR')} €</td>
                  <td><Pill variant={d.statut === 'accepte' ? 'gr' : d.statut === 'brouillon' ? 'or' : 'gy'}>{d.statut || '—'}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
