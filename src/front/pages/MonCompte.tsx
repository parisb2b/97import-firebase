import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, clientAuth } from '@/lib/firebase';
import { useClientAuth } from '@/front/hooks/useClientAuth';

type Tab =
  | 'devis' | 'factures' | 'virements' | 'livraisons' | 'profil'
  | 'partner-clients' | 'partner-devis-vip' | 'partner-commissions';

export default function MonCompte() {
  const [, navigate] = useLocation();
  const { user, role, loading } = useClientAuth();
  const [activeTab, setActiveTab] = useState<Tab>('devis');

  useEffect(() => {
    if (!loading && !user) navigate('/connexion');
  }, [loading, user, navigate]);

  if (loading) return <div style={{ padding: 80, textAlign: 'center' }}>Chargement...</div>;
  if (!user) return null;

  const isPartner = role === 'partner';

  const tabsClient = [
    { id: 'devis' as Tab, label: 'Mes devis', icon: '📋' },
    { id: 'factures' as Tab, label: 'Mes factures', icon: '🧾' },
    { id: 'virements' as Tab, label: 'Mes virements', icon: '💳' },
    { id: 'livraisons' as Tab, label: 'Mes livraisons', icon: '📦' },
    { id: 'profil' as Tab, label: 'Mon profil', icon: '👤' },
  ];

  const tabsPartner = [
    { id: 'partner-clients' as Tab, label: 'Mes clients', icon: '👥' },
    { id: 'partner-devis-vip' as Tab, label: 'Devis VIP', icon: '⭐' },
    { id: 'partner-commissions' as Tab, label: 'Commissions', icon: '💰' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-2)' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, margin: 0 }}>
              Mon espace
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              {user?.email}
              {isPartner && (
                <span style={{
                  padding: '2px 10px', background: 'var(--orange)', color: '#fff',
                  borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700,
                }}>PARTENAIRE</span>
              )}
              {role === 'vip' && (
                <span style={{
                  padding: '2px 10px', background: '#7c3aed', color: '#fff',
                  borderRadius: 'var(--radius-full)', fontSize: 10, fontWeight: 700,
                }}>VIP</span>
              )}
            </p>
          </div>
          <button onClick={async () => { await clientAuth.signOut(); navigate('/'); }} style={{
            padding: '8px 16px', background: 'transparent', color: 'var(--danger)',
            border: '1px solid var(--danger)', borderRadius: 'var(--radius)',
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ padding: '32px 0' }}>
        <div className="account-layout" style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 24px',
          display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24,
        }}>
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SidebarSection label="Espace client" tabs={tabsClient} active={activeTab} onClick={setActiveTab} />
            {isPartner && (
              <SidebarSection label="Espace partenaire" labelColor="var(--orange)" tabs={tabsPartner} active={activeTab} onClick={setActiveTab} />
            )}
          </aside>

          <div style={{
            background: '#fff', padding: 24, borderRadius: 'var(--radius-lg)',
          }}>
            {activeTab === 'devis' && <ClientDevisTab user={user} />}
            {activeTab === 'factures' && <PlaceholderTab title="Mes factures" />}
            {activeTab === 'virements' && <PlaceholderTab title="Mes virements" />}
            {activeTab === 'livraisons' && <PlaceholderTab title="Mes livraisons" />}
            {activeTab === 'profil' && <ProfilTab user={user} role={role} />}
            {activeTab === 'partner-clients' && <PlaceholderTab title="Mes clients (partenaire)" />}
            {activeTab === 'partner-devis-vip' && <PlaceholderTab title="Gestion des devis VIP" />}
            {activeTab === 'partner-commissions' && <PlaceholderTab title="Mes commissions" />}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .account-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function SidebarSection({ label, labelColor, tabs, active, onClick }: any) {
  return (
    <div style={{
      background: '#fff', padding: 16, borderRadius: 'var(--radius-lg)',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: labelColor || 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 8, paddingLeft: 8,
      }}>{label}</div>
      {tabs.map((t: any) => (
        <button key={t.id} onClick={() => onClick(t.id)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', width: '100%', textAlign: 'left',
          border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer',
          fontSize: 13, fontFamily: 'inherit',
          background: active === t.id ? 'var(--blue-light)' : 'transparent',
          color: active === t.id ? 'var(--blue)' : 'var(--text-2)',
          fontWeight: active === t.id ? 600 : 400,
        }}>
          <span>{t.icon}</span><span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function ClientDevisTab({ user }: any) {
  const [devis, setDevis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'quotes'), where('client_id', '==', user.uid)));
        setDevis(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } finally { setLoading(false); }
    })();
  }, [user]);

  if (loading) return <div>Chargement...</div>;

  if (devis.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-2)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Aucun devis</div>
        <div style={{ color: 'var(--text-3)', marginTop: 8 }}>Vos demandes apparaîtront ici</div>
      </div>
    );
  }

  return (
    <>
      <h2 style={tabTitleStyle}>Mes devis ({devis.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {devis.map(d => (
          <div key={d.id} style={{
            padding: 16, background: 'var(--bg-2)', borderRadius: 'var(--radius)',
          }}>
            <div style={{ fontWeight: 600 }}>{d.numero}</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {d.lignes?.length || 0} article(s) — {(d.total_ht || 0).toLocaleString('fr-FR')} € HT
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{
                padding: '4px 10px', borderRadius: 'var(--radius-full)',
                fontSize: 11, fontWeight: 600,
                background: d.statut === 'nouveau' ? '#FEF3C7' : 'var(--blue-light)',
                color: d.statut === 'nouveau' ? '#92400E' : 'var(--blue)',
              }}>{d.statut}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ProfilTab({ user, role }: any) {
  return (
    <>
      <h2 style={tabTitleStyle}>Mon profil</h2>
      <div style={{ padding: 16, background: 'var(--bg-2)', borderRadius: 'var(--radius)' }}>
        <div style={{ marginBottom: 12 }}><strong>Email :</strong> {user?.email}</div>
        <div style={{ marginBottom: 12 }}><strong>Rôle :</strong> {role}</div>
        <div><strong>UID :</strong> <code style={{ fontSize: 12 }}>{user?.uid}</code></div>
      </div>
    </>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <>
      <h2 style={tabTitleStyle}>{title}</h2>
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-2)' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
        <div>Section en cours de développement</div>
      </div>
    </>
  );
}

const tabTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700,
  marginTop: 0, marginBottom: 16, color: 'var(--text)',
};
