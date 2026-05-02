import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '../../lib/firebase';
import { getNextNumber } from '../../lib/counters';

export default function NouvelleListeAchat() {
  const [, setLocation] = useLocation();
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const generateNumero = async () => {
      try {
        const num = await getNextNumber('LA');
        setNumero(num);
      } catch (err) {
        console.error('Erreur génération numéro:', err);
        alert('Erreur lors de la génération du numéro');
      } finally {
        setLoading(false);
      }
    };
    generateNumero();
  }, []);

  const handleCreate = async () => {
    if (!numero) return;

    setSaving(true);
    try {
      await setDoc(doc(db, 'listes_achat', numero), {
        numero,
        date_creation: serverTimestamp(),
        statut: 'brouillon',
        lignes: [],
        total_cny: 0,
        notes: '',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      alert(`Liste d'achat ${numero} créée !`);
      setLocation(`/admin/listes-achat/${numero}`);
    } catch (err: any) {
      console.error('Erreur création:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Génération du numéro...</div>;
  }

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link href="/admin/listes-achat">
          <button style={{
            background: 'transparent', border: 'none', color: '#6B7280',
            fontSize: 14, cursor: 'pointer', padding: 0,
          }}>
            ← Retour
          </button>
        </Link>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>
        Nouvelle liste d'achat
      </h1>
      <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 32 }}>
        Une nouvelle liste vide va être créée. Vous pourrez ensuite ajouter des produits.
      </p>

      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Informations</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Numéro de liste</label>
          <input
            type="text"
            value={numero}
            readOnly
            style={{ ...inputStyle, background: '#F3F4F6', cursor: 'not-allowed' }}
          />
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            Numéro généré automatiquement au format LA-YYMMNNN
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Statut</label>
          <input
            type="text"
            value="Brouillon"
            readOnly
            style={{ ...inputStyle, background: '#F3F4F6', cursor: 'not-allowed' }}
          />
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            La liste sera créée en mode brouillon (éditable)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          onClick={handleCreate}
          disabled={saving}
          style={{
            flex: 1, padding: 14,
            background: saving ? '#D3D1C7' : '#EA580C',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
          {saving ? 'Création en cours...' : 'Créer la liste'}
        </button>
        <Link href="/admin/listes-achat">
          <button style={{
            padding: 14, background: 'transparent', color: '#6B7280',
            border: '1.5px solid #E5E7EB', borderRadius: 12,
            fontSize: 14, cursor: 'pointer',
          }}>
            Annuler
          </button>
        </Link>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  padding: 24,
  marginBottom: 20,
};
const sectionTitleStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 600, color: '#1565C0', marginTop: 0, marginBottom: 20,
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 6,
  fontWeight: 600, textTransform: 'uppercase',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  fontSize: 14,
  background: '#fff',
  boxSizing: 'border-box',
};
