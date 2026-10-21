import type { CalendarDate } from '../calendar/calendar-date';
import type { WorkRules } from '../rules/work-rules';
import { Duration } from '../time/duration';
import type { DatedDay } from './dated-plan';
import { SteadyPace } from './pace/steady-pace';
import { PlanGenerator } from './plan-generator';
import type { PlanningPreferences } from './planning-preferences';

/**
 * Journées « standard » : le temps attendu chaque jour (7h), au rythme régulier, selon les préférences.
 * Partagé par la semaine standard (ALT-51) et l'annulation d'un plan ou d'une récup (ALT-54).
 */
export class StandardDayPlanner {
  private readonly generator: PlanGenerator;

  /**
   * @param rules - Règles horaires (temps attendu, horaires)
   * @param preferences - Préférences par jour ; habitudes par défaut si absentes
   */
  constructor(
    private readonly rules: WorkRules,
    preferences: PlanningPreferences = {},
  ) {
    this.generator = new PlanGenerator(rules, preferences);
  }

  /**
   * @param dates - Jours travaillés à planifier, dans l'ordre
   * @returns Une journée standard par date (aucune si la liste est vide)
   * @throws {InvalidValueError} Si une date tombe un jour non travaillé
   */
  daysFor(dates: readonly CalendarDate[]): readonly DatedDay[] {
    if (dates.length === 0) {
      return [];
    }
    const target = dates.reduce((sum) => sum.plus(this.rules.expectedDailyWork), Duration.zero());
    const plan = this.generator.planForTotalHours(
      dates.map((date) => date.weekday()),
      target,
      new SteadyPace(),
    );
    return dates.flatMap((date, index) => {
      const day = plan.days[index];
      /* v8 ignore next -- le générateur renvoie exactement une journée par jour demandé, dans l'ordre */
      return day === undefined ? [] : [{ date, plan: day }];
    });
  }
}

/**
 * @param days - Journées
 * @returns Leur temps travaillé total
 */
export function totalWorkedOf(days: readonly DatedDay[]): Duration {
  return days.reduce((sum, day) => sum.plus(day.plan.worked), Duration.zero());
}
