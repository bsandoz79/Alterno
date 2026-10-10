import type { Weekday } from '../rules/weekday';
import type { WorkRules } from '../rules/work-rules';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { DayTimetableBuilder } from './day-timetable-builder';
import { distributeEvenly } from './distribute-evenly';
import type { Plan } from './plan';
import { DEFAULT_PLANNING_HABITS, type PlanningHabits } from './planning-habits';

/**
 * Génère un plan d'horaires sur une période pour atteindre un objectif d'heures.
 *
 * Orchestre deux étapes indépendantes : la répartition du temps entre les journées
 * (`distributeEvenly`), puis la traduction de chaque durée en horaires (`DayTimetableBuilder`).
 * Les règles et les habitudes sont injectées : le générateur ne connaît aucune valeur en dur.
 */
export class PlanGenerator {
  private readonly timetable: DayTimetableBuilder;

  /**
   * @param rules - Règles horaires de l'entreprise
   * @param habits - Habitudes de l'utilisateur ; arrivée 8h00 et pause 12h15–13h00 si absentes
   */
  constructor(
    private readonly rules: WorkRules,
    habits: PlanningHabits = DEFAULT_PLANNING_HABITS,
  ) {
    this.timetable = new DayTimetableBuilder(rules, habits);
  }

  /**
   * Plan qui atteint exactement `target` sur les jours donnés, réparti le plus également possible.
   *
   * @param days - Jours de la période, dans l'ordre (une semaine, deux semaines…)
   * @param target - Objectif d'heures sur la période (41h pour une semaine par exemple)
   * @returns Le plan, dont le total vaut `target`
   * @throws {InvalidValueError} Si la période est vide ou contient un jour non travaillé
   * @throws {ImpossiblePlanError} Si l'objectif est hors d'atteinte sur la période
   */
  planForTotalHours(days: readonly Weekday[], target: Duration): Plan {
    if (days.length === 0) {
      throw new InvalidValueError('La période doit contenir au moins un jour travaillé.');
    }
    const bounds = days.map((day) => ({
      day,
      minimum: this.rules.minimumWorkedTime(day),
      maximum: this.rules.maximumWorkedTime(day),
    }));

    const planned = distributeEvenly(target, bounds).map(({ item, worked }) =>
      this.timetable.build(item.day, worked),
    );
    return {
      days: planned,
      totalWorked: planned.reduce((sum, day) => sum.plus(day.worked), Duration.zero()),
    };
  }
}
