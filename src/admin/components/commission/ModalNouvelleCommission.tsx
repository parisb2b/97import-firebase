import { useState, useEffect } from 'react';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  calculateCommission,
  estEligibleCommission
} from '@/lib/commissionHelpers';
import { genererNumeroNC } from '@/lib/ncNumerotation';

interface Partner {
  id: string;
  nom: string;
  code: string;
  email?: string;
  actif?: boolean;
}

interface Devis {
  id: string;
  numero?: string;
  client_nom?: string;
  client_id?: string;
  total_ht?: number;
  is_vip?: boolean;
  statut?: string;
  acomptes?: any[];
  _commission?: number; // Pré-calculé
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalNouvelleCommission({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1); // 1: choix partenaire, 2: choix devis
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [devisEligibles, setDevisEligibles] = useState<Devis[]>([]);
  const [selectedDevisIds, setSelectedDevisIds] = useState<Set<string>>(new Set());
  const [devisDejaDansNC, setDevisDejaDansNC] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  // Étape 1 : charger les partenaires actifs
  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'partners'));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Partner))
        .filter(p => p.actif !== false)
        .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      setPartners(list);
    } catch (err) {
      console.error('Erreur chargement partenaires:', err);
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : charger les devis éligibles du partenaire sélectionné
  const handleSelectPartner = async (p: Partner) => {
    setSelectedPartner(p);
    setLoading(true);
    try {
      // 1. Charger tous les devis du partenaire (par code)
      const qDevis = query(
        collection(db, 'quotes'),
        where('partenaire_code', '==', p.code)
      );
      const devisSnap = await getDocs(qDevis);
      const allDevis = devisSnap.docs.map(d => ({
        id: d.id, ...d.data()
      } as Devis));

      // 2. Filtrer les éligibles (acompte encaissé)
      const eligibles = allDevis.filter(estEligibleCommission);

      // 3. Récupérer les devis déjà inclus dans une NC existante
      const qCommissions = query(
        collection(db, 'commissions'),
        where('partenaire_id', '==', p.id)
      );
      const commSnap = await getDocs(qCommissions);
      const dejaInclus = new Set<string>();
      commSnap.docs.forEach(c => {
        const data = c.data();
        if (Array.isArray(data.lignes)) {
          data.lignes.forEach((l: any) => {
            if (l.quote_id) dejaInclus.add(l.quote_id);
          });
        }
      });
      setDevisDejaDansNC(dejaInclus);

      // 4. Calculer les commissions en parallèle
      const avecCommission = await Promise.all(
        eligibles.map(async (d) => {
          const result = await calculateCommission(d);
          return { ...d, _commission: result.commission_totale };
        })
      );

      setDevisEligibles(avecCommission);
      setStep(2);
    } catch (err: any) {
      alert('Erreur chargement devis : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDevisSelection = (id: string) => {
    const next = new Set(selectedDevisIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedDevisIds(next);
  };

  const toggleSelectAll = () => {
    const disponibles = devisEligibles.filter(d => !devisDejaDansNC.has(d.id));
    if (selectedDevisIds.size === disponibles.length) {
      setSelectedDevisIds(new Set());
    } else {
      setSelectedDevisIds(new Set(disponibles.map(d => d.id)));
    }
  };

  const devisSelectionnes = devisEligibles.filter(d => selectedDevisIds.has(d.id));
  const totalCommission = devisSelectionnes.reduce((s, d) => s + (d._commission || 0), 0);

  const handleCreate = async () => {
    if (!selectedPartner) return;
    if (selectedDevisIds.size === 0) {
      alert('⚠️ Sélectionnez au moins un devis');
      return;
    }

    if (!confirm(
      `Créer la note de commission ?\n\n` +
      `Partenaire : ${selectedPartner.nom}\n` +
      `Devis inclus : ${selectedDevisIds.size}\n` +
      `Commission totale : ${totalCommission.toFixed(2)} €\n\n` +
      `La NC sera créée avec statut "en_attente" (non envoyée).`
    )) return;

    setCreating(true);
    try {
      const numero = await genererNumeroNC();

      const lignes = devisSelectionnes.map(d => ({
        quote_id: d.id,
        quote_numero: d.numero || d.id,
        client: d.client_nom || '—',
        client_id: d.client_id || '',
        montant_ht: d.total_ht || 0,
        commission: d._commission || 0,
      }));

      await addDoc(collection(db, 'commissions'), {
        numero,
        partenaire_id: selectedPartner.id,
        partenaire_code: selectedPartner.code,
        partenaire_nom: selectedPartner.nom,
        partenaire_email: selectedPartner.email || null,
        total_commission: parseFloat(totalCommission.toFixed(2)),
        statut: 'en_attente',
        lignes,
        createdAt: serverTimestamp(),
      });

      alert(`✅ Note de commission ${numero} créée avec succès`);
      onSuccess();
    } catch (err: any) {
      alert('❌ Erreur création : ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const partnersFiltres = partners.filter(p => {
    if (!search.trim()) return true;
    const t = search.toLowerCase();
    return (p.nom || '').toLowerCase().includes(t) ||
           (p.code || '').toLowerCase().includes(t) ||
           (p.email || '').toLowerCase().includes(t);
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16,
          width: '100%', maxWidth: 900, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: 20,
          borderBottom: '1px solid #E5E7EB',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: '#1E3A5F' }}>
              Nouvelle Note de Commission
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
              {step === 1 ? 'Étape 1/2 — Sélectionner un partenaire' : `Étape 2/2 — Sélectionner les devis (${selectedPartner?.nom})`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              fontSize: 24, cursor: 'pointer', color: '#6B7280',
              padding: 0, lineHeight: 1,
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
              Chargement...
            </div>
          ) : step === 1 ? (
            // ═══ ÉTAPE 1 : CHOIX PARTENAIRE ═══
            <>
              <input
                type="text"
                placeholder="Rechercher par nom, code ou email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1px solid #E5E7EB', borderRadius: 10,
                  fontSize: 14, marginBottom: 16, boxSizing: 'border-box',
                  fontFamily: 'inherit', outline: 'none',
                }}
              />

              {partnersFiltres.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
                  Aucun partenaire trouvé
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {partnersFiltres.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPartner(p)}
                      style={{
                        padding: 14,
                        background: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: '#1E3A5F', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14,
                      }}>{p.code}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{p.nom}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{p.email || '—'}</div>
                      </div>
                      <div style={{ color: '#EA580C', fontSize: 14 }}>→</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // ═══ ÉTAPE 2 : CHOIX DEVIS ═══
            <>
              {devisEligibles.length === 0 ? (
                <div style={{
                  padding: 40,
                  textAlign: 'center',
                  background: '#F9FAFB',
                  borderRadius: 12,
                  color: '#6B7280',
                }}>
                  <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
                  <div style={{ fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                    Aucun devis éligible
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Ce partenaire n'a pas de devis avec acompte encaissé actuellement.
                  </div>
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    padding: '8px 12px',
                    background: '#F9FAFB',
                    borderRadius: 8,
                    fontSize: 13,
                  }}>
                    <span>
                      <strong>{devisEligibles.length}</strong> devis éligibles
                      {devisDejaDansNC.size > 0 && (
                        <span style={{ color: '#DC2626', marginLeft: 8 }}>
                          ({devisDejaDansNC.size} déjà dans une NC)
                        </span>
                      )}
                    </span>
                    <button
                      onClick={toggleSelectAll}
                      style={{
                        background: 'transparent', border: '1px solid #E5E7EB',
                        padding: '4px 10px', borderRadius: 6,
                        fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {selectedDevisIds.size === 0 ? 'Tout sélectionner' : 'Tout désélectionner'}
                    </button>
                  </div>

                  <div style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                          <th style={thStyle} width="40"></th>
                          <th style={thStyle}>Devis</th>
                          <th style={thStyle}>Client</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Total HT</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devisEligibles.map(d => {
                          const dejaInclus = devisDejaDansNC.has(d.id);
                          const selected = selectedDevisIds.has(d.id);
                          return (
                            <tr
                              key={d.id}
                              style={{
                                borderBottom: '1px solid #F3F4F6',
                                opacity: dejaInclus ? 0.4 : 1,
                                background: selected ? '#FFF7ED' : 'transparent',
                                cursor: dejaInclus ? 'not-allowed' : 'pointer',
                              }}
                              onClick={() => !dejaInclus && toggleDevisSelection(d.id)}
                            >
                              <td style={tdStyle}>
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  disabled={dejaInclus}
                                  onChange={() => {}}
                                  style={{ cursor: dejaInclus ? 'not-allowed' : 'pointer', accentColor: '#EA580C' }}
                                />
                              </td>
                              <td style={tdStyle}>
                                <code style={{
                                  fontSize: 11, background: '#F3F4F6',
                                  padding: '2px 6px', borderRadius: 4,
                                  color: '#1E3A5F',
                                }}>
                                  {d.numero || d.id}
                                </code>
                                {d.is_vip && (
                                  <span style={{
                                    marginLeft: 6, fontSize: 10,
                                    color: '#7c3aed', fontWeight: 600,
                                  }}>VIP</span>
                                )}
                                {dejaInclus && (
                                  <div style={{ fontSize: 10, color: '#DC2626', marginTop: 2 }}>
                                    ⚠ Déjà dans une NC
                                  </div>
                                )}
                              </td>
                              <td style={tdStyle}>{d.client_nom || '—'}</td>
                              <td style={{ ...tdStyle, textAlign: 'right' }}>
                                {(d.total_ht || 0).toLocaleString('fr-FR')} €
                              </td>
                              <td style={{
                                ...tdStyle,
                                textAlign: 'right',
                                fontWeight: 600,
                                color: '#059669',
                              }}>
                                {(d._commission || 0).toLocaleString('fr-FR')} €
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {selectedDevisIds.size > 0 && (
                    <div style={{
                      marginTop: 16,
                      padding: 14,
                      background: '#D1FAE5',
                      borderRadius: 10,
                      border: '1px solid #6EE7B7',
                    }}>
                      <div style={{ fontSize: 13, color: '#065F46' }}>
                        <strong>{selectedDevisIds.size} devis sélectionnés</strong>
                        <span style={{ float: 'right', fontSize: 16, fontWeight: 700 }}>
                          Commission totale : {totalCommission.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: 16,
          borderTop: '1px solid #E5E7EB',
          display: 'flex', justifyContent: 'space-between', gap: 10,
          background: '#F9FAFB',
        }}>
          {step === 2 && (
            <button
              onClick={() => {
                setStep(1);
                setSelectedPartner(null);
                setSelectedDevisIds(new Set());
                setDevisEligibles([]);
              }}
              style={{
                padding: '10px 16px', background: '#fff',
                color: '#374151', border: '1px solid #E5E7EB',
                borderRadius: 10, fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ← Retour choix partenaire
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px', background: '#fff',
                color: '#374151', border: '1px solid #E5E7EB',
                borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Annuler
            </button>

            {step === 2 && devisEligibles.length > 0 && (
              <button
                onClick={handleCreate}
                disabled={creating || selectedDevisIds.size === 0}
                style={{
                  padding: '10px 24px',
                  background: (creating || selectedDevisIds.size === 0) ? '#D1D5DB' : '#EA580C',
                  color: '#fff', border: 'none',
                  borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: (creating || selectedDevisIds.size === 0) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {creating ? 'Création...' : `Créer la NC (${selectedDevisIds.size} devis)`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontWeight: 600,
  color: '#6B7280', fontSize: 10, textTransform: 'uppercase',
  letterSpacing: 0.3,
};
const tdStyle: React.CSSProperties = {
  padding: '12px 14px', verticalAlign: 'middle',
};
