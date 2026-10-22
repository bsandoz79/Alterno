import type { CalendarDate } from '../domain/calendar/calendar-date';
import type { DatedPlan } from '../domain/planning/dated-plan';
import type { ArrivalChoice } from '../domain/planning/deviation/arrival-choice';
import { ArrivalKeeper } from '../domain/planning/deviation/arrival-keeper';
import type { DeviationAlert } from '../domain/planning/deviation/deviation-alert';
import { DeviationReplanner } from '../domain/planning/deviation/deviation-replanner';
import type { Plan } from '../domain/planning/plan';
import type { PlanningPreferences } from '../domain/planning/planning-preferences';
import type { WorkRules } from '../domain/rules/work-rules';
import { InvalidValueError } from '../domain/shared/domain-error';
import type { Duration } from '../domain/time/duration';
import type { TimeOfDay } from '../domain/time/time-of-day';
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
  /**
   * Arrivée à garder sur les jours où le recalcul fait arriver plus tard que d'habitude ;
   * absente : le recalcul est gardé tel quel.
   */
  readonly arrival?: ArrivalChoice;
}

/** Jour où le recalcul fait arriver plus tard que d'habitude. */
export interface DatedLateArrival {
  readonly date: CalendarDate;
  /** Arrivée prévue par le recalcul (ex. 8h50). */
  readonly planned: TimeOfDay;
  /** Arrivée habituelle (ex. 8h20). */
  readonly preferred: TimeOfDay;
}

/** Résultat : le plan daté recalculé, l'écart du jour et les alertes à afficher. */
export interface DatedDeviationOutcome {
  readonly plan: DatedPlan;
  readonly gap: Duration;
  readonly alerts: readonly DeviationAlert[];
  /** Jours suivants où le recalcul repousse l'arrivée : l'écran propose de la garder. */
  readonly lateArrivals: readonly DatedLateArrival[];
}

/**
 * Cas d'usage « Modifier un jour et recalculer la suite » : traduit le jour choisi dans le calendrier
 * en position dans le plan, délègue le recalcul au domaine (`DeviationReplanner`) et rattache
 * de nouveau chaque journée à sa date.
 *
 * Si le recalcul repousse l'arrivée de certains jours, il les signale ; sur demande, il garde l'arrivée
 * habituelle ou une heure choisie sur ces jours (`ArrivalKeeper`), le surplus allant au compteur.
 *
 * Il ne fait que calculer : l'écran affiche l'aperçu, puis l'enregistrement passe par `ValidatePlan`.
 */
export class DeclareDeviation {
  private readonly replanner: DeviationReplanner;
  private readonly keeper: ArrivalKeeper;

  /**
   * @param rules - Règles horaires (réglages de l'utilisateur ou preset)
   * @param preferences - Préférences par jour ; habitudes par défaut si absentes
   */
  constructor(rules: WorkRules, preferences: PlanningPreferences = {}) {
    this.replanner = new DeviationReplanner(rules, preferences);
    this.keeper = new ArrivalKeeper(rules, preferences);
  }

  /**
   * Calcule le plan après modification d'un jour.
   *
   * @param request - Plan, jour modifié, horaires et rythme
   * @returns Le plan recalculé, l'écart du jour, les alertes et les arrivées repoussées
   * @throws {InvalidValueError} Si le jour n'est pas dans le plan, si les horaires sont incohérents
   *   ou si l'arrivée choisie sort de la plage d'arrivée
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
    // Les arrivées repoussées sont repérées sur le recalcul, pour rester proposées une fois le choix fait.
    const late = this.keeper.lateArrivals(outcome.plan, dayIndex + 1);
    const replanned =
      request.arrival === undefined
        ? outcome.plan
        : this.keeper.keep(
            outcome.plan,
            late.map(({ index }) => index),
            request.arrival,
          );

    return {
      // Le recalcul garde le même nombre de jours, dans le même ordre : chaque date retrouve sa journée.
      // Le reste du plan (la récup prévue) est conservé tel quel.
      plan: {
        ...plan,
        days: plan.days.flatMap((day, index) => {
          const dayPlan = replanned.days[index];
          /* v8 ignore next -- le recalcul renvoie exactement une journée par jour du plan */
          return dayPlan === undefined ? [] : [{ date: day.date, plan: dayPlan }];
        }),
        totalWorked: replanned.totalWorked,
      },
      gap: outcome.gap,
      alerts: outcome.alerts,
      lateArrivals: late.flatMap(({ index, planned, preferred }) => {
        const day = plan.days[index];
        /* v8 ignore next -- les positions viennent du recalcul, qui garde un jour par jour du plan */
        return day === undefined ? [] : [{ date: day.date, planned, preferred }];
      }),
    };
  }
}
