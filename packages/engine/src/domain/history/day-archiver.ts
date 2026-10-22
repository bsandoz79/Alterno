import type { CalendarDate } from '../calendar/calendar-date';
import type { SchoolWeeks } from '../calendar/school-weeks';
import { CounterCalculator } from '../counter/counter-calculator';
import type { DatedPlan } from '../planning/dated-plan';
import type { WorkRules } from '../rules/work-rules';
import { Duration } from '../time/duration';
import type { ArchivedDay } from './archived-day';

/**
 * Transforme les journées passées d'un plan en journées d'historique.
 *
 * Logique d'usage d'Alterno : le plan est considéré comme suivi. Une journée passée vaut donc ce que
 * le plan prévoyait (écarts déclarés compris). La récup vaut son temps de repos : 0h travaillées
 * pour une journée, 3h30 pour une demi-journée, sur 7h attendues. Une semaine d'école n'attend rien.
 */
export class DayArchiver {
  private readonly counter: CounterCalculator;

  /**
   * @param rules - Règles horaires (temps attendu, valeur des récups, jours travaillés)
   */
  constructor(private readonly rules: WorkRules) {
    this.counter = new CounterCalculator(rules);
  }

  /**
   * @param plan - Plan en cours (ou plan remplacé)
   * @param today - Date du jour : seuls les jours d'avant sont archivés
   * @param schoolWeeks - Semaines d'école marquées
   * @returns Les journées passées couvertes par le plan, dans l'ordre des dates
   */
  elapsedDays(
    plan: DatedPlan,
    today: CalendarDate,
    schoolWeeks: SchoolWeeks,
  ): readonly ArchivedDay[] {
    const expected = this.rules.expectedDailyWork;
    const archived: ArchivedDay[] = plan.days
      .filter((day) => day.date.isBefore(today))
      .map(({ date, plan: day }) => ({
        date,
        kind: 'work',
        worked: day.worked,
        expected,
        times: { arrival: day.arrival, lunchBreak: day.lunchBreak, departure: day.departure },
      }));

    const recovery = plan.recovery;
    if (recovery?.date.isBefore(today) === true) {
      // La récup est un temps attendu non travaillé : 7h − sa valeur (0h pour une journée, 3h30 pour une demie).
      archived.push({
        date: recovery.date,
        kind: recovery.kind === 'full' ? 'recovery' : 'half-recovery',
        worked: expected.minus(this.counter.recoveryValue(recovery.kind)),
        expected,
      });
    }

    archived.push(...this.schoolDays(plan, today, schoolWeeks, archived));
    return [...archived].sort((a, b) => (a.date.isBefore(b.date) ? -1 : 1));
  }

  /** Jours travaillés des semaines d'école, entre le début du plan et hier, sans journée déjà archivée. */
  private schoolDays(
    plan: DatedPlan,
    today: CalendarDate,
    schoolWeeks: SchoolWeeks,
    taken: readonly ArchivedDay[],
  ): readonly ArchivedDay[] {
    const first = plan.days[0]?.date;
    if (first === undefined) {
      return [];
    }
    const days: ArchivedDay[] = [];
    for (let date = first.startOfWeek(); date.isBefore(today); date = date.plusDays(1)) {
      const isFree = !taken.some((day) => day.date.equals(date));
      if (isFree && this.rules.isWorkingDay(date.weekday()) && schoolWeeks.contains(date)) {
        days.push({ date, kind: 'school', worked: Duration.zero(), expected: Duration.zero() });
      }
    }
    return days;
  }
}
