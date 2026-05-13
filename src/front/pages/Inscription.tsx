// ═══════════════════════════════════════════════════════════
// M1012 CERTIFIÉ — users/{email} + email.trim().toLowerCase()
// ═══════════════════════════════════════════════════════════
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { clientAuth, db } from '../../lib/firebase';
import { useI18n } from '../../i18n';
import { useToast } from '../components/Toast';

export default function Inscription() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [, setLocation] = useLocation();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cred = await createUserWithEmailAndPassword(clientAuth, cleanEmail, password);

      // M1012 : clé primaire = email normalisé (match users/{userEmail} dans les règles)
      const profileData = {
        uid: cred.user.uid,
        email: cleanEmail,
        firstName: prenom,
        lastName: nom,
        nom: `${prenom} ${nom}`.trim(),
        role: 'user',
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', cleanEmail), profileData);
      // Double écriture clients/{uid} pour rétrocompatibilité
      await setDoc(doc(db, 'clients', cred.user.uid), profileData);

      showToast('Compte créé avec succès !');
      setLocation('/profil');
    } catch (err: any) {
      const code = err?.code || '';
      if (code.includes('network-request-failed')) setError('Erreur réseau : vérifiez votre connexion et réessayez.');
      else if (code.includes('email-already-in-use')) setError('Cet email est déjà utilisé.');
      else setError(err?.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    console.log('🔍 [Google Auth Inscription] Tentative de connexion Google...');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(clientAuth, provider);
      console.log('✅ [Google Auth Inscription] Connexion réussie:', cred.user.email);
      const googleEmail = cred.user.email?.toLowerCase() || '';
      const displayName = cred.user.displayName || '';

      const profileData = {
        uid: cred.user.uid,
        email: googleEmail,
        nom: displayName,
        createdAt: serverTimestamp(),
      };
      // Écriture dans users/{email} (clé primaire)
      await setDoc(doc(db, 'users', googleEmail), profileData, { merge: true });
      // Double écriture clients/{uid} pour rétrocompatibilité
      await setDoc(doc(db, 'clients', cred.user.uid), profileData, { merge: true });

      showToast('Compte créé avec succès !');
      setLocation('/profil');
    } catch (err: any) {
      const code = err?.code || '';
      console.error('❌ [Google Auth Inscription] Erreur:', code, err?.message);
      if (code === 'auth/unauthorized-domain') {
        setError('Domaine non autorisé pour Google Auth. Ajoutez ce domaine dans Firebase Console > Authentication > Settings > Authorized Domains.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Inscription Google annulée.');
      } else if (code === 'auth/cancelled-popup-request') {
        setError('Inscription Google annulée (conflit de popup).');
      } else if (code === 'auth/account-exists-with-different-credential') {
        setError('Un compte existe déjà avec cet email. Connectez-vous plutôt.');
      } else {
        setError(err?.message || 'Erreur Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', background: '#F9FAFB' }}>
      <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 40, width: '100%', maxWidth: 440 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1565C0', textAlign: 'center', marginBottom: 8 }}>{t('auth.inscription')}</h1>
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 28 }}>Rejoignez 97import pour acceder aux prix</p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.nom')}</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} required placeholder="Dupont" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.prenom')}</label>
              <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required placeholder="Jean" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="votre@email.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="6 caracteres minimum" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('auth.confirmPassword')}</label>
            <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required placeholder="••••••••" style={inputStyle} />
          </div>

          {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px 0', background: '#1565C0', color: 'white', border: 'none',
            borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.5 : 1,
          }}>
            {loading ? '...' : t('auth.creerCompte')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
        </div>

        <button onClick={handleGoogle} disabled={loading} style={{
          width: '100%', padding: '12px 0', background: 'white', color: '#374151', border: '1px solid #E5E7EB',
          borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.9 7.35 2.56 10.56l7.97-5.97z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z"/></svg>
          {t('auth.avecGoogle')}
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#6B7280' }}>
          {t('auth.dejaCompte')}{' '}
          <Link href="/connexion">
            <span style={{ color: '#1565C0', fontWeight: 600, cursor: 'pointer' }}>{t('auth.connexion')}</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
