import { useState, useEffect } from 'react';
import { CATEGORIES, SOUS_CATEGORIES, calculerPrixDerives, genererReferenceAuto } from '../../../lib/productHelpers';
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
      <Card title="Image principale" subtitle="Image affichée partout (site, devis, PDF)">
        <FormGrid2>
          <div>
            <div style={imagePreviewStyle}>
              {product.image_principale ? (
                <img src={product.image_principale} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#9CA3AF' }}>Aucune image</span>
              )}
            </div>
          </div>
          <Field label="URL de l'image principale" required>
            <input type="text" value={product.image_principale || ''}
              onChange={e => onChange('image_principale', e.target.value)}
              placeholder="URL Firebase Storage ou URL externe" style={inputStyle} />
            <Hint>Pour uploader une image, utilisez l'onglet Médias site web</Hint>
          </Field>
        </FormGrid2>
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
function FormGrid3({ children }: any) { return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>{children}</div>; }

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
const imagePreviewStyle: React.CSSProperties = { width: '100%', aspectRatio: '1', background: '#F3F4F6', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', border: '1px solid #E5E7EB', fontSize: 12, position: 'relative', overflow: 'hidden' };
