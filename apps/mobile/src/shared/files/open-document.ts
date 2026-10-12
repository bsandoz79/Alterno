import { File } from 'expo-file-system';
import { startActivityAsync } from 'expo-intent-launcher';

import type { AttachedCalendar } from '@/shared/storage/annual-calendar-store';

/** Action Android « afficher ce contenu » : le système propose le lecteur PDF ou la galerie. */
const ACTION_VIEW = 'android.intent.action.VIEW';
/** `Intent.FLAG_GRANT_READ_URI_PERMISSION` : autorise l'app choisie à lire notre fichier. */
const FLAG_GRANT_READ_URI_PERMISSION = 1;

/**
 * Ouvre le fichier joint dans l'app adaptée du téléphone (lecteur PDF, galerie).
 * Android interdit de partager une adresse `file://` : on passe par l'adresse `content://` du fichier.
 * La version web est dans `open-document.web.ts`.
 *
 * @param document - Calendrier joint
 */
export async function openDocument(document: AttachedCalendar): Promise<void> {
  await startActivityAsync(ACTION_VIEW, {
    data: new File(document.uri).contentUri,
    type: document.mimeType,
    flags: FLAG_GRANT_READ_URI_PERMISSION,
  });
}
