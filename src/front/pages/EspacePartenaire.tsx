import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';

// Réutilisation des onglets client v29
import MesDevis from './espace-client/MesDevis';
import MesCommandes from './espace-client/MesCommandes';
import MesVirements from './espace-client/MesVirements';
import MesFactures from './espace-client/MesFactures';
import SuiviAchats from './espace-client/SuiviAchats';
import ContinuerAchats from './espace-client/ContinuerAchats';
import MesInfos from './espace-client/MesInfos';
import MesAdresses from './espace-client/MesAdresses';
import SAV from './espace-client/SAV';

// Onglets partenaire v30
import MesClientsPartner from './espace-partenaire/MesClientsPartner';
import GestionDevisPartner from './espace-partenaire/GestionDevisPartner';
import MesCommissionsPartner from './espace-partenaire/MesCommissionsPartner';

export default function EspacePartenaire() {
  const [activeTab, setActiveTab] = useState('devis');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [partnerCode, setPartnerCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [, navigate] = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(clientAuth, async (u) => {
      if (!u) { setLoading(false); setUser(null); return; }
      setUser(u);
      try {
        // Load profile
        const snap = await getDoc(doc(db, 'users', u.uid));
        const p = snap.exists() ? snap.data() : null;
        setProfile(p);

        // V44 : résolution du code partenaire en cascade
        // 1. /partners/{uid} (nouvelle convention)
        const partnerDocSnap = await getDoc(doc(db, 'partners', u.uid));
        if (partnerDocSnap.exists()) {
          setPartnerCode(partnerDocSnap.data().code);
        } else {
          // 2. /partners where userId == uid (ancien schéma)
          const pSnap = await getDocs(query(collection(db, 'partners'), where('userId', '==', u.uid)));
          if (!pSnap.empty) {
            setPartnerCode(pSnap.docs[0].data().code);
          } else if (u.email) {
            // 3. V62 fallback : /partners where email == user email
            const pEmailSnap = await getDocs(query(collection(db, 'partners'), where('email', '==', u.email)));
            if (!pEmailSnap.empty) {
              setPartnerCode(pEmailSnap.docs[0].data().code);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handlePartnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr('');
    try {
      const cred = await signInWithEmailAndPassword(clientAuth, loginEmail, loginPwd);
      // Vérifier que l'utilisateur a le rôle partenaire
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      const p = snap.exists() ? snap.data() : null;
      if (!p || p.role !== 'partner') {
        setLoginErr('Ce compte n\'est pas un compte partenaire. Veuillez utiliser l\'espace client.');
        await clientAuth.signOut();
        return;
      }
    } catch (err: any) {
      setLoginErr(err.message || 'Erreur de connexion');
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>;
  if (!user) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4F8' }}>
        <div style={{ width: 400, padding: 40, background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🤝</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Espace Partenaire</h1>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Connectez-vous pour gérer vos clients et devis</p>
          </div>
          <form onSubmit={handlePartnerLogin}>
            <input autoFocus type="email" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
            <input type="password" placeholder="Mot de passe" value={loginPwd} onChange={e => setLoginPwd(e.target.value)} required
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }} />
            {loginErr && <p style={{ color: '#DC2626', fontSize: 12, marginBottom: 12 }}>{loginErr}</p>}
            <button type="submit"
              style={{ width: '100%', padding: '12px 24px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Se connecter
            </button>
          </form>
          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 16 }}>
            Vous êtes client ? <a href="/connexion" style={{ color: '#1565C0', fontWeight: 600 }}>Espace client</a>
          </p>
        </div>
      </div>
    );
  }
  if (!profile) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement du profil...</div>;

  const clientTabs = [
    { id: 'devis', label: 'Mes devis', icon: '📋' },
    { id: 'commandes', label: 'Mes commandes', icon: '📦' },
    { id: 'virements', label: 'Mes virements', icon: '💳' },
    { id: 'factures', label: 'Mes factures', icon: '🧾' },
    { id: 'suivi', label: 'Suivre mes achats', icon: '🚚' },
    { id: 'achats', label: 'Continuer mes achats', icon: '🛒' },
    { id: 'infos', label: 'Mes infos', icon: '👤' },
    { id: 'adresses', label: 'Mes adresses', icon: '📍' },
    { id: 'sav', label: 'SAV', icon: '❓' },
  ];

  const partnerTabs = [
    { id: 'p-clients', label: 'Mes clients', icon: '👥' },
    { id: 'p-devis', label: 'Gestion des devis', icon: '📄' },
    { id: 'p-commissions', label: 'Mes commissions', icon: '💰' },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'devis': return <MesDevis userId={user.uid} profile={profile} />;
      case 'commandes': return <MesCommandes userId={user.uid} profile={profile} />;
      case 'virements': return <MesVirements userId={user.uid} profile={profile} />;
      case 'factures': return <MesFactures userId={user.uid} profile={profile} />;
      case 'suivi': return <SuiviAchats userId={user.uid} />;
      case 'achats': return <ContinuerAchats />;
      case 'infos': return <MesInfos userId={user.uid} profile={profile} />;
      case 'adresses': return <MesAdresses userId={user.uid} profile={profile} />;
      case 'sav': return <SAV userId={user.uid} profile={profile} />;
      case 'p-clients': return partnerCode ? <MesClientsPartner partnerCode={partnerCode} /> : <div style={{ padding: 40, color: '#6B7280' }}>Code partenaire non trouvé.</div>;
      case 'p-devis': return partnerCode ? <GestionDevisPartner partnerCode={partnerCode} /> : <div style={{ padding: 40, color: '#6B7280' }}>Code partenaire non trouvé.</div>;
      case 'p-commissions': return partnerCode ? <MesCommissionsPartner partnerCode={partnerCode} /> : <div style={{ padding: 40, color: '#6B7280' }}>Code partenaire non trouvé.</div>;
      default: return <MesDevis userId={user.uid} profile={profile} />;
    }
  };

  const initials = ((profile.firstName?.[0] || profile.prenom?.[0] || '') + (profile.lastName?.[0] || profile.nom?.[0] || '')).toUpperCase() || '👤';

  const tabStyle = (tabId: string) => ({
    padding: '10px 20px', cursor: 'pointer', fontSize: 13,
    fontWeight: activeTab === tabId ? 600 : 400,
    color: '#38608F',
    background: activeTab === tabId ? '#98CCEC' : 'transparent',
    borderLeft: activeTab === tabId ? '3px solid #38608F' : '3px solid transparent',
    display: 'flex', alignItems: 'center', gap: 10,
    transition: 'all .15s',
  } as const);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', background: '#F0F4F8' }}>
      {/* SIDEBAR */}
      <div style={{
        width: 240, background: '#ACDBF7', padding: '24px 0',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {/* Avatar + nom */}
        <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: '#7C3AED',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, margin: '0 auto 10px',
          }}>
            {initials}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#38608F' }}>
            {profile.firstName || profile.prenom || ''} {profile.lastName || profile.nom || ''}
          </div>
          <div style={{ fontSize: 11, color: '#38608F', opacity: 0.7 }}>{profile.email}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
            <span style={{
              display: 'inline-block', padding: '2px 12px',
              background: '#7C3AED', borderRadius: 20, fontSize: 10,
              fontWeight: 700, color: '#fff', textTransform: 'uppercase',
            }}>PARTENAIRE {partnerCode || ''}</span>
          </div>
        </div>

        {/* Onglets client */}
        {clientTabs.map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle(tab.id)}>
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </div>
        ))}

        {/* Séparateur ESPACE PARTENAIRE */}
        <div style={{
          padding: '6px 20px', fontSize: 9, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: 1,
          color: '#38608F', opacity: 0.5, marginTop: 16,
        }}>ESPACE PARTENAIRE</div>

        {/* Onglets partenaire */}
        {partnerTabs.map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle(tab.id)}>
            <span style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </div>
        ))}

        <div style={{ flex: 1 }} />
        <div style={{ borderTop: '1px solid rgba(56,96,143,.12)', margin: '12px 0' }} />
        <div onClick={() => { clientAuth.signOut(); navigate('/'); }}
          style={{
            padding: '10px 20px', cursor: 'pointer', fontSize: 13,
            color: '#38608F', display: 'flex', alignItems: 'center', gap: 10,
          }}>
          <span style={{ fontSize: 16 }}>🚪</span> Déconnexion
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: '28px 32px', overflow: 'auto' }}>
        {renderTab()}
      </div>
    </div>
  );
}
