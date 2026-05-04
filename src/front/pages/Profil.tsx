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
  // V62 — adresse de livraison distincte
  const [livraisonRue, setLivraisonRue] = useState('');
  const [livraisonCP, setLivraisonCP] = useState('');
  const [livraisonVille, setLivraisonVille] = useState('');
  const [livraisonPays, setLivraisonPays] = useState('MQ');
  const [identiqueFacturation, setIdentiqueFacturation] = useState(true);
  const [addressType, setAddressType] = useState('facturation');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isIncomplete, setIsIncomplete] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);

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
          // V62 adresse livraison
          const al = data.adresse_livraison || {};
          setLivraisonRue(al.rue || '');
          setLivraisonCP(al.code_postal || '');
          setLivraisonVille(al.ville || '');
          setLivraisonPays(al.pays || 'MQ');
          setIdentiqueFacturation(al.identique_facturation !== false);
          setAddressType(data.addressType || 'facturation');
          setIsIncomplete(!data.telephone || !data.adresse);
          setIsNewProfile(false);
        } else {
          setEmail(user.email || '');
          setPrenom(user.displayName?.split(' ')[0] || '');
          setNom(user.displayName?.split(' ').slice(1).join(' ') || '');
          setIsIncomplete(true);
          setIsNewProfile(true);
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
      const commonFields = {
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
        // V79 — Type d'adresse depuis le selecteur
        addressType: addressType || 'facturation',
        adresse_livraison: identiqueFacturation ? {
          rue: adresse,
          code_postal: codePostal,
          ville,
          pays,
          identique_facturation: true,
        } : {
          rue: livraisonRue,
          code_postal: livraisonCP,
          ville: livraisonVille,
          pays: livraisonPays,
          identique_facturation: false,
          addressType: 'livraison' as const,
        },
        updatedAt: serverTimestamp(),
        // V71 — createdAt uniquement au premier enregistrement
        ...(isNewProfile ? { createdAt: serverTimestamp() } : {}),
      };

      await setDoc(doc(db, 'clients', user.uid), commonFields, { merge: true });
      await setDoc(doc(db, 'users', user.uid), commonFields, { merge: true });

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
            <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>🔒 Ce champ est verrouillé</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('profil.telephone')} *</label>
            <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} required
              placeholder="+596 6 00 00 00 00" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16, background: '#F0F9FF', padding: 16, borderRadius: 12, border: '2px solid #BAE6FD' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>📋</span>
              <label style={{ fontSize: 14, fontWeight: 700, color: '#0369A1' }}>Type d'adresse *</label>
            </div>
            <select value={addressType} onChange={e => setAddressType(e.target.value)} required
              style={{ ...inputStyle, background: '#fff', fontWeight: 600, color: '#0369A1', border: '2px solid #BAE6FD' }}>
              <option value="">{t('address.select_type') || '— Sélectionnez le type d\'adresse —'}</option>
              <option value="facturation">{t('address.facturation') || '🧾 Adresse de facturation'}</option>
              <option value="livraison">{t('address.livraison') || '📦 Adresse de livraison'}</option>
            </select>
            {!addressType ? (
              <span style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'block' }}>
                {t('address.type_required') || 'Le type d\'adresse est obligatoire'}
              </span>
            ) : (
              <span style={{ fontSize: 12, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: addressType === 'facturation' ? '#DBEAFE' : '#FFF7ED', color: addressType === 'facturation' ? '#1E40AF' : '#9A3412', padding: '6px 12px', borderRadius: 8, fontWeight: 600 }}>
                {addressType === 'facturation' ? '🧾' : '📦'} {addressType === 'facturation' ? 'Adresse de FACTURATION' : 'Adresse de LIVRAISON'}
              </span>
            )}
            <div style={{ marginTop: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>{t('profil.adresse')} *</label>
              <input type="text" value={adresse} onChange={e => setAdresse(e.target.value)} required
                placeholder="12 rue du Port" style={inputStyle} />
            </div>
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

          {/* V62 — Adresse de livraison */}
          <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1565C0', margin: 0 }}>Adresse de livraison</h2>
              <span style={{ fontSize: 10, background: '#EDE9FE', color: '#7C3AED', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Livraison</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer', fontSize: 13, color: '#4B5563' }}>
              <input type="checkbox" checked={identiqueFacturation} onChange={e => {
                setIdentiqueFacturation(e.target.checked);
                if (e.target.checked) {
                  setLivraisonRue(adresse);
                  setLivraisonCP(codePostal);
                  setLivraisonVille(ville);
                  setLivraisonPays(pays);
                }
              }} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              Adresse de livraison identique à l'adresse de facturation
            </label>

            {!identiqueFacturation && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Rue</label>
                  <input type="text" value={livraisonRue} onChange={e => setLivraisonRue(e.target.value)}
                    placeholder="Adresse de livraison" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Code postal</label>
                    <input type="text" value={livraisonCP} onChange={e => setLivraisonCP(e.target.value)}
                      placeholder="97200" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Ville</label>
                    <input type="text" value={livraisonVille} onChange={e => setLivraisonVille(e.target.value)}
                      placeholder="Fort-de-France" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Pays</label>
                  <select value={livraisonPays} onChange={e => setLivraisonPays(e.target.value)} style={inputStyle}>
                    <option value="MQ">Martinique</option>
                    <option value="GP">Guadeloupe</option>
                    <option value="RE">Reunion</option>
                    <option value="GF">Guyane</option>
                    <option value="FR">France metropolitaine</option>
                  </select>
                </div>
              </>
            )}
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
