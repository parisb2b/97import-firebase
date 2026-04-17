import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { generateDevis, downloadPDF } from '../../../lib/pdf-generator';
import { useToast } from '../../components/Toast';
import PopupAcompte from './PopupAcompte';
import { peutVerserAcompte } from '../../../lib/devisHelpers';

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
  statut_commande?: string;
  total_ht: number;
  lignes: DevisLine[];
  acomptes: Acompte[];
  partenaire_code: string | null;
  client_nom: string;
  pays_livraison?: string;
  createdAt: any;
  devis_url?: string;
  facture_acompte_url?: string;
  facture_finale_url?: string;
  facture_logistique_url?: string;
  bon_livraison_url?: string;
}

const STATUT_CMD: Record<string, { bg: string; color: string; label: string }> = {
  en_preparation: { bg: '#FEF3C7', color: '#92400E', label: 'En préparation' },
  expedie: { bg: '#DBEAFE', color: '#1E40AF', label: 'Expédié' },
  livre: { bg: '#DCFCE7', color: '#166534', label: 'Livré' },
};

export default function MesCommandes({ userId, profile }: { userId: string; profile: any }) {
  const { showToast } = useToast();
  const [commandes, setCommandes] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [popupDevis, setPopupDevis] = useState<Devis | null>(null);

  const loadCommandes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quotes'), where('client_id', '==', userId));
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Devis));
      const filtered = all
        .filter(d => d.acomptes?.some(a => a.statut === 'encaisse'))
        .sort((a, b) => (b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0) - (a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0));
      setCommandes(filtered);
    } catch (err) {
      console.error(err);
      showToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCommandes(); }, [userId]);

  const getNumero = (d: Devis) => d.numero?.replace(/^DVS-/, '') || '';
  const cmdNumero = (d: Devis) => `CMD-${getNumero(d)}`;

  const getStatutCmd = (d: Devis) => {
    if (d.statut_commande && STATUT_CMD[d.statut_commande]) return STATUT_CMD[d.statut_commande];
    if (d.acomptes?.some(a => a.statut === 'encaisse')) return STATUT_CMD.en_preparation;
    return STATUT_CMD.en_preparation;
  };

  const totalEncaisse = (d: Devis) => (d.acomptes || []).filter(a => a.statut === 'encaisse').reduce((s, a) => s + a.montant, 0);
  const totalDeclare = (d: Devis) => (d.acomptes || []).filter(a => a.statut === 'declare').reduce((s, a) => s + a.montant, 0);

  const handleDownloadPDF = async (d: Devis) => {
    try {
      showToast('Génération du PDF...', 'info');
      if (d.devis_url) { window.open(d.devis_url, '_blank'); return; }
      const emSnap = await getDoc(doc(db, 'admin_params', 'emetteur'));
      const emetteur = emSnap.exists() ? emSnap.data() : undefined;
      const quoteSnap = await getDoc(doc(db, 'quotes', d.id));
      if (!quoteSnap.exists()) return;
      downloadPDF(generateDevis(quoteSnap.data(), emetteur), `${d.numero}.pdf`);
    } catch (err) {
      showToast('Erreur PDF', 'error');
    }
  };

  const filtered = commandes.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return cmdNumero(d).toLowerCase().includes(s) || d.lignes?.[0]?.nom_fr?.toLowerCase().includes(s);
  });

  const documents = (d: Devis) => {
    const n = getNumero(d);
    return [
      { icon: '📄', name: 'Devis', code: `DVS-${n}`, url: d.devis_url, status: d.devis_url ? 'Disponible' : 'En cours' },
      { icon: '🧾', name: 'Facture acompte', code: `FA-${n}`, url: d.facture_acompte_url, status: d.facture_acompte_url ? 'Disponible' : 'En attente' },
      { icon: '📃', name: 'Facture finale', code: `FF-${n}`, url: d.facture_finale_url, status: d.facture_finale_url ? 'Disponible' : 'Après paiement complet' },
      { icon: '⚓', name: 'Facture logistique', code: `FL-${n}`, url: d.facture_logistique_url, status: d.facture_logistique_url ? 'Disponible' : 'Au départ du conteneur' },
      { icon: '🚚', name: 'Bon de livraison', code: `BL-${n}`, url: d.bon_livraison_url, status: d.bon_livraison_url ? 'Disponible' : 'Après expédition confirmée' },
    ];
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Mes commandes</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Vos devis validés avec un premier acompte encaissé.</p>

      <div style={{ marginBottom: 20 }}>
        <input type="text" placeholder="Rechercher une commande..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 16px', borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }} />
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 60, textAlign: 'center', color: '#6B7280' }}>
          {search ? 'Aucune commande trouvée.' : 'Aucune commande pour le moment.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(d => {
            const isOpen = expandedId === d.id;
            const statutCmd = getStatutCmd(d);
            const encaisse = totalEncaisse(d);
            const declare = totalDeclare(d);
            const solde = d.total_ht - encaisse - declare;

            return (
              <div key={d.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                {/* Header */}
                <div onClick={() => setExpandedId(isOpen ? null : d.id)}
                  style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', cursor: 'pointer', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: '#1565C0', fontSize: 14 }}>{cmdNumero(d)}</span>
                      <span style={{ background: statutCmd.bg, color: statutCmd.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{statutCmd.label}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} · {d.lignes?.[0]?.nom_fr || 'Commande'}
                    </p>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#1565C0', whiteSpace: 'nowrap' }}>{d.total_ht?.toLocaleString('fr-FR')} €</span>
                  <button onClick={e => { e.stopPropagation(); handleDownloadPDF(d); }}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#1565C0', fontWeight: 600 }}>
                    📥 PDF
                  </button>
                  <button onClick={e => { e.stopPropagation(); setPopupDevis(d); }}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #0D9488', background: '#E0F2F1', fontSize: 12, cursor: 'pointer', color: '#0D9488', fontWeight: 600 }}>
                    💶 Acompte
                  </button>
                  <span style={{ fontSize: 16, color: '#9CA3AF', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : '', display: 'inline-block' }}>▾</span>
                </div>

                {/* Body */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #F3F4F6', padding: 20 }}>
                    {/* Détail commande - 3 colonnes */}
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1565C0', marginBottom: 12 }}>Détail commande</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                      {/* Col 1 - Infos */}
                      <div style={{ fontSize: 12 }}>
                        <p style={{ color: '#6B7280', marginBottom: 6 }}><strong>Destination :</strong> {d.pays_livraison || profile?.pays || '—'}</p>
                        <p style={{ color: '#6B7280', marginBottom: 6 }}><strong>Partenaire :</strong> {d.partenaire_code || 'Direct'}</p>
                        <p style={{ color: '#6B7280', fontSize: 11 }}><strong>Paiement :</strong> Virement bancaire / LUXENT LIMITED</p>
                      </div>
                      {/* Col 2 - Produits */}
                      <div style={{ fontSize: 12 }}>
                        {(d.lignes || []).map((l, i) => (
                          <p key={i} style={{ color: '#374151', marginBottom: 4 }}>{l.qte}x {l.nom_fr} — {l.prix_unitaire?.toLocaleString('fr-FR')} €</p>
                        ))}
                      </div>
                      {/* Col 3 - Totaux */}
                      <div style={{ fontSize: 12, textAlign: 'right' }}>
                        <p style={{ color: '#6B7280', marginBottom: 4 }}>Sous-total HT : {d.total_ht?.toLocaleString('fr-FR')} €</p>
                        <p style={{ color: '#6B7280', marginBottom: 4 }}>TVA (0% DOM) : 0 €</p>
                        <p style={{ color: '#6B7280', marginBottom: 4 }}>Frais livraison : {d.facture_logistique_url ? 'Inclus' : 'À définir'}</p>
                        <p style={{ fontWeight: 800, color: '#1565C0', fontSize: 15 }}>Total : {d.total_ht?.toLocaleString('fr-FR')} €</p>
                      </div>
                    </div>

                    {/* Documents */}
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1565C0', marginBottom: 12 }}>Documents</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 24 }}>
                      {documents(d).map((docItem, i) => {
                        const available = !!docItem.url;
                        return (
                          <div key={i} style={{
                            padding: '12px 8px', borderRadius: 12, background: available ? '#fff' : '#F9FAFB',
                            border: `1px solid ${available ? '#E5E7EB' : '#F3F4F6'}`,
                            opacity: available ? 1 : 0.5, textAlign: 'center',
                          }}>
                            <div style={{ fontSize: 22, marginBottom: 6 }}>{docItem.icon}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#1565C0', marginBottom: 2 }}>{docItem.name}</div>
                            <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 6 }}>{docItem.code}</div>
                            <div style={{
                              fontSize: 9, padding: '2px 6px', borderRadius: 8, display: 'inline-block',
                              background: available ? '#DCFCE7' : '#F3F4F6',
                              color: available ? '#166534' : '#9CA3AF',
                            }}>{docItem.status}</div>
                            {available && (
                              <div style={{ marginTop: 6, display: 'flex', gap: 4, justifyContent: 'center' }}>
                                <button onClick={() => window.open(docItem.url, '_blank')} style={{ fontSize: 10, padding: '3px 6px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>👁</button>
                                <button onClick={() => { const a = document.createElement('a'); a.href = docItem.url!; a.download = docItem.code + '.pdf'; a.click(); }}
                                  style={{ fontSize: 10, padding: '3px 6px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>📥</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Suivi paiements */}
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1565C0', marginBottom: 12 }}>Suivi des paiements</h4>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                      <div style={{ flex: 1, background: '#DCFCE7', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                        <p style={{ fontSize: 11, color: '#166534' }}>Encaissé</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#166534' }}>{encaisse.toLocaleString('fr-FR')} €</p>
                      </div>
                      <div style={{ flex: 1, background: '#FEF3C7', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                        <p style={{ fontSize: 11, color: '#92400E' }}>Déclaré</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#92400E' }}>{declare.toLocaleString('fr-FR')} €</p>
                      </div>
                      <div style={{ flex: 1, background: '#DBEAFE', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                        <p style={{ fontSize: 11, color: '#1E40AF' }}>Solde restant</p>
                        <p style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF' }}>{Math.max(0, solde).toLocaleString('fr-FR')} €</p>
                      </div>
                    </div>

                    {/* Historique acomptes */}
                    {d.acomptes && d.acomptes.length > 0 && (
                      <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Historique des acomptes</div>
                        {d.acomptes.map((a, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: i < d.acomptes.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                            <span style={{ color: '#6B7280' }}>{new Date(a.date).toLocaleDateString('fr-FR')}</span>
                            <span style={{ fontWeight: 600, color: '#374151' }}>{a.montant?.toLocaleString('fr-FR')} €</span>
                            <span style={{
                              padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                              background: a.statut === 'encaisse' ? '#DCFCE7' : a.statut === 'declare' ? '#FEF3C7' : '#FEE2E2',
                              color: a.statut === 'encaisse' ? '#166534' : a.statut === 'declare' ? '#92400E' : '#991B1B',
                            }}>
                              {a.statut === 'encaisse' ? 'Encaissé' : a.statut === 'declare' ? 'Déclaré' : 'Rejeté'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {peutVerserAcompte(d) && (
                      <button onClick={() => setPopupDevis(d)} style={{
                        width: '100%', padding: '12px 0', background: '#0D9488', color: '#fff',
                        border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      }}>
                        Verser un acompte
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {popupDevis && (
        <PopupAcompte
          devisId={popupDevis.id}
          devisNumero={popupDevis.numero}
          clientNom={popupDevis.client_nom || `${profile?.firstName || ''} ${profile?.lastName || ''}`}
          onClose={() => setPopupDevis(null)}
          onAcompteAdded={loadCommandes}
        />
      )}
    </div>
  );
}
