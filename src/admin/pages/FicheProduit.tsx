import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { calculerCompletude, CHAMPS_ESSENTIEL, migrerGalerieImages } from '../../lib/productHelpers';
import FicheProduitTabs from '../components/produit/FicheProduitTabs';
import OngletEssentiel from '../components/produit/OngletEssentiel';
import OngletDetails from '../components/produit/OngletDetails';
import OngletMedias from '../components/produit/OngletMedias';

export default function FicheProduit() {
  const [, params] = useRoute('/admin/produits/:ref');
  const [matchNouveau] = useRoute('/admin/produits/nouveau');
  const isCreation = !!matchNouveau;
  const [, setLocation] = useLocation();

  const [product, setProduct] = useState<any>({
    reference: '',
    categorie: '',
    sous_categorie: '',
    nom_fr: '',
    prix_achat: 0,
    fournisseur: '',
    poids_brut_kg: 0,
    volume_m3: 0,
    code_hs: '',
    image_principale: '',
    actif: true,
    est_kit: false,
    composition_kit: [],
  });

  const [loading, setLoading] = useState(!isCreation);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'essentiel' | 'details' | 'medias'>('essentiel');

  const completude = useMemo(() => calculerCompletude(product), [product]);

  useEffect(() => {
    if (isCreation) return;
    if (!params?.ref) return;
    const loadProduct = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'products', params.ref));
        if (!snap.exists()) {
          alert('Produit introuvable');
          setLocation('/admin/produits');
          return;
        }
        const data = { id: snap.id, ...snap.data() };
        const migrated = migrerGalerieImages(data);
        setProduct(migrated);
      } catch (err) {
        console.error('Erreur chargement:', err);
        alert('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [isCreation, params?.ref]);

  const handleChange = (field: string, value: any) => {
    setProduct((prev: any) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!product) return;

    // === Vérifications STRICTEMENT bloquantes (2 champs uniquement) ===
    if (!product.reference || product.reference.trim() === '') {
      alert('❌ La référence est obligatoire pour créer/sauvegarder le produit.');
      setActiveTab('essentiel');
      return;
    }
    if (!product.categorie || product.categorie.trim() === '') {
      alert('❌ La catégorie est obligatoire pour créer/sauvegarder le produit.');
      setActiveTab('essentiel');
      return;
    }

    // === Sauvegarde (toujours tentée même si champs manquants) ===
    setSaving(true);
    try {
      const ref = product.reference;

      // Vérifier unicité si création
      if (isCreation) {
        const existing = await getDoc(doc(db, 'products', ref));
        if (existing.exists()) {
          alert(`⚠️ La référence ${ref} existe déjà. Choisissez une autre référence.`);
          setSaving(false);
          return;
        }
      }

      // Calcul complétude à jour
      const completudeActuelle = calculerCompletude(product);

      const data = {
        ...product,
        completude: {
          essentiel: completudeActuelle.essentiel,
          details: completudeActuelle.details,
          medias: completudeActuelle.medias,
          statut: completudeActuelle.statut,
        },
        updated_at: serverTimestamp(),
        ...(isCreation ? { created_at: serverTimestamp() } : {}),
      };

      await setDoc(doc(db, 'products', ref), data, { merge: !isCreation });
      setDirty(false);

      // === Message de feedback adapté à la complétude ===
      const nbManquants = CHAMPS_ESSENTIEL.length - completudeActuelle.essentiel;
      if (nbManquants === 0) {
        // Tout OK
        alert(isCreation
          ? '✅ Produit créé avec succès'
          : '✅ Produit enregistré avec succès');
      } else {
        // Sauvegarde partielle : info non bloquante
        const message = `✅ ${isCreation ? 'Produit créé' : 'Produit enregistré'} avec succès\n\n`
          + `ℹ️ ${nbManquants} champ(s) essentiel(s) reste(nt) à remplir :\n`
          + completudeActuelle.champs_manquants_essentiel.map(c => `  • ${c}`).join('\n')
          + '\n\nLe produit reste en statut "Bloquant" jusqu\'à ce qu\'ils soient tous remplis.'
          + '\nVous pouvez revenir quand vous voulez pour les compléter.';
        alert(message);
      }

      // Redirection ou rechargement
      if (isCreation) {
        setLocation(`/admin/produits/${encodeURIComponent(ref)}`);
      } else {
        // Recharger pour synchroniser avec Firestore
        const snap = await getDoc(doc(db, 'products', ref));
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() });
        }
      }
    } catch (err: any) {
      alert('❌ Erreur lors de la sauvegarde : ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('⚠️ Supprimer définitivement ce produit ?\n\nCette action est irréversible.')) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'products', product.reference));
      alert('✓ Produit supprimé');
      setLocation('/admin/produits');
    } catch (err: any) {
      console.error('Erreur delete:', err);
      alert('Erreur lors de la suppression: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
        Chargement du produit...
      </div>
    );
  }

  const statutBadge = {
    complet: { label: '● Complet', bg: '#D1FAE5', color: '#065F46' },
    pret_site: { label: '● Prêt pour le site', bg: '#DBEAFE', color: '#1E40AF' },
    a_enrichir: { label: '● À enrichir', bg: '#FEF3C7', color: '#92400E' },
    bloquant: { label: '● Champs essentiels manquants', bg: '#FEE2E2', color: '#991B1B' },
  }[completude.statut];

  const bannerConfig = {
    complet: {
      bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7',
      icon: '✓', title: 'Produit complet',
      message: 'Tous les champs sont renseignés. Ce produit est prêt pour le catalogue public et les exports Excel.',
    },
    pret_site: {
      bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD',
      icon: '✓', title: 'Prêt pour le site',
      message: 'Tous les champs essentiels sont OK. Vous pouvez enrichir les détails techniques et médias pour une fiche produit plus complète.',
    },
    a_enrichir: {
      bg: '#FEF3C7', color: '#92400E', border: '#FCD34D',
      icon: '⚠', title: 'À enrichir',
      message: 'L\'essentiel est OK mais des champs optionnels manquent. Le produit fonctionne mais sa fiche sera moins riche sur le site.',
    },
    bloquant: {
      bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5',
      icon: '✗', title: 'Champs essentiels manquants',
      message: `Il manque ${CHAMPS_ESSENTIEL.length - completude.essentiel} champ(s) essentiel(s). Complétez l'onglet Essentiel avant de pouvoir sauvegarder.`,
    },
  }[completude.statut];

  return (
    <div style={{ padding: 32, paddingBottom: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/produits">
          <button style={{ background: 'transparent', border: '1px solid #E5E7EB', color: '#6B7280', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
            ← Retour à la liste
          </button>
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E3A5F', margin: 0 }}>
              {isCreation ? 'Nouveau produit' : product.nom_fr || product.reference}
            </h1>
            {!isCreation && (
              <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
                Référence <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, fontFamily: 'SF Mono, Monaco, monospace' }}>{product.reference}</code>
              </p>
            )}
          </div>
          <div style={{ background: statutBadge.bg, color: statutBadge.color, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
            {statutBadge.label}
          </div>
        </div>
      </div>

      {/* Banner */}
      <div style={{ background: bannerConfig.bg, border: `1px solid ${bannerConfig.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ fontSize: 20, color: bannerConfig.color }}>{bannerConfig.icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: bannerConfig.color, marginBottom: 2 }}>{bannerConfig.title}</div>
          <div style={{ fontSize: 13, color: bannerConfig.color, opacity: 0.9 }}>{bannerConfig.message}</div>
        </div>
      </div>

      {/* Tabs */}
      <FicheProduitTabs activeTab={activeTab} onChange={setActiveTab} completude={completude} locked={isCreation} />

      {/* Onglet Essentiel */}
      {activeTab === 'essentiel' && (
        <OngletEssentiel product={product} onChange={handleChange} isCreation={isCreation} />
      )}

      {/* Onglet Détails */}
      {activeTab === 'details' && !isCreation && (
        <OngletDetails product={product} onChange={handleChange} />
      )}

      {/* Onglet Médias — Placeholder Phase 3 */}
      {activeTab === 'medias' && !isCreation && (
        <OngletMedias product={product} onChange={handleChange} />
      )}

      {/* Sticky Footer */}
      <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '2px solid #E5E7EB', padding: '16px 32px', marginLeft: -32, marginRight: -32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, zIndex: 100 }}>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          {isCreation ? (
            <span>⚠️ Référence et catégorie obligatoires. Les autres champs peuvent être complétés plus tard.</span>
          ) : dirty ? (
            <span style={{ color: '#EA580C', fontWeight: 600 }}>● Modifications non enregistrées</span>
          ) : completude.essentiel < CHAMPS_ESSENTIEL.length ? (
            <span style={{ color: '#92400E' }}>
              ⚠️ {CHAMPS_ESSENTIEL.length - completude.essentiel} champ(s) essentiel(s) manquant(s) — produit non utilisable en devis
            </span>
          ) : (
            <span>Aucune modification en attente</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isCreation && (
            <button onClick={handleDelete} disabled={saving}
              style={{ padding: '10px 20px', background: 'transparent', border: '1.5px solid #FCA5A5', color: '#DC2626', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}>
              Supprimer
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            style={{
              padding: '10px 24px',
              background: saving ? '#D1D5DB' : '#EA580C',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}>
            {saving
              ? 'Enregistrement...'
              : isCreation
                ? 'Créer le produit'
                : completude.essentiel < CHAMPS_ESSENTIEL.length
                  ? 'Enregistrer (incomplet)'
                  : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
