import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '../../lib/firebase';

interface Port {
  code: string;
  nom: string;
  pays: string;
  type: string;
  actif?: boolean;
}

interface DropdownPortsProps {
  type: 'chargement' | 'destination';
  value: string;
  onChange: (code: string) => void;
  label?: string;
  required?: boolean;
}

export default function DropdownPorts({ type, value, onChange, label, required }: DropdownPortsProps) {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', nom: '', pays: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPorts(); }, [type]);

  const loadPorts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'ports'), where('type', '==', type));
      const snap = await getDocs(q);
      const list = snap.docs
        .map(d => d.data() as Port)
        .filter(p => p.actif !== false)
        .sort((a, b) => a.nom.localeCompare(b.nom));
      setPorts(list);
    } catch (err) {
      console.error('Erreur chargement ports:', err);
    } finally {
      setLoading(false);
    }
  };

  const ajouterPort = async () => {
    if (!form.code.trim() || !form.nom.trim() || !form.pays.trim()) {
      alert('Tous les champs sont requis');
      return;
    }
    setSaving(true);
    try {
      const codeClean = form.code.trim().toUpperCase().replace(/\s+/g, '');
      await setDoc(doc(db, 'ports', codeClean), {
        code: codeClean,
        nom: form.nom.trim(),
        pays: form.pays.trim().toUpperCase(),
        type,
        actif: true,
        created_at: serverTimestamp(),
      });

      await loadPorts();
      onChange(codeClean);
      setShowModal(false);
      setForm({ code: '', nom: '', pays: '' });
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>
          {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
        </label>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            fontSize: 14,
            background: '#fff',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          <option value="">{loading ? 'Chargement...' : '— Sélectionner un port —'}</option>
          {ports.map(p => (
            <option key={p.code} value={p.code}>
              {p.nom} ({p.pays})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 16px',
            background: '#F3F4F6',
            border: '1px solid #E5E7EB',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            color: '#1565C0',
            whiteSpace: 'nowrap',
          }}
          title="Ajouter un nouveau port"
        >
          + Nouveau
        </button>
      </div>

      {/* Modal ajout port */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, maxWidth: 480, width: '90%' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#1565C0' }}>
              Ajouter un port de {type === 'chargement' ? 'chargement' : 'destination'}
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
              Le port sera disponible dans la liste déroulante pour tous les conteneurs.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                  Code port <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: MQFDF, YANTIAN..."
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  style={inputStyle}
                />
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                  Code court en majuscules (sera l'ID du document Firestore)
                </p>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                  Nom complet <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fort-de-France, Yantian / Shenzhen..."
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                  Pays (code ISO 2 lettres) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: MQ, CN, FR..."
                  value={form.pays}
                  onChange={e => setForm({ ...form, pays: e.target.value.toUpperCase().slice(0, 2) })}
                  maxLength={2}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={ajouterPort}
                disabled={saving}
                style={{
                  flex: 1, padding: 12,
                  background: saving ? '#D3D1C7' : '#EA580C',
                  color: '#fff', border: 'none', borderRadius: 12,
                  fontSize: 14, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                {saving ? 'Création...' : 'Créer le port'}
              </button>
              <button
                onClick={() => { setShowModal(false); setForm({ code: '', nom: '', pays: '' }); }}
                style={{
                  padding: 12, background: 'transparent', color: '#6B7280',
                  border: '1.5px solid #E5E7EB', borderRadius: 12,
                  fontSize: 14, cursor: 'pointer',
                }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  fontSize: 14,
  boxSizing: 'border-box',
};
