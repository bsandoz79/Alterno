import { InvalidValueError } from '../shared/domain-error';

const MINUTES_PER_HOUR = 60;

/** Options d'affichage d'une durée. */
export interface DurationFormatOptions {
  /** Affiche « + » devant une durée positive : utile pour un écart au compteur (« +2h15 »). */
  readonly signed?: boolean;
}

/**
 * Durée exprimée en minutes entières, éventuellement négative.
 *
 * Value object immuable : chaque opération renvoie une nouvelle instance.
 * La minute est l'unité la plus fine du système d'horaires (pointages et règles sont à la minute),
 * ce qui évite toute erreur d'arrondi liée aux nombres décimaux.
 * Une durée peut être négative, car le compteur d'heures peut être en déficit.
 */
export class Duration {
  private constructor(private readonly totalMinutes: number) {}

  /**
   * Crée une durée à partir d'un nombre de minutes.
   *
   * @param minutes - Nombre entier de minutes (négatif autorisé)
   * @returns La durée correspondante
   * @throws {InvalidValueError} Si la valeur n'est pas un entier fini
   */
  static ofMinutes(minutes: number): Duration {
    if (!Number.isInteger(minutes)) {
      throw new InvalidValueError(
        `Une durée doit être un nombre entier de minutes (reçu : ${String(minutes)}).`,
      );
    }
    return new Duration(minutes);
  }

  /**
   * Crée une durée à partir d'heures et de minutes, par exemple `Duration.ofHours(7, 45)` pour 7h45.
   *
   * @param hours - Nombre d'heures
   * @param minutes - Minutes supplémentaires (0 par défaut)
   * @returns La durée correspondante
   * @throws {InvalidValueError} Si le total n'est pas un entier de minutes
   */
  static ofHours(hours: number, minutes = 0): Duration {
    return Duration.ofMinutes(hours * MINUTES_PER_HOUR + minutes);
  }

  /** @returns Une durée nulle */
  static zero(): Duration {
    return new Duration(0);
  }

  /** @returns Le nombre total de minutes (négatif si la durée l'est) */
  toMinutes(): number {
    return this.totalMinutes;
  }

  /** @returns La somme des deux durées */
  plus(other: Duration): Duration {
    return new Duration(this.totalMinutes + other.totalMinutes);
  }

  /** @returns La différence des deux durées, éventuellement négative */
  minus(other: Duration): Duration {
    return new Duration(this.totalMinutes - other.totalMinutes);
  }

  /** @returns La durée opposée (+30 min → −30 min) */
  negate(): Duration {
    // « 0 - x » plutôt que « -x » : évite de produire -0 pour une durée nulle.
    return new Duration(0 - this.totalMinutes);
  }

  /** @returns La valeur absolue de la durée */
  abs(): Duration {
    return new Duration(Math.abs(this.totalMinutes));
  }

  /** @returns `true` si la durée est strictement négative */
  isNegative(): boolean {
    return this.totalMinutes < 0;
  }

  /** @returns `true` si la durée est nulle */
  isZero(): boolean {
    return this.totalMinutes === 0;
  }

  /** @returns `true` si cette durée est strictement plus longue que `other` */
  isGreaterThan(other: Duration): boolean {
    return this.totalMinutes > other.totalMinutes;
  }

  /** @returns `true` si cette durée est strictement plus courte que `other` */
  isLessThan(other: Duration): boolean {
    return this.totalMinutes < other.totalMinutes;
  }

  /** @returns `true` si les deux durées ont la même valeur */
  equals(other: Duration): boolean {
    return this.totalMinutes === other.totalMinutes;
  }

  /**
   * Formate la durée à la française : « 7h45 », « 7h », « 0h30 », « -1h10 ».
   *
   * @param options - `signed: true` ajoute « + » devant une durée positive
   * @returns La durée lisible
   */
  format({ signed = false }: DurationFormatOptions = {}): string {
    const sign = this.isNegative() ? '-' : signed && this.totalMinutes > 0 ? '+' : '';
    const absolute = Math.abs(this.totalMinutes);
    const hours = Math.floor(absolute / MINUTES_PER_HOUR);
    const minutes = absolute % MINUTES_PER_HOUR;
    const minutesPart = minutes === 0 ? '' : String(minutes).padStart(2, '0');
    return `${sign}${String(hours)}h${minutesPart}`;
  }
}
