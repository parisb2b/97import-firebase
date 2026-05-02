import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { toDate } from '../../../lib/dateHelpers';
import { useToast } from '../../components/Toast';
import DevisCard from './DevisCard';

// V50-BIS Checkpoint C — extracteur robuste de date pour tri.
// Couvre createdAt (camelCase), created_at (snake_case legacy), et
// toutes les shapes : Firestore Timestamp, {_seconds, _nanoseconds},
// ISO string, epoch ms, Date.
function getDevisTimestamp(d: any): number {
  const date = toDate(d?.createdAt) || toDate(d?.created_at) || toDate(d?.date_creation);
  return date ? date.getTime() : 0;
}


export default function MesDevis({ userId, profile }: { userId: string; profile?: any }) {
  const { showToast } = useToast();
  const [devis, setDevis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadDevis = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quotes'), where('client_id', '==', userId));
      const snap = await getDocs(q);
      // V50-BIS Checkpoint C — tri DESC robuste : utilise toDate qui couvre
      // toutes les shapes (Timestamp, {_seconds}, ISO, epoch). Fallback
      // createdAt → created_at → date_creation pour compat docs anciens.
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .sort((a: any, b: any) => getDevisTimestamp(b) - getDevisTimestamp(a));
      setDevis(list);
    } catch (err) {
      console.error('Error loading devis:', err);
      showToast('Erreur de chargement des devis', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevis();
  }, [userId]);

  // Filtre : tous les devis sauf annulés
  const devisNonAnnules = devis.filter(d => d.statut !== 'annule');

  // Filtre de recherche
  const filtered = devisNonAnnules.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    const mainProduct = d.lignes?.[0]?.nom_fr || '';
    return (
      d.numero?.toLowerCase().includes(s) ||
      mainProduct.toLowerCase().includes(s) ||
      (d.statut || '').toLowerCase().includes(s)
    );
  });


  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Mes devis</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Retrouvez tous vos devis et téléchargez-les en PDF.</p>

      {/* Barre de recherche */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Rechercher par numéro, produit ou statut..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E5E7EB',
            fontSize: 13, outline: 'none', background: '#fff',
          }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6B7280', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          {search ? 'Aucun devis trouvé pour cette recherche.' : 'Aucun devis pour le moment.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((devis) => (
            <DevisCard
              key={devis.id}
              devis={devis}
              profile={profile}
              onRefresh={loadDevis}
            />
          ))}
        </div>
      )}
    </div>
  );
}
