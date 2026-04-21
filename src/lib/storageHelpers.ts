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

// ═══════════════════════════════════════════════════════
// UPLOAD VIDÉOS MP4
// ═══════════════════════════════════════════════════════

/**
 * Upload d'une vidéo MP4 vers Firebase Storage
 * Path: products/{ref}/videos/{timestamp}_{name}.mp4
 */
export async function uploadVideoProduit(
  productRef: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!file.type.startsWith('video/')) {
    throw new Error('Le fichier doit être une vidéo (MP4, MOV, WebM)');
  }

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `products/${productRef}/videos/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);

  // Upload simple (progression non supportée sur Firebase JS v9 sans observer)
  await uploadBytes(storageRef, file);
  if (onProgress) onProgress(100);

  return await getDownloadURL(storageRef);
}

/**
 * Upload du thumbnail d'une vidéo (image extraite)
 */
export async function uploadVideoThumbnail(
  productRef: string,
  videoFileName: string,
  thumbnailBlob: Blob
): Promise<string> {
  const timestamp = Date.now();
  const path = `products/${productRef}/videos/thumbnails/thumb_${timestamp}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, thumbnailBlob);
  return await getDownloadURL(storageRef);
}

/**
 * Extrait un thumbnail à 1s d'une vidéo (côté client)
 * Retourne un Blob JPEG + la durée en secondes
 */
export async function extraireThumbnailVideo(file: File): Promise<{ thumbnailBlob: Blob; duree_sec: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      // Aller à 1 seconde (ou 10% de la durée si plus courte)
      video.currentTime = Math.min(1, video.duration * 0.1);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas non supporté'));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error('Impossible de créer le thumbnail'));
            return;
          }
          resolve({
            thumbnailBlob: blob,
            duree_sec: Math.round(video.duration),
          });
        }, 'image/jpeg', 0.8);
      } catch (err: any) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Impossible de charger la vidéo'));
    };
  });
}

// ═══════════════════════════════════════════════════════
// UPLOAD IMAGES GALERIE (avec compression)
// ═══════════════════════════════════════════════════════

/**
 * Upload d'une image de galerie produit
 * Path: products/{ref}/galerie/{timestamp}_{name}.jpg
 */
export async function uploadImageGalerie(
  productRef: string,
  file: File
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image (JPG, PNG, WebP)');
  }

  // Compression
  const compressedFile = await compresserImage(file);

  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.(png|webp|gif)$/i, '.jpg');
  const path = `products/${productRef}/galerie/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressedFile);
  return await getDownloadURL(storageRef);
}
