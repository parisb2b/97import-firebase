import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { adminDb as db } from '../../lib/firebase';
import { Card, Button, Pill, Kpi, InfoRow } from '../components/Icons';

export default function DetailPartenaire() {
  const [, params] = useRoute('/admin/partenaires/:id');
  const [, setLocation] = useLocation();
  const [partner, setPartner] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!params?.id) return;
      const snap = await getDoc(doc(db, 'partners', params.id));
      if (snap.exists()) setPartner({ id: snap.id, ...snap.data() });

      try {
        const q = query(collection(db, 'commissions'), where('partenaire_id', '==', params.id));
        const cSnap = await getDocs(q);
        setCommissions(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (_) { /* no commissions */ }

      setLoading(false);
    };
    load();
  }, [params?.id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  if (!partner) return <div className="alert rd">Partenaire non trouvé</div>;

  const totalDues = commissions.filter(c => c.statut !== 'payee').reduce((s, c) => s + (c.total_commission || 0), 0);
  const totalPayees = commissions.filter(c => c.statut === 'payee').reduce((s, c) => s + (c.total_commission || 0), 0);

  return (
    <>
      <div className="filters" style={{ justifyContent: 'space-between' }}>
        <div className="ct" style={{ fontSize: 18, color: 'var(--pu)' }}>{partner.nom} <Pill variant="pu">{partner.code}</Pill></div>
        <Button variant="out" onClick={() => setLocation('/admin/partenaires')}>← Retour</Button>
      </div>

      <div className="kgrid">
        <Kpi label="Total dues" value={`${totalDues.toLocaleString('fr-FR')}€`} color="or" />
        <Kpi label="Total payées" value={`${totalPayees.toLocaleString('fr-FR')}€`} color="gr" />
        {(() => {
          const uniqueClients = new Set(
            commissions
              .map(c => c.client_nom || c.client_id)
              .filter(Boolean)
          ).size;
          return <Kpi label="Clients apportés" value={uniqueClients} color="pu" />;
        })()}
      </div>

      <Card title="Informations partenaire">
        <div style={{ padding: 16 }}>
          <InfoRow label="Nom" value={<strong>{partner.nom}</strong>} />
          <InfoRow label="Code" value={<Pill variant="pu">{partner.code}</Pill>} />
          <InfoRow label="Email" value={partner.email || '—'} />
          <InfoRow label="Téléphone" value={partner.tel || '—'} />
          <InfoRow label="Actif" value={<Pill variant={partner.actif ? 'gr' : 'rd'}>{partner.actif ? 'Actif' : 'Inactif'}</Pill>} />
        </div>
      </Card>

      {commissions.length > 0 && (
        <Card title={`Commissions (${commissions.length})`}>
          <table className="admin-table">
            <thead><tr><th>N° NC</th><th>Client</th><th>Devis</th><th style={{textAlign:'right'}}>Commission</th><th>Statut</th></tr></thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="cl">
                  <td><a onClick={() => setLocation(`/admin/commissions/${c.id}`)} style={{ color: 'var(--bl)', cursor: 'pointer', fontWeight: 700 }}>{c.numero}</a></td>
                  <td>{c.client_nom || '—'}</td>
                  <td style={{ color: 'var(--tx3)' }}>{c.quote_id || '—'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--pu)' }}>{(c.total_commission || 0).toLocaleString('fr-FR')} €</td>
                  <td><Pill variant={c.statut === 'payee' ? 'gr' : 'or'}>{c.statut === 'payee' ? 'Payée' : 'En attente'}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
