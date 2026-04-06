import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AdminLayout from './AdminLayout'
import {
  AdminCard, AdminCardHeader, AdminButton, AdminInput,
  ADMIN_COLORS,
} from '../../components/admin/AdminUI'

interface EmetteurData {
  nom: string
  adresse: string
  ville: string
  pays: string
  registration: string
  email: string
  telephone: string
}

interface RIBData {
  label: string
  titulaire: string
  iban: string
  bic: string
  banque: string
}

interface AcompteConfig {
  pourcentage_defaut: number
  montant_minimum: number
  nombre_max: number
}

interface MultiplicateursData {
  user: number
  partner: number
  vip: number
  admin: number
}

export default function AdminParametres() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [emetteur, setEmetteur] = useState<EmetteurData>({
    nom: 'LUXENT LIMITED',
    adresse: '2nd Floor College House, 17 King Edwards Rd',
    ville: 'Ruislip, HA4 7AE, London',
    pays: 'United Kingdom',
    registration: '14852122',
    email: 'parisb2b@gmail.com',
    telephone: '+33 6 63 28 49 08',
  })

  const [ribPro, setRibPro] = useState<RIBData>({
    label: 'RIB Professionnel',
    titulaire: 'LUXENT LIMITED',
    iban: '',
    bic: '',
    banque: '',
  })

  const [ribPerso, setRibPerso] = useState<RIBData>({
    label: 'RIB Personnel',
    titulaire: 'Michel Chen',
    iban: '',
    bic: '',
    banque: 'N26',
  })

  const [acompte, setAcompte] = useState<AcompteConfig>({
    pourcentage_defaut: 30,
    montant_minimum: 500,
    nombre_max: 3,
  })

  const [multiplicateurs, setMultiplicateurs] = useState<MultiplicateursData>({
    user: 2.0,
    partner: 1.2,
    vip: 1.3,
    admin: 1.0,
  })

  useEffect(() => { loadParams() }, [])

  async function loadParams() {
    try {
      const keys = ['emetteur_pro', 'rib_pro', 'rib_perso', 'config_acompte', 'multiplicateurs']
      const snaps = await Promise.all(keys.map(k => getDoc(doc(db, 'admin_params', k))))

      if (snaps[0].exists()) setEmetteur(snaps[0].data() as any)
      if (snaps[1].exists()) setRibPro(snaps[1].data() as any)
      if (snaps[2].exists()) setRibPerso(snaps[2].data() as any)
      if (snaps[3].exists()) setAcompte(snaps[3].data() as any)
      if (snaps[4].exists()) setMultiplicateurs(snaps[4].data() as any)
    } catch (err) {
      console.error('Erreur chargement params:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveAll() {
    setSaving(true)
    try {
      await Promise.all([
        setDoc(doc(db, 'admin_params', 'emetteur_pro'), { ...emetteur, updated_at: serverTimestamp() }),
        setDoc(doc(db, 'admin_params', 'rib_pro'), { ...ribPro, updated_at: serverTimestamp() }),
        setDoc(doc(db, 'admin_params', 'rib_perso'), { ...ribPerso, updated_at: serverTimestamp() }),
        setDoc(doc(db, 'admin_params', 'config_acompte'), { ...acompte, updated_at: serverTimestamp() }),
        setDoc(doc(db, 'admin_params', 'multiplicateurs'), { ...multiplicateurs, updated_at: serverTimestamp() }),
      ])
      alert('Paramètres sauvegardés')
    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ padding: 40, textAlign: 'center', color: ADMIN_COLORS.grayText }}>Chargement...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px', fontFamily: ADMIN_COLORS.font }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: ADMIN_COLORS.navy }}>
            ⚙️ Paramètres
          </h1>
          <AdminButton variant="success" onClick={saveAll} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Enregistrer tout'}
          </AdminButton>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Émetteur */}
          <AdminCard>
            <AdminCardHeader>Émetteur (LUXENT LIMITED)</AdminCardHeader>
            <div style={{ padding: 16, display: 'grid', gap: 10 }}>
              <AdminInput label="Nom" value={emetteur.nom} onChange={e => setEmetteur({ ...emetteur, nom: e.target.value })} />
              <AdminInput label="Adresse" value={emetteur.adresse} onChange={e => setEmetteur({ ...emetteur, adresse: e.target.value })} />
              <AdminInput label="Ville" value={emetteur.ville} onChange={e => setEmetteur({ ...emetteur, ville: e.target.value })} />
              <AdminInput label="Pays" value={emetteur.pays} onChange={e => setEmetteur({ ...emetteur, pays: e.target.value })} />
              <AdminInput label="N° Enregistrement" value={emetteur.registration} onChange={e => setEmetteur({ ...emetteur, registration: e.target.value })} />
              <AdminInput label="Email" value={emetteur.email} onChange={e => setEmetteur({ ...emetteur, email: e.target.value })} />
              <AdminInput label="Téléphone" value={emetteur.telephone} onChange={e => setEmetteur({ ...emetteur, telephone: e.target.value })} />
            </div>
          </AdminCard>

          {/* Multiplicateurs */}
          <AdminCard>
            <AdminCardHeader>Multiplicateurs de prix</AdminCardHeader>
            <div style={{ padding: 16, display: 'grid', gap: 10 }}>
              <AdminInput label="User (×)" type="number" step="0.1" value={String(multiplicateurs.user)}
                onChange={e => setMultiplicateurs({ ...multiplicateurs, user: parseFloat(e.target.value) || 2 })} />
              <AdminInput label="Partner (×)" type="number" step="0.1" value={String(multiplicateurs.partner)}
                onChange={e => setMultiplicateurs({ ...multiplicateurs, partner: parseFloat(e.target.value) || 1.2 })} />
              <AdminInput label="VIP (×)" type="number" step="0.1" value={String(multiplicateurs.vip)}
                onChange={e => setMultiplicateurs({ ...multiplicateurs, vip: parseFloat(e.target.value) || 1.3 })} />
              <AdminInput label="Admin (×)" type="number" step="0.1" value={String(multiplicateurs.admin)}
                onChange={e => setMultiplicateurs({ ...multiplicateurs, admin: parseFloat(e.target.value) || 1 })} />
              <div style={{ fontSize: 11, color: ADMIN_COLORS.grayText, marginTop: 4, padding: '8px', background: ADMIN_COLORS.grayBg, borderRadius: 6 }}>
                Prix affiché = prix_achat × multiplicateur<br/>
                User : ×2 = marge 100% | Partner : ×1.2 = marge 20%
              </div>
            </div>
          </AdminCard>

          {/* RIB Pro */}
          <AdminCard>
            <AdminCardHeader>RIB Professionnel (LUXENT)</AdminCardHeader>
            <div style={{ padding: 16, display: 'grid', gap: 10 }}>
              <AdminInput label="Titulaire" value={ribPro.titulaire} onChange={e => setRibPro({ ...ribPro, titulaire: e.target.value })} />
              <AdminInput label="IBAN" value={ribPro.iban} onChange={e => setRibPro({ ...ribPro, iban: e.target.value })} />
              <AdminInput label="BIC" value={ribPro.bic} onChange={e => setRibPro({ ...ribPro, bic: e.target.value })} />
              <AdminInput label="Banque" value={ribPro.banque} onChange={e => setRibPro({ ...ribPro, banque: e.target.value })} />
            </div>
          </AdminCard>

          {/* RIB Perso */}
          <AdminCard>
            <AdminCardHeader>RIB Personnel (N26)</AdminCardHeader>
            <div style={{ padding: 16, display: 'grid', gap: 10 }}>
              <AdminInput label="Titulaire" value={ribPerso.titulaire} onChange={e => setRibPerso({ ...ribPerso, titulaire: e.target.value })} />
              <AdminInput label="IBAN" value={ribPerso.iban} onChange={e => setRibPerso({ ...ribPerso, iban: e.target.value })} />
              <AdminInput label="BIC" value={ribPerso.bic} onChange={e => setRibPerso({ ...ribPerso, bic: e.target.value })} />
              <AdminInput label="Banque" value={ribPerso.banque} onChange={e => setRibPerso({ ...ribPerso, banque: e.target.value })} />
            </div>
          </AdminCard>

          {/* Config Acomptes */}
          <AdminCard>
            <AdminCardHeader>Configuration des acomptes</AdminCardHeader>
            <div style={{ padding: 16, display: 'grid', gap: 10 }}>
              <AdminInput label="Pourcentage par défaut (%)" type="number" value={String(acompte.pourcentage_defaut)}
                onChange={e => setAcompte({ ...acompte, pourcentage_defaut: parseInt(e.target.value) || 30 })} />
              <AdminInput label="Montant minimum (€)" type="number" value={String(acompte.montant_minimum)}
                onChange={e => setAcompte({ ...acompte, montant_minimum: parseInt(e.target.value) || 500 })} />
              <AdminInput label="Nombre max d'acomptes" type="number" value={String(acompte.nombre_max)}
                onChange={e => setAcompte({ ...acompte, nombre_max: parseInt(e.target.value) || 3 })} />
            </div>
          </AdminCard>
        </div>
      </div>
    </AdminLayout>
  )
}
