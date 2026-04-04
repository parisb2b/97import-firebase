/**
 * createTestAccounts.ts — Crée les 5 comptes test
 * PRÉREQUIS : Activer "Email/Password" dans Firebase Console :
 *   → console.firebase.google.com/project/import2030/authentication/providers
 *   → Activer "Adresse e-mail/Mot de passe"
 *
 * Usage : npx tsx src/scripts/createTestAccounts.ts
 */

import admin from 'firebase-admin'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..', '..')

admin.initializeApp({
  credential: admin.credential.cert(join(PROJECT_ROOT, 'service-account.json')),
})
const db = admin.firestore()
const auth = admin.auth()

const ACCOUNTS = [
  { email: 'admin@97import.com',       role: 'admin',   first_name: 'Admin',  last_name: '97import' },
  { email: 'client@97import.com',      role: 'user',    first_name: 'Jean',   last_name: 'Dupont' },
  { email: 'vip@97import.com',         role: 'vip',     first_name: 'Marie',  last_name: 'Martin' },
  { email: 'partenaire@97import.com',  role: 'partner', first_name: 'Pierre', last_name: 'Bernard' },
  { email: 'client2@97import.com',     role: 'user',    first_name: 'Sophie', last_name: 'Leblanc' },
]

async function main() {
  console.log('═══ CRÉATION COMPTES TEST ═══\n')

  for (const a of ACCOUNTS) {
    try {
      // Supprimer si existe
      try {
        const existing = await auth.getUserByEmail(a.email)
        await auth.deleteUser(existing.uid)
      } catch {}

      const user = await auth.createUser({
        email: a.email,
        password: '20262026',
        displayName: `${a.first_name} ${a.last_name}`,
      })

      await db.collection('profiles').doc(user.uid).set({
        email: a.email,
        role: a.role,
        first_name: a.first_name,
        last_name: a.last_name,
        phone: '',
        adresse_facturation: '', ville_facturation: '', cp_facturation: '',
        pays_facturation: 'France',
        adresse_livraison: '', ville_livraison: '', cp_livraison: '',
        pays_livraison: 'France',
        adresse_livraison_identique: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      console.log(`  ✅ ${a.email.padEnd(30)} ${a.role.padEnd(8)} uid: ${user.uid}`)
    } catch (err: any) {
      console.error(`  ❌ ${a.email} — ${err.message}`)
    }
  }

  console.log('\n✅ Terminé. MDP pour tous : 20262026')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
