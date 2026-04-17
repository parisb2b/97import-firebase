import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useToast } from '../../components/Toast';
import DevisCard from './DevisCard';

export default function MesVirements({ userId, profile }: { userId: string; profile: any }) {
  const { showToast } = useToast();
  const [virements, setVirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadVirements = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quotes'), where('client_id', '==', userId));
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtre : devis avec au moins 1 acompte (déclaré ou encaissé)
      const filtered = all
        .filter(d => Array.isArray(d.acomptes) && d.acomptes.length > 0)
        .sort((a, b) => (b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0) - (a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0));
      setVirements(filtered);
    } catch (err) {
      console.error(err);
      showToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVirements(); }, [userId]);

  const filtered = virements.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    const mainProduct = d.lignes?.[0]?.nom_fr || '';
    return (
      d.numero?.toLowerCase().includes(s) ||
      mainProduct.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Mes virements</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Historique de tous vos virements et acomptes.</p>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            fontSize: 13,
            outline: 'none',
          }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6B7280' }}>
          Aucun virement enregistré.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((devis) => (
            <DevisCard
              key={devis.id}
              devis={devis}
              profile={profile}
              onRefresh={loadVirements}
              forceOpen={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
