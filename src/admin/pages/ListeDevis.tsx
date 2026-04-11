import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';
import {
  Card,
  Button,
  Pill,
  IconButton,
  EyeIcon,
  DownloadIcon,
  StarIcon,
  EuroIcon,
} from '../components/Icons';

interface Devis {
  id: string;
  numero: string;
  date: string;
  client_nom: string;
  partenaire_code?: string;
  destination: string;
  produits: string;
  total_ht: number;
  statut: string;
  is_vip: boolean;
  conteneur_ref?: string;
  createdAt: any;
}

export default function ListeDevis() {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterDest, setFilterDest] = useState('');
  const [filterPartner, setFilterPartner] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);

    const loadDevis = async () => {
      try {
        const q = query(collection(db, 'quotes'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            numero: raw.numero || d.id,
            date: raw.createdAt?.toDate?.()?.toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
            }) || '',
            client_nom: raw.client_nom || '',
            partenaire_code: raw.partenaire_code,
            destination: raw.destination || 'MQ',
            produits: raw.lignes?.map((l: any) => l.reference).join(', ') || '',
            total_ht: raw.total_ht || 0,
            statut: raw.statut || 'brouillon',
            is_vip: raw.is_vip || false,
            conteneur_ref: raw.conteneur_ref,
          } as Devis;
        });
        setDevis(data);
      } catch (err) {
        console.error('Error loading devis:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    loadDevis();

    return () => clearTimeout(timeout);
  }, []);

  // Demo data if no real data
  const demoDevis: Devis[] = [
    {
      id: 'D2604006',
      numero: 'D2604006',
      date: '08/04',
      client_nom: 'Dupont MQ',
      partenaire_code: 'JM',
      destination: 'MQ',
      produits: 'MP-R22-001',
      total_ht: 14200,
      statut: 'vip',
      is_vip: true,
      conteneur_ref: 'CTN-2604-001',
      createdAt: null,
    },
    {
      id: 'D2604007',
      numero: 'D2604007',
      date: '10/04',
      client_nom: 'Martin GP',
      partenaire_code: 'TD',
      destination: 'GP',
      produits: 'MS-20-001',
      total_ht: 18400,
      statut: 'en_attente',
      is_vip: false,
      createdAt: null,
    },
    {
      id: 'D2604004',
      numero: 'D2604004',
      date: '05/04',
      client_nom: 'Carrera',
      partenaire_code: 'MC',
      destination: 'MQ',
      produits: '+3 produits',
      total_ht: 8800,
      statut: 'acompte_1',
      is_vip: false,
      conteneur_ref: 'CTN-2604-001',
      createdAt: null,
    },
  ];

  const displayDevis = devis.length > 0 ? devis : demoDevis;
  const filtered = displayDevis.filter((d) => {
    const matchSearch =
      !search ||
      d.numero.toLowerCase().includes(search.toLowerCase()) ||
      d.client_nom.toLowerCase().includes(search.toLowerCase()) ||
      d.produits.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || d.statut === filterStatut || (filterStatut === 'vip' && d.is_vip);
    const matchDest = !filterDest || d.destination === filterDest;
    const matchPartner = !filterPartner || d.partenaire_code === filterPartner;
    return matchSearch && matchStatut && matchDest && matchPartner;
  });

  const getStatutPill = (d: Devis) => {
    if (d.is_vip) return <Pill variant="pu">VIP</Pill>;
    switch (d.statut) {
      case 'en_attente':
      case 'brouillon':
        return <Pill variant="or">En attente</Pill>;
      case 'acompte_1':
        return <Pill variant="tl">Acompte 1</Pill>;
      case 'acompte_2':
        return <Pill variant="tl">Acompte 2</Pill>;
      case 'finalise':
        return <Pill variant="gr">Finalise</Pill>;
      default:
        return <Pill variant="gy">{d.statut}</Pill>;
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  return (
    <>
      {/* Filters */}
      <div className="filters">
        <input
          className="si-bar"
          placeholder="Rechercher N° devis, client, produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="fsel"
          style={{ padding: '7px 9px' }}
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
        >
          <option value="">Tous statuts</option>
          <option value="vip">VIP</option>
          <option value="en_attente">En attente</option>
          <option value="acompte_1">Acompte recu</option>
        </select>
        <select
          className="fsel"
          style={{ padding: '7px 9px' }}
          value={filterDest}
          onChange={(e) => setFilterDest(e.target.value)}
        >
          <option value="">Toutes dest.</option>
          <option value="MQ">MQ</option>
          <option value="GP">GP</option>
          <option value="RE">RE</option>
          <option value="GF">GF</option>
        </select>
        <select
          className="fsel"
          style={{ padding: '7px 9px' }}
          value={filterPartner}
          onChange={(e) => setFilterPartner(e.target.value)}
        >
          <option value="">Tous partenaires</option>
          <option value="JM">JM</option>
          <option value="TD">TD</option>
          <option value="MC">MC</option>
        </select>
        <Button variant="o">📊 Export Excel</Button>
        <Link href="/admin/devis/nouveau">
          <Button variant="p">➕ Nouveau devis</Button>
        </Link>
      </div>

      {/* Card */}
      <Card
        title={`Tous les devis (${filtered.length})`}
        subtitle="Cliquer sur une ligne pour ouvrir"
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Date</th>
              <th>Client</th>
              <th>Part.</th>
              <th>Dest.</th>
              <th>Produits</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Ctn.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="cl">
                <td>
                  <Link href={`/admin/devis/${d.id}`}>
                    <strong style={{ cursor: 'pointer' }}>{d.numero}</strong>
                  </Link>
                </td>
                <td>{d.date}</td>
                <td>{d.client_nom}</td>
                <td>
                  {d.partenaire_code ? (
                    <Pill variant="pu">{d.partenaire_code}</Pill>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{d.destination}</td>
                <td>{d.produits}</td>
                <td
                  style={{
                    fontWeight: 700,
                    color: d.is_vip ? 'var(--pu)' : 'inherit',
                  }}
                >
                  {d.total_ht.toLocaleString('fr-FR')}€
                </td>
                <td>{getStatutPill(d)}</td>
                <td>
                  {d.conteneur_ref ? (
                    <Pill variant="nv" small>
                      {d.conteneur_ref}
                    </Pill>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="tda">
                  <Link href={`/admin/devis/${d.id}`}>
                    <IconButton icon={<EyeIcon />} tooltip="Voir detail" variant="eye" />
                  </Link>
                  <IconButton
                    icon={<DownloadIcon />}
                    tooltip="Devis PDF"
                    variant="dl"
                    onClick={() => alert('Telecharger Devis PDF')}
                  />
                  {d.is_vip && (
                    <IconButton
                      icon={<StarIcon />}
                      tooltip="Devis VIP PDF"
                      variant="vip"
                      onClick={() => alert('Telecharger Devis VIP PDF')}
                    />
                  )}
                  <IconButton
                    icon={<EuroIcon />}
                    tooltip="Encaisser acompte"
                    variant="eur"
                    onClick={() => alert('Encaisser acompte')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
