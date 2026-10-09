import { InvalidValueError } from '../shared/domain-error';
import { Duration } from './duration';

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR;
const HH_MM_PATTERN = /^(\d{2}):(\d{2})$/;

/**
 * Heure de la journée (de 00h00 à 23h59), à la minute près.
 *
 * Value object immuable. Une journée de travail ne passe jamais minuit :
 * toute opération qui sortirait de la journée est donc refusée plutôt que « bouclée ».
 */
export class TimeOfDay {
  private constructor(private readonly minutesSinceMidnight: number) {}

  /**
   * Crée une heure, par exemple `TimeOfDay.of(7, 30)` pour 7h30.
   *
   * @param hours - Heure, entier de 0 à 23
   * @param minutes - Minutes, entier de 0 à 59
   * @returns L'heure correspondante
   * @throws {InvalidValueError} Si l'heure ou les minutes sont hors limites ou non entières
   */
  static of(hours: number, minutes: number): TimeOfDay {
    const validHours = Number.isInteger(hours) && hours >= 0 && hours < HOURS_PER_DAY;
    const validMinutes = Number.isInteger(minutes) && minutes >= 0 && minutes < MINUTES_PER_HOUR;
    if (!validHours || !validMinutes) {
      throw new InvalidValueError(
        `Heure invalide : ${String(hours)}:${String(minutes)} (attendu entre 00:00 et 23:59).`,
      );
    }
    return new TimeOfDay(hours * MINUTES_PER_HOUR + minutes);
  }

  /**
   * Lit une heure au format « HH:mm » (format des paramètres et du stockage), ex. « 07:30 ».
   *
   * @param value - Chaîne au format « HH:mm »
   * @returns L'heure correspondante
   * @throws {InvalidValueError} Si le format ou la valeur est invalide
   */
  static parse(value: string): TimeOfDay {
    const match = HH_MM_PATTERN.exec(value);
    if (match === null) {
      throw new InvalidValueError(`Format d'heure invalide : « ${value} » (attendu HH:mm).`);
    }
    return TimeOfDay.of(Number(match[1]), Number(match[2]));
  }

  /** Heure (0 à 23). */
  get hours(): number {
    return Math.floor(this.minutesSinceMidnight / MINUTES_PER_HOUR);
  }

  /** Minutes (0 à 59). */
  get minutes(): number {
    return this.minutesSinceMidnight % MINUTES_PER_HOUR;
  }

  /** @returns Le nombre de minutes écoulées depuis minuit */
  toMinutesSinceMidnight(): number {
    return this.minutesSinceMidnight;
  }

  /** @returns `true` si cette heure est strictement avant `other` */
  isBefore(other: TimeOfDay): boolean {
    return this.minutesSinceMidnight < other.minutesSinceMidnight;
  }

  /** @returns `true` si cette heure est strictement après `other` */
  isAfter(other: TimeOfDay): boolean {
    return this.minutesSinceMidnight > other.minutesSinceMidnight;
  }

  /** @returns `true` si les deux heures sont identiques */
  equals(other: TimeOfDay): boolean {
    return this.minutesSinceMidnight === other.minutesSinceMidnight;
  }

  /**
   * Durée entre cette heure et `other` (négative si `other` est plus tôt).
   *
   * @param other - Heure d'arrivée du calcul
   * @returns La durée de cette heure jusqu'à `other`
   */
  durationUntil(other: TimeOfDay): Duration {
    return Duration.ofMinutes(other.minutesSinceMidnight - this.minutesSinceMidnight);
  }

  /**
   * Ajoute une durée (négative possible) à cette heure.
   *
   * @param duration - Durée à ajouter
   * @returns La nouvelle heure
   * @throws {InvalidValueError} Si le résultat sort de la journée (avant 00h00 ou après 23h59)
   */
  plus(duration: Duration): TimeOfDay {
    const result = this.minutesSinceMidnight + duration.toMinutes();
    if (result < 0 || result >= MINUTES_PER_DAY) {
      throw new InvalidValueError(
        `${this.format()} + ${duration.format()} sort de la journée : une journée de travail ne passe pas minuit.`,
      );
    }
    return new TimeOfDay(result);
  }

  /** @returns L'heure lisible à la française : « 7h30 », « 17h05 » */
  format(): string {
    return `${String(this.hours)}h${String(this.minutes).padStart(2, '0')}`;
  }
}
