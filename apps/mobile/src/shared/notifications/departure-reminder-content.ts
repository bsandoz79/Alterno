import type { DepartureReminder, Duration } from '@alterno/engine';

import { WEEK_CHECK_CATEGORY } from './week-check-category';

const MINUTES_PER_HOUR = 60;

/** Contenu d'une notification : son texte, l'écran à ouvrir quand on la touche, et ses boutons éventuels. */
export interface NotificationContent {
  readonly title: string;
  readonly body: string;
  readonly data: { readonly url: string };
  /** Catégorie déclarée au téléphone qui ajoute des boutons à la notification. */
  readonly categoryIdentifier?: string;
}

/**
 * Contenu d'une notification de départ, affiché dans la barre de notifications.
 * Toucher la question de l'heure de départ ouvre directement la saisie « Parti plus tard » ;
 * la question de fin de semaine propose « Oui » et « Corriger » (qui ouvre la semaine).
 *
 * @param reminder - Rappel calculé par le moteur
 * @returns Le titre, le message et l'écran à ouvrir
 */
export function departureReminderContent(reminder: DepartureReminder): NotificationContent {
  const departure = reminder.departure.format();
  if (reminder.kind === 'week-check') {
    return {
      title: 'Fin de semaine',
      body: 'Ta semaine s’est passée comme prévu ?',
      data: { url: '/semaine' },
      categoryIdentifier: WEEK_CHECK_CATEGORY,
    };
  }
  if (reminder.kind === 'at-departure') {
    return {
      title: 'C’est l’heure de partir',
      body: `Départ prévu à ${departure}. Tu pars plus tard ? Touche ici pour le signaler.`,
      data: { url: `/jour/${reminder.date.toIsoString()}?change=late-departure` },
    };
  }
  const remaining = spokenDuration(reminder.at.durationUntil(reminder.departure));
  return {
    title: 'Bientôt l’heure de partir',
    body: `Départ prévu à ${departure} (dans ${remaining}).`,
    data: { url: '/' },
  };
}

/**
 * Instant où déclencher le rappel, à l'heure locale du téléphone.
 *
 * @param reminder - Rappel calculé par le moteur
 * @returns La date et l'heure du rappel
 */
export function departureReminderTime(reminder: DepartureReminder): Date {
  const { date, at } = reminder;
  return new Date(date.year, date.month - 1, date.day, at.hours, at.minutes);
}

/** Durée telle qu'on la dit : « 15 min » sous une heure, « 1h30 » au-delà. */
function spokenDuration(duration: Duration): string {
  return duration.toMinutes() < MINUTES_PER_HOUR
    ? `${String(duration.toMinutes())} min`
    : duration.format();
}
