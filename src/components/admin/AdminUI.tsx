import React from 'react'

// ─── DESIGN SYSTEM ADMIN 97import ───────────────────────
// Police : Inter 12px standard back-office

export const ADMIN_COLORS = {
  navy: '#1E3A5F',
  navyLight: '#EFF6FF',
  navyBorder: '#BFDBFE',
  greenBg: '#F0FDF4',
  greenBorder: '#86EFAC',
  greenText: '#166534',
  greenBtn: '#16A34A',
  orangeBg: '#FFFBEB',
  orangeBorder: '#FCD34D',
  orangeText: '#92400E',
  orangeBtn: '#EA580C',
  purpleBg: '#FAF5FF',
  purpleBgDark: '#EDE9FE',
  purpleBorder: '#D8B4FE',
  purpleText: '#6B21A8',
  purpleBtn: '#7C3AED',
  grayBg: '#F9FAFB',
  grayBorder: '#E5E7EB',
  grayText: '#6B7280',
  font: "'Inter', -apple-system, sans-serif",
} as const

// ─── BADGE STATUT ─────────────────────────────────────────

const BADGE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  nouveau:   { bg: ADMIN_COLORS.navyLight,   color: ADMIN_COLORS.navy,        label: 'Nouveau' },
  en_cours:  { bg: ADMIN_COLORS.orangeBg,    color: ADMIN_COLORS.orangeText,  label: 'En cours' },
  vip:       { bg: ADMIN_COLORS.purpleBgDark,color: ADMIN_COLORS.purpleText,  label: '★ VIP' },
  accepte:   { bg: ADMIN_COLORS.greenBg,     color: ADMIN_COLORS.greenText,   label: 'Accepté' },
  refuse:    { bg: '#FEF2F2',                color: '#DC2626',                label: 'Refusé' },
  en_attente:{ bg: ADMIN_COLORS.orangeBg,    color: ADMIN_COLORS.orangeText,  label: 'En attente' },
  encaisse:  { bg: ADMIN_COLORS.greenBg,     color: ADMIN_COLORS.greenText,   label: 'Encaissé' },
  emise:     { bg: ADMIN_COLORS.purpleBgDark,color: ADMIN_COLORS.purpleText,  label: 'Émise' },
  payee:     { bg: ADMIN_COLORS.greenBg,     color: ADMIN_COLORS.greenText,   label: 'Payée' },
  brouillon: { bg: ADMIN_COLORS.grayBg,      color: ADMIN_COLORS.grayText,    label: 'Brouillon' },
  envoye:    { bg: ADMIN_COLORS.navyLight,   color: ADMIN_COLORS.navy,        label: 'Envoyé' },
  signe:     { bg: ADMIN_COLORS.greenBg,     color: ADMIN_COLORS.greenText,   label: 'Signé' },
}

interface BadgeStatutProps {
  statut: string
}

export function BadgeStatut({ statut }: BadgeStatutProps) {
  const cfg = BADGE_CONFIG[statut] ?? {
    bg: ADMIN_COLORS.grayBg,
    color: ADMIN_COLORS.grayText,
    label: statut,
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      background: cfg.bg,
      color: cfg.color,
      fontFamily: ADMIN_COLORS.font,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

// ─── ADMIN BUTTON ─────────────────────────────────────────

type ButtonVariant = 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'ghost'

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: ADMIN_COLORS.navy,       color: '#fff', border: 'none' },
  success: { background: ADMIN_COLORS.greenBtn,   color: '#fff', border: 'none' },
  warning: { background: ADMIN_COLORS.orangeBtn,  color: '#fff', border: 'none' },
  danger:  { background: '#DC2626',               color: '#fff', border: 'none' },
  purple:  { background: ADMIN_COLORS.purpleBtn,  color: '#fff', border: 'none' },
  ghost:   { background: 'transparent',           color: ADMIN_COLORS.navy,
             border: `0.5px solid ${ADMIN_COLORS.navyBorder}` },
}

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
}

export function AdminButton({
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  style,
  ...props
}: AdminButtonProps) {
  const base = VARIANT_STYLES[variant]
  return (
    <button
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: size === 'sm' ? '4px 10px' : '7px 14px',
        borderRadius: '6px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: ADMIN_COLORS.font,
        transition: 'opacity 0.15s',
        whiteSpace: 'nowrap',
        ...base,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── ADMIN CARD ───────────────────────────────────────────

interface AdminCardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function AdminCard({ children, style }: AdminCardProps) {
  return (
    <div style={{
      background: '#fff',
      border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
      borderRadius: '8px',
      overflow: 'hidden',
      fontFamily: ADMIN_COLORS.font,
      ...style,
    }}>
      {children}
    </div>
  )
}

interface AdminCardHeaderProps {
  children: React.ReactNode
  actions?: React.ReactNode
  style?: React.CSSProperties
}

export function AdminCardHeader({ children, actions, style }: AdminCardHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 16px',
      borderBottom: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
      background: ADMIN_COLORS.grayBg,
      ...style,
    }}>
      <span style={{
        fontSize: '12px',
        fontWeight: '600',
        color: '#374151',
        fontFamily: ADMIN_COLORS.font,
      }}>
        {children}
      </span>
      {actions && <div style={{ display: 'flex', gap: '6px' }}>{actions}</div>}
    </div>
  )
}

// ─── DOCUMENT ROW ─────────────────────────────────────────
// Ligne document dans colonne droite du GDF

interface DocumentRowProps {
  label: string
  numero?: string
  couleurBg: string
  couleurBorder: string
  couleurText: string
  pdfUrl?: string
  onPdf?: () => void
  onEnvoyer?: () => void
  envoyerLabel?: string
  disabled?: boolean
}

export function DocumentRow({
  label,
  numero,
  couleurBg,
  couleurBorder,
  couleurText,
  pdfUrl,
  onPdf,
  onEnvoyer,
  envoyerLabel = '→ Client',
  disabled = false,
}: DocumentRowProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: couleurBg,
      border: `0.5px solid ${couleurBorder}`,
      borderRadius: '6px',
      marginBottom: '6px',
      fontFamily: ADMIN_COLORS.font,
    }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: couleurText }}>
        {label}{numero ? ` — ${numero}` : ''}
      </span>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={onPdf}
          disabled={!pdfUrl && !onPdf}
          title="Voir / Générer PDF"
          style={{
            padding: '3px 8px',
            background: couleurBg,
            border: `0.5px solid ${couleurBorder}`,
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            color: couleurText,
            cursor: (!pdfUrl && !onPdf) ? 'not-allowed' : 'pointer',
            opacity: (!pdfUrl && !onPdf) ? 0.5 : 1,
            fontFamily: ADMIN_COLORS.font,
          }}
        >
          PDF
        </button>
        <button
          onClick={onEnvoyer}
          disabled={disabled || !onEnvoyer}
          title={envoyerLabel}
          style={{
            padding: '3px 8px',
            background: couleurText,
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#fff',
            cursor: (disabled || !onEnvoyer) ? 'not-allowed' : 'pointer',
            opacity: (disabled || !onEnvoyer) ? 0.5 : 1,
            fontFamily: ADMIN_COLORS.font,
          }}
        >
          {envoyerLabel}
        </button>
      </div>
    </div>
  )
}

// ─── PAIEMENT ROW ─────────────────────────────────────────
// Orange si en_attente, vert si encaissé

interface PaiementRowProps {
  numero: number
  montant: number
  type: 'pro' | 'perso'
  statut: 'en_attente' | 'encaisse'
  date?: string
  onEncaisser?: () => void
}

export function PaiementRow({
  numero,
  montant,
  type,
  statut,
  date,
  onEncaisser,
}: PaiementRowProps) {
  const isEnAttente = statut === 'en_attente'
  const bg = isEnAttente ? ADMIN_COLORS.orangeBg : ADMIN_COLORS.greenBg
  const border = isEnAttente ? ADMIN_COLORS.orangeBorder : ADMIN_COLORS.greenBorder
  const textColor = isEnAttente ? ADMIN_COLORS.orangeText : ADMIN_COLORS.greenText

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: bg,
      border: `0.5px solid ${border}`,
      borderRadius: '6px',
      marginBottom: '4px',
      fontFamily: ADMIN_COLORS.font,
    }}>
      <div>
        <span style={{ fontSize: '12px', fontWeight: '600', color: textColor }}>
          Acompte {numero} — {montant.toLocaleString('fr-FR')} €
        </span>
        <span style={{
          marginLeft: '8px',
          fontSize: '11px',
          color: textColor,
          opacity: 0.8,
        }}>
          ({type === 'pro' ? 'Pro' : 'Perso'})
          {date ? ` · ${date}` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BadgeStatut statut={statut} />
        {isEnAttente && onEncaisser && (
          <AdminButton variant="success" size="sm" onClick={onEncaisser}>
            Encaisser
          </AdminButton>
        )}
      </div>
    </div>
  )
}

// ─── PAIEMENT RESUME ──────────────────────────────────────

interface PaiementResumeProps {
  totalEncaisse: number
  soldeRestant: number
}

export function PaiementResume({ totalEncaisse, soldeRestant }: PaiementResumeProps) {
  const soldee = soldeRestant <= 0
  return (
    <div style={{ marginTop: '8px', fontFamily: ADMIN_COLORS.font }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: ADMIN_COLORS.greenBg,
        border: `0.5px solid ${ADMIN_COLORS.greenBorder}`,
        borderRadius: '6px 6px 0 0',
        fontSize: '12px',
        fontWeight: '600',
        color: ADMIN_COLORS.greenText,
      }}>
        <span>Total acomptes versés</span>
        <span>- {totalEncaisse.toLocaleString('fr-FR')} €</span>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: soldee ? ADMIN_COLORS.greenBg : ADMIN_COLORS.orangeBg,
        border: `0.5px solid ${soldee ? ADMIN_COLORS.greenBorder : ADMIN_COLORS.orangeBorder}`,
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
        fontSize: '12px',
        fontWeight: '700',
        color: soldee ? ADMIN_COLORS.greenText : ADMIN_COLORS.orangeText,
      }}>
        <span>{soldee ? 'ENTIÈREMENT SOLDÉE ✅' : 'SOLDE RESTANT'}</span>
        {!soldee && <span>{soldeRestant.toLocaleString('fr-FR')} €</span>}
      </div>
    </div>
  )
}

// ─── ADMIN INPUT ──────────────────────────────────────────

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function AdminInput({ label, style, ...props }: AdminInputProps) {
  return (
    <div style={{ fontFamily: ADMIN_COLORS.font }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '4px',
        }}>
          {label}
        </label>
      )}
      <input
        style={{
          width: '100%',
          padding: '6px 10px',
          border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
          borderRadius: '5px',
          fontSize: '12px',
          color: '#374151',
          background: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: ADMIN_COLORS.font,
          ...style,
        }}
        {...props}
      />
    </div>
  )
}

// ─── ADMIN SELECT ─────────────────────────────────────────

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function AdminSelect({ label, style, children, ...props }: AdminSelectProps) {
  return (
    <div style={{ fontFamily: ADMIN_COLORS.font }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '4px',
        }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%',
          padding: '6px 10px',
          border: `0.5px solid ${ADMIN_COLORS.grayBorder}`,
          borderRadius: '5px',
          fontSize: '12px',
          color: '#374151',
          background: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: ADMIN_COLORS.font,
          cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

// ─── SECTION LABEL ────────────────────────────────────────

interface SectionLabelProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function SectionLabel({ children, style }: SectionLabelProps) {
  return (
    <div style={{
      fontSize: '10px',
      fontWeight: '700',
      color: ADMIN_COLORS.grayText,
      textTransform: 'uppercase',
      letterSpacing: '0.8px',
      padding: '12px 0 6px',
      fontFamily: ADMIN_COLORS.font,
      ...style,
    }}>
      {children}
    </div>
  )
}
