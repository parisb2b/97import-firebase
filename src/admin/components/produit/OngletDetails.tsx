import { useState, useRef } from 'react';
import { traduireTexte } from '../../../lib/deeplService';
import { calculerVolumeDepuisDimensions } from '../../../lib/productHelpers';
import { uploadCertificatCe, supprimerFichierStorage } from '../../../lib/storageHelpers';

interface Props {
  product: any;
  onChange: (field: string, value: any) => void;
}

export default function OngletDetails({ product, onChange }: Props) {
  const [translating, setTranslating] = useState<string | null>(null);
  const [uploadingCE, setUploadingCE] = useState(false);
  const ceInputRef = useRef<HTMLInputElement>(null);

  const handleTranslate = async (source: string, targetZh: string, targetEn: string) => {
    const texteFr = product[source];
    if (!texteFr) {
      alert('Remplissez d\'abord le champ français');
      return;
    }
    setTranslating(source);
    try {
      const [zh, en] = await Promise.all([
        traduireTexte(texteFr, 'ZH'),
        traduireTexte(texteFr, 'EN'),
      ]);
      onChange(targetZh, zh);
      onChange(targetEn, en);
    } catch (err: any) {
      alert('Erreur traduction : ' + err.message);
    } finally {
      setTranslating(null);
    }
  };

  const handleUploadCE = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product.reference) return;
    if (file.type !== 'application/pdf') {
      alert('Seul le format PDF est accepté');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 20 Mo)');
      return;
    }
    setUploadingCE(true);
    try {
      // Supprimer ancien si existe
      if (product.ce_certificat_pdf_url) {
        await supprimerFichierStorage(product.ce_certificat_pdf_url);
      }
      const url = await uploadCertificatCe(product.reference, file);
      onChange('ce_certificat_pdf_url', url);
      onChange('ce_certification', 'oui-pdf');
    } catch (err: any) {
      alert('Erreur upload : ' + err.message);
    } finally {
      setUploadingCE(false);
      if (ceInputRef.current) ceInputRef.current.value = '';
    }
  };

  const handleRemoveCE = async () => {
    if (!confirm('Supprimer le certificat CE ?')) return;
    const url = product.ce_certificat_pdf_url;
    onChange('ce_certificat_pdf_url', '');
    if (url) await supprimerFichierStorage(url);
  };

  const volumeCalc = calculerVolumeDepuisDimensions(
    product.longueur_cm, product.largeur_cm, product.hauteur_cm
  );

  // Vérifier si code_hs est vide pour afficher un warning visible
  const codeHsVide = !product.code_hs || product.code_hs.trim() === '';

  return (
    <>
      <Banner type="warning" icon="!">
        <strong>Champs optionnels mais recommandés.</strong> S'ils sont vides, les Excel afficheront "À compléter" en italique gris — non bloquant mais moins professionnel pour l'envoi fournisseur ou la déclaration douane.
      </Banner>

      {/* CODE HS — MISE EN VALEUR EN HAUT */}
      <Card
        title="Code HS douane"
        subtitle="⚠️ Requis pour la déclaration douane chinoise (Excel BE-EXPORT). À défaut, le conteneur sera bloqué au port."
      >
        <FormGrid2>
          <Field label="Code HS douane" required>
            <input
              type="text"
              value={product.code_hs || ''}
              onChange={e => onChange('code_hs', e.target.value)}
              placeholder="Ex: 85016190"
              style={{
                ...inputStyle,
                borderColor: codeHsVide ? '#F59E0B' : '#E5E7EB',
                background: codeHsVide ? '#FFFBEB' : '#fff',
              }}
            />
            <Hint>
              Code HS à 8 ou 10 chiffres.
              {codeHsVide && <span style={{ color: '#92400E', fontWeight: 600 }}> ⚠️ Champ vide — impossible d'exporter vers la Chine sans.</span>}
            </Hint>
          </Field>
          <div>
            <label style={labelStyle}>Aide recherche code HS</label>
            <a
              href="https://eservices.nf.fr/lookuphts/lookuphs.nsf"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '10px 14px',
                background: '#EEF2FF',
                color: '#4F46E5',
                textDecoration: 'none',
                borderRadius: 10,
                fontSize: 13,
                border: '1px solid #C7D2FE',
                textAlign: 'center',
              }}
            >
              🌐 Rechercher sur site douanes →
            </a>
          </div>
        </FormGrid2>
      </Card>

      {/* Traductions multilingues */}
      <Card title="Traductions multilingues" subtitle="Pour les fiches site bilingues et les Excel fournisseurs/douane">
        <TranslationRow
          labelFr="Nom français" valueFr={product.nom_fr || ''} disabledFr
          labelZh="Nom chinois" valueZh={product.nom_zh || ''}
          labelEn="Nom anglais" valueEn={product.nom_en || ''}
          onChangeZh={(v: string) => onChange('nom_zh', v)}
          onChangeEn={(v: string) => onChange('nom_en', v)}
          translating={translating === 'nom_fr'}
          onTranslate={() => handleTranslate('nom_fr', 'nom_zh', 'nom_en')}
        />
        <TranslationRow
          labelFr="Description courte FR" valueFr={product.description_courte_fr || ''}
          labelZh="Description courte ZH" valueZh={product.description_courte_zh || ''}
          labelEn="Description courte EN" valueEn={product.description_courte_en || ''}
          onChangeFr={(v: string) => onChange('description_courte_fr', v)}
          onChangeZh={(v: string) => onChange('description_courte_zh', v)}
          onChangeEn={(v: string) => onChange('description_courte_en', v)}
          translating={translating === 'description_courte_fr'}
          onTranslate={() => handleTranslate('description_courte_fr', 'description_courte_zh', 'description_courte_en')}
          textarea
        />
        <TranslationRow
          labelFr="Usage FR (déclaration douane)" valueFr={product.usage_fr || ''}
          labelZh="Usage ZH (中国海关)" valueZh={product.usage_zh || ''}
          labelEn="Usage EN" valueEn={product.usage_en || ''}
          onChangeFr={(v: string) => onChange('usage_fr', v)}
          onChangeZh={(v: string) => onChange('usage_zh', v)}
          onChangeEn={(v: string) => onChange('usage_en', v)}
          translating={translating === 'usage_fr'}
          onTranslate={() => handleTranslate('usage_fr', 'usage_zh', 'usage_en')}
        />
      </Card>

      {/* Dimensions physiques */}
      <Card title="Dimensions physiques" subtitle="Si renseignées, le volume sera calculé automatiquement et synchronisé dans l'onglet Essentiel">
        <FormGrid3>
          <Field label="Longueur (cm)">
            <input type="number" value={product.longueur_cm ?? ''} onChange={e => {
              const v = parseFloat(e.target.value) || 0;
              onChange('longueur_cm', v);
              const newVol = calculerVolumeDepuisDimensions(v, product.largeur_cm, product.hauteur_cm);
              if (newVol !== null) onChange('volume_m3', newVol);
            }} style={inputStyle} />
          </Field>
          <Field label="Largeur (cm)">
            <input type="number" value={product.largeur_cm ?? ''} onChange={e => {
              const v = parseFloat(e.target.value) || 0;
              onChange('largeur_cm', v);
              const newVol = calculerVolumeDepuisDimensions(product.longueur_cm, v, product.hauteur_cm);
              if (newVol !== null) onChange('volume_m3', newVol);
            }} style={inputStyle} />
          </Field>
          <Field label="Hauteur (cm)">
            <input type="number" value={product.hauteur_cm ?? ''} onChange={e => {
              const v = parseFloat(e.target.value) || 0;
              onChange('hauteur_cm', v);
              const newVol = calculerVolumeDepuisDimensions(product.longueur_cm, product.largeur_cm, v);
              if (newVol !== null) onChange('volume_m3', newVol);
            }} style={inputStyle} />
          </Field>
          <Field label="Poids net (kg)">
            <input type="number" step="0.1" value={product.poids_net_kg ?? ''}
              onChange={e => onChange('poids_net_kg', parseFloat(e.target.value) || 0)} style={inputStyle} />
            <Hint>Sans emballage</Hint>
          </Field>
          <Field label="Poids brut (kg) — voir Essentiel">
            <input type="number" step="0.1" value={product.poids_brut_kg ?? ''} disabled
              style={{ ...inputStyle, background: '#F9FAFB', color: '#6B7280' }} />
            <Hint>Modifiable depuis l'onglet Essentiel</Hint>
          </Field>
          <Field label="Volume calculé (m³)">
            <input
              type="number"
              value={volumeCalc ?? ''}
              disabled
              style={{
                ...inputStyle,
                background: volumeCalc ? '#D1FAE5' : '#F9FAFB',
                color: volumeCalc ? '#065F46' : '#6B7280',
                fontWeight: volumeCalc ? 500 : 400,
              }}
            />
            {volumeCalc && (
              <Hint>
                = {product.longueur_cm} × {product.largeur_cm} × {product.hauteur_cm} / 1 000 000
                <span style={{ color: '#059669', fontWeight: 600 }}> ✓ Synchronisé avec Essentiel</span>
              </Hint>
            )}
            {!volumeCalc && <Hint>Remplissez L, l, H ci-dessus pour calcul automatique</Hint>}
          </Field>
        </FormGrid3>
      </Card>

      {/* Matières */}
      <Card title="Matières & composition">
        <TranslationRow
          labelFr="Matière FR" valueFr={product.matiere_fr || ''}
          labelZh="Matière ZH" valueZh={product.matiere_zh || ''}
          labelEn="Matière EN" valueEn={product.matiere_en || ''}
          onChangeFr={(v: string) => onChange('matiere_fr', v)}
          onChangeZh={(v: string) => onChange('matiere_zh', v)}
          onChangeEn={(v: string) => onChange('matiere_en', v)}
          translating={translating === 'matiere_fr'}
          onTranslate={() => handleTranslate('matiere_fr', 'matiere_zh', 'matiere_en')}
        />
        <FormGrid2>
          <Field label="Couleur (optionnel)">
            <input type="text" value={product.couleur || ''}
              onChange={e => onChange('couleur', e.target.value)}
              placeholder="Ex: Noir / Gris anodisé" style={inputStyle} />
          </Field>
          <Field label="Marque (optionnel)">
            <input type="text" value={product.marque || ''}
              onChange={e => onChange('marque', e.target.value)}
              placeholder="Ex: JinkoSolar / DEYE" style={inputStyle} />
          </Field>
        </FormGrid2>
      </Card>

      {/* Fournisseur Chine SIMPLIFIÉ */}
      <Card title="Données fournisseur Chine" subtitle="Informations nécessaires au Bon de Commande et à la déclaration douanière">
        <FormGrid2>
          <Field label="Référence usine (chez le fournisseur)">
            <input type="text" value={product.reference_usine || ''}
              onChange={e => onChange('reference_usine', e.target.value)}
              placeholder="Ex: JKM-10KW-2026-HYBRID" style={inputStyle} />
            <Hint>Apparaît dans le BC-CHINE envoyé au fournisseur</Hint>
          </Field>
          <Field label="Ville d'origine (Chine)">
            <input type="text" value={product.ville_origine_cn || ''}
              onChange={e => onChange('ville_origine_cn', e.target.value)}
              placeholder="Ex: Shenzhen" style={inputStyle} />
            <Hint>Requis pour déclaration douane CN (BE-EXPORT)</Hint>
          </Field>
          <Field label="Pays d'origine" full>
            <input type="text" value={product.pays_origine ?? 'Chine'}
              onChange={e => onChange('pays_origine', e.target.value)} style={inputStyle} />
          </Field>
        </FormGrid2>
      </Card>

      {/* Certification CE avec upload PDF privé */}
      <Card title="Certification CE" subtitle="Statut et certificat PDF (stocké en privé dans Firebase, pas affiché sur le site)">
        <FormGrid2>
          <Field label="Statut certification CE">
            <select value={product.ce_certification || ''}
              onChange={e => onChange('ce_certification', e.target.value)} style={inputStyle}>
              <option value="">— Non renseigné —</option>
              <option value="oui-pdf">✓ Oui — avec PDF</option>
              <option value="oui-sans-pdf">✓ Oui — sans PDF disponible</option>
              <option value="non">✗ Non certifié</option>
              <option value="en-cours">⏳ Certification en cours</option>
            </select>
          </Field>

          <Field label="Certificat PDF">
            {product.ce_certificat_pdf_url ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                background: '#D1FAE5', borderRadius: 10, border: '1px solid #6EE7B7',
              }}>
                <div style={{
                  width: 32, height: 32, background: '#10B981', color: '#fff',
                  borderRadius: 6, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontWeight: 700, fontSize: 10,
                  flexShrink: 0,
                }}>PDF</div>
                <a
                  href={product.ce_certificat_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1, color: '#065F46', textDecoration: 'none',
                    fontSize: 13, fontWeight: 500,
                  }}
                >
                  📄 Voir le certificat CE
                </a>
                <button
                  onClick={handleRemoveCE}
                  style={{
                    background: 'transparent', border: '1px solid #FECACA',
                    color: '#DC2626', borderRadius: 8, padding: '4px 10px',
                    cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                  }}
                >✕</button>
              </div>
            ) : (
              <>
                <input
                  ref={ceInputRef}
                  type="file"
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleUploadCE}
                />
                <button
                  onClick={() => ceInputRef.current?.click()}
                  disabled={uploadingCE || !product.reference}
                  style={{
                    width: '100%', padding: 10, background: 'transparent',
                    border: '1.5px dashed #E5E7EB', color: '#6B7280', borderRadius: 10,
                    fontSize: 13, cursor: uploadingCE ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {uploadingCE ? '⏳ Upload en cours...' : '⬆ Uploader le certificat CE (PDF)'}
                </button>
                {!product.reference && (
                  <Hint>Enregistrez d'abord le produit pour pouvoir uploader</Hint>
                )}
              </>
            )}
          </Field>
        </FormGrid2>
      </Card>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// COMPOSANTS HELPERS LOCAUX (styles identiques à Phase 1)
// ═══════════════════════════════════════════════════════

function Card({ title, subtitle, children }: any) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#1E3A5F' }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function FormGrid2({ children }: any) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{children}</div>;
}
function FormGrid3({ children }: any) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>{children}</div>;
}

function Field({ label, required, full, children }: any) {
  return (
    <div style={{ gridColumn: full ? 'span 2' : undefined }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Hint({ children }: any) {
  return <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{children}</div>;
}

function Banner({ type, icon, children }: any) {
  const colors: any = {
    success: { bg: '#D1FAE5', color: '#065F46', border: '#10B981' },
    warning: { bg: '#FEF3C7', color: '#92400E', border: '#F59E0B' },
    danger: { bg: '#FEE2E2', color: '#991B1B', border: '#EF4444' },
    info: { bg: '#DBEAFE', color: '#1E40AF', border: '#3B82F6' },
  };
  const c = colors[type] || colors.info;
  return (
    <div style={{
      padding: '14px 18px', borderRadius: 12, marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 12, fontSize: 14,
      background: c.bg, color: c.color, borderLeft: `4px solid ${c.border}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontWeight: 700,
        background: c.border, color: '#fff', flexShrink: 0,
      }}>{icon}</div>
      <div>{children}</div>
    </div>
  );
}

function TranslationRow({
  labelFr, valueFr, onChangeFr, disabledFr,
  labelZh, valueZh, onChangeZh,
  labelEn, valueEn, onChangeEn,
  translating, onTranslate, textarea,
}: any) {
  const Input: any = textarea ? 'textarea' : 'input';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto',
      gap: 10, alignItems: 'flex-end', marginBottom: 14,
    }}>
      <div>
        <label style={labelStyle}>{labelFr} <LangTag type="fr" /></label>
        <Input
          {...(textarea ? { rows: 2 } : { type: 'text' })}
          value={valueFr}
          onChange={(e: any) => onChangeFr?.(e.target.value)}
          disabled={disabledFr}
          style={{
            ...inputStyle,
            ...(textarea ? { minHeight: 60, resize: 'vertical' } : {}),
            ...(disabledFr ? { background: '#F9FAFB', color: '#6B7280' } : {}),
          }}
        />
      </div>
      <div>
        <label style={labelStyle}>{labelZh} <LangTag type="zh" /></label>
        <Input
          {...(textarea ? { rows: 2 } : { type: 'text' })}
          value={valueZh}
          onChange={(e: any) => onChangeZh(e.target.value)}
          style={{
            ...inputStyle,
            ...(textarea ? { minHeight: 60, resize: 'vertical' } : {}),
          }}
        />
      </div>
      <div>
        <label style={labelStyle}>{labelEn} <LangTag type="en" /></label>
        <Input
          {...(textarea ? { rows: 2 } : { type: 'text' })}
          value={valueEn}
          onChange={(e: any) => onChangeEn(e.target.value)}
          style={{
            ...inputStyle,
            ...(textarea ? { minHeight: 60, resize: 'vertical' } : {}),
          }}
        />
      </div>
      <button
        onClick={onTranslate}
        disabled={translating}
        style={{
          background: '#EEF2FF', color: '#4F46E5',
          border: '1px solid #C7D2FE', padding: '10px 14px',
          borderRadius: 10, fontSize: 13,
          cursor: translating ? 'not-allowed' : 'pointer',
          fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'inherit',
        }}
      >
        {translating ? '⏳' : '🌐'} {translating ? 'Traduction...' : 'Traduire'}
      </button>
    </div>
  );
}

function LangTag({ type }: { type: 'fr' | 'zh' | 'en' }) {
  const c = {
    fr: { bg: '#DBEAFE', color: '#1E40AF' },
    zh: { bg: '#FEE2E2', color: '#991B1B' },
    en: { bg: '#D1FAE5', color: '#065F46' }
  }[type];
  return (
    <span style={{
      display: 'inline-block', background: c.bg, color: c.color,
      fontSize: 10, padding: '1px 6px', borderRadius: 4,
      fontWeight: 700, marginLeft: 4,
    }}>
      {type.toUpperCase()}
    </span>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#6B7280',
  marginBottom: 6, fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: 0.3,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB',
  borderRadius: 10, fontSize: 14, background: '#fff', fontFamily: 'inherit',
  color: '#111827', outline: 'none', boxSizing: 'border-box',
};
