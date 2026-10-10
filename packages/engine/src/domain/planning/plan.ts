import type { Weekday } from '../rules/weekday';
import type { Duration } from '../time/duration';
import type { WorkedDayInput } from '../worked-time/worked-time-calculator';

/**
 * Journée planifiée : les horaires proposés et le temps de travail qu'ils représentent.
 * Étend `WorkedDayInput` pour pouvoir être validée et recalculée par les mêmes services qu'une journée réelle.
 */
export interface DayPlan extends WorkedDayInput {
  /** Jour de la semaine. */
  readonly day: Weekday;
  /** Temps de travail prévu, déjà déduit de la pause. */
  readonly worked: Duration;
}

/** Plan sur une période : les journées dans l'ordre et leur total. */
export interface Plan {
  /** Journées planifiées, dans l'ordre de la période. */
  readonly days: readonly DayPlan[];
  /** Somme du temps travaillé prévu sur la période. */
  readonly totalWorked: Duration;
}
