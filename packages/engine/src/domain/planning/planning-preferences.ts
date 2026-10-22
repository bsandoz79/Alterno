import type { Weekday } from '../rules/weekday';
import type { TimeOfDay } from '../time/time-of-day';
import type { TimeSlot } from '../time/time-slot';
import type { PlanningHabits } from './planning-habits';

/**
 * Bout de la journée qui bouge quand le plan ajoute ou retire des heures :
 * - `departure` : l'arrivée habituelle est gardée, on part plus tard (ou plus tôt) ;
 * - `arrival` : le départ habituel est gardé, on arrive plus tôt (ou plus tard).
 */
export type FlexibleEnd = 'departure' | 'arrival';

/** Préférences propres à un jour de la semaine ; chaque champ absent reprend l'habitude par défaut. */
export interface DayPreferences {
  /** Heure d'arrivée habituelle ce jour-là (ex. 8h30 le lundi). */
  readonly arrival?: TimeOfDay;
  /** Pause déjeuner habituelle ce jour-là (ex. 12h00–12h45 le vendredi). */
  readonly lunchBreak?: TimeSlot;
  /** Arrivée au plus tôt ce jour-là (ex. 8h20 le vendredi) : plafonne la journée. */
  readonly earliestArrival?: TimeOfDay;
  /** Départ au plus tard ce jour-là (ex. 17h00 le mercredi) : plafonne la journée. */
  readonly latestDeparture?: TimeOfDay;
  /** Bout de journée qui absorbe les heures en plus ou en moins ; `departure` si absent. */
  readonly flexibleEnd?: FlexibleEnd;
  /** Journée fixée au temps attendu (7h), quel que soit le rythme. */
  readonly exactlyExpected?: boolean;
}

/** Préférences de planification de l'utilisateur. */
export interface PlanningPreferences {
  /** Habitudes par défaut ; arrivée 8h00 et pause 12h15–13h00 si absentes. */
  readonly defaults?: PlanningHabits;
  /** Préférences par jour, prioritaires sur les habitudes par défaut. */
  readonly days?: Readonly<Partial<Record<Weekday, DayPreferences>>>;
}
