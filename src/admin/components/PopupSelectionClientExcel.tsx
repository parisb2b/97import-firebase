import { useState, useEffect } from 'react';
import { adminDb as db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { InfosClient } from '../../lib/excel-generators/excelTypes';
import { getInfosClientDevis } from '../../lib/excel-generators/firestoreHelpers';

interface Props {
  ctnId: string;
  onClose: () => void;
  onSelect: (clientNom: string, infosClient: InfosClient) => void;
}

/**
 * Popup de sélection du client pour les générateurs Excel BD/BE
 * Liste tous les clients uniques ayant des produits dans le conteneur
 */
export default function PopupSelectionClientExcel({ ctnId, onClose, onSelect }: Props) {
  const [clients, setClients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [loadingInfos, setLoadingInfos] = useState(false);

  // Charger la liste des clients du conteneur
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const ctnSnap = await getDoc(doc(db, 'conteneurs', ctnId));
        if (!ctnSnap.exists()) {
          setError('Conteneur introuvable');
          return;
        }

        const ctn = ctnSnap.data();
        const listesLiees = ctn.devis_lies || [];
        const clientsSet = new Set<string>();

        // Parcourir toutes les LA pour récupérer les clients
        for (const laId of listesLiees) {
          const laSnap = await getDoc(doc(db, 'listes_achat', laId));
          if (!laSnap.exists()) continue;

          const la = laSnap.data();
          const lignes = la.lignes || [];

          lignes.forEach((ligne: any) => {
            if (ligne.conteneur_assigne === ctnId && ligne.client_nom) {
              clientsSet.add(ligne.client_nom);
            }
          });
        }

        const clientsArray = Array.from(clientsSet).sort();
        setClients(clientsArray);

        if (clientsArray.length === 0) {
          setError('Aucun client trouvé dans ce conteneur');
        }
      } catch (err: any) {
        setError('Erreur lors du chargement des clients: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [ctnId]);

  // Charger les infos client et appeler onSelect
  const handleConfirm = async () => {
    if (!selectedClient) {
      alert('Veuillez sélectionner un client');
      return;
    }

    setLoadingInfos(true);
    try {
      // Trouver le devis_id correspondant au client
      const ctnSnap = await getDoc(doc(db, 'conteneurs', ctnId));
      if (!ctnSnap.exists()) throw new Error('Conteneur introuvable');

      const ctn = ctnSnap.data();
      const listesLiees = ctn.devis_lies || [];
      let devisId = '';

      // Chercher le premier devis_id pour ce client
      for (const laId of listesLiees) {
        const laSnap = await getDoc(doc(db, 'listes_achat', laId));
        if (!laSnap.exists()) continue;

        const la = laSnap.data();
        const lignes = la.lignes || [];

        for (const ligne of lignes) {
          if (ligne.client_nom === selectedClient && ligne.devis_id) {
            devisId = ligne.devis_id;
            break;
          }
        }

        if (devisId) break;
      }

      if (!devisId) {
        throw new Error('Devis introuvable pour ce client');
      }

      // Charger les infos client depuis le devis
      const infosClient = await getInfosClientDevis(devisId);
      if (!infosClient) {
        throw new Error('Informations client introuvables');
      }

      onSelect(selectedClient, infosClient);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setLoadingInfos(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32,
        width: '90%', maxWidth: 500,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: 20, fontWeight: 700, color: '#1565C0' }}>
          Sélectionner un client
        </h2>

        {loading && (
          <p style={{ color: '#6B7280', textAlign: 'center' }}>Chargement des clients...</p>
        )}

        {error && (
          <p style={{ color: '#DC2626', background: '#FEE2E2', padding: 12, borderRadius: 8 }}>
            {error}
          </p>
        )}

        {!loading && !error && clients.length > 0 && (
          <>
            <p style={{ marginBottom: 16, color: '#6B7280', fontSize: 14 }}>
              Ce conteneur contient des produits pour {clients.length} client{clients.length > 1 ? 's' : ''}.
              Sélectionnez le client pour générer le document.
            </p>

            <div style={{
              border: '1px solid #E5E7EB', borderRadius: 8,
              maxHeight: 300, overflowY: 'auto',
            }}>
              {clients.map(client => (
                <div
                  key={client}
                  onClick={() => setSelectedClient(client)}
                  style={{
                    padding: 12,
                    cursor: 'pointer',
                    background: selectedClient === client ? '#EBF5FF' : '#fff',
                    borderLeft: selectedClient === client ? '4px solid #1565C0' : '4px solid transparent',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (selectedClient !== client) {
                      e.currentTarget.style.background = '#F9FAFB';
                    }
                  }}
                  onMouseLeave={e => {
                    if (selectedClient !== client) {
                      e.currentTarget.style.background = '#fff';
                    }
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#1F2937' }}>{client}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={onClose}
                disabled={loadingInfos}
                style={{
                  flex: 1, padding: 12, background: '#F3F4F6', color: '#374151',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: loadingInfos ? 'not-allowed' : 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedClient || loadingInfos}
                style={{
                  flex: 1, padding: 12,
                  background: (!selectedClient || loadingInfos) ? '#D3D1C7' : '#1565C0',
                  color: '#fff', border: 'none', borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                  cursor: (!selectedClient || loadingInfos) ? 'not-allowed' : 'pointer',
                }}
              >
                {loadingInfos ? 'Chargement...' : 'Confirmer'}
              </button>
            </div>
          </>
        )}

        {!loading && !error && clients.length === 0 && (
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: 12, background: '#F3F4F6', color: '#374151',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', marginTop: 16,
            }}
          >
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}
