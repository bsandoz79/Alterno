import type { Weekday } from '../rules/weekday';
import type { WorkRules } from '../rules/work-rules';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import type { TimeOfDay } from '../time/time-of-day';
import { TimeSlot } from '../time/time-slot';

/** Horaires réels (ou prévus) d'une journée. */
export interface WorkedDayInput {
  /** Heure d'arrivée. */
  readonly arrival: TimeOfDay;
  /** Heure de départ. */
  readonly departure: TimeOfDay;
  /** Pause déjeuner prise. */
  readonly lunchBreak: TimeSlot;
}

/**
 * Calcule le temps de travail réellement comptabilisé sur une journée, selon les règles de l'entreprise.
 *
 * Service du domaine : il ne stocke rien, il applique les règles qu'on lui fournit à la construction
 * (inversion de dépendance : il ne connaît pas La Brosse et Dupont, seulement `WorkRules`).
 */
export class WorkedTimeCalculator {
  /**
   * @param rules - Règles horaires à appliquer
   */
  constructor(private readonly rules: WorkRules) {}

  /**
   * Temps travaillé comptabilisé pour une journée.
   *
   * Règles appliquées :
   * - seule la présence comprise entre l'arrivée au plus tôt et le départ au plus tard est comptée
   *   (rien avant 7h30 ni après 18h15, 17h30 le vendredi) ;
   * - la pause déjeuner est déduite selon `rules.lunchBreakPolicy` : par défaut, au moins la pause minimale.
   *
   * @param day - Jour de la semaine (détermine les plages applicables)
   * @param input - Arrivée, départ et pause de la journée
   * @returns Le temps travaillé comptabilisé, jamais négatif
   * @throws {InvalidValueError} Si le départ n'est pas après l'arrivée ou si le jour n'est pas travaillé
   */
  compute(day: Weekday, input: WorkedDayInput): Duration {
    if (!input.arrival.isBefore(input.departure)) {
      throw new InvalidValueError(
        `Le départ (${input.departure.format()}) doit être après l'arrivée (${input.arrival.format()}).`,
      );
    }
    const schedule = this.rules.scheduleFor(day);

    const presence = TimeSlot.between(input.arrival, input.departure);
    const countableDay = TimeSlot.between(schedule.earliestArrival, schedule.latestDeparture);
    const countedPresence = presence.overlapDuration(countableDay);

    const worked = countedPresence.minus(this.deductedBreak(presence, input.lunchBreak));
    // Une présence quasi entièrement hors des plages peut être plus courte que la pause : on plafonne à zéro.
    return worked.isNegative() ? Duration.zero() : worked;
  }

  /**
   * Durée de pause à retirer : la pause prise pendant la présence, portée au minimum si la règle l'impose.
   */
  private deductedBreak(presence: TimeSlot, lunchBreak: TimeSlot): Duration {
    const actualBreak = lunchBreak.overlapDuration(presence);
    const minimum = this.rules.minimumLunchBreak;
    if (this.rules.lunchBreakPolicy === 'minimum-enforced' && actualBreak.isLessThan(minimum)) {
      return minimum;
    }
    return actualBreak;
  }
}
