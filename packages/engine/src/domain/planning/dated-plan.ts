import type { CalendarDate } from '../calendar/calendar-date';
import type { Duration } from '../time/duration';
import type { DayPlan } from './plan';

/** Journée d'un plan rattachée à sa date du calendrier. */
export interface DatedDay {
  readonly date: CalendarDate;
  readonly plan: DayPlan;
}

/**
 * Plan daté : ce que l'utilisateur simule puis valide, et ce que l'app affiche jour par jour.
 * Le générateur raisonne en jours de la semaine ; les dates sont ajoutées par le cas d'usage.
 */
export interface DatedPlan {
  readonly days: readonly DatedDay[];
  readonly totalWorked: Duration;
}
