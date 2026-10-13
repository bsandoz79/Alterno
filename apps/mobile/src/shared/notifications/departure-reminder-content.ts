import type { DepartureReminder, Duration } from '@alterno/engine';

const MINUTES_PER_HOUR = 60;

/** Texte d'une notification. */
export interface NotificationText {
  readonly title: string;
  readonly body: string;
}

/**
 * Texte du rappel de départ, affiché dans la barre de notifications.
 *
 * @param reminder - Rappel calculé par le moteur
 * @returns Le titre et le message
 */
export function departureReminderContent(reminder: DepartureReminder): NotificationText {
  const remaining = spokenDuration(reminder.at.durationUntil(reminder.departure));
  return {
    title: 'Bientôt l’heure de partir',
    body: `Départ prévu à ${reminder.departure.format()} (dans ${remaining}).`,
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
