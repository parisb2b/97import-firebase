import { useState, useEffect, useMemo } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { doc, getDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { generateBcChine } from '../../lib/excel-generators/generateBcChine';

export default function DetailListeAchat() {
  const [, params] = useRoute('/admin/listes-achat/:id');
  const [, setLocation] = useLocation();
  const [la, setLa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [conteneurs, setConteneurs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // État éditable
  const [lignes, setLignes] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (params?.id) loadLa(params.id);
    loadConteneurs();
  }, [params?.id]);

  const loadLa = async (id: string) => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'listes_achat', id));
      if (snap.exists()) {
        const data = snap.data();
        setLa({ id: snap.id, ...data });
        setLignes(Array.isArray(data.lignes) ? data.lignes : []);
        setNotes(data.notes || '');
      } else {
        alert('Liste introuvable');
        setLocation('/admin/listes-achat');
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadConteneurs = async () => {
    try {
      const snap = await getDocs(collection(db, 'conteneurs'));
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter((c: any) => c.statut !== 'livre')
        .sort((a: any, b: any) => (a.numero > b.numero ? -1 : 1));
      setConteneurs(list);
    } catch (err) {
      console.error('Erreur chargement conteneurs:', err);
    }
  };

  const readOnly = la?.statut === 'envoyee';

  const totalCny = useMemo(() => {
    return lignes.reduce((sum, l) => sum + (l.qte || 0) * (l.prix_achat_unitaire || 0), 0);
  }, [lignes]);

  const handleAjoutProduits = (nouvelles: any[]) => {
    setLignes([...lignes, ...nouvelles]);
    setShowModal(false);
  };

  const handleDeleteLigne = (id: string) => {
    if (!confirm('Supprimer cette ligne ?')) return;
    setLignes(lignes.filter(l => l.id !== id));
  };

  const handleChangeQte = (id: string, qte: number) => {
    setLignes(lignes.map(l => l.id === id ? { ...l, qte } : l));
  };

  const handleChangeConteneur = (id: string, conteneurId: string | null) => {
    setLignes(lignes.map(l => l.id === id ? { ...l, conteneur_id: conteneurId } : l));
  };

  const handleSave = async () => {
    if (!la) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'listes_achat', la.id), {
        lignes,
        notes,
        total_cny: totalCny,
        updated_at: serverTimestamp(),
      });
      alert('Brouillon enregistré');
      await loadLa(la.id);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnvoyer = async () => {
    if (!la) return;
    if (lignes.length === 0) {
      alert('La liste est vide. Ajoutez au moins un produit avant d\'envoyer.');
      return;
    }
    if (!confirm(`Envoyer définitivement la liste ${la.numero} ?\n\n⚠️ Une fois envoyée, elle ne pourra plus être modifiée.`)) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'listes_achat', la.id), {
        lignes,
        notes,
        total_cny: totalCny,
        statut: 'envoyee',
        date_envoi: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Mettre à jour devis_lies dans conteneurs
      await updateConteneursDevisLies(lignes);

      alert('Liste d\'achat envoyée');
      await loadLa(la.id);
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateBCChine = async () => {
    if (!la) return;
    setGeneratingExcel(true);
    try {
      await generateBcChine(la.id);
    } catch (err: any) {
      alert('Erreur génération Excel: ' + err.message);
      console.error('Erreur Excel:', err);
    } finally {
      setGeneratingExcel(false);
    }
  };

  const updateConteneursDevisLies = async (lignesLA: any[]) => {
    try {
      const byConteneur: Record<string, Set<string>> = {};
      for (const l of lignesLA) {
        if (l.conteneur_id && l.devis_id) {
          if (!byConteneur[l.conteneur_id]) byConteneur[l.conteneur_id] = new Set();
          byConteneur[l.conteneur_id].add(l.devis_id);
        }
      }

      for (const conteneurId of Object.keys(byConteneur)) {
        const snap = await getDoc(doc(db, 'conteneurs', conteneurId));
        if (!snap.exists()) continue;
        const data = snap.data();
        const existants = new Set(Array.isArray(data.devis_lies) ? data.devis_lies : []);
        byConteneur[conteneurId].forEach(d => existants.add(d));
        await updateDoc(doc(db, 'conteneurs', conteneurId), {
          devis_lies: Array.from(existants),
        });
      }
    } catch (err) {
      console.error('Erreur mise à jour conteneurs:', err);
    }
  };

  if (loading || !la) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Chargement...</div>;
  }

  const dateCreation = la.date_creation?.toDate ? la.date_creation.toDate().toLocaleDateString('fr-FR') : '—';
  const dateEnvoi = la.date_envoi?.toDate ? la.date_envoi.toDate().toLocaleDateString('fr-FR') : null;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link href="/admin/listes-achat">
          <button style={{ background: 'transparent', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer', padding: 0 }}>
            ← Retour liste
          </button>
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1565C0', margin: 0 }}>
            {la.numero}
          </h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <span style={{
              background: readOnly ? '#05966915' : '#D9770615',
              color: readOnly ? '#059669' : '#D97706',
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            }}>
              {readOnly ? 'Envoyée' : 'Brouillon'}
            </span>
            <span style={{ color: '#6B7280', fontSize: 14 }}>
              {lignes.length} produit{lignes.length > 1 ? 's' : ''} · ¥{totalCny.toLocaleString('fr-FR')}
            </span>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 20px', background: '#1565C0',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>
            + Ajouter produits
          </button>
        )}
      </div>

      {/* Info card */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Informations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div>
            <label style={labelStyle}>Numéro</label>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1565C0' }}>{la.numero}</div>
          </div>
          <div>
            <label style={labelStyle}>Date création</label>
            <div style={{ fontSize: 15 }}>{dateCreation}</div>
          </div>
          {dateEnvoi && (
            <div>
              <label style={labelStyle}>Date envoi</label>
              <div style={{ fontSize: 15 }}>{dateEnvoi}</div>
            </div>
          )}
        </div>
      </div>

      {/* Lignes */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Produits ({lignes.length})</h2>

        {lignes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic' }}>
            Aucun produit. Cliquez sur "Ajouter produits" pour sélectionner des commandes.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ ...thStyle, width: 120 }}>Réf.</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Nom FR</th>
                <th style={{ ...thStyle, width: 80 }}>Qté</th>
                <th style={{ ...thStyle, width: 100 }}>Prix unit. ¥</th>
                <th style={{ ...thStyle, width: 100 }}>Total ¥</th>
                <th style={{ ...thStyle, width: 150 }}>Conteneur</th>
                <th style={{ ...thStyle, width: 150 }}>Client</th>
                {!readOnly && <th style={{ ...thStyle, width: 60 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={tdStyle}>
                    <strong style={{ color: '#1565C0' }}>{l.ref}</strong>
                    {l.est_composant_kit && (
                      <div style={{ fontSize: 10, color: '#D97706', marginTop: 2 }}>
                        🔧 de {l.kit_parent}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>{l.nom_fr || '—'}</td>
                  <td style={tdStyle}>
                    {readOnly ? (
                      l.qte || 0
                    ) : (
                      <input
                        type="number"
                        value={l.qte || 1}
                        onChange={e => handleChangeQte(l.id, parseInt(e.target.value) || 1)}
                        min="1"
                        style={{
                          width: 60, padding: '4px 6px', border: '1px solid #E5E7EB',
                          borderRadius: 6, fontSize: 13, textAlign: 'center',
                        }}
                      />
                    )}
                  </td>
                  <td style={tdStyle}>¥{(l.prix_achat_unitaire || 0).toLocaleString('fr-FR')}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    ¥{((l.qte || 0) * (l.prix_achat_unitaire || 0)).toLocaleString('fr-FR')}
                  </td>
                  <td style={tdStyle}>
                    {readOnly ? (
                      <span style={{ fontSize: 12 }}>{l.conteneur_id || '—'}</span>
                    ) : (
                      <select
                        value={l.conteneur_id || ''}
                        onChange={e => handleChangeConteneur(l.id, e.target.value || null)}
                        style={{
                          width: '100%', padding: '4px 6px', border: '1px solid #E5E7EB',
                          borderRadius: 6, fontSize: 12,
                        }}>
                        <option value="">— Non attribué —</option>
                        {conteneurs.map(c => (
                          <option key={c.id} value={c.numero}>{c.numero}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td style={{ ...tdStyle, fontSize: 11, color: '#6B7280' }}>
                    {l.client_nom || '—'}
                    <div style={{ fontSize: 10, marginTop: 2 }}>{l.devis_id || ''}</div>
                  </td>
                  {!readOnly && (
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDeleteLigne(l.id)}
                        style={{
                          padding: '4px 8px', background: '#FEE2E2', color: '#DC2626',
                          border: '1px solid #FECACA', borderRadius: 6,
                          fontSize: 11, cursor: 'pointer',
                        }}>
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {lignes.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E5E7EB', textAlign: 'right' }}>
            <strong style={{ fontSize: 16, color: '#DC2626' }}>
              Total : ¥{totalCny.toLocaleString('fr-FR')}
            </strong>
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Notes internes</h2>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          readOnly={readOnly}
          placeholder={readOnly ? '' : 'Notes optionnelles...'}
          style={{
            ...inputStyle, fontFamily: 'inherit', resize: 'vertical',
            background: readOnly ? '#F3F4F6' : '#fff',
            cursor: readOnly ? 'not-allowed' : 'text',
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        {readOnly ? (
          <div style={{
            flex: 1, padding: 14, background: '#F3F4F6',
            color: '#6B7280', borderRadius: 12, fontSize: 14, textAlign: 'center',
            fontStyle: 'italic',
          }}>
            ✅ Liste d'achat validée — non modifiable
          </div>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: 14,
                background: saving ? '#D3D1C7' : '#EA580C',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>
              {saving ? 'Enregistrement...' : 'Enregistrer (brouillon)'}
            </button>
            <button
              onClick={handleEnvoyer}
              disabled={saving}
              style={{
                padding: 14, background: saving ? '#D3D1C7' : '#059669',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>
              {saving ? 'Envoi...' : 'Envoyer (figer)'}
            </button>
          </>
        )}
        <button
          onClick={handleGenerateBCChine}
          disabled={generatingExcel || lignes.length === 0}
          style={{
            padding: 14,
            background: (generatingExcel || lignes.length === 0) ? '#D3D1C7' : '#1565C0',
            color: '#fff', border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 600,
            cursor: (generatingExcel || lignes.length === 0) ? 'not-allowed' : 'pointer',
          }}>
          {generatingExcel ? 'Génération...' : '📊 BC-CHINE (Excel)'}
        </button>
      </div>

      {/* Modal ajout produits */}
      {showModal && (
        <ModalAjoutProduits
          existingRefs={lignes.map(l => l.ref)}
          onAdd={handleAjoutProduits}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ====== MODAL AJOUT PRODUITS ======
interface ModalAjoutProduitsProps {
  existingRefs: string[];
  onAdd: (lignes: any[]) => void;
  onClose: () => void;
}

function ModalAjoutProduits({ existingRefs, onAdd, onClose }: ModalAjoutProduitsProps) {
  const [devisList, setDevisList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => { loadDevis(); }, []);

  const loadDevis = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'quotes'));
      const all = snap.docs.map(d => ({ numero: d.id, ...d.data() } as any));
      // Filtrer : seulement ceux avec acompte encaissé
      const valides = all.filter((d: any) => {
        const acomptes = d.acomptes || [];
        return acomptes.some((a: any) => a.encaisse === true); // v43 P3-COMPLET format
      });
      setDevisList(valides);
    } catch (err) {
      console.error('Erreur chargement devis:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return devisList;
    const term = searchTerm.toLowerCase();
    return devisList.filter(d =>
      d.numero?.toLowerCase().includes(term) ||
      d.client_nom?.toLowerCase().includes(term) ||
      d.client_prenom?.toLowerCase().includes(term) ||
      d.lignes?.some((l: any) => l.ref?.toLowerCase().includes(term) || l.nom_fr?.toLowerCase().includes(term))
    );
  }, [devisList, searchTerm]);

  const toggleLigne = (devisId: string, ref: string) => {
    setSelected(prev => {
      const newSel = { ...prev };
      if (!newSel[devisId]) newSel[devisId] = {};
      newSel[devisId][ref] = !newSel[devisId][ref];
      return newSel;
    });
  };

  const ajouter = async () => {
    setProcessing(true);
    try {
      const nouvelles: any[] = [];

      for (const devisId of Object.keys(selected)) {
        const devis = devisList.find(d => d.numero === devisId);
        if (!devis) continue;

        const clientNom = `${devis.client_prenom || ''} ${devis.client_nom || ''}`.trim() || '—';
        const lignesDevis = devis.lignes || [];

        for (const ligne of lignesDevis) {
          if (!selected[devisId][ligne.ref]) continue;

          const ref = ligne.ref;
          const qteDevis = ligne.qte || 1;

          // Lire le produit pour savoir si kit
          const prodSnap = await getDoc(doc(db, 'products', ref));

          if (!prodSnap.exists()) {
            // Produit inconnu : ajouter tel quel
            nouvelles.push(buildLigne({
              ref, nom_fr: ligne.nom_fr || ligne.designation || ref, qte: qteDevis,
              fournisseur: '—', prix_achat_unitaire: 0,
              devis_id: devisId, client_nom: clientNom,
            }));
            continue;
          }

          const prod = prodSnap.data();

          // Cas 1 : kit → éclater
          if (prod.est_kit === true && prod.composition_kit) {
            const composants = String(prod.composition_kit)
              .split(';')
              .map(s => s.trim())
              .filter(Boolean);

            for (const compRef of composants) {
              const compSnap = await getDoc(doc(db, 'products', compRef));
              const compData = compSnap.exists() ? compSnap.data() : null;

              nouvelles.push(buildLigne({
                ref: compRef,
                nom_fr: compData?.nom_fr || compRef,
                qte: qteDevis,
                fournisseur: compData?.fournisseur || '—',
                prix_achat_unitaire: compData?.prix_achat || 0,
                devis_id: devisId,
                client_nom: clientNom,
                kit_parent: ref,
                kit_parent_nom: prod.nom_fr || ref,
                est_composant_kit: true,
              }));
            }
          }
          // Cas 2 : produit simple
          else {
            nouvelles.push(buildLigne({
              ref,
              nom_fr: prod.nom_fr || ligne.nom_fr || ligne.designation || ref,
              qte: qteDevis,
              fournisseur: prod.fournisseur || '—',
              prix_achat_unitaire: prod.prix_achat || 0,
              devis_id: devisId,
              client_nom: clientNom,
            }));
          }
        }
      }

      if (nouvelles.length === 0) {
        alert('Aucun produit sélectionné');
        setProcessing(false);
        return;
      }

      onAdd(nouvelles);
    } catch (err: any) {
      console.error('Erreur ajout produits:', err);
      alert('Erreur: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const nbSelection = Object.values(selected).reduce(
    (sum, devisSel) => sum + Object.values(devisSel).filter(Boolean).length, 0
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: 28,
        maxWidth: 900, width: '95%', maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1565C0', margin: 0, marginBottom: 6 }}>
          Ajouter des produits
        </h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 0, marginBottom: 16 }}>
          Sélectionnez les produits à inclure depuis les commandes avec acompte encaissé.
          Les kits sont automatiquement éclatés en leurs composants.
        </p>

        <input
          type="text"
          placeholder="Rechercher par devis, client, produit..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 16,
            border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 13,
            boxSizing: 'border-box',
          }}
        />

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Chargement...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
              Aucun devis avec acompte encaissé {searchTerm && '(essayez de modifier votre recherche)'}
            </div>
          ) : (
            filtered.map((d: any) => {
              const clientNom = `${d.client_prenom || ''} ${d.client_nom || ''}`.trim() || '—';
              const lignes = d.lignes || [];

              return (
                <div key={d.numero} style={{
                  border: '1px solid #E5E7EB', borderRadius: 12,
                  marginBottom: 12, padding: 14, background: '#FAFBFC',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <strong style={{ color: '#1565C0' }}>{d.numero}</strong>
                      <span style={{ color: '#6B7280', marginLeft: 8 }}>— {clientNom}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {lignes.length} produit{lignes.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {lignes.map((ligne: any, idx: number) => {
                      const checked = !!selected[d.numero]?.[ligne.ref];
                      const alreadyInLA = existingRefs.includes(ligne.ref);

                      return (
                        <label key={idx} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: 8, background: checked ? '#DBEAFE' : '#fff',
                          borderRadius: 8, cursor: 'pointer',
                          border: '1px solid ' + (checked ? '#1565C0' : '#E5E7EB'),
                        }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLigne(d.numero, ligne.ref)}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1, fontSize: 13 }}>
                            <div>
                              <strong>{ligne.ref}</strong>
                              {' — '}
                              {ligne.nom_fr || ligne.designation || '—'}
                            </div>
                            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                              Qté devis : {ligne.qte || 1}
                              {alreadyInLA && (
                                <span style={{ marginLeft: 8, color: '#D97706', fontWeight: 600 }}>
                                  ⚠️ Déjà dans cette LA
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{
          display: 'flex', gap: 12, alignItems: 'center',
          borderTop: '1px solid #E5E7EB', paddingTop: 16,
        }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>
            <strong>{nbSelection}</strong> produit{nbSelection > 1 ? 's' : ''} sélectionné{nbSelection > 1 ? 's' : ''}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px', background: 'transparent', color: '#6B7280',
              border: '1.5px solid #E5E7EB', borderRadius: 10,
              fontSize: 14, cursor: 'pointer',
            }}>
            Annuler
          </button>
          <button
            onClick={ajouter}
            disabled={nbSelection === 0 || processing}
            style={{
              padding: '10px 20px',
              background: (nbSelection === 0 || processing) ? '#D3D1C7' : '#EA580C',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 600,
              cursor: (nbSelection === 0 || processing) ? 'not-allowed' : 'pointer',
            }}>
            {processing ? 'Ajout en cours...' : `Ajouter ${nbSelection > 0 ? `(${nbSelection})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildLigne(data: any): any {
  const id = `L${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  return {
    id,
    ref: data.ref,
    nom_fr: data.nom_fr,
    qte: data.qte || 1,
    fournisseur: data.fournisseur || '—',
    prix_achat_unitaire: data.prix_achat_unitaire || 0,
    conteneur_id: null,
    devis_id: data.devis_id,
    client_nom: data.client_nom,
    kit_parent: data.kit_parent || null,
    kit_parent_nom: data.kit_parent_nom || null,
    est_composant_kit: !!data.est_composant_kit,
    date_ajout: new Date().toISOString(),
  };
}

// Styles
const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16,
  padding: 24, marginBottom: 20,
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
const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#6B7280',
  fontSize: 12, textTransform: 'uppercase',
};
const tdStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle',
};
