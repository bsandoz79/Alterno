import type { Weekday } from '../rules/weekday';
import type { WorkRules } from '../rules/work-rules';
import type { Duration } from '../time/duration';
import type { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';
import type { DayConstraints } from './day-constraints';
import type { DayPlan } from './plan';

/**
 * Transforme un temps de travail en horaires concrets (arrivée, pause, départ) pour un jour donné.
 *
 * Part des habitudes de l'utilisateur pour ce jour et ne s'en écarte que si les règles l'imposent :
 * 1. départ = arrivée habituelle + travail + pause, ramené entre la fin de la plage fixe
 *    et le départ au plus tard (règle ou préférence du jour) ;
 * 2. arrivée recalculée depuis ce départ, sans dépasser le début de la plage fixe du matin ;
 * 3. si la présence dépasse alors le besoin (journée courte), l'excédent allonge la pause,
 *    qui reste dans la plage de déjeuner.
 */
export class DayTimetableBuilder {
  /**
   * @param rules - Règles horaires de l'entreprise
   * @param constraints - Contraintes du jour : habitudes et départ au plus tard, préférences comprises
   */
  constructor(
    private readonly rules: WorkRules,
    private readonly constraints: DayConstraints,
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
    const habits = this.constraints.habitsFor(day);
    const habitualBreak = habits.lunchBreak.duration();
    const minimumBreak = this.rules.minimumLunchBreak;
    // Une pause habituelle plus courte que le minimum de l'entreprise (45 min) est allongée jusqu'à ce minimum.
    const breakDuration = habitualBreak.isLessThan(minimumBreak) ? minimumBreak : habitualBreak;
    const presence = worked.plus(breakDuration);

    // On ne peut partir ni avant la fin de la plage fixe (16h00), ni après le départ au plus tard
    // (fin de la plage variable, 18h15, ou plus tôt si l'utilisateur l'a choisi pour ce jour).
    const departure = clamp(
      habits.arrival.plus(presence),
      schedule.earliestDeparture,
      this.constraints.latestDepartureFor(day),
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
      habits.lunchBreak.start,
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
