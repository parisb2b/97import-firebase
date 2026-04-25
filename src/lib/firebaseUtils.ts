// src/lib/firebaseUtils.ts
// Utilitaires défensifs pour les écritures Firestore.
//
// Firestore refuse les champs `undefined` (Unsupported field value).
// `sanitizeForFirestore()` retourne une copie profonde de l'objet sans aucun
// champ `undefined`, en préservant `null`, primitives et objets imbriqués.

export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((v) => sanitizeForFirestore(v)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}
