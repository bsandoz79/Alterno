/**
 * Télécharge l'export (web) : un fichier JSON créé dans le navigateur, sans passer par un serveur.
 * Metro choisit ce fichier sur le web, `share-export.ts` sur Android.
 *
 * @param fileName - Nom du fichier téléchargé
 * @param json - Contenu de l'export
 */
export function shareExport(fileName: string, json: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return Promise.resolve();
}
