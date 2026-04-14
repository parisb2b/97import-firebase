import { useState, useEffect } from 'react';
import { useRoute, Link, Redirect } from 'wouter';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';
import { useI18n } from '../../i18n';

interface Devis {
  id: string;
  numero: string;
  statut: string;
  total_ht: number;
  createdAt: any;
}

const STATUT_STYLE: Record<string, { bg: string; color: string }> = {
  accepte: { bg: '#DCFCE7', color: '#166534' },
  envoye: { bg: '#DBEAFE', color: '#1E40AF' },
  refuse: { bg: '#FEE2E2', color: '#991B1B' },
};

export default function MonCompte() {
  const { t } = useI18n();
  const [, params] = useRoute('/mon-compte/:tab?');
  const [devis, setDevis] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);

  const user = clientAuth.currentUser;
  const currentTab = params?.tab || 'devis';

  const TABS = [
    { id: 'devis', label: t('espace.mesDevis'), icon: '📋' },
    { id: 'factures', label: 'Factures', icon: '🧾' },
    { id: 'livraison', label: 'Suivi livraison', icon: '🚚' },
    { id: 'sav', label: 'SAV', icon: '🔧' },
  ];

  useEffect(() => {
    if (!user) return;
    const loadDevis = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'quotes'),
          where('client_id', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setDevis(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Devis)));
      } catch (err) {
        console.error('Error loading devis:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDevis();
  }, [user]);

  if (!user) return <Redirect to="/connexion" />;

  const statutStyle = (statut: string): React.CSSProperties => {
    const s = STATUT_STYLE[statut] || { bg: '#F3F4F6', color: '#374151' };
    return { background: s.bg, color: s.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 };
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0B2545', marginBottom: 32 }}>{t('auth.monCompte')}</h1>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{ width: 240, flexShrink: 0 }}>
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 16, marginBottom: 16 }}>
            <p style={{ fontWeight: 600, color: '#0B2545' }}>{user.displayName || 'Client'}</p>
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{user.email}</p>
          </div>

          <nav style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            {TABS.map((tab) => (
              <Link key={tab.id} href={`/mon-compte/${tab.id}`}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                  borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
                  background: currentTab === tab.id ? '#0B2545' : 'white',
                  color: currentTab === tab.id ? 'white' : '#374151',
                  fontWeight: currentTab === tab.id ? 600 : 400, fontSize: 14,
                }}>
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {currentTab === 'devis' && (
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: 16, borderBottom: '1px solid #F3F4F6' }}>
                <h2 style={{ fontWeight: 700, fontSize: 18, color: '#0B2545' }}>{t('espace.mesDevis')}</h2>
              </div>
              {loading ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>{t('loading')}</div>
              ) : devis.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>{t('espace.aucunDevis')}</div>
              ) : (
                <div>
                  {devis.map((d) => (
                    <div key={d.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderBottom: '1px solid #F3F4F6',
                    }}>
                      <div>
                        <p style={{ fontWeight: 600, color: '#0B2545', fontSize: 14 }}>{d.numero}</p>
                        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                          {d.createdAt?.toDate?.()?.toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={statutStyle(d.statut)}>{t(`statut.${d.statut}`)}</span>
                        <p style={{ fontWeight: 700, color: '#0B2545', marginTop: 4, fontSize: 14 }}>
                          {d.total_ht?.toLocaleString('fr-FR')} €
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentTab === 'factures' && (
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 32, textAlign: 'center', color: '#6B7280' }}>
              Les factures apparaitront ici apres validation de vos devis
            </div>
          )}

          {currentTab === 'livraison' && (
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 32, textAlign: 'center', color: '#6B7280' }}>
              Le suivi de livraison apparaitra ici apres expedition
            </div>
          )}

          {currentTab === 'sav' && (
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 32 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18, color: '#0B2545', marginBottom: 16 }}>Service apres-vente</h2>
              <p style={{ color: '#6B7280', marginBottom: 16 }}>
                Pour toute demande SAV, contactez-nous :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p>📧 <a href="mailto:luxent@ltd-uk.eu" style={{ color: '#0B2545', textDecoration: 'underline' }}>luxent@ltd-uk.eu</a></p>
                <p>📞 France: +33 620 607 448</p>
                <p>📞 Chine: +86 135 6627 1902</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
