import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';
import { DuplicateBtn, duplicateDoc } from '../../components/DuplicateBtn';
import { Card, Kpi, Pill, Button, IconButton, EyeIcon, Progress } from '../components/Icons';

interface Container {
  id: string;
  numero: string;
  type: string;
  destination: string;
  statut: string;
  volume_total: number;
  poids_total: number;
  lignes?: any[];
  createdAt: any;
}

export default function ListeConteneurs() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'containers'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setContainers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Container)));
    } catch (err) {
      console.error('Error loading containers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    load();
    return () => clearTimeout(timeout);
  }, []);

  const handleDuplicate = async (c: Container) => {
    try {
      await duplicateDoc(c, 'containers', 'CONT');
      load();
    } catch (err) {
      console.error('Error duplicating:', err);
    }
  };

  const filtered = containers.filter((c) => {
    const matchSearch = !search || c.numero.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const totalVolume = filtered.reduce((s, c) => s + (c.volume_total || 0), 0);
  const totalPoids = filtered.reduce((s, c) => s + (c.poids_total || 0), 0);
  const livres = filtered.filter(c => c.statut === 'livré').length;

  const getStatutPill = (statut: string) => {
    switch (statut) {
      case 'préparation': return <Pill variant="or">Préparation</Pill>;
      case 'chargé': return <Pill variant="bl">Chargé</Pill>;
      case 'parti': case 'en_mer': return <Pill variant="tl">En mer</Pill>;
      case 'arrivé': return <Pill variant="gr">Arrivé</Pill>;
      case 'livré': return <Pill variant="gr">Livré</Pill>;
      default: return <Pill variant="gy">{statut}</Pill>;
    }
  };

  const getCapacity = (c: Container) => {
    const max = c.type === '20ft' ? 33 : 67;
    return Math.min(100, Math.round(((c.volume_total || 0) / max) * 100));
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;

  return (
    <>
      <div className="kgrid">
        <Kpi label="Conteneurs actifs" value={filtered.length} color="tl" />
        <Kpi label="Volume total" value={`${totalVolume.toFixed(1)} m³`} color="tl" />
        <Kpi label="Poids total" value={`${totalPoids.toLocaleString('fr-FR')} kg`} />
        <Kpi label="Livrés" value={livres} color="gr" />
      </div>

      <div className="filters">
        <input className="si-bar" placeholder="Rechercher conteneur..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <select className="fsel" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="préparation">Préparation</option>
          <option value="chargé">Chargé</option>
          <option value="parti">En mer</option>
          <option value="livré">Livré</option>
        </select>
        <Link href="/admin/conteneurs/nouveau">
          <Button variant="p">+ Nouveau conteneur</Button>
        </Link>
      </div>

      <Card title={`Conteneurs (${filtered.length})`} subtitle="Cliquer sur une ligne pour ouvrir">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Type</th>
              <th>Destination</th>
              <th>Date départ</th>
              <th>Remplissage</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucun conteneur</td></tr>
            ) : filtered.map((c) => (
              <tr key={c.id} className="cl">
                <td>
                  <Link href={`/admin/conteneurs/${c.id}`}>
                    <strong style={{ cursor: 'pointer' }}>{c.numero}</strong>
                  </Link>
                </td>
                <td><Pill variant="nv">{c.type}</Pill></td>
                <td>{c.destination}</td>
                <td style={{ color: 'var(--tx3)' }}>
                  {c.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'}
                </td>
                <td style={{ minWidth: 100 }}>
                  <Progress value={getCapacity(c)} max={100} />
                  <span style={{ fontSize: 10, color: 'var(--tx3)' }}>{c.volume_total?.toFixed(1) || 0} m³</span>
                </td>
                <td>{getStatutPill(c.statut)}</td>
                <td className="tda">
                  <Link href={`/admin/conteneurs/${c.id}`}>
                    <IconButton icon={<EyeIcon />} tooltip="Détail" variant="eye" />
                  </Link>
                  <DuplicateBtn onClick={() => handleDuplicate(c)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
