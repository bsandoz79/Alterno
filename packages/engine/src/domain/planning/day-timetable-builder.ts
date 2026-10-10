import type { Weekday } from '../rules/weekday';
import type { WorkRules } from '../rules/work-rules';
import type { Duration } from '../time/duration';
import type { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import type { DayPlan } from './plan';
import type { PlanningHabits } from './planning-habits';

/**
 * Transforme un temps de travail en horaires concrets (arrivée, pause, départ) pour un jour donné.
 *
 * Part des habitudes de l'utilisateur et ne s'en écarte que si les règles l'imposent :
 * 1. départ = arrivée habituelle + travail + pause, ramené dans la plage variable du soir ;
 * 2. arrivée recalculée depuis ce départ, sans dépasser le début de la plage fixe du matin ;
 * 3. si la présence dépasse alors le besoin (journée courte), l'excédent allonge la pause,
 *    qui reste dans la plage de déjeuner.
 */
export class DayTimetableBuilder {
  /**
   * @param rules - Règles horaires de l'entreprise
   * @param habits - Habitudes de l'utilisateur (arrivée, pause)
   */
  constructor(
    private readonly rules: WorkRules,
    private readonly habits: PlanningHabits,
  ) {}

  /**
   * Horaires d'une journée pour un temps de travail donné.
   *
   * @param day - Jour travaillé
   * @param worked - Temps de travail visé, compris entre la journée minimale et maximale du jour
   * @returns La journée planifiée
   * @throws {InvalidValueError} Si le jour n'est pas travaillé
   */
  build(day: Weekday, worked: Duration): DayPlan {
    const schedule = this.rules.scheduleFor(day);
    const habitualBreak = this.habits.lunchBreak.duration();
    const minimumBreak = this.rules.minimumLunchBreak;
    // Une pause habituelle plus courte que le minimum de l'entreprise (45 min) est allongée jusqu'à ce minimum.
    const breakDuration = habitualBreak.isLessThan(minimumBreak) ? minimumBreak : habitualBreak;
    const presence = worked.plus(breakDuration);

    // On ne peut partir ni avant la fin de la plage fixe (16h00), ni après la fin de la plage variable (18h15).
    const departure = clamp(
      this.habits.arrival.plus(presence),
      schedule.earliestDeparture,
      schedule.latestDeparture,
    );
    // Ni arriver après le début de la plage fixe du matin (9h00).
    const idealArrival = departure.plus(presence.negate());
    const arrival = idealArrival.isAfter(schedule.latestArrival)
      ? schedule.latestArrival
      : idealArrival;

    // Arrivée plafonnée : la présence imposée dépasse le travail visé, la pause absorbe la différence.
    const lunchDuration = arrival.durationUntil(departure).minus(worked);
    const window = schedule.lunchWindow;
    const lunchStart = clamp(
      this.habits.lunchBreak.start,
      window.start,
      window.end.plus(lunchDuration.negate()),
    );

    return {
      day,
      arrival,
      departure,
      lunchBreak: TimeSlot.between(lunchStart, lunchStart.plus(lunchDuration)),
      worked,
    };
  }
}

/** Ramène une heure entre deux bornes incluses. */
function clamp(time: TimeOfDay, earliest: TimeOfDay, latest: TimeOfDay): TimeOfDay {
  if (time.isBefore(earliest)) {
    return earliest;
  }
  return time.isAfter(latest) ? latest : time;
}
