import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useLocation } from 'wouter';
import { db } from '../../lib/firebase';
import { Card, Pill, IconButton, Kpi, FileIcon, DownloadIcon, EyeIcon } from '../components/Icons';

interface FraisLigne {
  id: string;
  numero: string;
  conteneur_ref: string;
  client_nom: string;
  destination: string;
  type_conteneur: string;
  fret_maritime: number;
  dechargement: number;
  douane: number;
  livraison: number;
  total: number;
  statut: string;
  createdAt: any;
}

const FRAIS_DEFAUT: Record<string, Record<string, number>> = {
  'MQ-20ft': { fret: 2800, dechargement: 450, douane: 200, livraison: 350 },
  'MQ-40ft': { fret: 4200, dechargement: 650, douane: 350, livraison: 500 },
  'GP-20ft': { fret: 2900, dechargement: 480, douane: 220, livraison: 380 },
  'GP-40ft': { fret: 4400, dechargement: 700, douane: 380, livraison: 550 },
  'RE-20ft': { fret: 3200, dechargement: 520, douane: 250, livraison: 400 },
  'RE-40ft': { fret: 4800, dechargement: 750, douane: 420, livraison: 600 },
  'GF-20ft': { fret: 3500, dechargement: 550, douane: 280, livraison: 450 },
  'GF-40ft': { fret: 5200, dechargement: 800, douane: 480, livraison: 680 },
};

const DESTINATIONS: Record<string, string> = {
  MQ: 'Martinique',
  GP: 'Guadeloupe',
  RE: 'Réunion',
  GF: 'Guyane',
};

export default function FraisLogistique() {
  const [frais, setFrais] = useState<FraisLigne[]>([]);
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [filterDest, setFilterDest] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    const load = async () => {
      try {
        // Try logistics_invoices first
        let snap = await getDocs(query(collection(db, 'logistics_invoices'), orderBy('createdAt', 'desc')));

        if (snap.empty) {
          // Fallback: build from containers
          snap = await getDocs(query(collection(db, 'containers'), orderBy('createdAt', 'desc')));
          const data = snap.docs.map((d) => {
            const raw = d.data();
            const key = `${raw.destination || 'MQ'}-${raw.type || '40ft'}`;
            const defaults = FRAIS_DEFAUT[key] || FRAIS_DEFAUT['MQ-40ft'];
            const total = defaults.fret + defaults.dechargement + defaults.douane + defaults.livraison;
            return {
              id: d.id,
              numero: `FM-${raw.numero || d.id}`,
              conteneur_ref: raw.numero || d.id,
              client_nom: raw.client_nom || '—',
              destination: raw.destination || 'MQ',
              type_conteneur: raw.type || '40ft',
              fret_maritime: defaults.fret,
              dechargement: defaults.dechargement,
              douane: defaults.douane,
              livraison: defaults.livraison,
              total,
              statut: raw.statut_frais || 'en_attente',
              createdAt: raw.createdAt,
            } as FraisLigne;
          });
          setFrais(data);
        } else {
          setFrais(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FraisLigne)));
        }
      } catch (err) {
        console.error('Error loading frais:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    load();
    return () => clearTimeout(timeout);
  }, []);

  const filtered = frais.filter((f) => {
    const matchDest = !filterDest || f.destination === filterDest;
    const matchStatut = !filterStatut || f.statut === filterStatut;
    return matchDest && matchStatut;
  });

  const totalFrais = filtered.reduce((s, f) => s + (f.total || 0), 0);
  const envoyees = filtered.filter(f => f.statut === 'envoyee').length;
  const enAttente = filtered.filter(f => f.statut === 'en_attente' || !f.statut).length;

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  return (
    <>
      <div className="kgrid">
        <Kpi label="Conteneurs actifs" value={filtered.length} color="tl" />
        <Kpi label="Total frais" value={`${totalFrais.toLocaleString('fr-FR')}€`} color="tl" />
        <Kpi label="Factures envoyées" value={envoyees} color="gr" />
        <Kpi label="En attente" value={enAttente} color="or" />
      </div>

      <div className="filters">
        <select className="fsel" value={filterDest} onChange={(e) => setFilterDest(e.target.value)}>
          <option value="">Toutes destinations</option>
          {Object.entries(DESTINATIONS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select className="fsel" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="envoyee">Envoyée</option>
          <option value="en_attente">En attente</option>
          <option value="payee">Payée</option>
        </select>
      </div>

      <Card title={`Frais logistiques (${filtered.length})`} subtitle="Thème teal — factures conteneurs">
        <table className="admin-table">
          <thead>
            <tr>
              <th>N° FM</th>
              <th>Conteneur</th>
              <th>Client</th>
              <th>Destination</th>
              <th>Fret</th>
              <th>Décharg.</th>
              <th>Douane</th>
              <th>Livraison</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Documents</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: 32, color: '#666' }}>
                  Aucun frais logistique
                </td>
              </tr>
            ) : filtered.map((f) => (
              <tr key={f.id} className="cl">
                <td style={{ fontWeight: 700 }}>{f.numero}</td>
                <td><Pill variant="nv">{f.conteneur_ref}</Pill></td>
                <td>{f.client_nom}</td>
                <td><Pill variant="tl">{DESTINATIONS[f.destination] || f.destination}</Pill></td>
                <td style={{ textAlign: 'right' }}>{f.fret_maritime.toLocaleString('fr-FR')}€</td>
                <td style={{ textAlign: 'right' }}>{f.dechargement.toLocaleString('fr-FR')}€</td>
                <td style={{ textAlign: 'right' }}>{f.douane.toLocaleString('fr-FR')}€</td>
                <td style={{ textAlign: 'right' }}>{f.livraison.toLocaleString('fr-FR')}€</td>
                <td style={{ fontWeight: 700, color: 'var(--tl)', textAlign: 'right' }}>
                  {f.total.toLocaleString('fr-FR')}€
                </td>
                <td>
                  <Pill variant={f.statut === 'payee' ? 'gr' : f.statut === 'envoyee' ? 'tl' : 'or'}>
                    {f.statut === 'payee' ? 'Payée' : f.statut === 'envoyee' ? 'Envoyée' : 'En attente'}
                  </Pill>
                </td>
                <td className="tda">
                  <IconButton icon={<EyeIcon />} tooltip="Voir détail" variant="eye" onClick={(e: any) => { e.stopPropagation(); setLocation('/admin/frais/' + f.id); }} />
                  <IconButton icon={<FileIcon />} tooltip="FM PDF" variant="eye" onClick={(e: any) => { e.stopPropagation(); alert(`PDF FM ${f.numero}`); }} />
                  <IconButton icon={<DownloadIcon />} tooltip="Télécharger" variant="dl" onClick={(e: any) => { e.stopPropagation(); alert(`Download ${f.numero}`); }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
