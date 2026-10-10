import type { Weekday } from '../rules/weekday';
import type { TimeOfDay } from '../time/time-of-day';
import type { TimeSlot } from '../time/time-slot';
import type { PlanningHabits } from './planning-habits';

/** Préférences propres à un jour de la semaine ; chaque champ absent reprend l'habitude par défaut. */
export interface DayPreferences {
  /** Heure d'arrivée habituelle ce jour-là (ex. 8h30 le lundi). */
  readonly arrival?: TimeOfDay;
  /** Pause déjeuner habituelle ce jour-là (ex. 12h00–12h45 le vendredi). */
  readonly lunchBreak?: TimeSlot;
  /** Départ au plus tard ce jour-là (ex. 17h00 le mercredi) : plafonne la journée. */
  readonly latestDeparture?: TimeOfDay;
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
