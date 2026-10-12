import type { CalendarDate, SchoolWeeks, YearMonth } from '@alterno/engine';

import { WORKDAYS_SHOWN, monthWeekMondays } from '@/shared/calendar/month-weeks';

/** Jour d'une ligne : sa date, et s'il appartient au mois affiché. */
export interface SchoolMonthDay {
  readonly date: CalendarDate;
  readonly inMonth: boolean;
}

/** Ligne du calendrier de marquage : une semaine, marquée « école » ou non. */
export interface SchoolMonthRow {
  readonly monday: CalendarDate;
  readonly days: readonly SchoolMonthDay[];
  readonly school: boolean;
}

/**
 * Lignes du calendrier de marquage : on marque une semaine entière d'un seul appui
 * (rythme d'alternance par semaines), d'où une ligne par semaine plutôt qu'une case par jour.
 *
 * @param month - Mois affiché
 * @param schoolWeeks - Semaines déjà marquées
 * @returns Une ligne par semaine ouvrée du mois
 */
export function schoolMonthRows(
  month: YearMonth,
  schoolWeeks: SchoolWeeks,
): readonly SchoolMonthRow[] {
  return monthWeekMondays(month).map((monday) => ({
    monday,
    days: Array.from({ length: WORKDAYS_SHOWN }, (_, index) => {
      const date = monday.plusDays(index);
      return { date, inMonth: month.contains(date) };
    }),
    school: schoolWeeks.contains(monday),
  }));
}
