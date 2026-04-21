import { useState, useRef } from 'react';
import { traduireTexte } from '@/lib/deeplService';
import { uploadPdfPublic, supprimerFichierStorage } from '@/lib/storageHelpers';
import { genererSlug } from '@/lib/productHelpers';
import GaleriePhotos from './GaleriePhotos';
import GalerieVideos from './GalerieVideos';

interface Props {
  product: any;
  onChange: (field: string, value: any) => void;
}

export default function OngletMedias({ product, onChange }: Props) {
  const [translating, setTranslating] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleTranslateMarketing = async (cible: 'ZH' | 'EN') => {
    if (!product.description_marketing_fr) {
      alert('⚠️ Remplissez d\'abord la description FR');
      return;
    }
    setTranslating(cible);
    try {
      const traduction = await traduireTexte(product.description_marketing_fr, cible);
      onChange(cible === 'ZH' ? 'description_marketing_zh' : 'description_marketing_en', traduction);
    } catch (err: any) {
      alert('❌ Erreur traduction : ' + err.message);
    } finally {
      setTranslating(null);
    }
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product.reference) return;
    if (file.type !== 'application/pdf') {
      alert('Seul le format PDF est accepté');
      return;
    }
    setUploadingPdf(true);
    try {
      const { url, taille_mo } = await uploadPdfPublic(product.reference, file);
      const currentDocs = Array.isArray(product.documents_pdf) ? product.documents_pdf : [];
      const newDoc = {
        nom: file.name.replace(/\.pdf$/i, ''),
        url,
        taille_mo,
        date_upload: new Date().toISOString(),
      };
      onChange('documents_pdf', [...currentDocs, newDoc]);
    } catch (err: any) {
      alert('❌ Erreur upload : ' + err.message);
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const handleRemovePdf = async (index: number) => {
    if (!confirm('Supprimer ce document ?')) return;
    const doc = product.documents_pdf[index];
    onChange('documents_pdf', product.documents_pdf.filter((_: any, i: number) => i !== index));
    if (doc?.url) await supprimerFichierStorage(doc.url);
  };

  const handleGenererSlug = () => {
    onChange('slug_url', genererSlug(product.nom_fr || product.reference || ''));
  };

  const points: string[] = Array.isArray(product.points_forts) ? product.points_forts : [];
  const videos = Array.isArray(product.videos_galerie) ? product.videos_galerie : [];
  const photos = Array.isArray(product.images_galerie) ? product.images_galerie : [];

  return (
    <>
      <Banner type="info" icon="i">
        <strong>Ces éléments concernent la fiche produit publique.</strong> Sur le site, les vidéos s'afficheront en premier, puis les photos. Vous pouvez masquer individuellement chaque média sans le supprimer.
      </Banner>

      {/* VIDÉOS MP4 (EN PREMIER car affichées en premier sur le site) */}
      <Card
        title="Galerie vidéos MP4"
        subtitle="Jusqu'à 6 vidéos. Thumbnails générés automatiquement. Avertissement si > 200 Mo (coût bande passante)."
      >
        <GalerieVideos
          productRef={product.reference || ''}
          videos={videos}
          onChange={(newVideos) => onChange('videos_galerie', newVideos)}
        />
      </Card>

      {/* PHOTOS */}
      <Card
        title="Galerie photos"
        subtitle="Jusqu'à 6 photos. Compression automatique (max 1920px, JPEG 80%)."
      >
        <GaleriePhotos
          productRef={product.reference || ''}
          photos={photos}
          onChange={(newPhotos) => onChange('images_galerie', newPhotos)}
        />
      </Card>

      {/* Vidéo externe */}
      <Card title="Vidéo externe (YouTube, Vimeo)">
        <Field label="URL vidéo externe (optionnel)">
          <input
            type="text"
            value={product.video_url || ''}
            onChange={e => onChange('video_url', e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            style={inputStyle}
          />
          <Hint>Différent des vidéos MP4 uploadées ci-dessus — pour intégrer une vidéo hébergée ailleurs</Hint>
        </Field>
      </Card>

      {/* Description marketing */}
      <Card title="Description marketing" subtitle="Texte long affiché sur la fiche produit publique">
        <Field label="Description FR">
          <textarea
            rows={6}
            value={product.description_marketing_fr || ''}
            onChange={e => onChange('description_marketing_fr', e.target.value)}
            placeholder="Décrivez le produit de manière engageante pour le client..."
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
          />
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => handleTranslateMarketing('ZH')}
            disabled={translating !== null}
            style={btnTranslate}
          >
            {translating === 'ZH' ? '⏳ Traduction ZH...' : '🌐 Traduire en chinois'}
          </button>
          <button
            onClick={() => handleTranslateMarketing('EN')}
            disabled={translating !== null}
            style={btnTranslate}
          >
            {translating === 'EN' ? '⏳ Traduction EN...' : '🌐 Traduire en anglais'}
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <Field label="Description ZH (中文)">
            <textarea
              rows={4}
              value={product.description_marketing_zh || ''}
              onChange={e => onChange('description_marketing_zh', e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            />
          </Field>
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="Description EN">
            <textarea
              rows={4}
              value={product.description_marketing_en || ''}
              onChange={e => onChange('description_marketing_en', e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            />
          </Field>
        </div>
      </Card>

      {/* Points forts */}
      <Card title="Points forts (bullet points)" subtitle="Affichés en liste à puces sur la fiche produit">
        {points.length === 0 && (
          <div style={{ padding: 14, textAlign: 'center', color: '#9CA3AF', background: '#F9FAFB', borderRadius: 10, fontSize: 13, marginBottom: 10 }}>
            Aucun point fort. Cliquez sur "+ Ajouter" ci-dessous.
          </div>
        )}
        {points.map((pt, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              value={pt}
              onChange={e => {
                const newPoints = [...points];
                newPoints[i] = e.target.value;
                onChange('points_forts', newPoints);
              }}
              placeholder={`Point fort ${i + 1}...`}
              style={{ flex: 1, ...inputStyle }}
            />
            <button
              onClick={() => onChange('points_forts', points.filter((_, j) => j !== i))}
              style={{
                background: 'transparent', border: '1px solid #FECACA',
                color: '#DC2626', borderRadius: 8, padding: '6px 12px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >×</button>
          </div>
        ))}
        <button
          onClick={() => onChange('points_forts', [...points, '✓ '])}
          style={{
            width: '100%', padding: 10, background: 'transparent',
            border: '1.5px dashed #E5E7EB', color: '#6B7280',
            borderRadius: 10, fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >+ Ajouter un point fort</button>
      </Card>

      {/* Documents PDF publics */}
      <Card
        title="Documents techniques PDF"
        subtitle="Fiches techniques, manuels (téléchargeables par le client depuis le site)"
      >
        {(product.documents_pdf || []).map((d: any, i: number) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', background: '#F9FAFB',
              borderRadius: 10, border: '1px solid #E5E7EB',
              fontSize: 13, marginBottom: 8,
            }}
          >
            <div style={{
              width: 36, height: 36, background: '#FEE2E2', color: '#991B1B',
              borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0,
            }}>PDF</div>
            <div style={{ flex: 1 }}>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1E3A5F', textDecoration: 'none', fontWeight: 500 }}
              >
                {d.nom}
              </a>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {d.taille_mo} Mo · {d.date_upload ? new Date(d.date_upload).toLocaleDateString('fr-FR') : ''}
              </div>
            </div>
            <button
              onClick={() => handleRemovePdf(i)}
              style={{
                background: 'transparent', border: '1px solid #FECACA',
                color: '#DC2626', borderRadius: 8, padding: '6px 10px',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >×</button>
          </div>
        ))}
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={handleUploadPdf}
        />
        <button
          onClick={() => pdfInputRef.current?.click()}
          disabled={uploadingPdf || !product.reference}
          style={{
            width: '100%', padding: 10, background: 'transparent',
            border: '1.5px dashed #E5E7EB', color: '#6B7280',
            borderRadius: 10, fontSize: 13,
            cursor: uploadingPdf ? 'wait' : 'pointer',
            fontFamily: 'inherit', marginTop: 8,
          }}
        >
          {uploadingPdf ? '⏳ Upload...' : '+ Uploader un document PDF'}
        </button>
      </Card>

      {/* SEO */}
      <Card title="SEO & URL">
        <Field label="Slug URL">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={product.slug_url || ''}
              onChange={e => onChange('slug_url', e.target.value)}
              placeholder="kit-solaire-10kw-complet"
              style={{ flex: 1, ...inputStyle }}
            />
            <button
              onClick={handleGenererSlug}
              style={{
                padding: '10px 16px', background: '#fff', color: '#374151',
                border: '1px solid #E5E7EB', borderRadius: 10,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >🔄 Auto</button>
          </div>
          {product.slug_url && (
            <Hint>
              URL finale : 97import.com/{product.categorie}/
              <strong style={{ color: '#EA580C' }}>{product.slug_url}</strong>
            </Hint>
          )}
        </Field>
        <div style={{ marginTop: 14 }}>
          <Field label="Meta title (SEO)">
            <input
              type="text"
              value={product.meta_title || ''}
              onChange={e => onChange('meta_title', e.target.value)}
              placeholder="Titre pour Google (60 caractères max)"
              style={inputStyle}
            />
          </Field>
        </div>
        <div style={{ marginTop: 14 }}>
          <Field label="Meta description (SEO)">
            <textarea
              rows={3}
              value={product.meta_description || ''}
              onChange={e => onChange('meta_description', e.target.value)}
              placeholder="Description pour Google (160 caractères max)"
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
            />
          </Field>
        </div>
      </Card>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// COMPOSANTS HELPERS LOCAUX
// ═══════════════════════════════════════════════════════

function Card({ title, subtitle, children }: any) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E5E7EB',
      borderRadius: 16, padding: 24, marginBottom: 16,
    }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#1E3A5F' }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, color: '#6B7280',
        marginBottom: 6, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: 0.3,
      }}>{label}</label>
      {children}
    </div>
  );
}

function Hint({ children }: any) {
  return <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{children}</div>;
}

function Banner({ type, icon, children }: any) {
  const colors: Record<string, any> = {
    success: { bg: '#D1FAE5', color: '#065F46', border: '#10B981' },
    warning: { bg: '#FEF3C7', color: '#92400E', border: '#F59E0B' },
    danger: { bg: '#FEE2E2', color: '#991B1B', border: '#EF4444' },
    info: { bg: '#DBEAFE', color: '#1E40AF', border: '#3B82F6' },
  };
  const c = colors[type] || colors['info'];
  return (
    <div style={{
      padding: '14px 18px', borderRadius: 12, marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 12, fontSize: 14,
      background: c.bg, color: c.color, borderLeft: `4px solid ${c.border}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, background: c.border, color: '#fff', flexShrink: 0,
      }}>{icon}</div>
      <div>{children}</div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB',
  borderRadius: 10, fontSize: 14, background: '#fff',
  fontFamily: 'inherit', color: '#111827', outline: 'none',
  boxSizing: 'border-box',
};

const btnTranslate: React.CSSProperties = {
  background: '#EEF2FF', color: '#4F46E5',
  border: '1px solid #C7D2FE', padding: '10px 14px',
  borderRadius: 10, fontSize: 13, cursor: 'pointer',
  fontWeight: 500, fontFamily: 'inherit',
};
