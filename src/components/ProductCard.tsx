import { useState } from 'react'
import { Link } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { calculerPrix, formatPrix } from '@/utils/calculPrix'

interface ProductCardProps {
  id: string
  nom: string
  image: string
  prix_achat: number
  categorie: string
  description?: string
}

const NAVY = '#1B2A4A'
const GREEN = '#2D7D46'

export default function ProductCard({ id, nom, image, prix_achat, categorie, description }: ProductCardProps) {
  const { role } = useAuth()
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(false)

  const prix = calculerPrix(prix_achat, role)

  return (
    <Link href={`/produit/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#fff',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: hovered
            ? '0 8px 30px rgba(0,0,0,0.12)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'box-shadow 0.25s, transform 0.25s',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Image */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          background: '#F5F5F5',
          overflow: 'hidden',
        }}>
          {!imgError ? (
            <img
              src={image}
              alt={nom}
              loading="lazy"
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              fontSize: 13,
            }}>
              Image non disponible
            </div>
          )}

          {/* Category badge */}
          <span style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: NAVY,
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 20,
            textTransform: 'capitalize',
          }}>
            {categorie}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{
            fontSize: 15,
            fontWeight: 700,
            color: NAVY,
            margin: 0,
            marginBottom: 4,
            lineHeight: 1.3,
          }}>
            {nom}
          </h3>

          {description && (
            <p style={{
              fontSize: 12,
              color: '#6B7280',
              margin: 0,
              marginBottom: 10,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {description}
            </p>
          )}

          <div style={{ marginTop: 'auto' }}>
            {prix.montant !== null ? (
              <>
                <span style={{ fontSize: 18, fontWeight: 800, color: GREEN }}>
                  {formatPrix(prix.montant)}
                </span>
                <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>
                  {prix.label}
                </span>
                {prix.estVIP && prix.prixPublic > 0 && (
                  <div style={{
                    fontSize: 12,
                    color: '#9CA3AF',
                    textDecoration: 'line-through',
                    marginTop: 2,
                  }}>
                    {formatPrix(prix.prixPublic)}
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 600, color: '#E8913A' }}>
                {prix.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
