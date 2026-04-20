// src/lib/deeplService.ts

const DEEPL_API_KEY = '3fae7c40-bed9-48ee-88d9-26c5f719caf3:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

export type LangueCible = 'ZH' | 'EN';

export async function traduireTexte(
  texte: string,
  langueCible: LangueCible,
  langueSource: 'FR' = 'FR'
): Promise<string> {
  if (!texte || !texte.trim()) return '';
  try {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: texte,
        source_lang: langueSource,
        target_lang: langueCible,
      }),
    });
    if (!response.ok) throw new Error(`DeepL ${response.status}`);
    const data = await response.json();
    return data.translations?.[0]?.text || '';
  } catch (err: any) {
    console.error('DeepL error:', err);
    throw new Error('Erreur DeepL : ' + err.message);
  }
}
