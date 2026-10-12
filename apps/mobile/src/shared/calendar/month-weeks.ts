import type { CalendarDate, YearMonth } from '@alterno/engine';

/** Jours ouvrés affichés par semaine dans les calendriers de l'app (lundi → vendredi). */
export const WORKDAYS_SHOWN = 5;
const DAYS_PER_WEEK = 7;

/**
 * Lignes d'un calendrier mensuel sans week-end : le lundi de chaque semaine dont au moins
 * un jour ouvré tombe dans le mois. Partagé par la vue mois du planning et le marquage des semaines d'école.
 *
 * @param month - Mois à afficher
 * @returns Les lundis, du premier au dernier
 */
export function monthWeekMondays(month: YearMonth): readonly CalendarDate[] {
  const mondays: CalendarDate[] = [];
  const lastDay = month.lastDay();
  for (
    let monday = month.firstDay().startOfWeek();
    !lastDay.isBefore(monday);
    monday = monday.plusDays(DAYS_PER_WEEK)
  ) {
    const start = monday;
    const hasWorkdayInMonth = Array.from({ length: WORKDAYS_SHOWN }, (_, index) =>
      start.plusDays(index),
    ).some((date) => month.contains(date));
    if (hasWorkdayInMonth) {
      mondays.push(monday);
    }
  }
  return mondays;
}
