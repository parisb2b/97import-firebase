// src/lib/deeplService.ts
// Service de traduction via Vercel Serverless Function (proxy)
//
// IMPORTANT : Ce fichier n'appelle PLUS directement DeepL (bloqué par CORS).
// Il passe par notre endpoint /api/translate qui fait le proxy côté serveur.

export type LangueCible = 'ZH' | 'EN';

/**
 * Traduit un texte via notre proxy Vercel
 *
 * @param texte Le texte source (en français par défaut)
 * @param langueCible 'ZH' pour chinois, 'EN' pour anglais
 * @param langueSource Langue source (défaut 'FR')
 * @returns La traduction
 * @throws Error si l'API retourne une erreur
 */
export async function traduireTexte(
  texte: string,
  langueCible: LangueCible,
  langueSource: 'FR' = 'FR'
): Promise<string> {
  // Skip si texte vide
  if (!texte || !texte.trim()) return '';

  try {
    // Appel à notre proxy Vercel (même origine que le site → pas de CORS)
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: texte,
        target_lang: langueCible,
        source_lang: langueSource,
      }),
    });

    if (!response.ok) {
      // Lecture du message d'erreur serveur
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
      throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.text || '';

  } catch (err: any) {
    console.error('Erreur traduction:', err);

    // Message d'erreur plus clair pour l'utilisateur
    if (err.message?.includes('Failed to fetch')) {
      throw new Error('Impossible de contacter le service de traduction. Vérifiez votre connexion internet.');
    }

    throw err;
  }
}

/**
 * Traduit en parallèle vers ZH et EN
 * Utile quand on veut les 2 traductions en même temps depuis un même FR
 */
export async function traduireFrVersZhEn(texteFr: string): Promise<{ zh: string; en: string }> {
  if (!texteFr || !texteFr.trim()) {
    return { zh: '', en: '' };
  }

  const [zh, en] = await Promise.all([
    traduireTexte(texteFr, 'ZH'),
    traduireTexte(texteFr, 'EN'),
  ]);

  return { zh, en };
}
