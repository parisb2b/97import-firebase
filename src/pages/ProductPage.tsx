/**
 * ProductPage — Fiche produit détaillée
 * Route: /produit/:id
 */
import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { Link, useParams } from 'wouter'
import { db } from '../lib/firebase'
import { Product } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../features/cart/CartContext'
import { calculerPrix, formatPrix, eurToYuan, formatYuan } from '../utils/calculPrix'
import { useLang, LangToggle } from '../contexts/LanguageContext'
import { generateQuotePDF } from '../features/pdf/templates/quote-pdf'
import { getNextDevisNumber } from '../lib/firebaseHelpers'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes } from 'firebase/storage'
import { storage } from '../lib/firebase'

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgdmlld0JveD0iMCAwIDY0MCA0ODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSI0ODAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSIzMjAiIHk9IjI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5Q0EzQUYiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg=='

type CatType = 'machine' | 'accessory' | 'solar' | 'house'

function getCatType(categorie?: string): CatType {
  if (categorie === 'mini-pelles') return 'machine'
  if (categorie === 'maisons') return 'house'
  if (categorie === 'solaire') return 'solar'
  return 'accessory'
}

export default function ProductPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const { role, user, profile } = useAuth()
  const { addToCart, count } = useCart()
  const { lang, t } = useLang()

  const [product, setProduct]       = useState<Product | null>(null)
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)
  const [activeImg, setActiveImg]   = useState(0)
  const [imgErrors, setImgErrors]   = useState<Record<number, boolean>>({})
  const [addedToCart, setAddedToCart] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [qty, setQty]               = useState(1)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, 'products', id))
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() } as Product)
        } else {
          setNotFound(true)
        }
      } catch (err) {
        console.error(err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function handleAddToCart() {
    if (!product) return
    const prix = calculerPrix(product.prix_achat, role)
    const prixUnit = prix.montant ?? 0
    addToCart({
      id: product.id,
      name: product.nom,
      prixAchat: product.prix_achat,
      prixUnitaire: prixUnit,
      image: product.images?.[0] || '',
      type: getCatType(product.categorie),
      numeroInterne: product.numero_interne,
    })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
  }

  async function handleGeneratePdf() {
    if (!product) return
    if (!user) {
      alert(lang === 'fr' ? 'Connectez-vous pour generer un devis' : '请登录以生成报价单')
      return
    }
    setPdfLoading(true)
    try {
      const prixCalc = calculerPrix(product.prix_achat, role)
      const prixUnit = prixCalc.montant ?? product.prix_achat * 2
      const totalHT = prixUnit * qty

      // Numero de devis atomique Firestore
      const numeroDevis = await getNextDevisNumber()

      // Date formatee
      const dateStr = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })

      // Generer PDF LUXENT
      const pdfDoc = generateQuotePDF({
        numero_devis: numeroDevis,
        date: dateStr,
        client: {
          nom: profile?.last_name || '',
          prenom: profile?.first_name || '',
          email: profile?.email || user?.email || '',
          telephone: profile?.phone || '',
          adresse: profile?.adresse_facturation || '',
          ville: profile?.ville_facturation || '',
          cp: profile?.cp_facturation || '',
          pays: 'France',
        },
        produits: [{
          nom: product.nom,
          numero_interne: product.numero_interne,
          quantite: qty,
          prixUnitaire: prixUnit,
        }],
        total_ht: totalHT,
        lang: 'fr',
      })

      // Sauvegarder dans Firestore
      await addDoc(collection(db, 'quotes'), {
        numero: numeroDevis,
        client_nom: profile?.last_name || '',
        client_prenom: profile?.first_name || '',
        client_email: profile?.email || user?.email || '',
        user_id: user.uid,
        total_ht: totalHT,
        produits: [{
          nom: product.nom,
          numero_interne: product.numero_interne || '',
          quantite: qty,
          prixUnitaire: prixUnit,
        }],
        statut: 'brouillon',
        created_at: serverTimestamp(),
      })

      // Upload PDF dans Storage (non-bloquant)
      try {
        const pdfBlob = pdfDoc.output('blob')
        const storageRef = ref(storage, `devis/${numeroDevis}.pdf`)
        await uploadBytes(storageRef, pdfBlob, { contentType: 'application/pdf' })
      } catch { /* non-bloquant */ }

      // Telecharger
      pdfDoc.save(`${numeroDevis}.pdf`)
    } catch (err) {
      console.error('Erreur PDF:', err)
      alert('Erreur lors de la generation du PDF.')
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
          <p>{t('msg_loading')}</p>
        </div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
        <h1 style={{ color: '#1E3A5F', marginBottom: '8px' }}>{lang === 'fr' ? 'Produit introuvable' : '产品未找到'}</h1>
        <Link href="/catalogue">
          <button style={{ marginTop: '16px', padding: '10px 20px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
            ← {lang === 'fr' ? 'Retour au catalogue' : '返回目录'}
          </button>
        </Link>
      </div>
    )
  }

  const prix = calculerPrix(product.prix_achat, role)
  const images = product.images && product.images.length > 0 ? product.images : [PLACEHOLDER]
  const specs = (product as any).specs_raw || {}
  const hasSpecs = Object.keys(specs).length > 0
  const detailedSpecs: Record<string, { label: string; value: string }[]> = (product as any).detailed_specs || {}
  const hasDetailedSpecs = Object.keys(detailedSpecs).length > 0
  const features: string[] = (product as any).features || []
  const descriptionFr: string = (product as any).description_fr || ''

  // Catégorie URL
  const catPath = {
    'mini-pelles': '/mini-pelles',
    'maisons':     '/maisons',
    'solaire':     '/solaire',
    'accessoires': '/accessoires',
  }[product.categorie || ''] || '/catalogue'

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── BANNIÈRE ──────────────────────────────────── */}
      <div style={{ background: '#1D4ED8', color: '#fff', textAlign: 'center', padding: '5px', fontSize: '12px', fontWeight: '600' }}>
        {lang === 'fr' ? '-50% PAR RAPPORT AUX PRIX MARTINIQUE' : '比马提尼克岛零售价低50%'}
      </div>

      {/* ── NAVBAR ────────────────────────────────────── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: '#1E3A5F' }}>97import</span>
          </Link>
          <Link href={catPath} style={{ textDecoration: 'none', fontSize: '13px', color: '#6B7280' }}>
            ← {lang === 'fr' ? 'Retour au catalogue' : '返回'}
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LangToggle />
          <Link href="/mon-compte" style={{ textDecoration: 'none', fontSize: '13px', color: '#374151' }}>
            {t('nav_account')}
          </Link>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '6px 14px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              {t('nav_login')}
            </button>
          </Link>
          <Link href="/panier" style={{ textDecoration: 'none', position: 'relative' }}>
            <span style={{ fontSize: '20px' }}>🛒</span>
            {count > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#DC2626', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {count}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* ── CONTENU PRINCIPAL ─────────────────────────── */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 20px' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '20px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#6B7280', textDecoration: 'none' }}>{lang === 'fr' ? 'Accueil' : '首页'}</Link>
          <span>›</span>
          <Link href={catPath} style={{ color: '#6B7280', textDecoration: 'none' }}>{product.categorie}</Link>
          <span>›</span>
          <span style={{ color: '#111827' }}>{product.nom}</span>
        </div>

        {/* Grille 2 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '32px' }}>

          {/* ── Colonne gauche : images ─────────────── */}
          <div>
            {/* Image principale */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#F3F4F6', marginBottom: '12px', height: '420px' }}>
              <img
                src={imgErrors[activeImg] ? PLACEHOLDER : images[activeImg]}
                alt={`${product.nom} - image ${activeImg + 1}`}
                onError={() => setImgErrors(prev => ({ ...prev, [activeImg]: true }))}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: '72px',
                      height: '56px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: `2px solid ${activeImg === i ? '#1E3A5F' : '#E5E7EB'}`,
                      cursor: 'pointer',
                      padding: 0,
                      background: 'none',
                    }}
                  >
                    <img
                      src={imgErrors[i] ? PLACEHOLDER : img}
                      alt={`thumb ${i + 1}`}
                      onError={() => setImgErrors(prev => ({ ...prev, [i]: true }))}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description produit */}
            {descriptionFr && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E3A5F', marginBottom: '10px' }}>
                  📝 {lang === 'fr' ? 'Description' : '产品描述'}
                </h3>
                <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#374151', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  {descriptionFr}
                </p>
              </div>
            )}

            {/* Caractéristiques clés */}
            {features.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E3A5F', marginBottom: '10px' }}>
                  ✅ {lang === 'fr' ? 'Points forts' : '产品亮点'}
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #86EFAC', padding: '16px 16px 16px 32px' }}>
                  {features.map((f, i) => (
                    <li key={i} style={{ fontSize: '13px', color: '#166534', lineHeight: '1.8', fontWeight: '500' }}>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specs détaillées complètes (par section) */}
            {hasDetailedSpecs && (
              <div style={{ marginTop: '28px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E3A5F', marginBottom: '16px' }}>
                  📋 {lang === 'fr' ? 'Spécifications techniques complètes' : '完整技术规格'}
                </h3>
                {Object.entries(detailedSpecs).map(([section, rows]) => (
                  <div key={section} style={{ marginBottom: '16px' }}>
                    <div style={{ padding: '8px 14px', background: '#1E3A5F', color: '#fff', fontSize: '12px', fontWeight: '700', borderRadius: '8px 8px 0 0', letterSpacing: '0.3px' }}>
                      {section}
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                      {(rows as { label: string; value: string }[]).map((row, i) => (
                        <div key={i} style={{
                          display: 'grid',
                          gridTemplateColumns: '200px 1fr',
                          fontSize: '13px',
                          borderBottom: i < rows.length - 1 ? '1px solid #F3F4F6' : 'none',
                        }}>
                          <span style={{ padding: '8px 14px', fontWeight: '600', color: '#374151', background: i % 2 === 0 ? '#F9FAFB' : '#fff' }}>
                            {row.label}
                          </span>
                          <span style={{ padding: '8px 14px', color: '#111827', background: i % 2 === 0 ? '#F9FAFB' : '#fff' }}>
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Specs résumé (fallback si pas de detailed_specs) */}
            {!hasDetailedSpecs && hasSpecs && (
              <div style={{ marginTop: '28px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1E3A5F', marginBottom: '12px' }}>
                  📋 {lang === 'fr' ? 'Spécifications techniques' : '技术规格'}
                </h3>
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                  {Object.entries(specs).map(([key, val], i) => (
                    <div key={key} style={{
                      display: 'grid',
                      gridTemplateColumns: '160px 1fr',
                      fontSize: '13px',
                      borderBottom: i < Object.keys(specs).length - 1 ? '1px solid #F3F4F6' : 'none',
                    }}>
                      <span style={{ padding: '8px 12px', fontWeight: '600', color: '#374151', background: '#F9FAFB' }}>{key}</span>
                      <span style={{ padding: '8px 12px', color: '#111827' }}>{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dimensions (si renseignées en back-office) */}
            {(product.longueur_cm || product.poids_net_kg) && (
              <div style={{ marginTop: '20px', padding: '16px', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1E3A5F', margin: '0 0 8px' }}>
                  📐 {lang === 'fr' ? 'Dimensions & Poids' : '尺寸和重量'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px' }}>
                  {product.longueur_cm ? <Dim label="L" val={`${product.longueur_cm} cm`} /> : null}
                  {product.largeur_cm  ? <Dim label="l" val={`${product.largeur_cm} cm`} /> : null}
                  {product.hauteur_cm  ? <Dim label="H" val={`${product.hauteur_cm} cm`} /> : null}
                  {product.poids_net_kg  ? <Dim label={lang === 'fr' ? 'Poids net' : '净重'} val={`${product.poids_net_kg} kg`} /> : null}
                  {product.poids_brut_kg ? <Dim label={lang === 'fr' ? 'Poids brut' : '毛重'} val={`${product.poids_brut_kg} kg`} /> : null}
                </div>
              </div>
            )}
          </div>

          {/* ── Colonne droite : prix + actions ────────── */}
          <div>
            <div style={{ position: 'sticky', top: '72px' }}>
              {/* Catégorie badge */}
              <span style={{ display: 'inline-block', padding: '3px 10px', background: '#EFF6FF', color: '#1E3A5F', borderRadius: '12px', fontSize: '11px', fontWeight: '600', marginBottom: '12px' }}>
                {product.categorie}
              </span>

              {/* Nom */}
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', lineHeight: '1.3', marginBottom: '6px' }}>
                {product.nom}
              </h1>

              {/* Ref */}
              {product.numero_interne && (
                <p style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace', marginBottom: '16px' }}>
                  {lang === 'fr' ? 'Réf.' : '货号'} {product.numero_interne}
                </p>
              )}

              {/* Prix block */}
              <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '16px' }}>
                {prix.montant === null ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '15px', color: '#6B7280', marginBottom: '12px' }}>
                      {lang === 'fr' ? '🔒 Connectez-vous pour voir le prix' : '🔒 登录查看价格'}
                    </div>
                    <Link href="/login">
                      <button style={{ padding: '10px 20px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                        {t('btn_login')}
                      </button>
                    </Link>
                  </div>
                ) : product.prix_achat === 0 ? (
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1E3A5F', marginBottom: '4px' }}>
                      {lang === 'fr' ? 'Prix sur demande' : '价格面议'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280' }}>{lang === 'fr' ? 'Contactez-nous pour un devis personnalisé' : '联系我们获取报价'}</div>
                  </div>
                ) : (
                  <div>
                    {prix.estVIP && (
                      <span style={{ display: 'inline-block', fontSize: '11px', background: '#EDE9FE', color: '#6B21A8', padding: '2px 8px', borderRadius: '8px', fontWeight: '700', marginBottom: '8px' }}>
                        ★ Prix VIP négocié
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '28px', fontWeight: '800', color: '#1E3A5F' }}>
                        {formatPrix(prix.montant)}
                      </span>
                    </div>
                    {/* Équivalent RMB (affiché toujours, utile en mode 中文) */}
                    <div style={{ fontSize: '13px', color: '#EA580C', fontWeight: '600', marginBottom: '4px' }}>
                      ≈ {formatYuan(eurToYuan(prix.montant))}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '12px' }}>{prix.label}</div>

                    {/* TVA indicative */}
                    <div style={{ fontSize: '11px', color: '#9CA3AF', padding: '8px', background: '#F9FAFB', borderRadius: '6px' }}>
                      {lang === 'fr' ? `TVA DOM-TOM 8,5% ≈ ${formatPrix(prix.montant * 1.085)} TTC` : `含税价(8.5%): ${formatPrix(prix.montant * 1.085)}`}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantité */}
              {prix.montant !== null && product.prix_achat > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                    {lang === 'fr' ? 'Quantité' : '数量'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden' }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ padding: '6px 12px', background: '#F9FAFB', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>−</button>
                    <span style={{ padding: '6px 16px', fontSize: '14px', fontWeight: '600', borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>{qty}</span>
                    <button onClick={() => setQty(q => q + 1)} style={{ padding: '6px 12px', background: '#F9FAFB', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>+</button>
                  </div>
                </div>
              )}

              {/* Boutons action */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Ajouter au panier */}
                {prix.montant !== null && product.prix_achat > 0 && (
                  <button
                    onClick={handleAddToCart}
                    style={{
                      padding: '12px',
                      background: addedToCart ? '#16A34A' : '#1E3A5F',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    {addedToCart ? `✅ ${lang === 'fr' ? 'Ajouté !' : '已添加!'}` : `🛒 ${t('btn_add_cart')}`}
                  </button>
                )}

                {/* Générer Devis PDF */}
                <button
                  onClick={handleGeneratePdf}
                  disabled={pdfLoading}
                  style={{
                    padding: '11px',
                    background: pdfLoading ? '#6B7280' : '#EA580C',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: pdfLoading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {pdfLoading ? '⏳ Génération...' : `📄 ${lang === 'fr' ? 'Générer Devis PDF' : '生成报价单'}`}
                </button>

                {/* Notice PDF */}
                {product.notice_url && (
                  <a href={product.notice_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button style={{ width: '100%', padding: '10px', background: '#fff', color: '#1E3A5F', border: '1px solid #BFDBFE', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      📥 {lang === 'fr' ? 'Fiche technique PDF' : '技术资料'} ↗
                    </button>
                  </a>
                )}

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/33663284908?text=${encodeURIComponent(`Bonjour, je suis intéressé par : ${product.nom} (${product.numero_interne || product.id})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <button style={{ width: '100%', padding: '10px', background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    💬 {lang === 'fr' ? 'Contacter via WhatsApp' : 'WhatsApp咨询'}
                  </button>
                </a>
              </div>

              {/* Info livraison */}
              <div style={{ marginTop: '16px', padding: '12px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #86EFAC' }}>
                <div style={{ fontSize: '12px', color: '#166534', lineHeight: '1.6' }}>
                  ✅ {lang === 'fr' ? 'Livraison DOM-TOM incluse sur devis' : '含DOM-TOM运费(按报价)'}<br />
                  🚢 {lang === 'fr' ? 'Délai : 6–10 semaines depuis Chine' : '交货期：6-10周'}<br />
                  🛡️ {lang === 'fr' ? 'Garantie 1 an constructeur' : '1年原厂保修'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer style={{ background: '#1E3A5F', color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: '20px', fontSize: '12px', marginTop: '40px' }}>
        © 2025 97import — Importation directe Chine → DOM-TOM
      </footer>
    </div>
  )
}

function Dim({ label, val }: { label: string; val: string }) {
  return (
    <div style={{ padding: '6px 8px', background: '#fff', borderRadius: '6px', textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '600' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E3A5F' }}>{val}</div>
    </div>
  )
}
