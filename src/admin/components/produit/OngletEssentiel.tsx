import { useState, useEffect, useRef } from 'react';
import { CATEGORIES, SOUS_CATEGORIES, calculerPrixDerives, genererReferenceAuto } from '../../../lib/productHelpers';
import { uploadImagePrincipale, supprimerFichierStorage } from '../../../lib/storageHelpers';
import CompositionKitEditor from './CompositionKitEditor';

interface Props {
  product: any;
  onChange: (field: string, value: any) => void;
  isCreation: boolean;
}

export default function OngletEssentiel({ product, onChange, isCreation }: Props) {
  const [modeleAffine, setModeleAffine] = useState('');

  const prixDerives = typeof product.prix_achat === 'number' && product.prix_achat > 0
    ? calculerPrixDerives(product.prix_achat) : null;

  const sousCats = product.categorie ? SOUS_CATEGORIES[product.categorie] || [] : [];

  // === Gestion upload image principale ===
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadImagePrincipale = async (file: File) => {
    if (!product.reference && !isCreation) {
      alert('⚠️ Enregistrez d\'abord le produit pour uploader une image');
      return;
    }

    // Pour la création : exiger une référence saisie
    if (isCreation && (!product.reference || product.reference.trim() === '')) {
      alert('⚠️ Saisissez d\'abord une référence produit avant d\'uploader l\'image');
      return;
    }

    setUploadingImage(true);
    try {
      // Supprimer ancienne image si elle existe et vient de Firebase Storage
      if (product.image_principale && product.image_principale.includes('firebasestorage')) {
        await supprimerFichierStorage(product.image_principale);
      }

      const url = await uploadImagePrincipale(product.reference, file);
      onChange('image_principale', url);
    } catch (err: any) {
      alert('❌ Erreur upload : ' + err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadImagePrincipale(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUploadImagePrincipale(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemoveImage = async () => {
    if (!confirm('Supprimer l\'image principale ?')) return;
    const url = product.image_principale;
    onChange('image_principale', '');
    // Suppression Storage uniquement si c'est une URL Firebase
    if (url && url.includes('firebasestorage')) {
      await supprimerFichierStorage(url);
    }
  };

  // Auto-génération référence quand catégorie/sous-cat/modèle change (création uniquement)
  useEffect(() => {
    if (!isCreation) return;
    if (!product.categorie) return;
    const generer = async () => {
      const ref = await genererReferenceAuto(
        product.categorie,
        product.sous_categorie,
        modeleAffine || undefined
      );
      onChange('reference', ref);
    };
    generer();
  }, [product.categorie, product.sous_categorie, modeleAffine, isCreation]);

  return (
    <>
      {/* Identification */}
      <Card title="Identification" subtitle="Informations de base du produit">
        <FormGrid2>
          <Field label="Catégorie" required>
            <select value={product.categorie || ''} onChange={e => {
              onChange('categorie', e.target.value);
              onChange('sous_categorie', '');
            }} style={inputStyle}>
              <option value="">— Sélectionner —</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>

          {sousCats.length > 0 && (
            <Field label="Sous-catégorie">
              <select value={product.sous_categorie || ''} onChange={e => onChange('sous_categorie', e.target.value)} style={inputStyle}>
                <option value="">— Optionnel —</option>
                {sousCats.map(sc => <option key={sc.id} value={sc.id}>{sc.label}</option>)}
              </select>
              <Hint>Préfixe de référence : {sousCats.find(sc => sc.id === product.sous_categorie)?.prefixe || 'non défini'}</Hint>
            </Field>
          )}

          {isCreation && product.sous_categorie && (
            <Field label="Modèle / Variante (pour référence)">
              <input type="text" value={modeleAffine}
                onChange={e => setModeleAffine(e.target.value)}
                placeholder="Ex: 10K (pour kit 10kW) ou R22 (pour mini-pelle)"
                style={inputStyle} />
              <Hint>Optionnel — permet d'affiner la référence auto</Hint>
            </Field>
          )}

          <Field label="Référence" required full>
            <input type="text" value={product.reference || ''}
              onChange={e => onChange('reference', e.target.value.toUpperCase())}
              placeholder="Ex: KS-10K-001"
              style={inputStyle}
              disabled={!!product.created_at} />
            <Hint>
              {product.created_at
                ? 'Non modifiable après création'
                : isCreation && product.reference
                  ? '✨ Référence auto-générée. Modifiable si besoin.'
                  : 'Sélectionnez catégorie et sous-catégorie pour génération auto'}
            </Hint>
          </Field>

          <Field label="Nom (français)" required full>
            <input type="text" value={product.nom_fr || ''}
              onChange={e => onChange('nom_fr', e.target.value)}
              placeholder="Ex: Kit Solaire 10kW" style={inputStyle} />
          </Field>

          <div style={{ gridColumn: 'span 2' }}>
            <CheckboxField checked={!!product.est_kit}
              onChange={(checked: boolean) => onChange('est_kit', checked)}
              label="C'est un kit composé de plusieurs produits"
              subtitle="Le kit sera éclaté automatiquement dans les listes d'achat" />
          </div>
        </FormGrid2>
      </Card>

      {/* Composition kit */}
      {product.est_kit && (
        <Card title="Composition du kit" subtitle="Produits qui composent ce kit — chacun doit exister dans le catalogue">
          <CompositionKitEditor
            composition={Array.isArray(product.composition_kit) ? product.composition_kit : []}
            onChange={comp => onChange('composition_kit', comp)} />
        </Card>
      )}

      {/* Prix & Fournisseur */}
      <Card title="Prix & Fournisseur">
        <FormGrid2>
          <Field label="Prix d'achat en EUR" required>
            <input type="number" step="0.01" value={product.prix_achat ?? ''}
              onChange={e => onChange('prix_achat', parseFloat(e.target.value) || 0)}
              placeholder="0.00" style={inputStyle} />
            {prixDerives && (
              <div style={priceCalcStyle}>
                <span>User <strong>×2.0 = {prixDerives.prix_user.toLocaleString('fr-FR')} €</strong></span>
                <span>Partner <strong>×1.2 = {prixDerives.prix_partner.toLocaleString('fr-FR')} €</strong></span>
              </div>
            )}
          </Field>
          <Field label="Fournisseur" required>
            <input type="text" value={product.fournisseur || ''}
              onChange={e => onChange('fournisseur', e.target.value)}
              placeholder="Ex: JinkoSolar / DEYE" style={inputStyle} />
          </Field>
        </FormGrid2>
      </Card>

      {/* Logistique */}
      <Card title="Logistique" subtitle="Informations indispensables pour les Excel et la génération de devis">
        <FormGrid2>
          <Field label="Poids brut (kg)" required>
            <input type="number" step="0.1" value={product.poids_brut_kg ?? ''}
              onChange={e => onChange('poids_brut_kg', parseFloat(e.target.value) || 0)} style={inputStyle} />
          </Field>
          <Field label="Volume (m³)" required>
            <input type="number" step="0.001" value={product.volume_m3 ?? ''}
              onChange={e => onChange('volume_m3', parseFloat(e.target.value) || 0)} style={inputStyle} />
            <Hint>Calculé auto si L×l×H renseignés en onglet Détails techniques</Hint>
          </Field>
        </FormGrid2>
      </Card>

      {/* Image principale */}
      <Card title="Image principale" subtitle="Image affichée partout (site, devis, PDF). Glissez-déposez depuis votre ordinateur ou collez une URL.">
        {/* Si une image existe, afficher preview + bouton supprimer */}
        {product.image_principale ? (
          <FormGrid2>
            <div>
              <div style={{
                width: '100%',
                aspectRatio: '1',
                background: '#F3F4F6',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
                position: 'relative',
              }}>
                <img
                  src={product.image_principale}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: '#EA580C',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: uploadingImage ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {uploadingImage ? '⏳ Upload...' : '🔄 Remplacer'}
                </button>
                <button
                  onClick={handleRemoveImage}
                  style={{
                    padding: '10px 16px',
                    background: '#fff',
                    color: '#DC2626',
                    border: '1.5px solid #FECACA',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  🗑 Supprimer
                </button>
              </div>
              <Field label="URL (lecture seule)">
                <input
                  type="text"
                  value={product.image_principale || ''}
                  readOnly
                  style={{
                    ...inputStyle,
                    background: '#F9FAFB',
                    color: '#6B7280',
                    fontSize: 11,
                  }}
                />
                <Hint>URL Firebase Storage (ou externe)</Hint>
              </Field>
            </div>
          </FormGrid2>
        ) : (
          // Aucune image : zone drag & drop + input URL
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%',
                padding: 40,
                background: dragOver ? '#FFF7ED' : '#F9FAFB',
                border: `2px dashed ${dragOver ? '#EA580C' : '#E5E7EB'}`,
                borderRadius: 12,
                textAlign: 'center',
                cursor: uploadingImage ? 'wait' : 'pointer',
                transition: 'all 0.15s',
                marginBottom: 14,
              }}
            >
              {uploadingImage ? (
                <>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                    Upload en cours...
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                    Compression et envoi vers Firebase Storage
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40, color: '#9CA3AF', marginBottom: 8 }}>⬆</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                    Glissez-déposez une image ici
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                    ou cliquez pour parcourir — JPG, PNG, WebP (compression auto)
                  </div>
                </>
              )}
            </div>

            <div style={{ textAlign: 'center', margin: '12px 0', fontSize: 12, color: '#9CA3AF' }}>
              — ou —
            </div>

            <Field label="URL externe de l'image">
              <input
                type="text"
                value={product.image_principale || ''}
                onChange={e => onChange('image_principale', e.target.value)}
                placeholder="https://..."
                style={inputStyle}
              />
              <Hint>Pour coller une URL d'image hébergée ailleurs (optionnel)</Hint>
            </Field>
          </>
        )}

        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Card>

      {/* Statut */}
      <Card title="Statut">
        <CheckboxField checked={!!product.actif}
          onChange={(checked: boolean) => onChange('actif', checked)}
          label="Produit actif sur le site"
          subtitle="Si décoché, le produit n'apparaît pas dans le catalogue public mais reste disponible pour les devis admin" />
      </Card>
    </>
  );
}

function Card({ title, subtitle, children }: any) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#1E3A5F' }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function FormGrid2({ children }: any) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>; }

function Field({ label, required, full, children }: any) {
  return (
    <div style={{ gridColumn: full ? 'span 2' : undefined }}>
      <label style={labelStyle}>{label}{required && <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>}</label>
      {children}
    </div>
  );
}

function CheckboxField({ checked, onChange, label, subtitle }: any) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 14px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#EA580C' }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{label}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{subtitle}</div>}
      </div>
    </label>
  );
}

function Hint({ children }: any) { return <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{children}</div>; }

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, background: '#fff', fontFamily: 'inherit', color: '#111827', outline: 'none', boxSizing: 'border-box' };
const priceCalcStyle: React.CSSProperties = { background: '#F9FAFB', borderRadius: 10, padding: '12px 14px', marginTop: 8, fontSize: 12, color: '#6B7280', display: 'flex', gap: 20, flexWrap: 'wrap' };
