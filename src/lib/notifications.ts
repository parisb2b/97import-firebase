import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

interface EmailPayload {
  to: string
  subject: string
  html: string
}

export async function sendNotificationEmail(
  payload: EmailPayload
): Promise<void> {
  try {
    const sendEmail = httpsCallable(functions, 'sendEmail')
    await sendEmail(payload)
  } catch (error) {
    console.warn('Email non envoyé:', error)
    // Ne jamais bloquer l'action principale
  }
}

export const emailTemplates = {
  virementClient: (
    numeroDevis: string,
    nomClient: string,
    montant: number,
    typePaiement: string
  ) => ({
    to: 'parisb2b@gmail.com',
    subject: `Virement client — ${numeroDevis} — À encaisser`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;
        max-width:560px;margin:0 auto">
        <div style="background:#1E3A5F;padding:16px 24px;
          border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:16px">
            97import.com — Acompte à encaisser
          </h2>
        </div>
        <div style="background:#fff;
          border:0.5px solid #E5E7EB;
          padding:20px 24px;
          border-radius:0 0 8px 8px">
          <div style="background:#FFFBEB;
            border:0.5px solid #FCD34D;
            border-radius:6px;padding:12px 16px;
            margin:12px 0">
            <p style="margin:0;color:#92400E;
              font-weight:600">
              Devis : ${numeroDevis}
            </p>
            <p style="margin:4px 0 0;color:#92400E">
              Client : ${nomClient}
            </p>
            <p style="margin:4px 0 0;color:#92400E">
              Montant déclaré : ${montant}€
            </p>
            <p style="margin:4px 0 0;color:#92400E">
              Type : ${typePaiement === 'pro'
                ? 'Professionnel' : 'Particulier'}
            </p>
          </div>
          <a href="https://97import.com/admin/devis"
            style="display:inline-block;
            background:#1E3A5F;color:#fff;
            text-decoration:none;
            padding:10px 20px;border-radius:6px;
            font-size:13px;margin-top:8px">
            Accéder au back-office →
          </a>
        </div>
      </div>
    `,
  }),

  documentDisponible: (
    to: string,
    nomDoc: string,
    nomClient?: string
  ) => ({
    to,
    subject: `Votre ${nomDoc} est disponible — 97import.com`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;
        max-width:560px;margin:0 auto">
        <div style="background:#1E3A5F;
          padding:16px 24px;
          border-radius:8px 8px 0 0">
          <h2 style="color:#fff;margin:0;font-size:16px">
            97import.com
          </h2>
        </div>
        <div style="background:#fff;
          border:0.5px solid #E5E7EB;
          padding:20px 24px;
          border-radius:0 0 8px 8px">
          <p style="color:#374151">
            Bonjour${nomClient ? ' ' + nomClient : ''},
          </p>
          <p style="color:#374151">
            Votre document <strong>${nomDoc}</strong>
            est disponible dans votre espace client.
          </p>
          <a href="https://97import.com/mon-compte"
            style="display:inline-block;
            background:#1E3A5F;color:#fff;
            text-decoration:none;
            padding:10px 20px;border-radius:6px;
            font-size:13px;margin-top:8px">
            Accéder à mon espace →
          </a>
        </div>
      </div>
    `,
  }),
}
