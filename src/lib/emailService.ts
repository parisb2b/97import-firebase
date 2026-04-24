// src/lib/emailService.ts
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

// ═══ Constantes de config ═══
const FROM_ADDRESS = '97import <notifications@97import.com>';
const REPLY_TO = 'parisb2b@gmail.com';
const ADMIN_EMAIL = 'parisb2b@gmail.com';

// ═══════════════════════════════════════════════════
// URL du site — à modifier quand on passera en prod
// ═══════════════════════════════════════════════════
// En test : URL Vercel preview
// En prod : remplacer par 'https://97import.com'
const SITE_URL = 'https://97import-firebase-git-v2-parisb2bs-projects.vercel.app';
const ESPACE_CLIENT_URL = `${SITE_URL}/espace-client`;
const ESPACE_PARTENAIRE_URL = `${SITE_URL}/espace-partenaire`;

// ═══ Types ═══
interface EmailAttachment {
  filename: string;
  path: string; // URL publique Firebase Storage
}

interface EmailMessage {
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
}

interface MailDoc {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  from?: string;
  message: EmailMessage;
  _metadata?: {
    event: string;
    devis_id?: string;
    created_at: any;
  };
}

/**
 * Envoi bas-niveau : écrit un document dans la collection mail/
 * L'extension Firestore Trigger Email prend le relais pour envoyer.
 */
async function sendEmail(mail: MailDoc): Promise<void> {
  try {
    await addDoc(collection(db, 'mail'), {
      ...mail,
      from: mail.from || FROM_ADDRESS,
      replyTo: mail.replyTo || REPLY_TO,
      _metadata: {
        ...mail._metadata,
        created_at: serverTimestamp(),
      },
    });
  } catch (err) {
    console.error('[emailService] Erreur écriture doc mail:', err);
    // Ne pas throw : une erreur email ne doit pas bloquer l'action principale
  }
}

/**
 * Helper : récupère les infos du partenaire lié à un devis.
 * Cherche dans la collection `partners/` via le champ `code`.
 * Retourne null si aucun partenaire associé ou introuvable.
 */
async function getPartnerFromDevis(devis: any): Promise<{ email: string; nom: string; code: string } | null> {
  if (!devis.partenaire_code) return null;

  try {
    const partnerQuery = query(
      collection(db, 'partners'),
      where('code', '==', devis.partenaire_code),
      where('actif', '==', true)
    );
    const partnerSnap = await getDocs(partnerQuery);

    if (partnerSnap.empty) {
      console.warn(`[getPartnerFromDevis] Partenaire ${devis.partenaire_code} non trouvé dans partners/`);
      return null;
    }

    const data = partnerSnap.docs[0].data();
    if (!data.email) {
      console.warn(`[getPartnerFromDevis] Partenaire ${devis.partenaire_code} trouvé mais sans email`);
      return null;
    }

    return {
      email: data.email,
      nom: data.nom || 'Partenaire',
      code: devis.partenaire_code,
    };
  } catch (err) {
    console.error('[getPartnerFromDevis] Erreur:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// TEMPLATES HTML PARTAGÉS
// ═══════════════════════════════════════════════════════

/**
 * Template de base utilisé par tous les emails transactionnels.
 * Design simple, propre, responsive, charte 97import (bleu #1565C0 + salmon #C87F6B).
 */
function baseTemplate(options: {
  preheader?: string;
  title: string;
  intro: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}): string {
  const { preheader = '', title, intro, body, ctaLabel, ctaUrl, footer = '' } = options;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <span style="display:none;font-size:1px;color:#F3F4F6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F3F4F6;padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">

          <!-- Header -->
          <tr>
            <td style="background:#1565C0;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">97 IMPORT</h1>
              <p style="margin:6px 0 0 0;color:#BBDEFB;font-size:12px;">Import B2B DOM-TOM · Partenaire chinois</p>
            </td>
          </tr>

          <!-- Titre -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <h2 style="margin:0;color:#1E3A5F;font-size:20px;font-weight:700;">${title}</h2>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:16px 40px 0 40px;">
              <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">${intro}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 40px 0 40px;color:#374151;font-size:14px;line-height:1.6;">
              ${body}
            </td>
          </tr>

          <!-- CTA -->
          ${ctaLabel && ctaUrl ? `
          <tr>
            <td style="padding:28px 40px;text-align:center;">
              <a href="${ctaUrl}" style="display:inline-block;background:#1565C0;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:600;">${ctaLabel}</a>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #E5E7EB;background:#FAFBFC;">
              <p style="margin:0;color:#6B7280;font-size:12px;line-height:1.6;">
                ${footer || `Cet email a été envoyé automatiquement par 97import.com.<br>Pour toute question, répondez directement à cet email ou contactez <a href="mailto:parisb2b@gmail.com" style="color:#1565C0;text-decoration:none;">parisb2b@gmail.com</a>.`}
              </p>
              <p style="margin:12px 0 0 0;color:#9CA3AF;font-size:11px;">
                LUXENT LIMITED · 2nd Floor College House, 17 King Edwards Road, Ruislip HA4 7AE · Company No. 14852122
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Conversion HTML → texte simple pour clients mail qui n'affichent pas l'HTML */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s+\n/g, '\n\n')
    .trim();
}

function formatEur(n: number): string {
  return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// ═══════════════════════════════════════════════════════
// ÉVÉNEMENT 1 : DEVIS CRÉÉ
// ═══════════════════════════════════════════════════════

export async function notifyDevisCree(devis: any): Promise<void> {
  const clientEmail = devis.client_email || devis.email;
  if (!clientEmail) {
    console.warn('[notifyDevisCree] Pas d\'email client pour', devis.numero);
    return;
  }

  const clientNom = `${devis.client_prenom || ''} ${devis.client_nom || ''}`.trim() || 'Cher client';
  const produitsList = (devis.lignes || []).map((l: any) =>
    `<li>${l.qte || 1}× ${l.nom_fr || l.designation || l.ref} — ${formatEur((l.prix_unitaire || 0) * (l.qte || 1))}</li>`
  ).join('');

  const totalHt = devis.total_ht || 0;

  // ─── Email au CLIENT ───
  const htmlClient = baseTemplate({
    preheader: `Votre devis ${devis.numero} a bien été créé.`,
    title: `Votre devis est créé`,
    intro: `Bonjour ${clientNom},<br><br>Nous avons bien reçu votre demande. Votre devis <strong>${devis.numero}</strong> est maintenant disponible dans votre espace client.`,
    body: `
      <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-top:12px;">
        <p style="margin:0 0 12px 0;color:#1E3A5F;font-weight:600;">Récapitulatif :</p>
        <ul style="margin:0;padding-left:20px;color:#374151;">${produitsList}</ul>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0;">
        <p style="margin:0;color:#1565C0;font-size:18px;font-weight:700;">Total HT : ${formatEur(totalHt)}</p>
      </div>
      <p style="margin-top:20px;">Pour confirmer votre commande, vous pouvez dès maintenant verser un acompte depuis votre espace client.</p>
    `,
    ctaLabel: 'Accéder à mon espace client',
    ctaUrl: ESPACE_CLIENT_URL,
  });

  await sendEmail({
    to: clientEmail,
    message: {
      subject: `Votre devis ${devis.numero} — 97import`,
      html: htmlClient,
      text: htmlToText(htmlClient),
    },
    _metadata: { event: 'devis_cree', devis_id: devis.numero, created_at: null },
  });

  // ─── Email à l'ADMIN ───
  const htmlAdmin = baseTemplate({
    preheader: `Nouveau devis ${devis.numero} créé par ${clientNom}`,
    title: `Nouveau devis à traiter`,
    intro: `<strong>${clientNom}</strong> vient de créer un devis sur le site.`,
    body: `
      <div style="background:#F9FAFB;border-radius:12px;padding:20px;">
        <p style="margin:0 0 8px 0;"><strong>Devis :</strong> ${devis.numero}</p>
        <p style="margin:0 0 8px 0;"><strong>Client :</strong> ${clientNom} (${clientEmail})</p>
        <p style="margin:0 0 8px 0;"><strong>Destination :</strong> ${devis.pays_livraison || '—'}</p>
        <p style="margin:0 0 8px 0;"><strong>Partenaire :</strong> ${devis.partenaire_code || 'aucun'}</p>
        <p style="margin:0;color:#1565C0;font-weight:700;">Total HT : ${formatEur(totalHt)}</p>
      </div>
      <ul style="margin:16px 0 0 0;padding-left:20px;color:#374151;">${produitsList}</ul>
    `,
    ctaLabel: 'Ouvrir le devis dans l\'admin',
    ctaUrl: `${SITE_URL}/admin/devis/${devis.numero}`,
  });

  await sendEmail({
    to: ADMIN_EMAIL,
    message: {
      subject: `[97import] Nouveau devis ${devis.numero} — ${formatEur(totalHt)}`,
      html: htmlAdmin,
      text: htmlToText(htmlAdmin),
    },
    _metadata: { event: 'devis_cree_admin', devis_id: devis.numero, created_at: null },
  });

  // ─── Email au PARTENAIRE (si attribué) ───
  try {
    const partner = await getPartnerFromDevis(devis);
    if (partner) {
      const htmlPart = baseTemplate({
        preheader: `Nouveau devis client ${devis.numero} attribué à votre code ${partner.code}`,
        title: `Un nouveau client vous a choisi comme partenaire`,
        intro: `<strong>${clientNom}</strong> vient de créer un devis en vous sélectionnant comme partenaire.`,
        body: `
          <div style="background:#F9FAFB;border-radius:12px;padding:20px;">
            <p style="margin:0 0 8px 0;"><strong>Devis :</strong> ${devis.numero}</p>
            <p style="margin:0 0 8px 0;"><strong>Client :</strong> ${clientNom}</p>
            <p style="margin:0;color:#1565C0;font-weight:700;">Total public HT : ${formatEur(totalHt)}</p>
          </div>
          <p style="margin-top:20px;">Vous pouvez accéder au devis depuis votre espace partenaire pour négocier un prix VIP si souhaité.</p>
        `,
        ctaLabel: 'Gérer ce devis',
        ctaUrl: `${ESPACE_PARTENAIRE_URL}`,
      });

      await sendEmail({
        to: partner.email,
        message: {
          subject: `[97import partenaire] Nouveau devis ${devis.numero}`,
          html: htmlPart,
          text: htmlToText(htmlPart),
        },
        _metadata: { event: 'devis_cree_partenaire', devis_id: devis.numero, created_at: null },
      });
    }
  } catch (err) {
    console.error('[notifyDevisCree] Erreur email partenaire:', err);
  }
}

// ═══════════════════════════════════════════════════════
// ÉVÉNEMENT 2 : DEVIS VIP ENVOYÉ
// ═══════════════════════════════════════════════════════

/**
 * Étape 9 : Partenaire a renvoyé le devis VIP au client.
 * Envoie 3 emails : client (avec lien signature), admin (info), partenaire (confirmation).
 */
export async function notifyDevisVipEnvoye(devis: any, partenaireName?: string): Promise<void> {
  const signatureToken = devis.signature_token || '';
  const signatureUrl = signatureToken
    ? `${SITE_URL}/signature/${signatureToken}`
    : ESPACE_CLIENT_URL;

  const montantVip = Math.ceil(devis.total_ht || 0).toLocaleString('fr-FR');
  const montantPublic = Math.ceil(devis.total_ht_public || devis.total_ht || 0).toLocaleString('fr-FR');

  // ═══ Email 1 : CLIENT (avec lien signature) ═══
  if (devis.client_email) {
    try {
      await addDoc(collection(db, 'mail'), {
        to: devis.client_email,
        from: FROM_ADDRESS,
        replyTo: REPLY_TO,
        message: {
          subject: `🎁 Votre devis VIP est prêt — ${devis.numero}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1565C0;">Votre devis VIP est prêt !</h2>
              <p>Bonjour ${devis.client_nom || 'cher client'},</p>
              <p>Votre partenaire ${partenaireName || ''} a négocié des tarifs préférentiels pour votre devis.</p>

              <div style="padding: 16px; background: #EEF2FF; border-radius: 8px; margin: 20px 0;">
                <div><strong>📋 Numéro :</strong> ${devis.numero}</div>
                <div><strong>💰 Montant VIP :</strong> <span style="color: #10B981; font-weight: 700;">${montantVip} €</span></div>
                ${montantPublic !== montantVip ? `<div style="color: #6B7280; text-decoration: line-through;">Prix public initial : ${montantPublic} €</div>` : ''}
              </div>

              ${signatureToken ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signatureUrl}"
                   style="display: inline-block; padding: 16px 32px; background: #10B981; color: #fff;
                          text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">
                  ✍️ Signer directement mon devis
                </a>
                <div style="font-size: 11px; color: #6B7280; margin-top: 8px;">
                  Lien unique, valable 30 jours
                </div>
              </div>
              <p style="text-align: center; color: #6B7280; font-size: 13px;">— ou —</p>
              ` : ''}

              <div style="text-align: center; margin: 20px 0;">
                <a href="${ESPACE_CLIENT_URL}"
                   style="display: inline-block; padding: 10px 20px; border: 2px solid #1565C0;
                          color: #1565C0; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Accéder à mon espace client
                </a>
              </div>

              <p style="color: #6B7280; font-size: 13px; margin-top: 30px;">
                Cordialement,<br>L'équipe 97import
              </p>
            </div>
          `,
          text: `Votre devis VIP est prêt - ${devis.numero}\n\nBonjour ${devis.client_nom || 'cher client'},\n\nVotre partenaire ${partenaireName || ''} a négocié des tarifs préférentiels pour votre devis.\n\nMontant VIP : ${montantVip} €\n\n${signatureToken ? `Signer directement : ${signatureUrl}\n\n` : ''}Accéder à mon espace client : ${ESPACE_CLIENT_URL}`,
        },
        _metadata: {
          event: 'devis_vip_envoye_client',
          devis_id: devis.id || devis.numero,
          created_at: serverTimestamp(),
        },
      });
    } catch (err) {
      console.error('[notifyDevisVipEnvoye] Erreur email client:', err);
    }
  }

  // ═══ Email 2 : ADMIN ═══
  try {
    await addDoc(collection(db, 'mail'), {
      to: ADMIN_EMAIL,
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      message: {
        subject: `[97import] Devis VIP envoyé au client — ${devis.numero}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1E3A5F;">Devis VIP envoyé au client</h2>
            <p>Le partenaire ${partenaireName || '—'} a négocié et envoyé le devis VIP.</p>

            <div style="padding: 16px; background: #F3F4F6; border-radius: 8px; margin: 20px 0;">
              <div><strong>📋 Devis :</strong> ${devis.numero}</div>
              <div><strong>👤 Client :</strong> ${devis.client_nom || '—'} (${devis.client_email || '—'})</div>
              <div><strong>🤝 Partenaire :</strong> ${partenaireName || '—'} (code ${devis.partenaire_code || '—'})</div>
              <div><strong>💰 Montant VIP :</strong> ${montantVip} € (public: ${montantPublic} €)</div>
            </div>

            <p style="color: #EA580C;"><strong>⏳ En attente signature client</strong></p>

            <div style="text-align: center; margin: 20px 0;">
              <a href="${SITE_URL}/admin/devis/${devis.id || devis.numero}"
                 style="display: inline-block; padding: 10px 20px; background: #1565C0; color: #fff;
                        text-decoration: none; border-radius: 6px; font-weight: 600;">
                Voir le devis
              </a>
            </div>
          </div>
        `,
        text: `Devis VIP envoyé au client - ${devis.numero}\n\nLe partenaire ${partenaireName || '—'} a négocié et envoyé le devis VIP.\n\nClient : ${devis.client_nom || '—'} (${devis.client_email || '—'})\nMontant VIP : ${montantVip} €\n\nVoir : ${SITE_URL}/admin/devis/${devis.id || devis.numero}`,
      },
      _metadata: {
        event: 'devis_vip_envoye_admin',
        devis_id: devis.id || devis.numero,
        created_at: serverTimestamp(),
      },
    });
  } catch (err) {
    console.error('[notifyDevisVipEnvoye] Erreur email admin:', err);
  }

  // ═══ Email 3 : PARTENAIRE (confirmation) ═══
  try {
    const partner = await getPartnerFromDevis(devis);
    if (partner) {
      await addDoc(collection(db, 'mail'), {
        to: partner.email,
        from: FROM_ADDRESS,
        replyTo: REPLY_TO,
        message: {
          subject: `✅ Devis VIP envoyé au client — ${devis.numero}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10B981;">Devis VIP bien envoyé ✓</h2>
              <p>Bonjour ${partner.nom},</p>
              <p>Votre devis VIP négocié a été envoyé au client avec succès.</p>

              <div style="padding: 16px; background: #F0FDF4; border-radius: 8px; margin: 20px 0;">
                <div><strong>📋 Devis :</strong> ${devis.numero}</div>
                <div><strong>👤 Client :</strong> ${devis.client_nom || '—'}</div>
                <div><strong>💰 Montant VIP :</strong> ${montantVip} €</div>
              </div>

              <p>Vous serez notifié quand le client signera le devis.</p>

              <div style="text-align: center; margin: 20px 0;">
                <a href="${ESPACE_PARTENAIRE_URL}"
                   style="display: inline-block; padding: 10px 20px; background: #1565C0; color: #fff;
                          text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Mon espace partenaire
                </a>
              </div>
            </div>
          `,
          text: `Devis VIP bien envoyé - ${devis.numero}\n\nBonjour ${partner.nom},\n\nVotre devis VIP négocié a été envoyé au client avec succès.\n\nClient : ${devis.client_nom || '—'}\nMontant VIP : ${montantVip} €\n\nVous serez notifié quand le client signera le devis.\n\nMon espace partenaire : ${ESPACE_PARTENAIRE_URL}`,
        },
        _metadata: {
          event: 'devis_vip_envoye_partenaire',
          devis_id: devis.id || devis.numero,
          partenaire_code: partner.code,
          created_at: serverTimestamp(),
        },
      });
    }
  } catch (err) {
    console.error('[notifyDevisVipEnvoye] Erreur email partenaire:', err);
  }
}

// ═══════════════════════════════════════════════════════
// ÉVÉNEMENT 3 : ACOMPTE DÉCLARÉ
// ═══════════════════════════════════════════════════════

export async function notifyAcompteDeclare(devis: any, acompte: any): Promise<void> {
  const clientEmail = devis.client_email || devis.email;
  const clientNom = `${devis.client_prenom || ''} ${devis.client_nom || ''}`.trim() || 'Cher client';
  const montant = acompte.montant || 0;
  const typeCompte = acompte.type_compte === 'perso' ? 'Personnel (N26)' : 'Professionnel (Banking Circle)';

  // ─── Email au CLIENT (accusé) ───
  if (clientEmail) {
    const htmlClient = baseTemplate({
      preheader: `Virement de ${formatEur(montant)} déclaré pour ${devis.numero}`,
      title: `Virement bien déclaré`,
      intro: `Bonjour ${clientNom},<br><br>Vous venez de nous déclarer un virement de <strong>${formatEur(montant)}</strong> pour votre devis <strong>${devis.numero}</strong>.`,
      body: `
        <div style="background:#F9FAFB;border-radius:12px;padding:20px;">
          <p style="margin:0 0 8px 0;"><strong>Montant :</strong> ${formatEur(montant)}</p>
          <p style="margin:0 0 8px 0;"><strong>Compte :</strong> ${typeCompte}</p>
          <p style="margin:0;"><strong>Date déclaration :</strong> ${new Date(acompte.date || Date.now()).toLocaleDateString('fr-FR')}</p>
        </div>
        <p style="margin-top:20px;">Dès que nous constaterons votre virement sur notre compte bancaire, nous validerons l'encaissement et vous recevrez votre facture d'acompte par email.</p>
      `,
      ctaLabel: 'Suivre l\'état de mon virement',
      ctaUrl: `${ESPACE_CLIENT_URL}`,
    });

    await sendEmail({
      to: clientEmail,
      message: {
        subject: `Virement de ${formatEur(montant)} déclaré — ${devis.numero}`,
        html: htmlClient,
        text: htmlToText(htmlClient),
      },
      _metadata: { event: 'acompte_declare_client', devis_id: devis.numero, created_at: null },
    });
  }

  // ─── Email à l'ADMIN (urgent - vérifier banque) ───
  const htmlAdmin = baseTemplate({
    preheader: `Virement de ${formatEur(montant)} à vérifier pour ${devis.numero}`,
    title: `⚠️ Vérifier un virement en banque`,
    intro: `Le client <strong>${clientNom}</strong> a déclaré un virement de <strong>${formatEur(montant)}</strong>. À vérifier sur le compte ${typeCompte}.`,
    body: `
      <div style="background:#FEF3C7;border-radius:12px;padding:20px;border-left:4px solid #D97706;">
        <p style="margin:0 0 8px 0;"><strong>Devis :</strong> ${devis.numero}</p>
        <p style="margin:0 0 8px 0;"><strong>Client :</strong> ${clientNom} (${clientEmail || '—'})</p>
        <p style="margin:0 0 8px 0;"><strong>Montant :</strong> ${formatEur(montant)}</p>
        <p style="margin:0 0 8px 0;"><strong>Compte utilisé :</strong> ${typeCompte}</p>
        <p style="margin:0;"><strong>Déclaré le :</strong> ${new Date(acompte.date || Date.now()).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <p style="margin-top:20px;color:#92400E;">→ Vérifier la réception du virement sur le compte bancaire, puis encaisser via l'admin.</p>
    `,
    ctaLabel: 'Ouvrir le devis dans l\'admin',
    ctaUrl: `${SITE_URL}/admin/devis/${devis.numero}`,
  });

  await sendEmail({
    to: ADMIN_EMAIL,
    message: {
      subject: `[97import URGENT] Acompte ${formatEur(montant)} déclaré — ${devis.numero}`,
      html: htmlAdmin,
      text: htmlToText(htmlAdmin),
    },
    _metadata: { event: 'acompte_declare_admin', devis_id: devis.numero, created_at: null },
  });

  // ─── Email au PARTENAIRE (si attribué) ───
  try {
    const partner = await getPartnerFromDevis(devis);
    if (partner) {
      const htmlPart = baseTemplate({
        preheader: `Votre client ${clientNom} a déclaré un acompte sur ${devis.numero}`,
        title: `Votre client a versé un acompte`,
        intro: `<strong>${clientNom}</strong> vient de déclarer un virement de <strong>${formatEur(montant)}</strong> sur le devis ${devis.numero}.`,
        body: `
          <p>Dès que l'acompte sera encaissé, votre commission sera calculée et visible dans votre espace partenaire.</p>
        `,
        ctaLabel: 'Voir dans mon espace partenaire',
        ctaUrl: ESPACE_PARTENAIRE_URL,
      });

      await sendEmail({
        to: partner.email,
        message: {
          subject: `[97import partenaire] Acompte déclaré sur ${devis.numero}`,
          html: htmlPart,
          text: htmlToText(htmlPart),
        },
        _metadata: { event: 'acompte_declare_partenaire', devis_id: devis.numero, created_at: null },
      });
    }
  } catch (err) {
    console.error('[notifyAcompteDeclare] Erreur email partenaire:', err);
  }
}

// ═══════════════════════════════════════════════════════
// ÉVÉNEMENT 4 : ACOMPTE ENCAISSÉ
// ═══════════════════════════════════════════════════════

export async function notifyAcompteEncaisse(
  devis: any,
  acompte: any,
  factureUrl?: string
): Promise<void> {
  const clientEmail = devis.client_email || devis.email;
  const clientNom = `${devis.client_prenom || ''} ${devis.client_nom || ''}`.trim() || 'Cher client';
  const montant = acompte.montant || 0;
  const refFa = acompte.ref_fa || '';
  const totalHt = devis.total_ht || 0;

  // Recalculer le cumul
  const acomptes = Array.isArray(devis.acomptes) ? devis.acomptes : [];
  const totalEncaisse = acomptes
    .filter((a: any) => a.statut === 'encaisse')
    .reduce((s: number, a: any) => s + (a.montant || 0), 0);
  const soldeRestant = totalHt - totalEncaisse;

  // ─── Email au CLIENT (avec FA en PJ) ───
  if (clientEmail) {
    const htmlClient = baseTemplate({
      preheader: `Votre acompte de ${formatEur(montant)} a été encaissé — FA ${refFa}`,
      title: `Acompte encaissé ✓`,
      intro: `Bonjour ${clientNom},<br><br>Nous avons bien reçu votre virement de <strong>${formatEur(montant)}</strong>. Votre facture d'acompte <strong>${refFa}</strong> est en pièce jointe.`,
      body: `
        <div style="background:#D1FAE5;border-radius:12px;padding:20px;border-left:4px solid #059669;">
          <p style="margin:0 0 8px 0;"><strong>Acompte encaissé :</strong> ${formatEur(montant)}</p>
          <p style="margin:0 0 8px 0;"><strong>Facture :</strong> ${refFa}</p>
          <p style="margin:0;"><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>
        <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-top:16px;">
          <p style="margin:0 0 8px 0;"><strong>Total devis HT :</strong> ${formatEur(totalHt)}</p>
          <p style="margin:0 0 8px 0;color:#059669;"><strong>Total encaissé :</strong> ${formatEur(totalEncaisse)}</p>
          <p style="margin:0;color:#1E3A8A;"><strong>Solde restant :</strong> ${formatEur(soldeRestant)}</p>
        </div>
        ${soldeRestant > 0
          ? `<p style="margin-top:20px;">Pour compléter votre commande, vous pouvez verser un nouvel acompte depuis votre espace client.</p>`
          : `<p style="margin-top:20px;color:#059669;font-weight:600;">✓ Votre commande est intégralement payée. Nous préparons votre expédition.</p>`
        }
      `,
      ctaLabel: 'Accéder à ma commande',
      ctaUrl: ESPACE_CLIENT_URL,
    });

    const attachments: EmailAttachment[] = factureUrl
      ? [{ filename: `${refFa}.pdf`, path: factureUrl }]
      : [];

    await sendEmail({
      to: clientEmail,
      message: {
        subject: `Acompte encaissé — Facture ${refFa}`,
        html: htmlClient,
        text: htmlToText(htmlClient),
        attachments,
      },
      _metadata: { event: 'acompte_encaisse_client', devis_id: devis.numero, created_at: null },
    });
  }

  // ─── Email à l'ADMIN (confirmation encaissement) ───
  const htmlAdmin = baseTemplate({
    preheader: `Acompte de ${formatEur(montant)} encaissé pour ${devis.numero}`,
    title: `✅ Acompte encaissé`,
    intro: `L'acompte de <strong>${formatEur(montant)}</strong> a été encaissé pour le devis <strong>${devis.numero}</strong>.`,
    body: `
      <div style="background:#D1FAE5;border-radius:12px;padding:20px;border-left:4px solid #059669;">
        <p style="margin:0 0 8px 0;"><strong>Client :</strong> ${clientNom} (${clientEmail || '—'})</p>
        <p style="margin:0 0 8px 0;"><strong>Devis :</strong> ${devis.numero}</p>
        <p style="margin:0 0 8px 0;"><strong>Acompte encaissé :</strong> ${formatEur(montant)}</p>
        <p style="margin:0 0 8px 0;"><strong>Facture :</strong> ${refFa}</p>
        <p style="margin:0;"><strong>Partenaire :</strong> ${devis.partenaire_code || 'aucun'}</p>
      </div>
      <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-top:16px;">
        <p style="margin:0 0 8px 0;"><strong>Total devis HT :</strong> ${formatEur(totalHt)}</p>
        <p style="margin:0 0 8px 0;color:#059669;"><strong>Total encaissé :</strong> ${formatEur(totalEncaisse)}</p>
        <p style="margin:0;${soldeRestant > 0 ? 'color:#EA580C;' : 'color:#059669;'}"><strong>Solde restant :</strong> ${formatEur(soldeRestant)}</p>
      </div>
      ${soldeRestant > 0
        ? `<p style="margin-top:20px;color:#EA580C;">→ En attente des prochains acomptes.</p>`
        : `<p style="margin-top:20px;color:#059669;font-weight:600;">✓ Commande intégralement payée — Préparer l'expédition.</p>`
      }
    `,
    ctaLabel: 'Voir le devis',
    ctaUrl: `${SITE_URL}/admin/devis/${devis.numero}`,
  });

  await sendEmail({
    to: ADMIN_EMAIL,
    message: {
      subject: `[97import] Acompte encaissé ${formatEur(montant)} — ${devis.numero}`,
      html: htmlAdmin,
      text: htmlToText(htmlAdmin),
    },
    _metadata: { event: 'acompte_encaisse_admin', devis_id: devis.numero, created_at: null },
  });

  // ─── Email au PARTENAIRE (commission due) ───
  try {
    const partner = await getPartnerFromDevis(devis);
    if (partner) {
      const htmlPart = baseTemplate({
        preheader: `L'acompte de ${formatEur(montant)} a été encaissé — votre commission est due`,
        title: `Acompte encaissé — Commission confirmée`,
        intro: `L'acompte de <strong>${formatEur(montant)}</strong> sur le devis <strong>${devis.numero}</strong> a été encaissé.`,
        body: `
          <p>Votre commission correspondante est désormais confirmée. Vous pouvez la consulter dans votre espace partenaire.</p>
          <div style="background:#F9FAFB;border-radius:12px;padding:20px;margin-top:16px;">
            <p style="margin:0 0 8px 0;"><strong>Client :</strong> ${clientNom}</p>
            <p style="margin:0 0 8px 0;"><strong>Acompte encaissé :</strong> ${formatEur(montant)}</p>
            <p style="margin:0;"><strong>Facture :</strong> ${refFa}</p>
          </div>
        `,
        ctaLabel: 'Voir mes commissions',
        ctaUrl: `${ESPACE_PARTENAIRE_URL}`,
      });

      await sendEmail({
        to: partner.email,
        message: {
          subject: `[97import partenaire] Commission confirmée — ${devis.numero}`,
          html: htmlPart,
          text: htmlToText(htmlPart),
        },
        _metadata: { event: 'acompte_encaisse_partenaire', devis_id: devis.numero, created_at: null },
      });
    }
  } catch (err) {
    console.error('[notifyAcompteEncaisse] Erreur email partenaire:', err);
  }
}

// ═══════════════════════════════════════════════════════
// P3-WF1: FACTURE ACOMPTE (NOUVEAU WORKFLOW)
// ═══════════════════════════════════════════════════════

/**
 * Envoie l'email de confirmation de paiement acompte au client
 * avec le PDF en pièce jointe (via URL Firebase Storage)
 */
export async function envoyerEmailFactureAcompte(params: {
  clientEmail: string;
  clientNom: string;
  factureNumero: string;
  devisNumero: string;
  acompteNumero: number;
  estSolde: boolean;
  montantAcompte: number;
  totalPaye: number;
  totalDevis: number;
  pdfUrl: string;
  estEntierementPaye: boolean;
}): Promise<void> {
  const subject = params.estEntierementPaye
    ? `✅ Facture payée intégralement — ${params.devisNumero}`
    : params.estSolde
      ? `Facture solde reçue — ${params.factureNumero}`
      : `Facture acompte n°${params.acompteNumero}/3 reçue — ${params.factureNumero}`;

  const restant = params.totalDevis - params.totalPaye;

  const html = baseTemplate({
    preheader: params.estEntierementPaye ? 'Votre devis est intégralement payé' : `Acompte n°${params.acompteNumero} reçu`,
    title: params.estEntierementPaye ? '✅ Facture payée intégralement' : `Acompte n°${params.acompteNumero} reçu`,
    intro: `Bonjour ${params.clientNom},<br><br>Nous avons bien reçu votre paiement. Vous trouverez ci-joint votre facture <strong>${params.factureNumero}</strong>.`,
    body: `
      <div style="background:#FBF0ED;padding:16px;border-radius:8px;margin:20px 0;">
        <h3 style="margin:0 0 12px;color:#C87F6B;">Détail du paiement</h3>
        <p style="margin:4px 0;"><strong>Devis d'origine :</strong> ${params.devisNumero}</p>
        <p style="margin:4px 0;"><strong>Montant reçu :</strong> ${formatEur(params.montantAcompte)}</p>
        <p style="margin:4px 0;"><strong>Total payé à ce jour :</strong> ${formatEur(params.totalPaye)}</p>
        <p style="margin:4px 0;"><strong>Total devis :</strong> ${formatEur(params.totalDevis)}</p>
        ${restant > 0.01 ? `<p style="margin:4px 0;color:#D97706;"><strong>Reste à payer :</strong> ${formatEur(restant)}</p>` : ''}
      </div>

      ${params.estEntierementPaye
        ? `<p style="background:#D1FAE5;padding:12px;border-left:4px solid #10B981;border-radius:4px;">
             🎉 Votre devis est intégralement payé. Nous allons procéder au lancement de la production.
           </p>`
        : `<p>Pour effectuer le paiement suivant, merci de vous référer aux coordonnées bancaires indiquées sur votre devis.</p>`
      }
    `,
    ctaLabel: '📄 Télécharger la facture',
    ctaUrl: params.pdfUrl,
    footer: `
      <p style="margin-top:32px;color:#6B7280;font-size:13px;">
        Merci pour votre confiance.<br>
        L'équipe 97import
      </p>
    `,
  });

  await sendEmail({
    to: params.clientEmail,
    message: {
      subject,
      html,
      text: htmlToText(html),
      attachments: [{ filename: `${params.factureNumero}.pdf`, path: params.pdfUrl }],
    },
    _metadata: {
      event: 'facture_acompte',
      devis_id: params.devisNumero,
      created_at: null,
    },
  });
}

// ═══════════════════════════════════════════════════════
// ÉVÉNEMENT 5 : SIGNATURE DEVIS
// ═══════════════════════════════════════════════════════

export async function notifySignatureClient(devis: any, partenaireName?: string): Promise<void> {
  const clientEmail = devis.client_email || devis.email;
  const clientNom = `${devis.client_prenom || ''} ${devis.client_nom || ''}`.trim() || 'Cher client';
  const totalHt = devis.total_ht || 0;

  // ─── Email au CLIENT ───
  if (clientEmail) {
    const htmlClient = baseTemplate({
      preheader: `Votre devis ${devis.numero} a été signé avec succès`,
      title: `✅ Devis signé`,
      intro: `Bonjour ${clientNom},<br><br>Vous venez de signer votre devis <strong>${devis.numero}</strong>. Merci de votre confiance !`,
      body: `
        <div style="background:#D1FAE5;border-radius:12px;padding:20px;text-align:center;border-left:4px solid #059669;">
          <p style="margin:0 0 8px 0;color:#065F46;font-size:16px;font-weight:600;">Devis signé avec succès</p>
          <p style="margin:0 0 16px 0;color:#059669;font-size:14px;">Votre commande pour <strong>${formatEur(totalHt)}</strong> est maintenant confirmée.</p>
        </div>
        <p style="margin-top:20px;">Pour lancer la production, merci de verser un acompte minimum de 30% depuis votre espace client.</p>
        <p style="margin-top:12px;color:#6B7280;font-size:13px;">
          Dès réception de votre virement, nous vous enverrons votre facture d'acompte et lancerons la fabrication de vos produits.
        </p>
      `,
      ctaLabel: 'Accéder à mon espace client',
      ctaUrl: ESPACE_CLIENT_URL,
    });

    await sendEmail({
      to: clientEmail,
      message: {
        subject: `✅ Devis signé — ${devis.numero}`,
        html: htmlClient,
        text: htmlToText(htmlClient),
      },
      _metadata: { event: 'signature_client', devis_id: devis.numero, created_at: null },
    });
  }

  // ─── Email à l'ADMIN ───
  const htmlAdmin = baseTemplate({
    preheader: `Devis ${devis.numero} signé par ${clientNom}`,
    title: `✍️ Devis signé`,
    intro: `Le client <strong>${clientNom}</strong> vient de signer le devis <strong>${devis.numero}</strong>.`,
    body: `
      <div style="background:#D1FAE5;border-radius:12px;padding:20px;border-left:4px solid #059669;">
        <p style="margin:0 0 8px 0;"><strong>Client :</strong> ${clientNom} (${clientEmail || '—'})</p>
        <p style="margin:0 0 8px 0;"><strong>Devis :</strong> ${devis.numero}</p>
        <p style="margin:0 0 8px 0;"><strong>Montant HT :</strong> ${formatEur(totalHt)}</p>
        <p style="margin:0;"><strong>Partenaire :</strong> ${partenaireName || devis.partenaire_code || 'aucun'}</p>
      </div>
      <p style="margin-top:20px;color:#92400E;">
        → En attente du premier acompte pour lancer la production.
      </p>
    `,
    ctaLabel: 'Voir le devis',
    ctaUrl: `${SITE_URL}/admin/devis/${devis.numero}`,
  });

  await sendEmail({
    to: ADMIN_EMAIL,
    message: {
      subject: `[97import] Devis signé — ${devis.numero} — ${formatEur(totalHt)}`,
      html: htmlAdmin,
      text: htmlToText(htmlAdmin),
    },
    _metadata: { event: 'signature_admin', devis_id: devis.numero, created_at: null },
  });

  // ─── Email au PARTENAIRE (si attribué) ───
  try {
    const partner = await getPartnerFromDevis(devis);
    if (partner) {
      const htmlPart = baseTemplate({
        preheader: `Votre client ${clientNom} a signé son devis ${devis.numero}`,
        title: `✍️ Votre client a signé son devis`,
        intro: `<strong>${clientNom}</strong> vient de signer le devis <strong>${devis.numero}</strong> que vous avez négocié.`,
        body: `
          <div style="background:#D1FAE5;border-radius:12px;padding:20px;">
            <p style="margin:0 0 8px 0;color:#065F46;font-weight:600;">Félicitations ! 🎉</p>
            <p style="margin:0;color:#059669;font-size:14px;">
              Votre client a accepté votre offre VIP. Dès qu'il versera un acompte, votre commission sera calculée et visible dans votre espace partenaire.
            </p>
          </div>
        `,
        ctaLabel: 'Voir dans mon espace partenaire',
        ctaUrl: ESPACE_PARTENAIRE_URL,
      });

      await sendEmail({
        to: partner.email,
        message: {
          subject: `[97import partenaire] Devis signé — ${devis.numero}`,
          html: htmlPart,
          text: htmlToText(htmlPart),
        },
        _metadata: { event: 'signature_partenaire', devis_id: devis.numero, created_at: null },
      });
    }
  } catch (err) {
    console.error('[notifySignatureClient] Erreur email partenaire:', err);
  }
}

// ═══ NOUVEAU : EMAILS P3 (PARTIE E) ═══

/**
 * Email au client quand la facture FINALE globale est générée
 */
export async function envoyerEmailFactureFinale(params: {
  clientEmail: string;
  clientNom: string;
  factureFinaleNumero: string;
  devisNumero: string;
  total: number;
  pdfUrl: string;
}): Promise<void> {
  const { db } = await import('./firebase');
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 32px; text-align: center; color: #fff;">
        <div style="font-size: 48px;">✅</div>
        <h1 style="margin: 8px 0 0; font-size: 24px;">FACTURE PAYÉE — SOLDÉE</h1>
      </div>
      <div style="padding: 24px;">
        <p>Bonjour ${params.clientNom},</p>
        <p>Votre commande est intégralement payée. Voici votre <strong>facture globale</strong> ${params.factureFinaleNumero} récapitulative.</p>
        <p><strong>Total payé :</strong> ${formatEur(params.total)}</p>
        <p><strong>Devis :</strong> ${params.devisNumero}</p>
        <p><a href="${params.pdfUrl}" style="display: inline-block; padding: 12px 24px; background: #10B981; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 700;">📄 Télécharger la facture finale</a></p>
        <p style="margin-top: 24px; color: #6B7280;">Nous allons procéder à la commande auprès de notre fournisseur. Vous serez tenu informé à chaque étape.</p>
      </div>
      <div style="background: #F9FAFB; padding: 16px; text-align: center; font-size: 11px; color: #6B7280;">
        Luxent Limited / 97import.com<br/>
        TVA non applicable — Art. 293B du CGI
      </div>
    </div>
  `;
  
  await addDoc(collection(db, 'mail'), {
    to: params.clientEmail,
    message: { subject: `✅ Facture payée — ${params.devisNumero}`, html },
    created_at: serverTimestamp(),
  });
}

/**
 * Email au partenaire quand commission versable
 */
export async function envoyerEmailCommissionPartenaire(params: {
  partenaireEmail: string;
  partenaireNom: string;
  devisNumero: string;
  clientNom: string;
  montantCommission: number;
  noteCommissionNumero?: string;
  whatsappLink?: string;
}): Promise<void> {
  const { db } = await import('./firebase');
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1E3A5F 0%, #3B82F6 100%); padding: 32px; text-align: center; color: #fff;">
        <div style="font-size: 48px;">💰</div>
        <h1 style="margin: 8px 0 0;">Nouvelle commission</h1>
      </div>
      <div style="padding: 24px;">
        <p>Bonjour ${params.partenaireNom},</p>
        <p>Le client <strong>${params.clientNom}</strong> a soldé le devis <strong>${params.devisNumero}</strong>. Votre commission est prête à être versée.</p>
        
        <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0;">
          <div style="font-size: 12px; color: #059669; font-weight: 700;">COMMISSION À VERSER</div>
          <div style="font-size: 32px; font-weight: 800; color: #10B981; margin-top: 8px;">${formatEur(params.montantCommission)}</div>
          ${params.noteCommissionNumero ? `<div style="font-size: 11px; color: #6B7280; margin-top: 4px;">Note de commission : ${params.noteCommissionNumero}</div>` : ''}
        </div>
        
        <p>Merci de nous faire parvenir votre RIB pour que nous procédions au virement.</p>
        
        ${params.whatsappLink ? `<p><a href="${params.whatsappLink}" style="display: inline-block; padding: 10px 20px; background: #25D366; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 700;">💬 Répondre sur WhatsApp</a></p>` : ''}
      </div>
      <div style="background: #F9FAFB; padding: 16px; text-align: center; font-size: 11px; color: #6B7280;">
        97import.com / Luxent Limited
      </div>
    </div>
  `;
  
  await addDoc(collection(db, 'mail'), {
    to: params.partenaireEmail,
    message: {
      subject: `💰 Commission à verser — ${params.devisNumero}`,
      html,
    },
    created_at: serverTimestamp(),
  });
}
