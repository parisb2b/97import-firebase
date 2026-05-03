import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { useLocation } from 'wouter';
import { adminDb as db } from '../../lib/firebase';
import { Card, Kpi, Pill, IconButton, EyeIcon } from '../components/Icons';
import LoadingState from '../components/atoms/LoadingState';

interface Client {
  id: string;
  email: string;
  nom: string;
  role: string;
  createdAt: any;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState('');
  const [search, setSearch] = useState('');
  const [, setLocation] = useLocation();

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'clients'));
        const snap = await getDocs(q);
        setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Client)));
      } catch (err: any) {
        setErrMsg(err?.message || 'Erreur inconnue');
        console.error('Error loading clients:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = clients.filter(c =>
    !search || (c.nom || '').toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const vips = filtered.filter(c => c.role === 'vip').length;
  const partners = filtered.filter(c => c.role === 'partner').length;

  if (loading) return <LoadingState message="Chargement des clients…" />;

  if (errMsg) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '16px 24px', borderRadius: 12, display: 'inline-block', maxWidth: 600 }}>
        <strong>Erreur chargement clients</strong>
        <p style={{ fontSize: 13, marginTop: 8, opacity: 0.8 }}>{errMsg}</p>
      </div>
    </div>
  );

  return (
    <>
      <div className="kgrid">
        <Kpi label="Total clients" value={filtered.length} color="tl" />
        <Kpi label="VIP" value={vips} color="pu" />
        <Kpi label="Partenaires" value={partners} color="or" />
      </div>

      <div className="filters">
        <input className="si-bar" placeholder="Rechercher nom, email..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card title={`Clients (${filtered.length})`} subtitle="Cliquer sur une ligne pour voir le détail">
        <table className="admin-table">
          <thead>
            <tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Inscrit le</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucun client</td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="cl" onClick={() => setLocation(`/admin/clients/${c.id}`)}>
                <td style={{ fontWeight: 700 }}>{c.nom || '—'}</td>
                <td>{c.email}</td>
                <td><Pill variant={c.role === 'vip' ? 'pu' : c.role === 'partner' ? 'tl' : c.role === 'admin' ? 'rd' : 'bl'}>{c.role || 'user'}</Pill></td>
                <td style={{ color: 'var(--tx3)' }}>{c.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'}</td>
                <td className="tda">
                  <IconButton icon={<EyeIcon />} tooltip="Voir détail" variant="eye" onClick={(e: any) => { e.stopPropagation(); setLocation(`/admin/clients/${c.id}`); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
