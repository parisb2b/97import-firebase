// src/lib/deeplTranslator.ts
// V87 — Placeholder Traduction DeepL produit (F6)
// Bloqué : nécessite une clé API DeepL (https://www.deepl.com/pro-api)
// En attendant : les traductions manuelles dans src/i18n/ couvrent fr/zh/en

export const DEEPL_TRANSLATOR_STATUS = {
  available: false,
  reason: 'DeepL API key required',
  fallback: 'src/i18n/ — traductions manuelles fr/zh/en',
  planned: 'Traduction automatique des fiches produit (nom, description, specs)',
} as const;

/** Placeholder — traduit un texte via DeepL (sera activé quand la clé API sera fournie) */
export async function translateProductField(
  text: string,
  targetLang: 'fr' | 'zh' | 'en',
): Promise<string> {
  console.warn(`[V87] translateProductField: DeepL non configuré — retour du texte original (${targetLang})`);
  return text; // Retourne le texte inchangé en attendant la clé API
}
