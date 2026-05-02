import { useState, useEffect } from 'react';
import { useLocation, Redirect } from 'wouter';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { useToast } from '../components/Toast';

export default function Profil() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const user = clientAuth.currentUser;

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('MQ');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isIncomplete, setIsIncomplete] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'clients', user.uid));
        const data = snap.data();
        if (data) {
          setNom(data.lastName || data.nom || user.displayName?.split(' ').slice(1).join(' ') || '');
          setPrenom(data.firstName || user.displayName?.split(' ')[0] || '');
          setEmail(data.email || user.email || '');
          setTelephone(data.telephone || '');
          setAdresse(data.adresse || '');
          setCodePostal(data.codePostal || '');
          setVille(data.ville || '');
          setPays(data.pays || 'MQ');
          setIsIncomplete(!data.telephone || !data.adresse);
        } else {
          setEmail(user.email || '');
          setPrenom(user.displayName?.split(' ')[0] || '');
          setNom(user.displayName?.split(' ').slice(1).join(' ') || '');
          setIsIncomplete(true);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return <Redirect to="/connexion" />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'clients', user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: prenom,
        lastName: nom,
        nom: `${prenom} ${nom}`,
        telephone,
        adresse,
        codePostal,
        ville,
        pays,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        firstName: prenom,
        lastName: nom,
        nom: `${prenom} ${nom}`,
        telephone,
        adresse,
        codePostal,
        ville,
        pays,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      showToast('Profil enregistré avec succès !');
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const role = userSnap.data()?.role || 'user';
      setTimeout(() => {
        setLocation(role === 'partner' ? '/espace-partenaire' : '/espace-client');
      }, 1500);
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#6B7280' }}>Chargement...</div>;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', background: '#F9FAFB' }}>
      <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 40, width: '100%', maxWidth: 520 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1565C0', textAlign: 'center', marginBottom: 8 }}>{t('profil.title')}</h1>

        {isIncomplete && (
          <div style={{
            background: '#FFF7ED', border: '1px solid #FDBA74', borderRadius: 12, padding: 16, marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#92400E' }}>{t('profil.subtitle')}</p>
              <p style={{ fontSize: 12, color: '#B45309' }}>{t('profil.subtitleDesc')}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.prenom')}</label>
              <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.nom')}</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} required style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.email')}</label>
            <input type="email" value={email} disabled style={{ ...inputStyle, background: '#F3F4F6', color: '#9CA3AF' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('profil.telephone')} *</label>
            <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} required
              placeholder="+596 6 00 00 00 00" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('profil.adresse')} *</label>
            <input type="text" value={adresse} onChange={e => setAdresse(e.target.value)} required
              placeholder="12 rue du Port" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('profil.codePostal')} *</label>
              <input type="text" value={codePostal} onChange={e => setCodePostal(e.target.value)} required
                placeholder="97200" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('profil.ville')} *</label>
              <input type="text" value={ville} onChange={e => setVille(e.target.value)} required
                placeholder="Fort-de-France" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('profil.pays')} *</label>
            <select value={pays} onChange={e => setPays(e.target.value)} style={inputStyle}>
              <option value="MQ">Martinique</option>
              <option value="GP">Guadeloupe</option>
              <option value="RE">Reunion</option>
              <option value="GF">Guyane</option>
              <option value="FR">France metropolitaine</option>
            </select>
          </div>

          <button type="submit" disabled={saving} style={{
            width: '100%', padding: '14px 0', background: '#1565C0', color: 'white', border: 'none',
            borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1,
          }}>
            {saving ? '...' : t('profil.sauvegarder')}
          </button>
        </form>
      </div>
    </div>
  );
}
