import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useLocation } from 'wouter';
import { adminDb as db } from '../../lib/firebase';
import { Card, Kpi, Pill, Button, IconButton, EyeIcon } from '../components/Icons';
import LoadingState from '../components/atoms/LoadingState';

interface Partner {
  id: string;
  nom: string;
  code: string;
  email: string;
  tel: string;
  commission_taux: number;
  actif: boolean;
}

export default function Partenaires() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'partners'), orderBy('nom', 'asc'));
      const snap = await getDocs(q);
      setPartners(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Partner)));
    } catch (err) {
      console.error('Error loading partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActif = async (p: Partner) => {
    try {
      await updateDoc(doc(db, 'partners', p.id), { actif: !p.actif });
      load();
      setSuccessMsg('Statut mis à jour');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error toggling:', err);
      setErrorMsg('Erreur lors de la mise à jour du statut');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const actifs = partners.filter(p => p.actif).length;

  if (loading) return <LoadingState message="Chargement des partenaires…" />;

  return (
    <>
      {successMsg && <div className="alert gr">{successMsg}</div>}
      {errorMsg && <div className="alert rd">{errorMsg}</div>}

      <div className="kgrid">
        <Kpi label="Total partenaires" value={partners.length} color="pu" />
        <Kpi label="Actifs" value={actifs} color="gr" />
        <Kpi label="Inactifs" value={partners.length - actifs} />
      </div>

      <div style={{
        padding: '12px 16px',
        background: '#FEF3C7',
        border: '1px solid #FDE68A',
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 14,
        color: '#92400E',
      }}>
        💡 Pour créer un nouveau partenaire, ouvrez la fiche d'un client existant
        dans <strong>/admin/clients</strong> et cliquez sur <strong>⭐ Promouvoir partenaire</strong>.
      </div>

      <Card title={`Partenaires (${partners.length})`} subtitle="Cliquer sur une ligne pour voir le détail">
        <table className="admin-table">
          <thead>
            <tr><th>Code</th><th>Nom</th><th>Email</th><th>Tél</th><th style={{textAlign:'right'}}>Commission</th><th>Actif</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {partners.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucun partenaire</td></tr>
            ) : partners.map((p) => (
              <tr key={p.id} className="cl" onClick={() => setLocation(`/admin/partenaires/${p.id}`)}>
                <td><Pill variant="pu">{p.code}</Pill></td>
                <td style={{ fontWeight: 700 }}>{p.nom}</td>
                <td>{p.email}</td>
                <td>{p.tel || '—'}</td>
                <td style={{ textAlign: 'right' }}>{p.commission_taux}%</td>
                <td>
                  <Button variant={p.actif ? 's' : 'o'} onClick={(e: any) => { e.stopPropagation(); toggleActif(p); }}
                    style={{ fontSize: 11, padding: '2px 8px' }}>
                    {p.actif ? '✓ Actif' : '✕ Inactif'}
                  </Button>
                </td>
                <td className="tda">
                  <IconButton icon={<EyeIcon />} tooltip="Détail" variant="eye" onClick={(e: any) => { e.stopPropagation(); setLocation(`/admin/partenaires/${p.id}`); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
