import { File, Paths } from 'expo-file-system';

import type { DocumentFiles } from '../annual-calendar-store';

/**
 * Fichiers de l'app sur Android, via `expo-file-system` : la copie va dans le dossier « documents »
 * de l'app, que le système ne vide pas (contrairement au cache où le sélecteur dépose le fichier).
 */
export const expoDocumentFiles: DocumentFiles = {
  copyIn: async (sourceUri, fileName) => {
    const destination = new File(Paths.document, fileName);
    await new File(sourceUri).copy(destination, { overwrite: true });
    return destination.uri;
  },
  delete: (uri) => {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  },
};
