// src/lib/storageHelpers.ts
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export async function uploadImageProduit(
  productRef: string,
  file: File
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `products/${productRef}/images/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function uploadPdfPublic(
  productRef: string,
  file: File
): Promise<{ url: string; taille_mo: number }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `products/${productRef}/documents/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return {
    url,
    taille_mo: parseFloat((file.size / 1024 / 1024).toFixed(2)),
  };
}

/**
 * Upload certificat CE (privé, pas affiché site)
 */
export async function uploadCertificatCe(
  productRef: string,
  file: File
): Promise<string> {
  const timestamp = Date.now();
  const path = `products/${productRef}/certifications/CE_${timestamp}.pdf`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

export async function supprimerFichierStorage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.error('Erreur suppression:', err);
  }
}

/**
 * Compresse une image côté client avant upload
 * Max 1920px largeur, qualité JPEG 80%
 */
export async function compresserImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      // Redimensionnement si nécessaire
      const MAX_WIDTH = 1920;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width;
        width = MAX_WIDTH;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossible de créer le contexte canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Échec de la compression'));
          return;
        }
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      }, 'image/jpeg', 0.8);
    };

    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    reader.onerror = () => reject(new Error('Impossible de lire le fichier'));

    reader.readAsDataURL(file);
  });
}

/**
 * Upload de l'image principale d'un produit (avec compression auto)
 * Path: products/{ref}/principale/main_{timestamp}.jpg
 */
export async function uploadImagePrincipale(
  productRef: string,
  file: File
): Promise<string> {
  // Vérification type
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image (JPG, PNG, WebP)');
  }

  // Compression
  const compressedFile = await compresserImage(file);

  // Upload
  const timestamp = Date.now();
  const path = `products/${productRef}/principale/main_${timestamp}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressedFile);
  return await getDownloadURL(storageRef);
}
