import type { DocumentFiles } from '../annual-calendar-store';

/**
 * Fichiers « en mémoire » pour les tests : la copie renvoie une adresse dans un faux dossier de l'app.
 *
 * @returns Les fichiers simulés, avec la liste des fichiers présents pour vérifier les suppressions
 */
export function createMemoryDocumentFiles(): DocumentFiles & { readonly files: Set<string> } {
  const files = new Set<string>();
  return {
    files,
    copyIn: (_sourceUri, fileName) => {
      const uri = `file:///documents/${fileName}`;
      files.add(uri);
      return Promise.resolve(uri);
    },
    delete: (uri) => {
      files.delete(uri);
    },
  };
}
