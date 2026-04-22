import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { doc, getDoc } from 'firebase/firestore';
import { db, clientAuth } from '../../lib/firebase';
import { useClientAuth } from '@/front/hooks/useClientAuth';

// Import des onglets
import MesDevis from './espace-client/MesDevis';
import MesCommandes from './espace-client/MesCommandes';
import MesVirements from './espace-client/MesVirements';
import MesFactures from './espace-client/MesFactures';
import SuiviAchats from './espace-client/SuiviAchats';
import ContinuerAchats from './espace-client/ContinuerAchats';
import MesInfos from './espace-client/MesInfos';
import MesAdresses from './espace-client/MesAdresses';
import SAV from './espace-client/SAV';

export default function EspaceClient() {
  const [activeTab, setActiveTab] = useState('devis');
  const { user, role, loading } = useClientAuth();
  const [profile, setProfile] = useState<any>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/connexion');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && role === 'partner') {
      navigate('/espace-partenaire');
    }
  }, [loading, user, role, navigate]);

  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          setProfile(snap.exists() ? snap.data() : null);
        } catch (err) {
          console.error(err);
        }
      })();
    }
  }, [user]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>;
  if (!user) return null;
  if (!profile) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement du profil...</div>;

  const tabs = [
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
      default: return <MesDevis userId={user.uid} profile={profile} />;
    }
  };

  const initials = ((profile.firstName?.[0] || profile.prenom?.[0] || '') + (profile.lastName?.[0] || profile.nom?.[0] || '')).toUpperCase() || '👤';

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
            width: 56, height: 56, borderRadius: '50%', background: '#6394C0',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, margin: '0 auto 10px',
          }}>
            {initials}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#38608F' }}>
            {profile.firstName || profile.prenom || ''} {profile.lastName || profile.nom || ''}
          </div>
          <div style={{ fontSize: 11, color: '#38608F', opacity: 0.7 }}>{profile.email}</div>
          <div style={{
            display: 'inline-block', marginTop: 6, padding: '2px 12px',
            background: '#89B6D8', borderRadius: 20, fontSize: 10,
            fontWeight: 700, color: '#fff', textTransform: 'uppercase',
          }}>CLIENT</div>
        </div>

        {/* Onglets */}
        {tabs.map(tab => (
          <div key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', cursor: 'pointer', fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: '#38608F',
              background: activeTab === tab.id ? '#98CCEC' : 'transparent',
              borderLeft: activeTab === tab.id ? '3px solid #38608F' : '3px solid transparent',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'all .15s',
            }}
          >
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
