import { useState, useEffect } from 'react';
import { Link, useLocation, Redirect } from 'wouter';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { generateDevis, generateFactureAcompte, downloadPDF } from '../../lib/pdf-generator';
import { useToast } from '../components/Toast';

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
}

const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
  nouveau: { bg: '#DBEAFE', color: '#1E40AF' },
  brouillon: { bg: '#F3F4F6', color: '#374151' },
  envoye: { bg: '#DBEAFE', color: '#1E40AF' },
  accepte: { bg: '#DCFCE7', color: '#166534' },
  refuse: { bg: '#FEE2E2', color: '#991B1B' },
  en_production: { bg: '#FEF3C7', color: '#92400E' },
  expedie: { bg: '#E0E7FF', color: '#3730A3' },
  livre: { bg: '#DCFCE7', color: '#166534' },
};

export default function EspaceClient() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const user = clientAuth.currentUser;
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState('devis');
  const [showAcomptePopup, setShowAcomptePopup] = useState(false);
  const [acompteDevis, setAcompteDevis] = useState<Devis | null>(null);
  const [acompteStep, setAcompteStep] = useState<'montant' | 'rib'>('montant');
  const [acompteMontant, setAcompteMontant] = useState(500);
  const [acompteTypeCompte, setAcompteTypeCompte] = useState<'perso' | 'pro'>('perso');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'quotes'),
          where('client_id', '==', user.uid)
        );
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
  }, [user]);

  if (!user) return <Redirect to="/connexion" />;

  const handleDownloadDoc = async (d: Devis, docType: 'devis' | 'facture_acompte') => {
    try {
      const emSnap = await getDoc(doc(db, 'admin_params', 'emetteur'));
      const emetteur = emSnap.exists() ? emSnap.data() : undefined;
      const quoteSnap = await getDoc(doc(db, 'quotes', d.id));
      if (!quoteSnap.exists()) return;
      const data = quoteSnap.data();
      if (docType === 'devis') {
        downloadPDF(generateDevis(data, emetteur), `${d.numero}.pdf`);
      } else if (docType === 'facture_acompte' && d.acomptes?.length) {
        downloadPDF(generateFactureAcompte(data, d.acomptes[0], emetteur), `FA-${d.numero}.pdf`);
      }
    } catch (err) {
      console.error('PDF error:', err);
      showToast('Erreur de génération PDF', 'error');
    }
  };

  const handleVerserAcompte = (d: Devis) => {
    setAcompteDevis(d);
    setAcompteMontant(500);
    setAcompteTypeCompte('perso');
    setAcompteStep('montant');
    setShowAcomptePopup(true);
  };

  const handleLogout = async () => {
    await clientAuth.signOut();
    setLocation('/');
  };

  const totalEncaisse = (d: Devis) =>
    (d.acomptes || []).filter(a => a.statut === 'encaisse').reduce((s, a) => s + a.montant, 0);
  const totalDeclare = (d: Devis) =>
    (d.acomptes || []).filter(a => a.statut === 'declare').reduce((s, a) => s + a.montant, 0);

  const menuItems = [
    { id: 'devis', icon: '📋', label: t('espace.mesDevis') },
    { id: 'profil', icon: '👤', label: t('espace.monProfil') },
    { id: 'achats', icon: '🛍', label: t('espace.continuerAchats') },
    { id: 'logout', icon: '🚪', label: t('auth.deconnexion') },
  ];

  const statutStyle = (statut: string) => {
    const s = STATUT_COLORS[statut] || STATUT_COLORS.brouillon;
    return { background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600 as const };
  };

  return (
    <div style={{ background: '#F9FAFB', minHeight: '80vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 20px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'start' }}>

        {/* ═══ Sidebar ═══ */}
        <div style={{ position: 'sticky', top: 80 }}>
          {/* User card */}
          <div style={{
            background: '#0B2545', borderRadius: 16, padding: 24, color: 'white', marginBottom: 16,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#1E3A5F',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 12,
            }}>
              {user.displayName?.[0]?.toUpperCase() || '👤'}
            </div>
            <p style={{ fontWeight: 700, fontSize: 16 }}>{user.displayName || 'Client'}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{user.email}</p>
            <span style={{ display: 'inline-block', marginTop: 8, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
              CLIENT
            </span>
          </div>

          {/* Menu */}
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {menuItems.map(item => (
              <button key={item.id}
                onClick={() => {
                  if (item.id === 'logout') handleLogout();
                  else if (item.id === 'profil') setLocation('/profil');
                  else if (item.id === 'achats') setLocation('/catalogue');
                  else setActiveMenu(item.id);
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
                  border: 'none', borderBottom: '1px solid #F3F4F6', cursor: 'pointer', fontSize: 14,
                  background: activeMenu === item.id ? '#0B2545' : 'white',
                  color: activeMenu === item.id ? 'white' : '#374151',
                  fontWeight: activeMenu === item.id ? 600 : 400,
                }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Content ═══ */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0B2545', marginBottom: 4 }}>{t('espace.mesDevis')}</h1>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
            {t('espace.mesDevisDesc')}
          </p>

          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>
          ) : devis.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 16, padding: 60, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <p style={{ color: '#6B7280', marginBottom: 16 }}>{t('espace.aucunDevis')}</p>
              <Link href="/catalogue">
                <span style={{ color: '#0B2545', fontWeight: 600, cursor: 'pointer' }}>{t('espace.parcourirCatalogue')}</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {devis.map(d => {
                const isOpen = expandedId === d.id;
                const encaisse = totalEncaisse(d);
                const declare = totalDeclare(d);
                const solde = d.total_ht - encaisse;
                const mainProduct = d.lignes?.[0]?.nom_fr || 'Devis';

                return (
                  <div key={d.id} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    {/* Header - clickable */}
                    <div onClick={() => setExpandedId(isOpen ? null : d.id)}
                      style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: '#0B2545', fontSize: 15 }}>{d.numero}</span>
                          <span style={statutStyle(d.statut)}>{d.statut}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#9CA3AF' }}>
                          {d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '—'} · {mainProduct}
                          {d.lignes?.length > 1 ? ` +${d.lignes.length - 1}` : ''}
                        </p>
                      </div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: '#0B2545' }}>
                        {d.total_ht?.toLocaleString('fr-FR')} €
                      </span>
                      <span style={{ fontSize: 18, color: '#9CA3AF', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : '' }}>▾</span>
                    </div>

                    {/* Body - expandable */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #F3F4F6', padding: '20px' }}>
                        {/* Documents */}
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0B2545', marginBottom: 12 }}>{t('espace.documents')}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                          {[
                            { icon: '📄', label: 'Devis', status: 'Disponible', active: true, action: () => handleDownloadDoc(d, 'devis') },
                            { icon: '🧾', label: 'Facture acompte', status: encaisse > 0 ? 'Disponible' : 'En attente', active: encaisse > 0, action: () => handleDownloadDoc(d, 'facture_acompte') },
                            { icon: '🚚', label: 'Bon de livraison', status: 'Apres expedition', active: false, action: undefined },
                            { icon: '📃', label: 'Facture finale', status: 'Apres paiement complet', active: false, action: undefined },
                          ].map((docItem, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                              borderRadius: 10, background: '#F9FAFB',
                              opacity: docItem.active ? 1 : 0.5,
                            }}>
                              <span style={{ fontSize: 18 }}>{docItem.icon}</span>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#0B2545' }}>{docItem.label}</p>
                                <p style={{ fontSize: 11, color: '#9CA3AF' }}>{docItem.status}</p>
                              </div>
                              {docItem.active && (
                                <button onClick={docItem.action} style={{
                                  padding: '4px 10px', borderRadius: 8, border: '1px solid #E5E7EB',
                                  background: 'white', fontSize: 11, cursor: 'pointer', color: '#374151',
                                }}>Telecharger</button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Suivi paiements */}
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0B2545', marginBottom: 12 }}>{t('espace.paiements')}</h4>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                          <div style={{ flex: 1, background: '#DCFCE7', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                            <p style={{ fontSize: 11, color: '#166534' }}>Encaisse</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: '#166534' }}>{encaisse.toLocaleString('fr-FR')} €</p>
                          </div>
                          <div style={{ flex: 1, background: '#FEF3C7', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                            <p style={{ fontSize: 11, color: '#92400E' }}>Declare</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: '#92400E' }}>{declare.toLocaleString('fr-FR')} €</p>
                          </div>
                          <div style={{ flex: 1, background: '#FEE2E2', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                            <p style={{ fontSize: 11, color: '#991B1B' }}>Solde restant</p>
                            <p style={{ fontSize: 18, fontWeight: 800, color: '#991B1B' }}>{solde.toLocaleString('fr-FR')} €</p>
                          </div>
                        </div>

                        {/* Verser un acompte */}
                        {solde > 0 && (
                          <button onClick={() => handleVerserAcompte(d)} style={{
                            width: '100%', padding: '12px 0', background: '#0D9488', color: 'white',
                            border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                          }}>
                            {t('espace.verserAcompte')}
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
      </div>

      {showAcomptePopup && acompteDevis && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,37,69,.6)', backdropFilter: 'blur(5px)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowAcomptePopup(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, padding: 34, width: '100%', maxWidth: 490, boxShadow: '0 24px 64px rgba(0,0,0,.28)' }}>
            {acompteStep === 'montant' && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 4, background: '#1565C0' }} />
                  <div style={{ flex: 1, height: 4, borderRadius: 4, background: '#E8ECF4' }} />
                </div>
                <div style={{ fontSize: 26, marginBottom: 16 }}>💶</div>
                <h2 style={{ fontSize: 21, fontWeight: 700, color: '#1565C0', marginBottom: 6 }}>Verser un acompte</h2>
                <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>Devis {acompteDevis.numero} — Total : {acompteDevis.total_ht?.toLocaleString('fr-FR')} €</p>

                {acompteDevis.acomptes && acompteDevis.acomptes.length > 0 && (
                  <div style={{ background: '#F5F7FA', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1565C0', marginBottom: 8 }}>Paiements précédents</div>
                    {acompteDevis.acomptes.map((a: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                        <span style={{ color: '#6B7280' }}>Acompte {i + 1}</span>
                        <span style={{ fontWeight: 600, color: a.statut === 'encaisse' ? '#059669' : '#D97706' }}>{a.montant?.toLocaleString('fr-FR')} € — {a.statut === 'encaisse' ? '✅ Encaissé' : '⏳ Déclaré'}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 700, color: '#1565C0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Type de compte</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  {(['perso', 'pro'] as const).map(type => (
                    <div key={type} onClick={() => setAcompteTypeCompte(type)} style={{
                      padding: 12, borderRadius: 12, border: `2px solid ${acompteTypeCompte === type ? '#0D9488' : '#E8ECF4'}`,
                      background: acompteTypeCompte === type ? '#E0F2F1' : '#fff', cursor: 'pointer', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{type === 'perso' ? '👤' : '🏢'}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1565C0' }}>{type === 'perso' ? 'Compte personnel' : 'Compte professionnel'}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#E0F2F1', border: '2px solid #26A69A', borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
                  <label style={{ fontSize: 13, color: '#00897B', fontWeight: 600, flex: 1 }}>💶 Montant</label>
                  <input type="number" value={acompteMontant} onChange={e => setAcompteMontant(Number(e.target.value))}
                    style={{ width: 90, padding: '7px 10px', border: 'none', background: 'rgba(255,255,255,.8)', borderRadius: 8, fontSize: 17, fontWeight: 700, color: '#00897B', textAlign: 'center' }} />
                  <span style={{ fontSize: 10, color: '#00897B', background: 'rgba(0,137,123,.12)', padding: '2px 8px', borderRadius: 20 }}>modifiable</span>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Par défaut 500€ · Virement bancaire uniquement</div>

                <button onClick={() => setAcompteStep('rib')} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #1565C0, #1E88E5)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
                  J'ai effectué le virement →
                </button>
                <button onClick={() => setShowAcomptePopup(false)} style={{ width: '100%', padding: 14, background: 'transparent', color: '#6B7280', border: '1.5px solid #CBD5E1', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>
                  Annuler
                </button>
              </>
            )}

            {acompteStep === 'rib' && (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 4, background: '#0D9488' }} />
                  <div style={{ flex: 1, height: 4, borderRadius: 4, background: '#1565C0' }} />
                </div>
                <div style={{ fontSize: 26, marginBottom: 16 }}>🏦</div>
                <h2 style={{ fontSize: 21, fontWeight: 700, color: '#1565C0', marginBottom: 6 }}>Coordonnées bancaires</h2>
                <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>Effectuez votre virement de <strong>{acompteMontant.toLocaleString('fr-FR')} €</strong> puis cliquez sur Confirmer.</p>

                <div style={{ background: '#F5F7FA', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: '#1565C0', marginBottom: 12, fontSize: 14 }}>LUXENT LIMITED — Compte {acompteTypeCompte === 'pro' ? 'professionnel' : 'personnel'}</div>
                  {[
                    { k: 'IBAN', v: 'DE76 2022 0800 0059 5688 30' },
                    { k: 'SWIFT', v: 'SXPYDEHH' },
                    { k: 'Banque', v: 'Banking Circle S.A. — Munich' },
                    { k: 'Bénéficiaire', v: 'LUXENT LIMITED' },
                    { k: 'Référence', v: `${acompteDevis.numero} / ${acompteDevis.client_nom || ''}` },
                    { k: 'Montant', v: `${acompteMontant.toLocaleString('fr-FR')} €`, highlight: true },
                  ].map((row: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0', borderBottom: i < 5 ? '1px solid #E8ECF4' : 'none' }}>
                      <span style={{ color: '#6B7280', fontSize: 12, minWidth: 80 }}>{row.k}</span>
                      <span style={{ fontWeight: 600, color: row.highlight ? '#00897B' : '#1565C0', fontSize: row.highlight ? 16 : 13 }}>{row.v}</span>
                    </div>
                  ))}
                </div>

                <button onClick={async () => {
                  try {
                    const devisRef = doc(db, 'quotes', acompteDevis.id);
                    const currentAcomptes = acompteDevis.acomptes || [];
                    await updateDoc(devisRef, {
                      acomptes: [...currentAcomptes, { montant: acompteMontant, date: new Date().toISOString(), type_compte: acompteTypeCompte, statut: 'declare' }],
                      updatedAt: new Date(),
                    });
                    setShowAcomptePopup(false);
                    showToast(`Acompte de ${acompteMontant} € déclaré sur ${acompteDevis.numero} ✅`);
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                    showToast('Erreur lors de la déclaration', 'error');
                  }
                }} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #1565C0, #1E88E5)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  ✅ J'ai effectué le virement — Confirmer
                </button>
                <button onClick={() => setShowAcomptePopup(false)} style={{ width: '100%', padding: 14, background: 'transparent', color: '#6B7280', border: '1.5px solid #CBD5E1', borderRadius: 12, fontSize: 14, cursor: 'pointer' }}>
                  Fermer — Je virerai plus tard
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
