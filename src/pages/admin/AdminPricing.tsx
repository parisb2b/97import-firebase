import { useState } from 'react'
import { TAUX_EUR_RMB, MULTIPLICATEURS } from '@/utils/calculPrix'

const COLORS = {
  navy: '#1B2A4A', green: '#2D7D46', orange: '#E8913A',
  purple: '#7C3AED', gray: '#6B7280', lightGray: '#F3F4F6',
}

export default function AdminPricing() {
  const [testPrix, setTestPrix] = useState(9538)
  const tauxChange = TAUX_EUR_RMB
  const multis = MULTIPLICATEURS

  const prixRMB = Math.round(testPrix * tauxChange)

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.navy, marginBottom: 24 }}>
        💰 Tarification
      </h1>

      {/* Paramètres globaux */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.navy, marginBottom: 16 }}>Taux de change</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: COLORS.green }}>1 € = {tauxChange} ¥</span>
          </div>
          <p style={{ fontSize: 12, color: COLORS.gray, marginTop: 8 }}>
            Taux fixe configuré dans calculPrix.ts (TAUX_EUR_RMB)
          </p>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: COLORS.navy, marginBottom: 16 }}>TVA DOM-TOM</h2>
          <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.orange }}>8,5%</div>
          <p style={{ fontSize: 12, color: COLORS.gray, marginTop: 8 }}>
            Taux réduit applicable aux DOM-TOM
          </p>
        </div>
      </div>

      {/* Multiplicateurs par rôle */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.navy, marginBottom: 16 }}>
          Multiplicateurs par rôle
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: COLORS.lightGray }}>
              {['Rôle', 'Multiplicateur', 'Formule', 'Description'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { role: 'Admin', mult: 1, desc: 'Voit le prix d\'achat réel', color: '#DC2626' },
              { role: 'Partenaire', mult: 1.2, desc: 'Marge réduite (revendeur)', color: COLORS.purple },
              { role: 'VIP', mult: 1.3, desc: 'Client fidèle / négocié', color: COLORS.green },
              { role: 'Client (user)', mult: 2, desc: 'Prix public standard', color: COLORS.navy },
              { role: 'Public (visiteur)', mult: 2, desc: 'Prix affiché sans connexion', color: COLORS.gray },
            ].map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                    background: r.color + '15', color: r.color,
                  }}>
                    {r.role}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 20, fontWeight: 700, color: r.color }}>×{r.mult}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 13 }}>
                  prix_achat × {r.mult}
                </td>
                <td style={{ padding: '12px 16px', color: COLORS.gray }}>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simulateur de prix */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: COLORS.navy, marginBottom: 16 }}>
          🧮 Simulateur de prix
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <label style={{ fontWeight: 500 }}>Prix d'achat (EUR HT) :</label>
          <input
            type="number"
            value={testPrix}
            onChange={e => setTestPrix(Number(e.target.value))}
            style={{
              padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8,
              fontSize: 16, fontWeight: 600, width: 150, textAlign: 'right',
            }}
          />
          <span style={{ color: COLORS.gray, fontSize: 13 }}>= {prixRMB.toLocaleString()} ¥</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {Object.entries(multis).map(([role, mult]) => {
            const pv = Math.round(testPrix * mult)
            const marge = pv - testPrix
            const taux = ((marge / testPrix) * 100).toFixed(0)
            return (
              <div key={role} style={{
                background: COLORS.lightGray, borderRadius: 10, padding: 16, textAlign: 'center',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.gray, textTransform: 'uppercase' }}>{role}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, margin: '8px 0' }}>
                  {pv.toLocaleString('fr-FR')} €
                </div>
                <div style={{ fontSize: 12, color: COLORS.green }}>
                  Marge: {marge.toLocaleString('fr-FR')} € ({taux}%)
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
