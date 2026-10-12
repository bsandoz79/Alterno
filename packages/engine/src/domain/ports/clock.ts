import type { CalendarDate } from '../calendar/calendar-date';

/**
 * Port de l'horloge. Le domaine ne lit jamais la date système directement :
 * l'app fournit l'horloge réelle, les tests une horloge fixe (n'importe quelle date).
 */
export interface Clock {
  /** @returns La date du jour */
  today(): CalendarDate;
}
