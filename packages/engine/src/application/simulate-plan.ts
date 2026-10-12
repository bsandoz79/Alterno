import type { CalendarDate } from '../domain/calendar/calendar-date';
import type { HoursCounter } from '../domain/counter/hours-counter';
import type { RecoveryKind } from '../domain/counter/recovery-kind';
import { FastPace } from '../domain/planning/pace/fast-pace';
import { LatePace } from '../domain/planning/pace/late-pace';
import type { PaceStrategy } from '../domain/planning/pace/pace-strategy';
import { SteadyPace } from '../domain/planning/pace/steady-pace';
import type { DayPlan, Plan } from '../domain/planning/plan';
import { PlanGenerator } from '../domain/planning/plan-generator';
import type { PlanningPreferences } from '../domain/planning/planning-preferences';
import { RecoveryPlanner } from '../domain/planning/recovery-planner';
import type { WorkRules } from '../domain/rules/work-rules';
import { InvalidValueError } from '../domain/shared/domain-error';
import type { Duration } from '../domain/time/duration';

/** Nom d'un rythme, tel que choisi à l'écran. */
export type PaceName = 'fast' | 'steady' | 'late';

const PACES: Readonly<Record<PaceName, PaceStrategy>> = {
  fast: new FastPace(),
  steady: new SteadyPace(),
  late: new LatePace(),
};

/** Ce que l'utilisateur veut atteindre : un total d'heures, ou une récup à une date. */
export type SimulationObjective =
  | { readonly kind: 'hours'; readonly target: Duration }
  | { readonly kind: 'recovery'; readonly date: CalendarDate; readonly recovery: RecoveryKind };

/** Demande de simulation. */
export interface SimulationRequest {
  /** Jours travaillés de la période, dans l'ordre. */
  readonly days: readonly CalendarDate[];
  readonly objective: SimulationObjective;
  readonly pace: PaceName;
  /** Compteur actuel (utilisé pour une récup). */
  readonly counter: HoursCounter;
}

/** Journée simulée : sa date et ses horaires. */
export interface SimulatedDay {
  readonly date: CalendarDate;
  readonly plan: DayPlan;
}

/** Résultat d'une simulation. */
export interface Simulation {
  readonly days: readonly SimulatedDay[];
  readonly totalWorked: Duration;
}

/**
 * Cas d'usage « Simuler un plan » : traduit le choix de l'écran (période datée, objectif, rythme)
 * en appels aux services du domaine, et rattache chaque journée planifiée à sa date.
 */
export class SimulatePlan {
  private readonly generator: PlanGenerator;
  private readonly recoveryPlanner: RecoveryPlanner;

  /**
   * @param rules - Règles horaires (réglages de l'utilisateur ou preset)
   * @param preferences - Préférences par jour ; habitudes par défaut si absentes
   */
  constructor(rules: WorkRules, preferences: PlanningPreferences = {}) {
    this.generator = new PlanGenerator(rules, preferences);
    this.recoveryPlanner = new RecoveryPlanner(rules, preferences);
  }

  /**
   * Simule un plan.
   *
   * @param request - Période, objectif, rythme et compteur
   * @returns Les journées datées et leur total
   * @throws {InvalidValueError} Si la récup tombe le premier jour de la période (aucun jour pour la préparer)
   * @throws {ImpossiblePlanError} Si l'objectif est hors d'atteinte
   */
  execute(request: SimulationRequest): Simulation {
    const { objective, counter } = request;
    const pace = PACES[request.pace];

    // Pour une récup, seuls les jours qui la précèdent sont à planifier.
    const dates =
      objective.kind === 'hours'
        ? request.days
        : request.days.filter((date) => date.isBefore(objective.date));
    if (dates.length === 0) {
      throw new InvalidValueError(
        'La récup doit tomber après le premier jour de la période, pour avoir au moins un jour pour la préparer.',
      );
    }
    const weekdays = dates.map((date) => date.weekday());
    const plan: Plan =
      objective.kind === 'hours'
        ? this.generator.planForTotalHours(weekdays, objective.target, pace)
        : this.recoveryPlanner.planForRecovery(weekdays, counter, objective.recovery, pace);

    return {
      days: dates.flatMap((date, index) => {
        const dayPlan = plan.days[index];
        /* v8 ignore next -- le générateur renvoie exactement une journée par jour demandé, dans l'ordre */
        return dayPlan === undefined ? [] : [{ date, plan: dayPlan }];
      }),
      totalWorked: plan.totalWorked,
    };
  }

  /**
   * Heures à faire en plus avant une récup, pour l'afficher (« à faire avant : +4h45 »).
   *
   * @param counter - Compteur actuel
   * @param recovery - Journée ou demi-journée
   * @returns Le temps à rattraper, jamais négatif
   */
  hoursToCatchUp(counter: HoursCounter, recovery: RecoveryKind): Duration {
    return this.recoveryPlanner.hoursToCatchUp(counter, recovery);
  }
}
