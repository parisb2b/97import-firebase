// src/admin/components/produit/ModalDupliquerProduit.tsx
// Modal pour dupliquer un produit avec nouvelle référence

import { useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

interface Props {
  produit: any; // Le produit à dupliquer
  onClose: () => void;
  onSuccess: (newId: string, newRef: string) => void;
}

export default function ModalDupliquerProduit({ produit, onClose, onSuccess }: Props) {
  const [nouvelleRef, setNouvelleRef] = useState<string>('');
  const [nouveauNom, setNouveauNom] = useState<string>(`COPIE DE ${produit?.nom_fr || ''}`);
  const [nouvelleCategorie, setNouvelleCategorie] = useState<string>(produit?.categorie || '');
  const [creerDesactive, setCreerDesactive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [erreur, setErreur] = useState<string>('');

  async function handleDupliquer() {
    setErreur('');

    // Validations
    if (!nouvelleRef.trim()) {
      setErreur('La nouvelle référence est obligatoire.');
      return;
    }
    if (nouvelleRef.trim() === produit?.reference) {
      setErreur('La nouvelle référence doit être différente de l\'originale.');
      return;
    }
    if (!nouveauNom.trim()) {
      setErreur('Le nouveau nom est obligatoire.');
      return;
    }

    setLoading(true);

    try {
      // Vérifier que la nouvelle ref n'existe pas
      const refCheck = await getDocs(
        query(collection(db, 'products'), where('reference', '==', nouvelleRef.trim()))
      );

      if (!refCheck.empty) {
        setErreur(`La référence "${nouvelleRef}" existe déjà en base.`);
        setLoading(false);
        return;
      }

      // Construire le nouveau produit (copier tout sauf les champs à exclure)
      const nouveauProduit: any = { ...produit };

      // Champs à EXCLURE (ne pas copier)
      delete nouveauProduit.id;
      delete nouveauProduit.groupe_produit;
      delete nouveauProduit.options_config;
      delete nouveauProduit.image_principale;

      // Remplacements
      nouveauProduit.reference = nouvelleRef.trim();
      nouveauProduit.nom_fr = nouveauNom.trim();
      nouveauProduit.categorie = nouvelleCategorie.trim() || produit?.categorie || '';
      nouveauProduit.actif = !creerDesactive ? (produit?.actif !== false) : false;

      // Traçabilité
      nouveauProduit.duplique_de = produit?.reference || '';
      nouveauProduit.duplique_le = serverTimestamp();
      nouveauProduit.created_at = serverTimestamp();
      nouveauProduit.updated_at = serverTimestamp();

      // Créer le document
      const docRef = await addDoc(collection(db, 'products'), nouveauProduit);

      onSuccess(docRef.id, nouvelleRef.trim());
    } catch (err: any) {
      console.error('Erreur duplication:', err);
      setErreur('Erreur lors de la duplication : ' + (err.message || 'inconnue'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#1E3A5F' }}>
            📋 Dupliquer ce produit
          </h2>
          <button onClick={onClose} style={closeBtnStyle}>×</button>
        </div>

        <div style={bodyStyle}>
          <div style={infoBoxStyle}>
            <strong>Produit source :</strong>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              <code style={{ background: '#fff', padding: '2px 6px', borderRadius: 4 }}>
                {produit?.reference || '—'}
              </code>
              {' — '}{produit?.nom_fr || '—'}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Nouvelle référence <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              value={nouvelleRef}
              onChange={e => setNouvelleRef(e.target.value)}
              placeholder="Ex: MS-20-001"
              style={inputStyle}
              autoFocus
            />
            <div style={hintStyle}>
              Doit être unique. Format suggéré : XX-YYY-NNN
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Nouveau nom (FR) <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              value={nouveauNom}
              onChange={e => setNouveauNom(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Catégorie (optionnel, défaut = {produit?.categorie || '—'})
            </label>
            <input
              type="text"
              value={nouvelleCategorie}
              onChange={e => setNouvelleCategorie(e.target.value)}
              placeholder={produit?.categorie || 'mini-pelle, maison-modulaire, solaire, etc.'}
              style={inputStyle}
            />
          </div>

          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={creerDesactive}
              onChange={e => setCreerDesactive(e.target.checked)}
            />
            <span>Créer en <strong>désactivé</strong> (actif=false) — recommandé pour pouvoir ajuster avant publication</span>
          </label>

          <div style={noteStyle}>
            <strong>ℹ️ Non dupliqués :</strong>
            <ul style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: 12 }}>
              <li>Groupe produit et options (pour éviter les conflits)</li>
              <li>Image principale (à réuploader si différente)</li>
            </ul>
          </div>

          {erreur && (
            <div style={erreurStyle}>{erreur}</div>
          )}
        </div>

        <div style={footerStyle}>
          <button onClick={onClose} disabled={loading} style={btnSecondaryStyle}>
            Annuler
          </button>
          <button onClick={handleDupliquer} disabled={loading} style={btnPrimaryStyle}>
            {loading ? 'Duplication en cours...' : '📋 Dupliquer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// STYLES (inline, pas de modification admin.css)
// ═══════════════════════════════════════════════════

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 10000, padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12,
  maxWidth: 520, width: '100%', maxHeight: '90vh',
  display: 'flex', flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid #E5E7EB',
};

const bodyStyle: React.CSSProperties = {
  padding: 20, flex: 1, overflowY: 'auto',
};

const footerStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderTop: '1px solid #E5E7EB',
  display: 'flex', gap: 10, justifyContent: 'flex-end',
  background: '#F9FAFB',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent', border: 'none',
  fontSize: 24, cursor: 'pointer', color: '#6B7280',
  padding: 0, lineHeight: 1,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12, fontWeight: 600,
  color: '#374151', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #D1D5DB', borderRadius: 6,
  fontSize: 14, fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box',
};

const hintStyle: React.CSSProperties = {
  fontSize: 11, color: '#6B7280', marginTop: 4,
};

const infoBoxStyle: React.CSSProperties = {
  background: '#F3F4F6', padding: 12,
  borderRadius: 6, marginBottom: 16,
  fontSize: 13,
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  padding: 12, background: '#FEF3C7', borderRadius: 6,
  borderLeft: '3px solid #F59E0B',
  fontSize: 13, cursor: 'pointer',
  marginBottom: 16,
};

const noteStyle: React.CSSProperties = {
  padding: 12, background: '#DBEAFE', borderRadius: 6,
  fontSize: 13, color: '#1E3A8A',
};

const erreurStyle: React.CSSProperties = {
  padding: 12, background: '#FEE2E2',
  borderLeft: '4px solid #DC2626',
  borderRadius: 6, marginTop: 12,
  color: '#991B1B', fontSize: 13,
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '10px 20px', background: '#1E3A5F',
  color: '#fff', border: 'none', borderRadius: 6,
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: '10px 20px', background: '#E5E7EB',
  color: '#374151', border: 'none', borderRadius: 6,
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'inherit',
};
