import type { CalendarDate } from '../domain/calendar/calendar-date';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { DeviationAlert } from '../domain/planning/deviation/deviation-alert';
import { DeviationReplanner } from '../domain/planning/deviation/deviation-replanner';
import type { Plan } from '../domain/planning/plan';
import type { PlanningPreferences } from '../domain/planning/planning-preferences';
import type { WorkRules } from '../domain/rules/work-rules';
import { InvalidValueError } from '../domain/shared/domain-error';
import type { Duration } from '../domain/time/duration';
import type { WorkedDayInput } from '../domain/worked-time/worked-time-calculator';
import { paceStrategy, type PaceName } from './pace-name';

/** Demande de modification d'un jour du plan en cours. */
export interface DeviationRequest {
  /** Plan en cours ; son total est l'objectif à tenir. */
  readonly plan: DatedPlan;
  /** Jour modifié. */
  readonly date: CalendarDate;
  /** Horaires réels (ou nouvellement prévus) de ce jour. */
  readonly actual: WorkedDayInput;
  /** Rythme choisi à l'écran pour répartir le rattrapage sur les jours suivants. */
  readonly pace: PaceName;
}

/** Résultat : le plan daté recalculé, l'écart du jour et les alertes à afficher. */
export interface DatedDeviationOutcome {
  readonly plan: DatedPlan;
  readonly gap: Duration;
  readonly alerts: readonly DeviationAlert[];
}

/**
 * Cas d'usage « Modifier un jour et recalculer la suite » : traduit le jour choisi dans le calendrier
 * en position dans le plan, délègue le recalcul au domaine (`DeviationReplanner`) et rattache
 * de nouveau chaque journée à sa date.
 *
 * Il ne fait que calculer : l'écran affiche l'aperçu, puis l'enregistrement passe par `ValidatePlan`.
 */
export class DeclareDeviation {
  private readonly replanner: DeviationReplanner;

  /**
   * @param rules - Règles horaires (réglages de l'utilisateur ou preset)
   * @param preferences - Préférences par jour ; habitudes par défaut si absentes
   */
  constructor(rules: WorkRules, preferences: PlanningPreferences = {}) {
    this.replanner = new DeviationReplanner(rules, preferences);
  }

  /**
   * Calcule le plan après modification d'un jour.
   *
   * @param request - Plan, jour modifié, horaires et rythme
   * @returns Le plan recalculé, l'écart du jour et les alertes
   * @throws {InvalidValueError} Si le jour n'est pas dans le plan ou si les horaires sont incohérents
   */
  execute(request: DeviationRequest): DatedDeviationOutcome {
    const { plan, date } = request;
    const dayIndex = plan.days.findIndex((day) => day.date.equals(date));
    if (dayIndex === -1) {
      throw new InvalidValueError(`Le ${date.toIsoString()} ne fait pas partie du plan en cours.`);
    }
    const undated: Plan = { days: plan.days.map((day) => day.plan), totalWorked: plan.totalWorked };
    const outcome = this.replanner.replan(
      undated,
      dayIndex,
      request.actual,
      paceStrategy(request.pace),
    );

    return {
      // Le recalcul garde le même nombre de jours, dans le même ordre : chaque date retrouve sa journée.
      // Le reste du plan (la récup prévue) est conservé tel quel.
      plan: {
        ...plan,
        days: plan.days.flatMap((day, index) => {
          const dayPlan = outcome.plan.days[index];
          /* v8 ignore next -- le recalcul renvoie exactement une journée par jour du plan */
          return dayPlan === undefined ? [] : [{ date: day.date, plan: dayPlan }];
        }),
        totalWorked: outcome.plan.totalWorked,
      },
      gap: outcome.gap,
      alerts: outcome.alerts,
    };
  }
}
