import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useToast } from '../../components/Toast';

interface Adresse {
  label: string;
  prenom: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  pays: string;
  telephone: string;
  par_defaut?: boolean;
  type?: 'facturation' | 'livraison'; // V91
}

const EMPTY_ADRESSE: Adresse = { label: '', prenom: '', nom: '', adresse: '', code_postal: '', ville: '', pays: '', telephone: '', par_defaut: false };

export default function MesAdresses({ userId, profile }: { userId: string; profile: any }) {
  const { showToast } = useToast();
  const [adresses, setAdresses] = useState<Adresse[]>(profile?.adresses || []);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<Adresse>(EMPTY_ADRESSE);
  const [saving, setSaving] = useState(false);

  const saveToFirestore = async (updated: Adresse[]) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), { adresses: updated, updatedAt: new Date() });
      setAdresses(updated);
      showToast('Adresses mises à jour ✅');
    } catch (err) {
      console.error(err);
      showToast('Erreur de sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.adresse || !form.ville || !form.pays) { showToast('Adresse, ville et pays requis', 'error'); return; }
    let updated: Adresse[];
    if (editIndex !== null) {
      updated = [...adresses];
      updated[editIndex] = form;
    } else {
      updated = [...adresses, form];
    }
    await saveToFirestore(updated);
    setShowForm(false);
    setEditIndex(null);
    setForm(EMPTY_ADRESSE);
  };

  const handleDelete = async (idx: number) => {
    const updated = adresses.filter((_, i) => i !== idx);
    await saveToFirestore(updated);
  };

  const handleDefault = async (idx: number) => {
    const updated = adresses.map((a, i) => ({ ...a, par_defaut: i === idx }));
    await saveToFirestore(updated);
  };

  const handleSetType = async (idx: number, newType: 'facturation' | 'livraison') => {
    const updated = adresses.map((a, i) => {
      if (i === idx) return { ...a, type: newType };
      // Rend le choix exclusif : retire le type des autres adresses
      if (a.type === newType) return { ...a, type: undefined };
      return a;
    });
    await saveToFirestore(updated);
  };

  const handleEdit = (idx: number) => {
    setForm(adresses[idx]);
    setEditIndex(idx);
    setShowForm(true);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E5E7EB',
    fontSize: 13, outline: 'none', background: '#fff',
  } as const;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginBottom: 4 }}>Mes adresses</h1>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Gérez vos adresses de livraison.</p>

      {/* Liste adresses */}
      {adresses.length === 0 && !showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', color: '#6B7280', marginBottom: 16 }}>
          Aucune adresse enregistrée.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {adresses.map((a, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 12, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: a.par_defaut ? '2px solid #1565C0' : '1px solid #E5E7EB',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#1565C0', fontSize: 13 }}>{a.label || `Adresse ${i + 1}`}</span>
                {a.par_defaut && <span style={{ fontSize: 10, background: '#DBEAFE', color: '#1565C0', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Par défaut</span>}
                {a.type === 'facturation' && <span style={{ fontSize: 10, background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>🧾 Facturation</span>}
                {a.type === 'livraison' && <span style={{ fontSize: 10, background: '#FFF7ED', color: '#9A3412', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>📦 Livraison</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {!a.par_defaut && (
                  <button onClick={() => handleDefault(i)} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', color: '#1565C0' }}>⭐ Défaut</button>
                )}
                <button onClick={() => handleEdit(i)} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', color: '#374151' }}>✏️ Éditer</button>
                <button onClick={() => handleDelete(i)} style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', color: '#991B1B' }}>🗑 Supprimer</button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#374151' }}>{a.prenom} {a.nom}</p>
            <p style={{ fontSize: 12, color: '#6B7280' }}>{a.adresse}, {a.code_postal} {a.ville}, {a.pays}</p>
            {a.telephone && <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>📞 {a.telephone}</p>}


            <div style={{ display: 'flex', gap: 8, marginTop: 14, borderTop: '1px dashed #E5E7EB', paddingTop: 14 }}>
              <button onClick={() => handleSetType(i, 'facturation')} style={{ flex: 1, padding: '12px 14px', fontSize: '14px', fontWeight: a.type === 'facturation' ? 700 : 500, background: a.type === 'facturation' ? '#1E40AF' : '#EFF6FF', color: a.type === 'facturation' ? '#fff' : '#1E40AF', border: '2px solid #BFDBFE', borderRadius: '10px', cursor: 'pointer' }}>🧾 Facturation</button>
              <button onClick={() => handleSetType(i, 'livraison')} style={{ flex: 1, padding: '12px 14px', fontSize: '14px', fontWeight: a.type === 'livraison' ? 700 : 500, background: a.type === 'livraison' ? '#EA580C' : '#FFF7ED', color: a.type === 'livraison' ? '#fff' : '#EA580C', border: '2px solid #FED7AA', borderRadius: '10px', cursor: 'pointer' }}>📦 Livraison</button>
              <button onClick={() => handleEdit(i)} style={{ padding: '12px 14px', border: '1px solid #E5E7EB', background: '#fff', borderRadius: '10px', cursor: 'pointer', color: '#374151' }}>✏️</button>
              <button onClick={() => handleDelete(i)} style={{ padding: '12px 14px', border: '1px solid #FEE2E2', background: '#FEF2F2', borderRadius: '10px', cursor: 'pointer', color: '#991B1B' }}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton ajouter */}
      {!showForm && (
        <button onClick={() => { setForm({ ...EMPTY_ADRESSE, prenom: profile?.firstName || '', nom: profile?.lastName || '' }); setEditIndex(null); setShowForm(true); }}
          style={{ padding: '10px 20px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + Ajouter une adresse
        </button>
      )}

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1565C0', marginBottom: 14 }}>
            {editIndex !== null ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Label</label>
              <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Ex: Maison, Bureau..." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Téléphone</label>
              <input value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Prénom</label>
              <input value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nom</label>
              <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Adresse</label>
              <input value={form.adresse} onChange={e => setForm({ ...form, adresse: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Code postal</label>
              <input value={form.code_postal} onChange={e => setForm({ ...form, code_postal: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ville</label>
              <input value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Pays</label>
              <input value={form.pays} onChange={e => setForm({ ...form, pays: e.target.value })} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 20px', background: '#1565C0', color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
            }}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button onClick={() => { setShowForm(false); setEditIndex(null); }} style={{
              padding: '10px 20px', background: '#fff', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 12,
              fontSize: 13, cursor: 'pointer',
            }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
