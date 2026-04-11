const KEY = import.meta.env.VITE_DEEPL_KEY;
const URL = 'https://api-free.deepl.com/v2/translate';

export type DeepLLang = 'FR' | 'ZH' | 'EN-GB';

export const translateText = async (text: string, target: DeepLLang): Promise<string> => {
  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `DeepL-Auth-Key ${KEY}`,
    },
    body: JSON.stringify({ text: [text], target_lang: target }),
  });
  const data = await res.json();
  return data.translations[0].text;
};
