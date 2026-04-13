import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useLocation } from 'wouter';
import { db } from '../../lib/firebase';
import { Kpi, Card, Button, Pill, IconButton, EyeIcon, EditIcon, ExcelIcon } from '../components/Icons';

interface ListeAchat {
  id: string;
  reference: string;
  date_creation: string;
  statut: string;
  nb_produits: number;
  total_cny: number;
  conteneur_id?: string;
}

export default function ListesAchat() {
  const [listes, setListes] = useState<ListeAchat[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'listes_achat'), orderBy('date_creation', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ListeAchat[];
        setListes(data);
      } catch (e) {
        console.error('Error loading listes achat:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = listes.filter(
    (la) =>
      la.reference?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  return (
    <>
      {/* KPIs */}
      <div className="kgrid">
        <Kpi label="Listes actives" value={listes.filter((l) => l.statut === 'en_cours').length} />
        <Kpi label="Produits en attente" value="12" color="or" />
        <Kpi label="Total ¥" value="¥245 000" color="tl" />
        <Kpi label="Completees" value={listes.filter((l) => l.statut === 'complete').length} color="gr" />
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          className="si-bar"
          placeholder="Rechercher liste, produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="fsel" style={{ padding: '7px 9px' }}>
          <option>Tous statuts</option>
          <option>En cours</option>
          <option>Complete</option>
          <option>Archivee</option>
        </select>
        <Button variant="o">📊 Export Excel</Button>
        <Button variant="p">➕ Nouvelle liste</Button>
      </div>

      {/* Card */}
      <Card title={`Listes d'achat (${filtered.length})`}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Date</th>
              <th>Produits</th>
              <th>Total ¥</th>
              <th>Conteneur</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--tx3)' }}>
                  Aucune liste d'achat
                </td>
              </tr>
            ) : (
              filtered.map((la) => (
                <tr key={la.id} className="cl" onClick={() => setLocation(`/admin/achats/${la.id}`)}>
                  <td>
                    <strong>{la.reference}</strong>
                  </td>
                  <td>{la.date_creation}</td>
                  <td>{la.nb_produits}</td>
                  <td style={{ fontWeight: 700, color: 'var(--rd)' }}>
                    ¥{la.total_cny?.toLocaleString()}
                  </td>
                  <td>
                    {la.conteneur_id ? (
                      <Pill variant="nv" small>
                        {la.conteneur_id}
                      </Pill>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <Pill variant={la.statut === 'complete' ? 'tl' : 'or'}>
                      {la.statut === 'complete' ? 'Complete' : 'En cours'}
                    </Pill>
                  </td>
                  <td className="tda">
                    <IconButton icon={<EyeIcon />} tooltip="Voir" variant="eye" />
                    <IconButton icon={<EditIcon />} tooltip="Editer" variant="edit" />
                    <IconButton icon={<ExcelIcon />} tooltip="BC Chine Excel" variant="xl" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}
