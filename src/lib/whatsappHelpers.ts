// src/lib/whatsappHelpers.ts
// Générateur de liens wa.me pré-remplis (phase 1)
// Architecture prête pour swap vers API Business plus tard

/**
 * Génère un lien wa.me pré-rempli
 * Usage : <a href={generateWhatsAppLink('+596696XXXXXX', 'Bonjour...')}>
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  // Nettoyer le téléphone (retirer espaces, tirets, parenthèses, +)
  const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Templates de messages WhatsApp par événement
 */
export function msgAcompteRecu(params: {
  clientNom: string;
  devisNumero: string;
  montantRecu: number;
  totalPaye: number;
  totalDevis: number;
}): string {
  const restant = params.totalDevis - params.totalPaye;
  return `Bonjour ${params.clientNom},

✅ Nous avons bien reçu votre paiement de ${params.montantRecu.toFixed(2)}€ sur le devis ${params.devisNumero}.

💰 Total payé : ${params.totalPaye.toFixed(2)}€ / ${params.totalDevis.toFixed(2)}€
${restant > 0.01 ? `💳 Reste à payer : ${restant.toFixed(2)}€` : '🎉 VOTRE FACTURE EST ENTIÈREMENT PAYÉE !'}

Votre facture d'acompte a été envoyée par email.

Luxent Limited / 97import.com`;
}

export function msgSoldePaye(params: {
  clientNom: string;
  devisNumero: string;
  total: number;
}): string {
  return `Bonjour ${params.clientNom},

🎉 FACTURE PAYÉE SOLDÉE !

Le devis ${params.devisNumero} est intégralement payé (${params.total.toFixed(2)}€).

Nous lançons maintenant la commande auprès de notre fournisseur. Vous recevrez les mises à jour à chaque étape (embarquement Chine, arrivée port).

Merci pour votre confiance !
Luxent Limited / 97import.com`;
}

export function msgContainerParti(params: {
  clientNom: string;
  devisNumero: string;
  dateEmbarquement: string;
  dateArriveeEstimee?: string;
}): string {
  return `Bonjour ${params.clientNom},

🚢 Votre commande (${params.devisNumero}) a été embarquée de Chine le ${params.dateEmbarquement}.

${params.dateArriveeEstimee ? `📅 Arrivée estimée au port : ${params.dateArriveeEstimee}` : ''}

Vous recevrez une notification dès l'arrivée au port.

Luxent Limited / 97import.com`;
}

export function msgCommissionPartenaire(params: {
  partenaireNom: string;
  devisNumero: string;
  clientNom: string;
  montantCommission: number;
}): string {
  return `Bonjour ${params.partenaireNom},

💰 Nouvelle commission à verser :

📋 Devis : ${params.devisNumero}
👤 Client : ${params.clientNom}
💵 Commission : ${params.montantCommission.toFixed(2)}€

Le solde ayant été payé, votre commission peut être versée. Une NC (note de commission) a été générée.

97import.com`;
}
