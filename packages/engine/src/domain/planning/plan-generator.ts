import { WEEKDAY_LABELS, type Weekday } from '../rules/weekday';
import type { WorkRules } from '../rules/work-rules';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { DayConstraints } from './day-constraints';
import { DayTimetableBuilder } from './day-timetable-builder';
import type { PaceStrategy } from './pace/pace-strategy';
import { SteadyPace } from './pace/steady-pace';
import type { Plan } from './plan';
import type { PlanningPreferences } from './planning-preferences';

/**
 * Génère un plan d'horaires sur une période pour atteindre un objectif d'heures.
 *
 * Orchestre deux étapes indépendantes : la répartition du temps entre les journées
 * (le rythme choisi, `PaceStrategy`), puis la traduction de chaque durée en horaires (`DayTimetableBuilder`).
 * Les règles et les préférences sont injectées : le générateur ne connaît aucune valeur en dur.
 */
export class PlanGenerator {
  private readonly constraints: DayConstraints;
  private readonly timetable: DayTimetableBuilder;

  /**
   * @param rules - Règles horaires de l'entreprise
   * @param preferences - Préférences de l'utilisateur ; habitudes par défaut si absentes
   * @throws {InvalidValueError} Si une préférence sort des plages de l'entreprise
   */
  constructor(rules: WorkRules, preferences: PlanningPreferences = {}) {
    this.constraints = DayConstraints.create(rules, preferences);
    this.timetable = new DayTimetableBuilder(rules, this.constraints);
  }

  /**
   * Total minimal imposé sur une période, préférences comprises (plages fixes, jours à 7h pile).
   *
   * @param days - Jours de la période
   * @returns La somme des journées minimales
   * @throws {InvalidValueError} Si un jour n'est pas travaillé
   */
  minimumTotal(days: readonly Weekday[]): Duration {
    return days.reduce(
      (sum, day) => sum.plus(this.constraints.boundsFor(day).minimum),
      Duration.zero(),
    );
  }

  /**
   * Total maximal atteignable sur une période, préférences comprises (départs au plus tard, jours à 7h pile).
   *
   * @param days - Jours de la période
   * @returns La somme des journées maximales
   * @throws {InvalidValueError} Si un jour n'est pas travaillé
   */
  maximumTotal(days: readonly Weekday[]): Duration {
    return days.reduce(
      (sum, day) => sum.plus(this.constraints.boundsFor(day).maximum),
      Duration.zero(),
    );
  }

  /**
   * Plan qui atteint exactement `target` sur les jours donnés, réparti selon le rythme choisi.
   *
   * @param days - Jours de la période, dans l'ordre (une semaine, deux semaines…)
   * @param target - Objectif d'heures sur la période (41h pour une semaine par exemple)
   * @param pace - Rythme de répartition ; régulier par défaut
   * @param fixed - Journées modifiées à la main (position dans la période → temps voulu) : elles gardent
   *   ce temps, et le rythme répartit le reste de l'objectif sur les autres jours
   * @returns Le plan, dont le total vaut `target`
   * @throws {InvalidValueError} Si la période est vide, contient un jour non travaillé,
   *   ou si une journée fixée est absente de la période ou sort des bornes de son jour
   * @throws {ImpossiblePlanError} Si l'objectif est hors d'atteinte sur la période
   */
  planForTotalHours(
    days: readonly Weekday[],
    target: Duration,
    pace: PaceStrategy = new SteadyPace(),
    fixed: ReadonlyMap<number, Duration> = new Map(),
  ): Plan {
    if (days.length === 0) {
      throw new InvalidValueError('La période doit contenir au moins un jour travaillé.');
    }
    fixed.forEach((_worked, index) => {
      if (days[index] === undefined) {
        throw new InvalidValueError(
          `La journée n°${String(index + 1)} n'existe pas dans la période (${String(days.length)} jours).`,
        );
      }
    });
    // Une journée fixée a pour minimum et maximum son temps voulu : le rythme ne peut plus la toucher,
    // et le contrôle d'atteignabilité dit ce qui manque sur les autres jours.
    const bounds = days.map((day, index) => {
      const dayBounds = this.constraints.boundsFor(day);
      const wanted = fixed.get(index);
      if (wanted === undefined) {
        return { day, ...dayBounds };
      }
      if (wanted.isLessThan(dayBounds.minimum) || wanted.isGreaterThan(dayBounds.maximum)) {
        throw new InvalidValueError(
          `Le ${WEEKDAY_LABELS[day]}, ${wanted.format()} n'est pas possible : la journée doit faire entre ${dayBounds.minimum.format()} et ${dayBounds.maximum.format()}.`,
        );
      }
      return { day, ...dayBounds, minimum: wanted, maximum: wanted };
    });

    const planned = pace
      .distribute(target, bounds)
      .map(({ item, worked }) => this.timetable.build(item.day, worked));
    return {
      days: planned,
      totalWorked: planned.reduce((sum, day) => sum.plus(day.worked), Duration.zero()),
    };
  }
}
