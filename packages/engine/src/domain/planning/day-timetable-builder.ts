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
 * Part des habitudes de l'utilisateur pour ce jour et ne s'en écarte que si les règles l'imposent.
 * Le bout de journée qui bouge dépend de la préférence du jour :
 * - partir plus tard (par défaut) : départ = arrivée habituelle + travail + pause, puis arrivée recalculée ;
 * - arriver plus tôt : arrivée = départ habituel − travail − pause, puis départ recalculé.
 * Chaque heure reste entre ses bornes (plages de l'entreprise et préférences « au plus tôt / au plus tard ») :
 * quand un bout est bloqué, l'autre prend le relais. Si la présence dépasse alors le besoin (journée courte),
 * l'excédent allonge la pause, qui reste dans la plage de déjeuner.
 */
export class DayTimetableBuilder {
  /**
   * @param rules - Règles horaires de l'entreprise
   * @param constraints - Contraintes du jour : habitudes, bornes et bout de journée qui bouge, préférences comprises
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
    const presence = worked.plus(this.constraints.lunchDurationFor(day));

    // On ne peut partir ni avant la fin de la plage fixe (16h00), ni après le départ au plus tard
    // (fin de la plage variable, 18h15, ou plus tôt si l'utilisateur l'a choisi pour ce jour).
    const placeDeparture = (wanted: TimeOfDay): TimeOfDay =>
      clamp(wanted, schedule.earliestDeparture, this.constraints.latestDepartureFor(day));
    // Ni arriver après le début de la plage fixe du matin (9h00), ni avant l'arrivée au plus tôt
    // (début de la plage variable, 7h30, ou plus tard si l'utilisateur l'a choisi pour ce jour).
    const placeArrival = (wanted: TimeOfDay): TimeOfDay =>
      clamp(wanted, this.constraints.earliestArrivalFor(day), schedule.latestArrival);

    let arrival: TimeOfDay;
    let departure: TimeOfDay;
    if (this.constraints.flexibleEndFor(day) === 'arrival') {
      arrival = placeArrival(this.constraints.habitualDepartureFor(day).plus(presence.negate()));
      departure = placeDeparture(arrival.plus(presence));
    } else {
      departure = placeDeparture(habits.arrival.plus(presence));
      arrival = placeArrival(departure.plus(presence.negate()));
    }

    // Bornes atteintes : la présence imposée s'écarte du travail visé, la pause absorbe la différence.
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
