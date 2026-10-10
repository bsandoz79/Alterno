import { WEEKDAY_LABELS } from '../../rules/weekday';
import type { WorkRules } from '../../rules/work-rules';
import { InvalidValueError } from '../../shared/domain-error';
import { Duration } from '../../time/duration';
import { PlanValidator } from '../../validation/plan-validator';
import {
  WorkedTimeCalculator,
  type WorkedDayInput,
} from '../../worked-time/worked-time-calculator';
import type { PaceStrategy } from '../pace/pace-strategy';
import { SteadyPace } from '../pace/steady-pace';
import type { DayPlan, Plan } from '../plan';
import { PlanGenerator } from '../plan-generator';
import type { PlanningPreferences } from '../planning-preferences';
import type { DeviationAlert } from './deviation-alert';
import type { DeviationOutcome } from './deviation-outcome';

/**
 * Recalcule un plan après la déclaration d'un écart sur une journée.
 *
 * Logique d'usage d'Alterno : le plan est considéré comme suivi, l'utilisateur ne déclare que ce qui a changé.
 * Les jours précédant l'écart restent donc tels que prévus ; les jours suivants sont recalculés
 * pour tenir l'objectif initial du plan, avec le rythme choisi.
 */
export class DeviationReplanner {
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
   * Applique un écart déclaré et recalcule la suite du plan.
   *
   * Si l'objectif ne peut plus être tenu, les jours restants sont mis au maximum (ou au minimum)
   * et une alerte indique l'écart : l'utilisateur garde un plan utilisable plutôt qu'une erreur.
   *
   * @param plan - Plan en cours ; son total est l'objectif à tenir
   * @param dayIndex - Position de la journée déclarée dans le plan (0 pour le premier jour)
   * @param actual - Horaires réels de la journée
   * @param pace - Rythme pour recalculer les jours restants ; régulier par défaut
   * @returns Le plan recalculé, l'écart du jour et les alertes
   * @throws {InvalidValueError} Si la journée n'existe pas dans le plan ou si le départ précède l'arrivée
   */
  replan(
    plan: Plan,
    dayIndex: number,
    actual: WorkedDayInput,
    pace: PaceStrategy = new SteadyPace(),
  ): DeviationOutcome {
    const planned = plan.days[dayIndex];
    if (planned === undefined) {
      throw new InvalidValueError(
        `La journée n°${String(dayIndex + 1)} n'existe pas dans le plan (${String(plan.days.length)} jours).`,
      );
    }
    const declared: DayPlan = {
      day: planned.day,
      arrival: actual.arrival,
      lunchBreak: actual.lunchBreak,
      departure: actual.departure,
      worked: this.workedTime.compute(planned.day, actual),
    };
    const gap = declared.worked.minus(planned.worked);

    const done = [...plan.days.slice(0, dayIndex), declared];
    const remainingDays = plan.days.slice(dayIndex + 1).map((day) => day.day);
    const wanted = plan.totalWorked.minus(totalOf(done));
    const minimum = this.generator.minimumTotal(remainingDays);
    const maximum = this.generator.maximumTotal(remainingDays);
    // L'objectif restant est ramené dans ce que les jours restants permettent ; l'excès devient une alerte.
    const reachable = wanted.isGreaterThan(maximum)
      ? maximum
      : wanted.isLessThan(minimum)
        ? minimum
        : wanted;
    const rest =
      remainingDays.length === 0
        ? []
        : this.generator.planForTotalHours(remainingDays, reachable, pace).days;
    const days = [...done, ...rest];

    const alerts: DeviationAlert[] = [];
    if (!gap.isZero()) {
      alerts.push({
        kind: 'day-gap',
        message: `${gap.format({ signed: true })} par rapport au plan le ${WEEKDAY_LABELS[planned.day]}.`,
      });
    }
    for (const violation of this.validator.validate(planned.day, actual).violations) {
      alerts.push({ kind: 'rule-violation', message: violation.message });
    }
    if (wanted.isGreaterThan(reachable)) {
      alerts.push({
        kind: 'target-out-of-reach',
        message: `Objectif hors d’atteinte : il manque ${wanted.minus(reachable).format()} sur la période.`,
      });
    }
    if (wanted.isLessThan(reachable)) {
      alerts.push({
        kind: 'target-exceeded',
        message: `Objectif dépassé : ${reachable.minus(wanted).format()} de plus sur la période, elles iront au compteur.`,
      });
    }

    return { plan: { days, totalWorked: totalOf(days) }, gap, alerts };
  }
}

/** Somme du temps travaillé d'une liste de journées. */
function totalOf(days: readonly DayPlan[]): Duration {
  return days.reduce((sum, day) => sum.plus(day.worked), Duration.zero());
}
