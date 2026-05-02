import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { adminDb as db } from '../../lib/firebase';
import { Card, Kpi, Pill, IconButton, EyeIcon } from '../components/Icons';
import LoadingState from '../components/atoms/LoadingState';

interface SAV {
  id: string;
  numero: string;
  client_id: string;
  quote_id: string;
  produit_ref: string;
  description: string;
  statut: string;
  createdAt: any;
}

export default function SAVListe() {
  const [savList, setSavList] = useState<SAV[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    const load = async () => {
      try {
        const q = query(collection(db, 'sav'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setSavList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SAV)));
      } catch (err) {
        console.error('Error loading SAV:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    load();
    return () => clearTimeout(timeout);
  }, []);

  const filtered = savList.filter((s) => {
    const matchSearch = !search ||
      s.numero.toLowerCase().includes(search.toLowerCase()) ||
      s.produit_ref?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || s.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const ouverts = filtered.filter(s => s.statut === 'nouveau').length;
  const enCours = filtered.filter(s => s.statut === 'en cours').length;
  const resolus = filtered.filter(s => s.statut === 'résolu').length;
  const now = new Date();
  const ceMois = filtered.filter(s => {
    if (!s.createdAt?.toDate) return false;
    const d = s.createdAt.toDate();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const getStatutPill = (statut: string) => {
    switch (statut) {
      case 'nouveau': return <Pill variant="rd">Nouveau</Pill>;
      case 'en cours': return <Pill variant="or">En cours</Pill>;
      case 'résolu': return <Pill variant="gr">Résolu</Pill>;
      case 'fermé': return <Pill variant="gy">Fermé</Pill>;
      default: return <Pill variant="gy">{statut}</Pill>;
    }
  };

  if (loading) return <LoadingState message="Chargement des SAV…" />;

  return (
    <>
      <div className="kgrid">
        <Kpi label="Tickets ouverts" value={ouverts} color="rd" />
        <Kpi label="En cours" value={enCours} color="or" />
        <Kpi label="Résolus" value={resolus} color="gr" />
        <Kpi label="Ce mois" value={ceMois} />
      </div>

      <div className="filters">
        <input className="si-bar" placeholder="Rechercher SAV, produit, description..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <select className="fsel" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="nouveau">Nouveau</option>
          <option value="en cours">En cours</option>
          <option value="résolu">Résolu</option>
          <option value="fermé">Fermé</option>
        </select>
      </div>

      <Card title={`Tickets SAV (${filtered.length})`} subtitle="Cliquer sur une ligne pour ouvrir">
        <table className="admin-table">
          <thead>
            <tr>
              <th>N° SAV</th>
              <th>Date</th>
              <th>Produit</th>
              <th>Description</th>
              <th>Devis lié</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucun ticket SAV</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="cl">
                <td>
                  <Link href={`/admin/sav/${s.id}`}>
                    <strong style={{ cursor: 'pointer' }}>{s.numero}</strong>
                  </Link>
                </td>
                <td style={{ color: 'var(--tx3)' }}>
                  {s.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'}
                </td>
                <td>{s.produit_ref || '—'}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.description || '—'}
                </td>
                <td style={{ color: 'var(--tx3)' }}>{s.quote_id || '—'}</td>
                <td>{getStatutPill(s.statut)}</td>
                <td className="tda">
                  <Link href={`/admin/sav/${s.id}`}>
                    <IconButton icon={<EyeIcon />} tooltip="Détail" variant="eye" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
