import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useLocation } from 'wouter';
import { db } from '../../lib/firebase';
import { Card, Kpi, Pill, Button } from '../components/Icons';

interface StockItem {
  id: string;
  ref_piece: string;
  nom: string;
  categorie?: string;
  compatible: string[];
  qte: number;
  qte_transit?: number;
  seuil_alerte: number;
}

export default function Stock() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [, setLocation] = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [newQte, setNewQte] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);
    const load = async () => {
      try {
        const q = query(collection(db, 'stock'), orderBy('ref_piece', 'asc'));
        const snap = await getDocs(q);
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockItem)));
      } catch (err) {
        console.error('Error loading stock:', err);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };
    load();
    return () => clearTimeout(timeout);
  }, []);

  const handleAjuster = (item: StockItem) => {
    setEditItem(item);
    setNewQte(item.qte);
    setShowModal(true);
  };

  const handleConfirmAjust = async () => {
    if (!editItem) return;
    try {
      await updateDoc(doc(db, 'stock', editItem.id), { qte: newQte });
      setItems(items.map(i => i.id === editItem.id ? { ...i, qte: newQte } : i));
      setShowModal(false);
    } catch (err) {
      console.error('Erreur ajustement:', err);
    }
  };

  const filtered = items.filter(i =>
    !search || i.ref_piece.toLowerCase().includes(search.toLowerCase()) || i.nom.toLowerCase().includes(search.toLowerCase())
  );

  const enRupture = filtered.filter(i => i.qte <= i.seuil_alerte).length;
  const enTransit = filtered.filter(i => (i.qte_transit || 0) > 0).length;
  const valeurStock = filtered.reduce((s, i) => s + i.qte, 0);

  if (loading) return <div style={{ textAlign: 'center', padding: 32 }}>Chargement...</div>;

  return (
    <>
      <div className="kgrid">
        <Kpi label="Produits en stock" value={filtered.length} color="tl" />
        <Kpi label="Pièces totales" value={valeurStock} />
        <Kpi label="En rupture" value={enRupture} color="rd" />
        <Kpi label="En transit" value={enTransit} color="or" />
      </div>

      <div className="filters">
        <input className="si-bar" placeholder="Rechercher réf., nom..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card title={`Stock pièces (${filtered.length})`}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Produit</th>
              <th>Compatible avec</th>
              <th style={{ textAlign: 'right' }}>Qté stock</th>
              <th style={{ textAlign: 'right' }}>Qté transit</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucune pièce</td></tr>
            ) : filtered.map((item) => (
              <tr key={item.id} className="cl" onClick={() => setLocation(`/admin/produits/${item.id}`)}>
                <td style={{ fontWeight: 700 }}>{item.ref_piece}</td>
                <td>{item.nom}</td>
                <td style={{ color: 'var(--tx3)', fontSize: 12 }}>{item.compatible?.join(', ') || '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.qte}</td>
                <td style={{ textAlign: 'right', color: 'var(--or)' }}>{item.qte_transit || 0}</td>
                <td>
                  {item.qte <= item.seuil_alerte ? (
                    <Pill variant="rd">Rupture</Pill>
                  ) : (item.qte_transit || 0) > 0 ? (
                    <Pill variant="or">Transit</Pill>
                  ) : (
                    <Pill variant="gr">En stock</Pill>
                  )}
                </td>
                <td>
                  <Button variant="o" onClick={() => handleAjuster(item)} style={{ fontSize: 11, padding: '3px 8px' }}>
                    Ajuster
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showModal && editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="card" style={{ width: 340, padding: 24 }}>
            <div className="ct" style={{ marginBottom: 16 }}>Ajuster stock — {editItem.ref_piece}</div>
            <div className="fg">
              <div className="fl">Nouvelle quantité</div>
              <input className="fi" type="number" value={newQte} min={0}
                onChange={(e) => setNewQte(Number(e.target.value))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <Button variant="o" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button variant="p" onClick={handleConfirmAjust}>Confirmer</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
