import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'wouter';
import { db } from '../../lib/firebase';
import { scoreCompletude } from '../../components/OrangeIndicator';
import { Card, Button, Pill, IconButton, EditIcon, ExcelIcon } from '../components/Icons';

interface Product {
  id: string;
  numero_interne: string;
  categorie: string;
  nom_fr: string;
  prix_achat_cny: number;
  prix_public_eur: number;
  actif: boolean;
  createdAt: any;
}

const CATEGORIES: Record<string, { label: string; variant: 'bl' | 'tl' | 'pu' | 'or' | 'gy' }> = {
  'mini-pelles': { label: 'Mini-Pelle', variant: 'bl' },
  'maisons-modulaires': { label: 'Maisons', variant: 'tl' },
  solaire: { label: 'Solaire', variant: 'pu' },
  'machines-agricoles': { label: 'Agricole', variant: 'or' },
  divers: { label: 'Divers', variant: 'gy' },
  services: { label: 'Services', variant: 'gy' },
};

// Completeness display like mockup: ●●●●●●●●○○ 8/10
function CompletudeDisplay({ score }: { score: number }) {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  const color =
    score >= 70 ? 'var(--tl)' : score >= 50 ? 'var(--or)' : 'var(--rd)';

  return (
    <span style={{ fontSize: 11, color }}>
      {'●'.repeat(filled)}
      {'○'.repeat(empty)} {filled}/10
    </span>
  );
}

export default function CatalogueProduits() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);

    const load = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    load();

    return () => clearTimeout(timeout);
  }, []);

  // Demo products if no real data
  const demoProducts: Product[] = [
    {
      id: 'MP-R22-001',
      numero_interne: 'MP-R22-001',
      categorie: 'mini-pelles',
      nom_fr: 'Mini-pelle R22 PRO 2.2T',
      prix_achat_cny: 94800,
      prix_public_eur: 24300,
      actif: true,
      createdAt: null,
    },
    {
      id: 'MS-20-001',
      numero_interne: 'MS-20-001',
      categorie: 'maisons-modulaires',
      nom_fr: 'Maison Standard 20P',
      prix_achat_cny: 33660,
      prix_public_eur: 8616,
      actif: true,
      createdAt: null,
    },
    {
      id: 'LOG-CTN-2604-001',
      numero_interne: 'LOG-CTN-2604-001',
      categorie: 'services',
      nom_fr: 'Frais logistiques 40HC MQ',
      prix_achat_cny: 0,
      prix_public_eur: 0,
      actif: false,
      createdAt: null,
    },
  ];

  const displayProducts = products.length > 0 ? products : demoProducts;
  const filtered = displayProducts.filter((p) => {
    const matchSearch =
      !search ||
      p.numero_interne.toLowerCase().includes(search.toLowerCase()) ||
      p.nom_fr.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.categorie === filterCat;
    return matchSearch && matchCat;
  });

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;
  }

  return (
    <>
      {/* Filters */}
      <div className="filters">
        <input
          className="si-bar"
          placeholder="Rechercher ref., nom produit, categorie..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="fsel"
          style={{ padding: '7px 9px' }}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">Toutes cat.</option>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <IconButton
          icon={<ExcelIcon />}
          tooltip="Export Excel 69col."
          variant="xl"
          size="lg"
          onClick={() => alert('Export catalogue Excel')}
        />
        <Link href="/admin/produits/nouveau">
          <Button variant="p">➕ Ajouter produit</Button>
        </Link>
      </div>

      {/* Card */}
      <Card title={`Catalogue v3 (${filtered.length} ref.)`}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Nom FR</th>
              <th>Cat.</th>
              <th>Prix ¥</th>
              <th>Prix public</th>
              <th>Completude</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const score = scoreCompletude(p);
              const cat = CATEGORIES[p.categorie] || { label: p.categorie, variant: 'gy' as const };
              const refColor =
                p.categorie === 'mini-pelles'
                  ? 'var(--nv3)'
                  : p.categorie === 'maisons-modulaires'
                    ? 'var(--tl)'
                    : p.categorie === 'services'
                      ? 'var(--pu)'
                      : 'var(--or)';

              return (
                <tr key={p.id}>
                  <td
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: refColor,
                      fontWeight: 700,
                    }}
                  >
                    {p.numero_interne}
                  </td>
                  <td style={{ fontWeight: 700 }}>{p.nom_fr}</td>
                  <td>
                    <Pill variant={cat.variant}>{cat.label}</Pill>
                  </td>
                  <td style={{ color: 'var(--rd)', fontWeight: 600 }}>
                    {p.prix_achat_cny ? `¥${p.prix_achat_cny.toLocaleString('fr-FR')}` : '—'}
                  </td>
                  <td style={{ color: 'var(--nv3)', fontWeight: 700 }}>
                    {p.prix_public_eur
                      ? `${p.prix_public_eur.toLocaleString('fr-FR')}€`
                      : 'Sur devis'}
                  </td>
                  <td>
                    <CompletudeDisplay score={score} />
                  </td>
                  <td>
                    {p.actif ? (
                      <Pill variant="tl">Actif</Pill>
                    ) : (
                      <Pill variant="gy">Non visible</Pill>
                    )}
                  </td>
                  <td className="tda">
                    <Link href={`/admin/produits/${p.id}`}>
                      <IconButton
                        icon={<EditIcon />}
                        tooltip="Editer / Completer"
                        variant="edit"
                      />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
