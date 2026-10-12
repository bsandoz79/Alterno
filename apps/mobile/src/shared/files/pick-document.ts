import { getDocumentAsync } from 'expo-document-picker';

import type { PickedDocument } from '@/shared/storage/annual-calendar-store';

/**
 * Ouvre le sélecteur de fichiers du système (PDF ou image).
 * Sur le web, le contenu est lu tout de suite (`base64`) : le navigateur ne pourra plus relire
 * le fichier plus tard. Sur Android, il est copié dans le cache, puis dans l'app à l'enregistrement.
 *
 * @returns Le fichier choisi, ou `null` si l'utilisateur a annulé
 */
export async function pickDocument(): Promise<PickedDocument | null> {
  const result = await getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    base64: true,
  });
  const [asset] = result.assets ?? [];
  if (result.canceled || asset === undefined) {
    return null;
  }
  return {
    uri: asset.uri,
    name: asset.name,
    // Type ou taille inconnus : le fichier sera refusé par la vérification, avec un message clair.
    mimeType: asset.mimeType ?? 'application/octet-stream',
    size: asset.size ?? Number.POSITIVE_INFINITY,
    ...(asset.base64 === undefined ? {} : { dataUrl: asset.base64 }),
  };
}
