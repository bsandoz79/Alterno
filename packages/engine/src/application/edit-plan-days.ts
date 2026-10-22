import type { CalendarDate } from '../domain/calendar/calendar-date';
import type { DatedPlan } from '../domain/planning/dated-plan';
import { FixedDaysPlanner } from '../domain/planning/fixed-days-planner';
import { SteadyPace } from '../domain/planning/pace/steady-pace';
import type { PlanningPreferences } from '../domain/planning/planning-preferences';
import type { WorkRules } from '../domain/rules/work-rules';
import { InvalidValueError } from '../domain/shared/domain-error';
import { Duration } from '../domain/time/duration';
import type { WorkedDayInput } from '../domain/worked-time/worked-time-calculator';
import type { FixedDay } from './simulate-plan';

/** Demande : le plan en cours, la date du jour et les jours étirés. */
export interface PlanDaysEdit {
  readonly plan: DatedPlan;
  readonly today: CalendarDate;
  /** Jours aux horaires choisis (aujourd'hui ou après), verrouillés. */
  readonly fixedDays: readonly FixedDay[];
}

/**
 * Cas d'usage « Modifier la semaine » : des blocs étirés dans l'EDT deviennent des jours aux horaires
 * choisis, et le reste de l'objectif du plan est réparti sur les autres jours à venir (rythme régulier).
 * Les jours passés ne bougent pas : ils sont déjà faits.
 *
 * Il ne fait que calculer : l'écran affiche l'aperçu, puis l'enregistrement passe par `ValidatePlan`.
 */
export class EditPlanDays {
  private readonly planner: FixedDaysPlanner;

  /**
   * @param rules - Règles horaires (réglages de l'utilisateur ou preset)
   * @param preferences - Préférences par jour ; habitudes par défaut si absentes
   */
  constructor(rules: WorkRules, preferences: PlanningPreferences = {}) {
    this.planner = new FixedDaysPlanner(rules, preferences);
  }

  /**
   * @param edit - Plan, date du jour et jours étirés
   * @returns Le plan modifié ; même total que le plan reçu
   * @throws {InvalidValueError} Si un jour étiré est passé, hors du plan, ou enfreint une règle
   * @throws {ImpossiblePlanError} Si les autres jours à venir ne peuvent pas compléter l'objectif
   */
  execute({ plan, today, fixedDays }: PlanDaysEdit): DatedPlan {
    const past = plan.days.filter((day) => day.date.isBefore(today));
    const upcoming = plan.days.filter((day) => !day.date.isBefore(today));
    const fixed = new Map<number, WorkedDayInput>();
    fixedDays.forEach(({ date, ...times }) => {
      const index = upcoming.findIndex((day) => day.date.equals(date));
      if (index === -1) {
        throw new InvalidValueError(
          `Le ${date.toIsoString()} ne peut pas être modifié ici : seuls les jours à venir du plan le peuvent.`,
        );
      }
      fixed.set(index, times);
    });

    // L'objectif du plan est gardé : les jours passés sont faits, le reste se partage entre les jours à venir.
    const doneTotal = past.reduce((sum, day) => sum.plus(day.plan.worked), Duration.zero());
    const replanned = this.planner.plan(
      upcoming.map((day) => day.date.weekday()),
      plan.totalWorked.minus(doneTotal),
      new SteadyPace(),
      fixed,
    );
    const days = [
      ...past,
      ...upcoming.flatMap((day, index) => {
        const dayPlan = replanned.days[index];
        /* v8 ignore next -- le planificateur renvoie exactement une journée par jour demandé */
        return dayPlan === undefined ? [] : [{ date: day.date, plan: dayPlan }];
      }),
    ];
    // Modifié à la main, ce n'est plus la semaine standard : il sera enregistré comme un vrai plan.
    return { ...plan, days, totalWorked: doneTotal.plus(replanned.totalWorked), isDefault: false };
  }
}
