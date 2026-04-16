import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { generateDevis, downloadPDF } from '../../../lib/pdf-generator';
import { useToast } from '../../components/Toast';

interface DevisLine {
  ref: string;
  nom_fr: string;
  qte: number;
  prix_unitaire: number;
  total: number;
}

interface Acompte {
  montant: number;
  date: string;
  type_compte: string;
  statut: string;
}

interface Devis {
  id: string;
  numero: string;
  statut: string;
  total_ht: number;
  lignes: DevisLine[];
  acomptes: Acompte[];
  partenaire_code: string | null;
  client_nom: string;
  createdAt: any;
  devis_url?: string;
}

const STATUT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  nouveau: { bg: '#DBEAFE', color: '#1E40AF', label: 'Nouveau' },
  en_cours: { bg: '#FEF3C7', color: '#92400E', label: 'En cours' },
  accepte: { bg: '#DCFCE7', color: '#166534', label: 'Accepté' },
  refuse: { bg: '#FEE2E2', color: '#991B1B', label: 'Refusé' },
  expire: { bg: '#F3F4F6', color: '#6B7280', label: 'Expiré' },
  brouillon: { bg: '#F3F4F6', color: '#374151', label: 'Brouillon' },
  envoye: { bg: '#DBEAFE', color: '#1E40AF', label: 'Envoyé' },
  en_production: { bg: '#FEF3C7', color: '#92400E', label: 'En production' },
  expedie: { bg: '#E0E7FF', color: '#3730A3', label: 'Expédié' },
  livre: { bg: '#DCFCE7', color: '#166534', label: 'Livré' },
};

export default function MesDevis({ userId }: { userId: string; profile?: any }) {
  const { showToast } = useToast();
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'quotes'), where('client_id', '==', userId));
        const snap = await getDocs(q);
        const list = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Devis))
          .sort((a, b) => (b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0) - (a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0));
        setDevis(list);
      } catch (err) {
        console.error('Error loading devis:', err);
        showToast('Erreur de chargement des devis', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleDownloadPDF = async (d: Devis) => {
    try {
      showToast('Génération du PDF en cours...', 'info');
      if (d.devis_url) {
        window.open(d.devis_url, '_blank');
      } else {
        const emSnap = await getDoc(doc(db, 'admin_params', 'emetteur'));
        const emetteur = emSnap.exists() ? emSnap.data() : undefined;
        const quoteSnap = await getDoc(doc(db, 'quotes', d.id));
        if (!quoteSnap.exists()) return;
        downloadPDF(generateDevis(quoteSnap.data(), emetteur), `${d.numero}.pdf`);
      }
      showToast('PDF téléchargé ✅');
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Erreur de génération PDF', 'error');
    }
  };

  const filtered = devis.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    const mainProduct = d.lignes?.[0]?.nom_fr || '';
    const statutLabel = STATUT_COLORS[d.statut]?.label || d.statut;
    return (
      d.numero?.toLowerCase().includes(s) ||
      mainProduct.toLowerCase().includes(s) ||
      statutLabel.toLowerCase().includes(s)
    );
  });

  const statutStyle = (statut: string) => {
    const s = STATUT_COLORS[statut] || STATUT_COLORS.brouillon;
    return { background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 as const };
  };

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
          {filtered.map(d => {
            const isOpen = expandedId === d.id;
            const mainProduct = d.lignes?.[0]?.nom_fr || 'Devis';

            return (
              <div key={d.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                {/* Header */}
                <div
                  onClick={() => setExpandedId(isOpen ? null : d.id)}
                  style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', gap: 14 }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#1565C0', fontSize: 14 }}>{d.numero}</span>
                      <span style={statutStyle(d.statut)}>{STATUT_COLORS[d.statut]?.label || d.statut}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} · {mainProduct}
                      {d.lignes?.length > 1 ? ` +${d.lignes.length - 1}` : ''}
                    </p>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#1565C0', whiteSpace: 'nowrap' }}>
                    {d.total_ht?.toLocaleString('fr-FR')} €
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDownloadPDF(d); }}
                    style={{
                      padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB',
                      background: '#fff', fontSize: 12, cursor: 'pointer', color: '#1565C0', fontWeight: 600,
                    }}
                  >
                    📥 PDF
                  </button>
                  <span style={{
                    fontSize: 16, color: '#9CA3AF', transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : '', display: 'inline-block',
                  }}>▾</span>
                </div>

                {/* Body */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #F3F4F6', padding: 20 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                          <th style={{ textAlign: 'left', padding: '8px 10px', color: '#6B7280', fontWeight: 600 }}>Réf</th>
                          <th style={{ textAlign: 'left', padding: '8px 10px', color: '#6B7280', fontWeight: 600 }}>Produit</th>
                          <th style={{ textAlign: 'center', padding: '8px 10px', color: '#6B7280', fontWeight: 600 }}>Qté</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px', color: '#6B7280', fontWeight: 600 }}>Prix unit. HT</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px', color: '#6B7280', fontWeight: 600 }}>Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(d.lignes || []).map((l, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '8px 10px', color: '#374151' }}>{l.ref}</td>
                            <td style={{ padding: '8px 10px', color: '#374151' }}>{l.nom_fr}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', color: '#374151' }}>{l.qte}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#374151' }}>{l.prix_unitaire?.toLocaleString('fr-FR')} €</td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#374151', fontWeight: 600 }}>{l.total?.toLocaleString('fr-FR')} €</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: '2px solid #1565C0' }}>
                          <td colSpan={4} style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#1565C0' }}>Total HT</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#1565C0', fontSize: 15 }}>{d.total_ht?.toLocaleString('fr-FR')} €</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
