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
