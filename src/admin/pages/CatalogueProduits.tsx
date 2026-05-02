import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Link, useLocation } from 'wouter';
import { adminDb as db } from '../../lib/firebase';
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
  const [, setLocation] = useLocation();

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = products.filter((p) => {
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

  if (products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 64, color: '#666' }}>
        <p style={{ fontSize: 18, marginBottom: 8 }}>Aucun produit dans le catalogue</p>
        <p>Ajoutez votre premier produit pour commencer.</p>
        <Link href="/admin/produits/nouveau">
          <Button variant="p" style={{ marginTop: 16 }}>+ Ajouter produit</Button>
        </Link>
      </div>
    );
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
          onClick={async () => {
            const snap = await getDocs(collection(db, 'products'));
            const products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.json_to_sheet(products.map((p: any) => ({
              'Réf. interne': p.numero_interne || '',
              'Nom FR': p.nom_fr || p.nom || '',
              'Nom ZH': p.nom_chinois || p.nom_cn || '',
              'Catégorie': p.categorie || '',
              'Prix achat (¥)': p.prix_achat_cny || p.prix_achat || 0,
              'Actif': p.actif ? 'Oui' : 'Non',
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Catalogue');
            XLSX.writeFile(wb, `catalogue_97import_${new Date().toISOString().slice(0, 10)}.xlsx`);
          }}
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
                <tr key={p.id} className="cl" style={{ opacity: p.actif === false ? 0.5 : 1 }} onClick={() => setLocation(`/admin/produits/${p.id}`)}>
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
                  <td style={{ fontWeight: 700 }}>{p.nom_fr}{p.actif === false && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, marginLeft: 8 }}>INACTIF</span>}</td>
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
