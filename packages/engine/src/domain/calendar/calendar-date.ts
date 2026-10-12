import { WEEKDAYS, type Weekday } from '../rules/weekday';
import { InvalidValueError } from '../shared/domain-error';

const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Date du calendrier (jour, mois, année), sans heure ni fuseau horaire.
 *
 * Value object immuable, stocké en nombre de jours depuis le 1er janvier 1970 : les calculs
 * (ajouter des jours, trouver le lundi) restent exacts, même lors des changements d'heure.
 */
export class CalendarDate {
  private constructor(private readonly epochDay: number) {}

  /**
   * Crée une date, par exemple `CalendarDate.of(2026, 10, 12)` pour le 12 octobre 2026.
   *
   * @param year - Année
   * @param month - Mois, de 1 (janvier) à 12
   * @param day - Jour du mois
   * @returns La date
   * @throws {InvalidValueError} Si la date n'existe pas (30 février, mois 13…)
   */
  static of(year: number, month: number, day: number): CalendarDate {
    const utc = new Date(Date.UTC(year, month - 1, day));
    // Date.UTC « corrige » les dates impossibles (30 février → 2 mars) : on vérifie qu'elle n'a rien changé.
    const exists =
      utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
    if (!exists) {
      throw new InvalidValueError(
        `Date inexistante : ${String(day)}/${String(month)}/${String(year)}.`,
      );
    }
    return new CalendarDate(utc.getTime() / MS_PER_DAY);
  }

  /**
   * Lit une date au format « AAAA-MM-JJ » (format de stockage), ex. « 2026-10-12 ».
   *
   * @param value - Date au format ISO
   * @returns La date
   * @throws {InvalidValueError} Si le format ou la date est invalide
   */
  static fromIsoString(value: string): CalendarDate {
    const match = ISO_DATE_PATTERN.exec(value);
    if (match === null) {
      throw new InvalidValueError(`Format de date invalide : « ${value} » (attendu AAAA-MM-JJ).`);
    }
    return CalendarDate.of(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  /** Année. */
  get year(): number {
    return this.toUtc().getUTCFullYear();
  }

  /** Mois, de 1 à 12. */
  get month(): number {
    return this.toUtc().getUTCMonth() + 1;
  }

  /** Jour du mois. */
  get day(): number {
    return this.toUtc().getUTCDate();
  }

  /** @returns Le jour de la semaine de cette date */
  weekday(): Weekday {
    // getUTCDay compte à partir du dimanche (0) ; WEEKDAYS commence le lundi.
    const index = (this.toUtc().getUTCDay() + DAYS_PER_WEEK - 1) % DAYS_PER_WEEK;
    /* v8 ignore next -- l'index est toujours entre 0 et 6 ; le repli satisfait le typage strict */
    return WEEKDAYS[index] ?? 'monday';
  }

  /**
   * @param days - Nombre de jours à ajouter (négatif pour reculer)
   * @returns La date décalée
   */
  plusDays(days: number): CalendarDate {
    return new CalendarDate(this.epochDay + days);
  }

  /** @returns Le lundi de la semaine de cette date (elle-même si c'est un lundi) */
  startOfWeek(): CalendarDate {
    return this.plusDays(-WEEKDAYS.indexOf(this.weekday()));
  }

  /** @returns `true` si cette date est strictement avant `other` */
  isBefore(other: CalendarDate): boolean {
    return this.epochDay < other.epochDay;
  }

  /** @returns `true` si les deux dates sont le même jour */
  equals(other: CalendarDate): boolean {
    return this.epochDay === other.epochDay;
  }

  /** @returns La date au format « AAAA-MM-JJ » */
  toIsoString(): string {
    return this.toUtc().toISOString().slice(0, 10);
  }

  private toUtc(): Date {
    return new Date(this.epochDay * MS_PER_DAY);
  }
}
