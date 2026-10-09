import { InvalidValueError } from '../shared/domain-error';
import { Duration } from './duration';
import type { TimeOfDay } from './time-of-day';

/**
 * Plage horaire dans une journée : début inclus, fin exclue.
 *
 * Sert à décrire les plages de l'entreprise (fixe 9h00–11h45, variable 7h30–9h00, pause…)
 * et les périodes réellement travaillées. La fin exclue permet d'enchaîner deux plages
 * (9h00–11h45 puis 11h45–13h45) sans qu'elles se chevauchent.
 */
export class TimeSlot {
  private constructor(
    /** Début de la plage (inclus). */
    readonly start: TimeOfDay,
    /** Fin de la plage (exclue). */
    readonly end: TimeOfDay,
  ) {}

  /**
   * Crée une plage, par exemple `TimeSlot.between(TimeOfDay.of(9, 0), TimeOfDay.of(11, 45))`.
   *
   * @param start - Début (inclus)
   * @param end - Fin (exclue), strictement après le début
   * @returns La plage correspondante
   * @throws {InvalidValueError} Si la fin n'est pas strictement après le début
   */
  static between(start: TimeOfDay, end: TimeOfDay): TimeSlot {
    if (!start.isBefore(end)) {
      throw new InvalidValueError(
        `Plage invalide : la fin (${end.format()}) doit être après le début (${start.format()}).`,
      );
    }
    return new TimeSlot(start, end);
  }

  /** @returns La durée de la plage */
  duration(): Duration {
    return this.start.durationUntil(this.end);
  }

  /** @returns `true` si `time` est dans la plage (début inclus, fin exclue) */
  contains(time: TimeOfDay): boolean {
    return !time.isBefore(this.start) && time.isBefore(this.end);
  }

  /** @returns `true` si les deux plages ont au moins une minute en commun */
  overlaps(other: TimeSlot): boolean {
    return this.start.isBefore(other.end) && other.start.isBefore(this.end);
  }

  /**
   * Durée commune aux deux plages, par exemple le temps travaillé pendant une plage fixe.
   *
   * @param other - Plage à comparer
   * @returns La durée du chevauchement, nulle si les plages ne se chevauchent pas
   */
  overlapDuration(other: TimeSlot): Duration {
    if (!this.overlaps(other)) {
      return Duration.zero();
    }
    const latestStart = this.start.isAfter(other.start) ? this.start : other.start;
    const earliestEnd = this.end.isBefore(other.end) ? this.end : other.end;
    return latestStart.durationUntil(earliestEnd);
  }

  /** @returns La plage lisible : « 9h00 – 11h45 » */
  format(): string {
    return `${this.start.format()} – ${this.end.format()}`;
  }
}
