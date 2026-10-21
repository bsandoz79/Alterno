import { Share } from 'react-native';

/**
 * Partage l'export (Android) : la feuille de partage du téléphone permet de l'enregistrer
 * dans Fichiers, de l'envoyer par e-mail… Le partage intégré à React Native suffit : aucune
 * dépendance native en plus (donc pas de nouvel APK).
 *
 * @param fileName - Nom proposé pour le fichier
 * @param json - Contenu de l'export
 */
export async function shareExport(fileName: string, json: string): Promise<void> {
  await Share.share({ title: fileName, message: json });
}
