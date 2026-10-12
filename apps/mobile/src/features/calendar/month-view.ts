import {
  Duration,
  YearMonth,
  type CalendarDate,
  type DatedDay,
  type DatedPlan,
} from '@alterno/engine';

import { WORKDAYS_SHOWN, monthWeekMondays } from '@/shared/calendar/month-weeks';

/** Écart entre le lundi et le jeudi d'une même semaine. */
const MONDAY_TO_THURSDAY = 3;

/** Case de la vue mois : une date, et sa journée planifiée si elle existe. */
export interface MonthCell {
  readonly date: CalendarDate;
  /** `false` pour les jours du mois voisin qui complètent la première ou la dernière ligne. */
  readonly inMonth: boolean;
  readonly day: DatedDay | null;
}

/** Ligne de la vue mois : une semaine, du lundi au vendredi. */
export interface MonthRow {
  readonly monday: CalendarDate;
  readonly cells: readonly MonthCell[];
}

/** Mois affiché, découpé en semaines ouvrées. */
export interface MonthView {
  readonly month: YearMonth;
  readonly weeks: readonly MonthRow[];
  /** Temps travaillé prévu sur les jours du mois (hors jours des mois voisins). */
  readonly total: Duration;
}

/**
 * Découpe un mois en lignes du lundi au vendredi, comme un calendrier mural sans week-end.
 * Une semaine n'apparaît que si au moins un de ses jours ouvrés tombe dans le mois.
 *
 * @param plan - Plan en cours
 * @param month - Mois à afficher
 * @returns Le mois, ligne par ligne, avec son total
 */
export function buildMonth(plan: DatedPlan, month: YearMonth): MonthView {
  const weeks = monthWeekMondays(month).map((monday) => ({
    monday,
    cells: Array.from({ length: WORKDAYS_SHOWN }, (_, index) => {
      const date = monday.plusDays(index);
      return {
        date,
        inMonth: month.contains(date),
        day: plan.days.find((day) => day.date.equals(date)) ?? null,
      };
    }),
  }));
  const total = weeks
    .flatMap((week) => week.cells)
    .reduce(
      (sum, cell) => (cell.inMonth && cell.day !== null ? sum.plus(cell.day.plan.worked) : sum),
      Duration.zero(),
    );
  return { month, weeks, total };
}

/**
 * Mois auquel rattacher une semaine à cheval sur deux mois : celui de son jeudi.
 * C'est la règle des semaines ISO : le jeudi est le jour du milieu, donc le mois qui
 * contient le jeudi contient la majorité des jours ouvrés de la semaine.
 *
 * @param monday - Lundi de la semaine
 * @returns Le mois à ouvrir quand on passe de la vue semaine à la vue mois
 */
export function monthOfWeek(monday: CalendarDate): YearMonth {
  return YearMonth.containing(monday.startOfWeek().plusDays(MONDAY_TO_THURSDAY));
}
