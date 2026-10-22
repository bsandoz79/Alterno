import type { CalendarDate } from '../calendar/calendar-date';
import { YearMonth } from '../calendar/year-month';
import { Duration } from '../time/duration';
import type { ArchivedDay } from './archived-day';

/** Totaux d'une période (un mois, ou tout le contrat). */
export interface HistoryTotals {
  readonly worked: Duration;
  readonly expected: Duration;
  /** Écart au temps attendu (ce que la période a apporté au compteur). */
  readonly balance: Duration;
  readonly workedDays: number;
  /** Récups prises, en journées (une demi-journée compte 0,5). */
  readonly recoveryDays: number;
  readonly schoolDays: number;
}

/** Résumé d'un mois. */
export interface MonthSummary extends HistoryTotals {
  readonly month: YearMonth;
  /** Écart cumulé depuis le début de l'historique, à la fin du mois (la courbe du compteur). */
  readonly balanceAtEnd: Duration;
  /** Journées du mois, dans l'ordre des dates. */
  readonly days: readonly ArchivedDay[];
}

/** Historique complet : chaque mois, et le total depuis le début du contrat. */
export interface HistorySummary {
  readonly months: readonly MonthSummary[];
  readonly total: HistoryTotals;
}

/**
 * Résume l'archive des journées : par mois (heures faites et attendues, écart, jours travaillés,
 * récups, école) et depuis le début du contrat, avec l'écart cumulé à la fin de chaque mois.
 *
 * L'écart cumulé vient uniquement de l'archive : il peut différer du compteur recalé sur Smart RH
 * (heures d'avant Alterno, corrections de la RH).
 *
 * @param days - Journées archivées
 * @param contractStart - Début du contrat (jours d'avant ignorés), ou `null` pour tout garder
 * @returns Les mois dans l'ordre chronologique, et le total
 */
export function summarizeHistory(
  days: readonly ArchivedDay[],
  contractStart: CalendarDate | null,
): HistorySummary {
  const kept = days
    .filter((day) => contractStart === null || !day.date.isBefore(contractStart))
    .sort((a, b) => (a.date.isBefore(b.date) ? -1 : 1));

  const months: MonthSummary[] = [];
  let cumulative = Duration.zero();
  for (const day of kept) {
    const month = YearMonth.containing(day.date);
    const last = months.at(-1);
    const monthDays = last?.month.equals(month) === true ? [...last.days, day] : [day];
    const totals = totalsOf(monthDays);
    cumulative = cumulative.plus(day.worked.minus(day.expected));
    const summary = { month, ...totals, balanceAtEnd: cumulative, days: monthDays };
    if (last?.month.equals(month) === true) {
      months[months.length - 1] = summary;
    } else {
      months.push(summary);
    }
  }
  return { months, total: totalsOf(kept) };
}

/** Totaux d'une liste de journées. */
function totalsOf(days: readonly ArchivedDay[]): HistoryTotals {
  const worked = days.reduce((sum, day) => sum.plus(day.worked), Duration.zero());
  const expected = days.reduce((sum, day) => sum.plus(day.expected), Duration.zero());
  const count = (kind: ArchivedDay['kind']): number =>
    days.filter((day) => day.kind === kind).length;
  return {
    worked,
    expected,
    balance: worked.minus(expected),
    workedDays: count('work'),
    // Une demi-journée de récup compte pour moitié.
    recoveryDays: count('recovery') + count('half-recovery') / 2,
    schoolDays: count('school'),
  };
}
