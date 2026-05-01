// src/admin/components/ModalDupliquerDevis.tsx
// MISSION-V43-E3.1 — Modal de duplication d'un devis existant.
// Crée un nouveau devis avec statut 'nouveau' + acomptes vides + numéro DVS régénéré.

import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getNextNumber } from '../../lib/counters';
import { sanitizeForFirestore } from '../../lib/firebaseUtils';

interface ModalDupliquerDevisProps {
  isOpen: boolean;
  onClose: () => void;
  devisSource: any;
  onDuplicated: (newId: string, newNumero: string) => void;
}

export default function ModalDupliquerDevis({
  isOpen, onClose, devisSource, onDuplicated,
}: ModalDupliquerDevisProps) {
  const [duplicating, setDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setDuplicating(true);
    setError(null);

    try {
      const newNumero = await getNextNumber('DVS');

      const newDevis: any = {
        ...devisSource,
        numero: newNumero,
        statut: 'nouveau',
        is_vip: false,
        acomptes: [],
        total_encaisse: 0,
        solde_restant: devisSource.total_ht || 0,
        facture_finale: null,
        commission_generated: false,
        // Reset des dates événements
        date_signature: null,
        date_commande: null,
        date_embarquement: null,
        date_arrivee: null,
        date_livraison: null,
        // Reset des artefacts de signature précédente
        signature_token: null,
        signature_token_used: false,
        signature_token_expiry: null,
        signe_le: null,
        // Métadonnées duplication
        duplique_de: devisSource.numero,
        duplique_le: new Date().toISOString(),
        // Reset prix VIP négocié sur les lignes
        // V45 Bug A : null au lieu de undefined (Firestore refuse undefined sans
        // ignoreUndefinedProperties). null exprime correctement "pas de prix VIP négocié".
        lignes: (devisSource.lignes || []).map((l: any) => ({
          ...l,
          prix_vip_negocie: null,
          prix_unitaire_final: l.prix_unitaire ?? l.prix_unitaire_final ?? 0,
        })),
        prix_negocies: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Le doc Firestore aura comme ID le nouveau numéro — on supprime l'ID source
      delete newDevis.id;

      // V45 Bug A : defense-in-depth contre les undefined propagés par
      // ...devisSource ou ...l (Firestore SDK n'a pas ignoreUndefinedProperties).
      const cleanedDevis = sanitizeForFirestore(newDevis);

      await setDoc(doc(db, 'quotes', newNumero), cleanedDevis);

      onDuplicated(newNumero, newNumero);
      onClose();
    } catch (err: any) {
      console.error('[DUPLIQUER]', err);
      setError(err.message || 'Erreur lors de la duplication');
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12,
          padding: 32, maxWidth: 500, width: '100%',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 16 }}>📋</div>
        <h2 style={{ margin: 0, marginBottom: 12, color: '#1565C0', textAlign: 'center' }}>
          Dupliquer ce devis
        </h2>

        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: 16 }}>
          Un nouveau devis sera créé en copiant les lignes et les informations client de
          <strong> {devisSource.numero}</strong>.
        </p>

        <div style={{ background: '#F0F9FF', borderLeft: '4px solid #0369A1', padding: 12, borderRadius: 6, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0C4A6E', marginBottom: 4 }}>
            Le nouveau devis aura :
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#0C4A6E', lineHeight: 1.6 }}>
            <li>Statut : <strong>nouveau</strong></li>
            <li>Aucun acompte (à recommencer)</li>
            <li>Aucun prix VIP négocié</li>
            <li>Numéro régénéré (DVS-AAMM-NNN)</li>
          </ul>
        </div>

        {error && (
          <div style={{ background: '#FEE2E2', color: '#991B1B', padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={duplicating}
            style={{
              padding: '10px 20px', background: '#E2E8F0', color: '#475569',
              border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600,
              cursor: duplicating ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={duplicating}
            style={{
              padding: '10px 24px', background: '#1565C0', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600,
              cursor: duplicating ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {duplicating ? '⏳ Duplication...' : '📋 Dupliquer maintenant'}
          </button>
        </div>
      </div>
    </div>
  );
}
