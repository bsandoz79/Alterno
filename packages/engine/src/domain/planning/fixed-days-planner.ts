import { WEEKDAY_LABELS, type Weekday } from '../rules/weekday';
import type { WorkRules } from '../rules/work-rules';
import { InvalidValueError } from '../shared/domain-error';
import { Duration } from '../time/duration';
import { PlanValidator } from '../validation/plan-validator';
import { WorkedTimeCalculator, type WorkedDayInput } from '../worked-time/worked-time-calculator';
import type { PaceStrategy } from './pace/pace-strategy';
import type { Plan } from './plan';
import { PlanGenerator } from './plan-generator';
import type { PlanningPreferences } from './planning-preferences';

/**
 * Plan dont certains jours ont des horaires choisis à la main (bloc étiré dans l'EDT ou la simulation).
 *
 * Ces jours gardent exactement leurs horaires, à la minute près ; leur temps travaillé est calculé
 * par les règles, puis le générateur répartit le reste de l'objectif sur les autres jours, au rythme choisi.
 */
export class FixedDaysPlanner {
  private readonly generator: PlanGenerator;
  private readonly validator: PlanValidator;
  private readonly workedTime: WorkedTimeCalculator;

  /**
   * @param rules - Règles horaires de l'entreprise
   * @param preferences - Préférences de l'utilisateur ; habitudes par défaut si absentes
   * @throws {InvalidValueError} Si une préférence sort des plages de l'entreprise
   */
  constructor(rules: WorkRules, preferences: PlanningPreferences = {}) {
    this.generator = new PlanGenerator(rules, preferences);
    this.validator = new PlanValidator(rules);
    this.workedTime = new WorkedTimeCalculator(rules);
  }

  /**
   * @param days - Jours de la période, dans l'ordre
   * @param target - Objectif d'heures sur la période
   * @param pace - Rythme pour répartir le reste
   * @param fixed - Horaires choisis, par position dans la période
   * @returns Le plan : jours choisis tels quels, autres jours répartis ; total égal à l'objectif
   * @throws {InvalidValueError} Si des horaires choisis enfreignent une règle ou sortent de la période
   * @throws {ImpossiblePlanError} Si les autres jours ne peuvent pas compléter l'objectif
   */
  plan(
    days: readonly Weekday[],
    target: Duration,
    pace: PaceStrategy,
    fixed: ReadonlyMap<number, WorkedDayInput>,
  ): Plan {
    const worked = this.fixedWorked(days, fixed);
    return withChosenTimes(this.generator.planForTotalHours(days, target, pace, worked), fixed);
  }

  /**
   * Comme `plan`, mais sans refuser un objectif hors d'atteinte : les autres jours vont alors
   * à leur minimum (ou maximum), et le total s'écarte de l'objectif. Sert à modifier la semaine,
   * où l'on peut faire plus ou moins que le plan : l'écart va au compteur, comme un écart déclaré.
   *
   * @param days - Jours de la période, dans l'ordre
   * @param target - Objectif d'heures visé
   * @param pace - Rythme pour répartir le reste
   * @param fixed - Horaires choisis, par position dans la période
   * @returns Le plan dont le total est le plus proche de l'objectif
   * @throws {InvalidValueError} Si des horaires choisis enfreignent une règle ou sortent de la période
   */
  closestPlan(
    days: readonly Weekday[],
    target: Duration,
    pace: PaceStrategy,
    fixed: ReadonlyMap<number, WorkedDayInput>,
  ): Plan {
    const worked = this.fixedWorked(days, fixed);
    const fixedTotal = [...worked.values()].reduce(
      (sum, value) => sum.plus(value),
      Duration.zero(),
    );
    const others = days.filter((_day, index) => !worked.has(index));
    const minimum = fixedTotal.plus(this.generator.minimumTotal(others));
    const maximum = fixedTotal.plus(this.generator.maximumTotal(others));
    const reachable = target.isGreaterThan(maximum)
      ? maximum
      : target.isLessThan(minimum)
        ? minimum
        : target;
    return withChosenTimes(this.generator.planForTotalHours(days, reachable, pace, worked), fixed);
  }

  /** Temps travaillé des jours choisis, après vérification de leurs horaires. */
  private fixedWorked(
    days: readonly Weekday[],
    fixed: ReadonlyMap<number, WorkedDayInput>,
  ): ReadonlyMap<number, Duration> {
    const worked = new Map<number, Duration>();
    fixed.forEach((times, index) => {
      const day = days[index];
      if (day === undefined) {
        throw new InvalidValueError(
          `La journée n°${String(index + 1)} n'existe pas dans la période (${String(days.length)} jours).`,
        );
      }
      const [violation] = this.validator.validate(day, times).violations;
      if (violation !== undefined) {
        throw new InvalidValueError(`Le ${WEEKDAY_LABELS[day]} : ${violation.message}`);
      }
      worked.set(index, this.workedTime.compute(day, times));
    });
    return worked;
  }
}

/** Le générateur a respecté le temps des jours choisis ; on remet leurs horaires exacts. */
function withChosenTimes(generated: Plan, fixed: ReadonlyMap<number, WorkedDayInput>): Plan {
  return {
    ...generated,
    days: generated.days.map((day, index) => {
      const times = fixed.get(index);
      return times === undefined ? day : { ...day, ...times };
    }),
  };
}
