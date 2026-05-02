import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useToast } from '../../components/Toast';
import { calculateCommission, estEligibleCommission } from '../../../lib/commissionHelpers';

interface DevisLine {
  ref: string;
  nom_fr: string;
  qte: number;
  prix_unitaire: number;
  total: number;
  prix_negocie?: number;
}

interface Devis {
  id: string;
  numero: string;
  statut: string;
  total_ht: number;
  lignes: DevisLine[];
  client_nom: string;
  client_email: string;
  is_vip?: boolean;
  note_commission_url?: string;
  acomptes: any[];
  createdAt: any;
}

export default function MesCommissionsPartner({ partnerCode }: { partnerCode: string }) {
  const { showToast } = useToast();
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [commissions, setCommissions] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'quotes'), where('partenaire_code', '==', partnerCode));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Devis));

        // Filtrer les devis éligibles (acompte encaissé)
        const filtered = all
          .filter(estEligibleCommission)
          .sort((a, b) => (b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0) - (a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0));

        setDevis(filtered);

        // Calculer les commissions en parallèle
        const commissionsMap = new Map<string, number>();
        await Promise.all(
          filtered.map(async (d) => {
            const result = await calculateCommission(d);
            commissionsMap.set(d.id, result.commission_totale);
          })
        );
        setCommissions(commissionsMap);
      } catch (err) {
        console.error(err);
        showToast('Erreur de chargement', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  // showToast défini via hook — ajout risquerait boucle si non memoizé
  }, [partnerCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCommission = (d: Devis) => commissions.get(d.id) ?? 0;

  const getCommissionStatut = (d: Devis) => {
    if ((d as any).commission_payee) return { bg: '#065F46', color: '#fff', label: 'Payée' };
    if (d.statut === 'livre' || d.statut === 'paye_complet') return { bg: '#DCFCE7', color: '#166534', label: 'Confirmée' };
    return { bg: '#FEF3C7', color: '#92400E', label: 'En attente' };
  };

  const confirmees = devis.filter(d => d.statut === 'livre' || d.statut === 'paye_complet' || (d as any).commission_payee);
  const enAttente = devis.filter(d => d.statut !== 'livre' && d.statut !== 'paye_complet' && !(d as any).commission_payee);

  const totalConfirmees = confirmees.reduce((s, d) => s + getCommission(d), 0);
  const totalEnAttente = enAttente.reduce((s, d) => s + getCommission(d), 0);
  const totalEstime = devis.reduce((s, d) => s + getCommission(d), 0);

  const filtered = devis.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return d.numero?.toLowerCase().includes(s) || d.client_nom?.toLowerCase().includes(s);
  });

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Mes commissions</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Suivi de vos commissions (marge sur prix VIP négocié).</p>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, background: '#DCFCE7', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#166534' }}>Confirmées</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>{Math.round(totalConfirmees).toLocaleString('fr-FR')} €</p>
        </div>
        <div style={{ flex: 1, background: '#FEF3C7', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#92400E' }}>En attente</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#92400E' }}>{Math.round(totalEnAttente).toLocaleString('fr-FR')} €</p>
        </div>
        <div style={{ flex: 1, background: '#DBEAFE', borderRadius: 12, padding: 14, textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#1E40AF' }}>Total estimé</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#1E40AF' }}>{Math.round(totalEstime).toLocaleString('fr-FR')} €</p>
        </div>
      </div>

      {/* Recherche */}
      <div style={{ marginBottom: 20 }}>
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6B7280' }}>
          {search ? 'Aucune commission trouvée.' : 'Aucune commission pour le moment.'}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 120px 100px', padding: '12px 16px', borderBottom: '2px solid #E5E7EB', fontSize: 11, fontWeight: 600, color: '#6B7280' }}>
            <span>N° Devis</span><span>Client</span><span>Montant devis</span><span>Commission</span><span>Statut</span>
          </div>

          {filtered.map(d => {
            const isOpen = expandedId === d.id;
            const cs = getCommissionStatut(d);
            const commission = getCommission(d);
            const n = d.numero?.replace(/^DVS-/, '') || '';

            return (
              <div key={d.id}>
                <div onClick={() => setExpandedId(isOpen ? null : d.id)}
                  style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 120px 100px', padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: 13, alignItems: 'center', background: isOpen ? '#F9FAFB' : '#fff' }}>
                  <span style={{ fontWeight: 600, color: '#1565C0' }}>{d.numero}</span>
                  <span style={{ color: '#374151' }}>{d.client_nom || d.client_email}</span>
                  <span style={{ fontWeight: 600 }}>{d.total_ht?.toLocaleString('fr-FR')} €</span>
                  <span style={{ fontWeight: 700, color: '#166534' }}>+{Math.round(commission).toLocaleString('fr-FR')} €</span>
                  <span style={{ background: cs.bg, color: cs.color, padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{cs.label}</span>
                </div>

                {isOpen && (
                  <div style={{ padding: '16px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {/* Détail produits */}
                    <div style={{ fontSize: 12, marginBottom: 12 }}>
                      <strong style={{ color: '#374151' }}>Produits :</strong>
                      {(d.lignes || []).map((l, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
                          <span>{l.qte}x {l.nom_fr} (Réf: {l.ref})</span>
                          <span>
                            {d.is_vip && l.prix_negocie ? (
                              <>
                                <span style={{ textDecoration: 'line-through', color: '#9CA3AF', marginRight: 8 }}>{l.prix_unitaire?.toLocaleString('fr-FR')} €</span>
                                <span style={{ color: '#7C3AED', fontWeight: 700 }}>{l.prix_negocie?.toLocaleString('fr-FR')} €</span>
                              </>
                            ) : (
                              <span style={{ fontWeight: 600 }}>{l.prix_unitaire?.toLocaleString('fr-FR')} €</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Calcul commission */}
                    <div style={{ background: '#DCFCE7', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#166534' }}>Montant devis HT</span>
                        <span style={{ fontWeight: 600, color: '#166534' }}>{d.total_ht?.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                        <span style={{ color: '#166534' }}>Votre commission</span>
                        <span style={{ fontWeight: 600, color: '#166534' }}>Marge négociée</span>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(22,101,52,.2)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                        <span style={{ fontWeight: 700, color: '#166534' }}>Commission</span>
                        <span style={{ fontWeight: 800, color: '#166534' }}>{Math.round(getCommission(d)).toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>

                    {/* Note de commission PDF */}
                    {d.note_commission_url && (
                      <button onClick={() => window.open(d.note_commission_url, '_blank')} style={{
                        padding: '8px 16px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 10,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                        📥 Télécharger NC-{n} (Note de commission)
                      </button>
                    )}
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
