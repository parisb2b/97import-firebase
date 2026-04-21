// api/translate.ts
// Vercel Serverless Function — Proxy DeepL
// Déployé automatiquement sur : https://ton-domaine.vercel.app/api/translate

// IMPORTANT : La clé API DeepL doit être configurée dans les variables
// d'environnement Vercel sous le nom DEEPL_API_KEY (sans préfixe VITE_)

export const config = {
  runtime: 'edge', // Plus rapide et moins cher que nodejs
};

interface TranslateRequest {
  text: string;
  target_lang: 'ZH' | 'EN';
  source_lang?: 'FR';
}

interface DeeplResponse {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
}

export default async function handler(request: Request): Promise<Response> {
  // === CORS — Autoriser les appels depuis ton domaine ===
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Pre-flight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Seules les requêtes POST sont acceptées
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée. Utilisez POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // === Lecture du body ===
    const body: TranslateRequest = await request.json();
    const { text, target_lang, source_lang = 'FR' } = body;

    // Validation
    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: 'Le champ "text" est vide.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!target_lang || !['ZH', 'EN'].includes(target_lang)) {
      return new Response(
        JSON.stringify({ error: 'target_lang doit être "ZH" ou "EN".' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // === Récupération de la clé API depuis les env vars ===
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'DEEPL_API_KEY non configurée côté serveur. Ajoutez-la dans les variables d\'environnement Vercel.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // === Détection endpoint selon le type de clé ===
    // Les clés qui se terminent par ":fx" sont des clés gratuites (DeepL Free)
    // Les autres sont des clés Pro
    const isFreeKey = apiKey.endsWith(':fx');
    const deeplUrl = isFreeKey
      ? 'https://api-free.deepl.com/v2/translate'
      : 'https://api.deepl.com/v2/translate';

    // === Appel à DeepL ===
    const deeplResponse = await fetch(deeplUrl, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        text: text,
        source_lang: source_lang,
        target_lang: target_lang,
      }).toString(),
    });

    // Gestion erreurs DeepL
    if (!deeplResponse.ok) {
      const errorText = await deeplResponse.text();
      console.error(`DeepL API error ${deeplResponse.status}:`, errorText);

      let userMessage = `Erreur DeepL (${deeplResponse.status})`;
      if (deeplResponse.status === 403) {
        userMessage = 'Clé API DeepL invalide ou expirée.';
      } else if (deeplResponse.status === 429) {
        userMessage = 'Quota DeepL atteint. Attendez quelques minutes.';
      } else if (deeplResponse.status === 456) {
        userMessage = 'Quota mensuel DeepL dépassé (500k chars en plan gratuit).';
      }

      return new Response(
        JSON.stringify({ error: userMessage }),
        {
          status: deeplResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // === Retour de la traduction ===
    const data: DeeplResponse = await deeplResponse.json();
    const translatedText = data.translations?.[0]?.text || '';

    return new Response(
      JSON.stringify({
        text: translatedText,
        target_lang,
        source_lang,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (err: any) {
    console.error('Erreur serverless /api/translate:', err);
    return new Response(
      JSON.stringify({
        error: 'Erreur serveur : ' + (err.message || 'inconnue')
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
