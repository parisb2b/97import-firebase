import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { clientAuth, db } from '../../../lib/firebase';
import { useToast } from '../../components/Toast';

export default function MesInfos({ userId, profile }: { userId: string; profile: any }) {
  const { showToast } = useToast();
  const [phone, setPhone] = useState(profile?.phone || profile?.telephone || '');
  const [langue, setLangue] = useState(profile?.langue || 'fr');
  const [saving, setSaving] = useState(false);

  const [showPwdForm, setShowPwdForm] = useState(false);
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        phone, telephone: phone, langue, updatedAt: new Date(),
      });
      showToast('Informations enregistrées ✅');
    } catch (err) {
      console.error(err);
      showToast('Erreur de sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePwd = async () => {
    if (!oldPwd || !newPwd || newPwd.length < 6) {
      showToast('Le mot de passe doit faire au moins 6 caractères', 'error');
      return;
    }
    setChangingPwd(true);
    try {
      const user = clientAuth.currentUser;
      if (!user || !user.email) throw new Error('Non connecté');
      const cred = EmailAuthProvider.credential(user.email, oldPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);
      showToast('Mot de passe modifié ✅');
      setShowPwdForm(false);
      setOldPwd('');
      setNewPwd('');
    } catch (err: any) {
      console.error(err);
      showToast(err.code === 'auth/wrong-password' ? 'Ancien mot de passe incorrect' : 'Erreur', 'error');
    } finally {
      setChangingPwd(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 13, outline: 'none', background: '#fff',
  } as const;

  const readonlyStyle = { ...inputStyle, background: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed' } as const;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Mes informations</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Gérez vos informations personnelles.</p>

      <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Prénom</label>
            <input type="text" value={profile?.firstName || profile?.prenom || ''} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Nom</label>
            <input type="text" value={profile?.lastName || profile?.nom || ''} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Email</label>
            <input type="email" value={profile?.email || ''} readOnly style={readonlyStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Téléphone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Langue préférée</label>
            <select value={langue} onChange={e => setLangue(e.target.value)} style={inputStyle}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 24px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
          }}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button onClick={() => setShowPwdForm(!showPwdForm)} style={{
            padding: '10px 24px', background: '#fff', color: '#1565C0', border: '1px solid #1565C0', borderRadius: 12,
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            🔒 Changer le mot de passe
          </button>
        </div>

        {showPwdForm && (
          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Ancien mot de passe</label>
                <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Nouveau mot de passe</label>
                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <button onClick={handleChangePwd} disabled={changingPwd} style={{
              padding: '8px 20px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 12, fontWeight: 600, cursor: changingPwd ? 'wait' : 'pointer',
            }}>
              {changingPwd ? 'Modification...' : 'Confirmer le changement'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
