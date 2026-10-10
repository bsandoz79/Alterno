import { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';

/**
 * Habitudes de l'utilisateur, point de départ de chaque journée planifiée.
 * Ce ne sont pas des règles de l'entreprise : le générateur s'en écarte quand les règles l'imposent
 * (départ avant la fin de la plage fixe, arrivée après son début…).
 */
export interface PlanningHabits {
  /** Heure d'arrivée habituelle. */
  readonly arrival: TimeOfDay;
  /** Pause déjeuner habituelle. */
  readonly lunchBreak: TimeSlot;
}

/** Habitudes par défaut : arrivée à 8h00, pause de 12h15 à 13h00. */
export const DEFAULT_PLANNING_HABITS: PlanningHabits = {
  arrival: TimeOfDay.of(8, 0),
  lunchBreak: TimeSlot.between(TimeOfDay.of(12, 15), TimeOfDay.of(13, 0)),
};
