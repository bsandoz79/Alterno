import type { AttachedCalendar } from '@/shared/storage/annual-calendar-store';

/**
 * Ouvre le fichier joint dans un nouvel onglet (version web).
 * Les navigateurs bloquent l'ouverture directe d'une « data URL » : on la convertit en Blob,
 * dont l'adresse temporaire s'ouvre normalement.
 *
 * @param document - Calendrier joint (son `uri` est une data URL)
 */
export async function openDocument(document: AttachedCalendar): Promise<void> {
  const blob = await (await fetch(document.uri)).blob();
  window.open(URL.createObjectURL(blob), '_blank', 'noopener');
}
