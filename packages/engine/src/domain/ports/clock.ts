import type { CalendarDate } from '../calendar/calendar-date';
import type { TimeOfDay } from '../time/time-of-day';

/**
 * Port de l'horloge. Le domaine ne lit jamais la date système directement :
 * l'app fournit l'horloge réelle, les tests une horloge fixe (n'importe quelle date).
 */
export interface Clock {
  /** @returns La date du jour */
  today(): CalendarDate;

  /** @returns L'heure actuelle, à la minute (pour ne programmer que des rappels à venir) */
  currentTime(): TimeOfDay;
}
