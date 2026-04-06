/**
 * SolarKitDetailPage — Detail page for a specific solar kit
 * Uses wouter useParams to get slug, fetches from Firestore
 */
import { useState, useEffect } from 'react'
import { useParams } from 'wouter'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Product } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { calculerPrix, formatPrix, eurToYuan, formatYuan } from '@/utils/calculPrix'
import { SOLAIRE_PRIX } from '@/data/pricing'
import { Link } from 'wouter'

const C = {
  navy: '#1B2A4A',
  green: '#2D7D46',
  orange: '#E8913A',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray500: '#6B7280',
  gray700: '#374151',
  yellow: '#F59E0B',
}

interface KitData {
  slug: string
  name: string
  power: string
  prixAchat: number
  panels: { count: number; model: string; wattage: string; type: string; warranty: string }
  inverter: { model: string; power: string; type: string; phases: string; warranty: string }
  battery: { model: string; capacity: string; type: string; cycles: string; warranty: string }
  cables: string
  mounting: string
  image: string
}

const KITS_DATA: Record<string, KitData> = {
  'kit-solaire-10kw': {
    slug: 'kit-solaire-10kw',
    name: 'Kit Solaire 10 kW',
    power: '10 kW',
    prixAchat: SOLAIRE_PRIX['kit-solaire-10kw'],
    panels: {
      count: 18,
      model: 'Jinko Tiger Neo N-type JKM580N-72HL4-V',
      wattage: '580W',
      type: 'Monocristallin N-type TOPCon',
      warranty: '25 ans lineaire (87.4% a 25 ans)',
    },
    inverter: {
      model: 'Deye SUN-10K-SG04LP3',
      power: '10 kW',
      type: 'Hybride (reseau + batterie)',
      phases: 'Triphase',
      warranty: '10 ans',
    },
    battery: {
      model: 'Deye SE-G5.1 Pro x2',
      capacity: '10.24 kWh',
      type: 'LiFePO4 (Lithium Fer Phosphate)',
      cycles: '> 6 000 cycles',
      warranty: '10 ans',
    },
    cables: 'Cables solaires 6mm2 + connecteurs MC4 + cable AC',
    mounting: 'Structure aluminium pour toiture (inclinee ou plate)',
    image: '/images/solar/kit_overview.webp',
  },
  'kit-solaire-12kw': {
    slug: 'kit-solaire-12kw',
    name: 'Kit Solaire 12 kW',
    power: '12 kW',
    prixAchat: SOLAIRE_PRIX['kit-solaire-12kw'],
    panels: {
      count: 21,
      model: 'Jinko Tiger Neo N-type JKM580N-72HL4-V',
      wattage: '580W',
      type: 'Monocristallin N-type TOPCon',
      warranty: '25 ans lineaire (87.4% a 25 ans)',
    },
    inverter: {
      model: 'Deye SUN-12K-SG04LP3',
      power: '12 kW',
      type: 'Hybride (reseau + batterie)',
      phases: 'Triphase',
      warranty: '10 ans',
    },
    battery: {
      model: 'Deye SE-G5.1 Pro x2',
      capacity: '10.24 kWh',
      type: 'LiFePO4 (Lithium Fer Phosphate)',
      cycles: '> 6 000 cycles',
      warranty: '10 ans',
    },
    cables: 'Cables solaires 6mm2 + connecteurs MC4 + cable AC',
    mounting: 'Structure aluminium pour toiture (inclinee ou plate)',
    image: '/images/solar/panel_detail.webp',
  },
  'kit-solaire-20kw': {
    slug: 'kit-solaire-20kw',
    name: 'Kit Solaire 20 kW',
    power: '20 kW',
    prixAchat: SOLAIRE_PRIX['kit-solaire-20kw'],
    panels: {
      count: 35,
      model: 'Jinko Tiger Neo N-type JKM580N-72HL4-V',
      wattage: '580W',
      type: 'Monocristallin N-type TOPCon',
      warranty: '25 ans lineaire (87.4% a 25 ans)',
    },
    inverter: {
      model: 'Deye SUN-20K-SG01HP3',
      power: '20 kW',
      type: 'Hybride (reseau + batterie)',
      phases: 'Triphase',
      warranty: '10 ans',
    },
    battery: {
      model: 'Deye SE-G5.1 Pro x4',
      capacity: '20.48 kWh',
      type: 'LiFePO4 (Lithium Fer Phosphate)',
      cycles: '> 6 000 cycles',
      warranty: '10 ans',
    },
    cables: 'Cables solaires 10mm2 + connecteurs MC4 + cable AC 3 phases',
    mounting: 'Structure aluminium renforcee pour toiture (inclinee ou plate)',
    image: '/images/solar/deye_inverter.webp',
  },
}

export default function SolarKitDetailPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug || ''
  const { role } = useAuth()
  const [firestoreProduct, setFirestoreProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  const kit = KITS_DATA[slug]

  // Attempt to fetch from Firestore for images etc
  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        const q = query(collection(db, 'products'), where('categorie', '==', 'solaire'))
        const snap = await getDocs(q)
        const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
        const match = products.find(p =>
          p.nom.toLowerCase().includes(slug.replace('kit-solaire-', '').replace('kw', ''))
        )
        if (match) setFirestoreProduct(match)
      } catch (err) {
        console.error('Erreur chargement kit solaire:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [slug])

  if (!kit) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, sans-serif", flexDirection: 'column', gap: '16px',
      }}>
        <span style={{ fontSize: '48px' }}>🔍</span>
        <h2 style={{ color: C.navy, margin: 0 }}>Kit solaire introuvable</h2>
        <Link href="/solaire" style={{ color: C.orange, fontSize: '14px' }}>Retour aux kits solaires</Link>
      </div>
    )
  }

  const prixAchat = firestoreProduct?.prix_achat || kit.prixAchat
  const prix = calculerPrix(prixAchat, role)
  const images = firestoreProduct?.images || [kit.image]

  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div style={{ minHeight: '100vh', background: C.gray50, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── HERO ──────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #2D5A3D 100%)`,
        padding: '40px 24px 32px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Link href="/solaire" style={{ color: '#93C5FD', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
            ← Retour aux kits solaires
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <span style={{
              background: C.yellow + '30', color: C.yellow,
              padding: '4px 12px', borderRadius: '6px',
              fontSize: '13px', fontWeight: '700',
            }}>
              {kit.power}
            </span>
            <h1 style={{ color: C.white, fontSize: '30px', fontWeight: '800', margin: 0 }}>
              {kit.name}
            </h1>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>

          {/* ── LEFT ──────────────────────────────────── */}
          <div>
            {/* Image */}
            <div style={{
              background: C.white, borderRadius: '14px', overflow: 'hidden',
              border: `1px solid ${C.gray200}`, marginBottom: '24px',
            }}>
              <div style={{ height: '340px', background: C.gray100 }}>
                <img
                  src={images[selectedImage] || kit.image}
                  alt={kit.name}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement
                    el.style.display = 'none'
                    el.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:64px">☀️</div>'
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', padding: '12px', overflowX: 'auto' }}>
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      style={{
                        width: '64px', height: '48px', borderRadius: '6px', flexShrink: 0,
                        border: selectedImage === i ? `2px solid ${C.orange}` : `1px solid ${C.gray200}`,
                        overflow: 'hidden', cursor: 'pointer', padding: 0, background: C.gray100,
                      }}
                    >
                      <img src={img} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Kit Composition */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '24px',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: C.navy, margin: '0 0 20px' }}>
                Composition du kit
              </h3>

              {/* Panels */}
              <ComponentBlock
                title={`${kit.panels.count}x Panneaux solaires`}
                icon="☀️"
                specs={[
                  { label: 'Modele', value: kit.panels.model },
                  { label: 'Puissance unitaire', value: kit.panels.wattage },
                  { label: 'Technologie', value: kit.panels.type },
                  { label: 'Garantie', value: kit.panels.warranty },
                ]}
              />

              {/* Inverter */}
              <ComponentBlock
                title="Onduleur hybride"
                icon="⚡"
                specs={[
                  { label: 'Modele', value: kit.inverter.model },
                  { label: 'Puissance', value: kit.inverter.power },
                  { label: 'Type', value: kit.inverter.type },
                  { label: 'Phases', value: kit.inverter.phases },
                  { label: 'Garantie', value: kit.inverter.warranty },
                ]}
              />

              {/* Battery */}
              <ComponentBlock
                title="Batterie de stockage"
                icon="🔋"
                specs={[
                  { label: 'Modele', value: kit.battery.model },
                  { label: 'Capacite', value: kit.battery.capacity },
                  { label: 'Technologie', value: kit.battery.type },
                  { label: 'Cycles', value: kit.battery.cycles },
                  { label: 'Garantie', value: kit.battery.warranty },
                ]}
              />

              {/* Cables + Mounting */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: C.gray700, padding: '6px 0' }}>
                  <span style={{ color: C.green, fontWeight: '700' }}>+</span>
                  <span><strong>Cablage :</strong> {kit.cables}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: C.gray700, padding: '6px 0' }}>
                  <span style={{ color: C.green, fontWeight: '700' }}>+</span>
                  <span><strong>Fixation :</strong> {kit.mounting}</span>
                </div>
              </div>
            </div>

            {/* Installation Info */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`,
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: C.navy, margin: '0 0 16px' }}>
                Installation
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { icon: '🏗', title: 'Surface requise', desc: `~${kit.panels.count * 2.6} m2 de toiture` },
                  { icon: '⏱', title: 'Duree installation', desc: '2-3 jours (par un professionnel)' },
                  { icon: '🔌', title: 'Raccordement', desc: 'Reseau EDF ou autonome (off-grid)' },
                  { icon: '📋', title: 'Demarches', desc: 'Declaration prealable en mairie' },
                ].map(item => (
                  <div key={item.title} style={{
                    background: C.gray50, borderRadius: '10px', padding: '16px',
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>{item.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: C.navy, marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: C.gray500 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Price + CTA ────────────────────── */}
          <div style={{ position: 'sticky', top: '80px' }}>
            {/* Price */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.navy, margin: '0 0 14px' }}>
                {kit.name}
              </h3>
              {loading ? (
                <span style={{ fontSize: '14px', color: C.gray500 }}>Chargement...</span>
              ) : prix.montant !== null ? (
                <div>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: C.navy }}>
                    {formatPrix(prix.montant)}
                    <span style={{ fontSize: '13px', fontWeight: '500', color: C.gray500, marginLeft: '6px' }}>HT</span>
                  </div>
                  <div style={{ fontSize: '14px', color: C.orange, fontWeight: '600', marginBottom: '4px' }}>
                    {formatYuan(eurToYuan(prix.montant))}
                  </div>
                  <span style={{ fontSize: '12px', color: C.gray500 }}>{prix.label}</span>
                </div>
              ) : (
                <span style={{ fontSize: '14px', color: C.gray500 }}>Connectez-vous pour voir le prix</span>
              )}
            </div>

            {/* Price breakdown */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.navy, margin: '0 0 14px' }}>
                Le kit comprend
              </h3>
              {[
                { label: `${kit.panels.count}x Panneaux ${kit.panels.wattage}`, included: true },
                { label: `Onduleur ${kit.inverter.power}`, included: true },
                { label: `Batterie ${kit.battery.capacity}`, included: true },
                { label: 'Cablage complet', included: true },
                { label: 'Structure de fixation', included: true },
                { label: 'Connecteurs MC4', included: true },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 0', fontSize: '13px', color: C.gray700,
                }}>
                  <span style={{ color: C.green, fontWeight: '700' }}>+</span> {item.label}
                </div>
              ))}
            </div>

            {/* Transport */}
            <div style={{
              background: C.white, borderRadius: '14px', padding: '24px',
              border: `1px solid ${C.gray200}`, marginBottom: '16px',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: C.navy, margin: '0 0 14px' }}>
                Transport
              </h3>
              <p style={{ fontSize: '13px', color: C.gray500, margin: '0 0 8px' }}>
                Livraison en conteneur vers tous les DOM-TOM. Le kit est palettise et protege pour le transport maritime.
              </p>
              <p style={{ fontSize: '13px', color: C.orange, fontWeight: '600', margin: 0 }}>
                Cout transport : sur devis
              </p>
            </div>

            {/* CTA */}
            <a
              href={`https://wa.me/33663284908?text=Bonjour, je suis interesse par le ${kit.name}. Pouvez-vous me faire un devis ?`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center',
                padding: '16px', background: C.green, color: C.white,
                borderRadius: '12px', fontWeight: '700', fontSize: '16px',
                textDecoration: 'none', marginBottom: '12px',
              }}
            >
              Demander un devis
            </a>
            <Link href="/solaire" style={{
              display: 'block', textAlign: 'center',
              padding: '12px', background: 'transparent', color: C.navy,
              borderRadius: '10px', fontWeight: '600', fontSize: '13px',
              textDecoration: 'none', border: `1px solid ${C.gray200}`,
            }}>
              ← Voir tous les kits
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Component block helper ────────────────────────────────
function ComponentBlock({ title, icon, specs }: {
  title: string
  icon: string
  specs: { label: string; value: string }[]
}) {
  return (
    <div style={{
      background: '#F9FAFB', borderRadius: '10px', padding: '16px',
      marginBottom: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1B2A4A', margin: 0 }}>{title}</h4>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {specs.map(s => (
            <tr key={s.label}>
              <td style={{ padding: '4px 0', fontSize: '12px', color: '#6B7280', width: '130px', verticalAlign: 'top' }}>
                {s.label}
              </td>
              <td style={{ padding: '4px 0', fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                {s.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
