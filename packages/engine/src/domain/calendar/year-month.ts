import { InvalidValueError } from '../shared/domain-error';
import { CalendarDate } from './calendar-date';

const MONTHS_PER_YEAR = 12;

/**
 * Mois du calendrier (ex. octobre 2026), sans jour.
 *
 * Value object immuable, utile partout où l'on raisonne « par mois » (vue mois du calendrier,
 * plus tard le calendrier annuel d'alternance) sans manipuler un jour arbitraire du mois.
 */
export class YearMonth {
  private constructor(
    /** Année. */
    readonly year: number,
    /** Mois, de 1 (janvier) à 12. */
    readonly month: number,
  ) {}

  /**
   * Crée un mois, par exemple `YearMonth.of(2026, 10)` pour octobre 2026.
   *
   * @param year - Année
   * @param month - Mois, de 1 (janvier) à 12
   * @returns Le mois
   * @throws {InvalidValueError} Si l'année n'est pas entière ou si le mois n'est pas entre 1 et 12
   */
  static of(year: number, month: number): YearMonth {
    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > MONTHS_PER_YEAR
    ) {
      throw new InvalidValueError(`Mois inexistant : ${String(month)}/${String(year)}.`);
    }
    return new YearMonth(year, month);
  }

  /**
   * @param date - Date quelconque
   * @returns Le mois qui contient cette date
   */
  static containing(date: CalendarDate): YearMonth {
    return new YearMonth(date.year, date.month);
  }

  /**
   * @param months - Nombre de mois à ajouter (négatif pour reculer)
   * @returns Le mois décalé
   */
  plusMonths(months: number): YearMonth {
    // On compte en mois depuis l'an 0 : le passage d'une année à l'autre devient une simple division.
    const index = this.year * MONTHS_PER_YEAR + (this.month - 1) + months;
    return new YearMonth(Math.floor(index / MONTHS_PER_YEAR), (index % MONTHS_PER_YEAR) + 1);
  }

  /** @returns Le 1er du mois */
  firstDay(): CalendarDate {
    return CalendarDate.of(this.year, this.month, 1);
  }

  /** @returns Le dernier jour du mois (28, 29, 30 ou 31) */
  lastDay(): CalendarDate {
    return this.plusMonths(1).firstDay().plusDays(-1);
  }

  /** @returns `true` si la date tombe dans ce mois */
  contains(date: CalendarDate): boolean {
    return date.year === this.year && date.month === this.month;
  }

  /** @returns `true` si les deux mois sont identiques (même mois, même année) */
  equals(other: YearMonth): boolean {
    return this.year === other.year && this.month === other.month;
  }
}
