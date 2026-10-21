import type { CalendarDate } from '../domain/calendar/calendar-date';
import type { SchoolWeeks } from '../domain/calendar/school-weeks';
import type { DatedPlan } from '../domain/planning/dated-plan';
import { PlanCanceller } from '../domain/planning/plan-canceller';
import type { PlanningPreferences } from '../domain/planning/planning-preferences';
import type { Clock } from '../domain/ports/clock';
import type { PlanRepository } from '../domain/ports/plan-repository';
import type { WorkRules } from '../domain/rules/work-rules';

/**
 * Cas d'usage « Annuler le plan » : à partir d'aujourd'hui (ou du lendemain d'un écart qui rend
 * le plan irréalisable), les jours repassent en journées standard et la récup à venir est annulée.
 * Les semaines suivantes reprennent la semaine standard ; les rappels sont reprogrammés à l'enregistrement.
 */
export class CancelPlan {
  private readonly canceller: PlanCanceller;

  /**
   * @param plans - Dépôt du plan en cours
   * @param rules - Règles horaires
   * @param preferences - Préférences par jour
   * @param clock - Horloge (date du jour)
   */
  constructor(
    private readonly plans: PlanRepository,
    rules: WorkRules,
    preferences: PlanningPreferences,
    private readonly clock: Clock,
  ) {
    this.canceller = new PlanCanceller(rules, preferences);
  }

  /**
   * @param plan - Plan à annuler (le plan en cours, ou le plan recalculé après un écart)
   * @param schoolWeeks - Semaines d'école
   * @param from - Premier jour annulé ; aujourd'hui par défaut
   * @returns Le plan enregistré
   */
  async execute(
    plan: DatedPlan,
    schoolWeeks: SchoolWeeks,
    from: CalendarDate = this.clock.today(),
  ): Promise<DatedPlan> {
    const cancelled = this.canceller.cancelFrom(plan, from, schoolWeeks);
    await this.plans.saveCurrent(cancelled);
    return cancelled;
  }
}

/**
 * Cas d'usage « Annuler la récup » (refusée, ou plus nécessaire) : le jour de récup redevient travaillé,
 * les jours restants repassent en journées standard. L'avance déjà faite reste au compteur.
 */
export class CancelRecovery {
  private readonly canceller: PlanCanceller;

  /**
   * @param plans - Dépôt du plan en cours
   * @param rules - Règles horaires
   * @param preferences - Préférences par jour
   * @param clock - Horloge (date du jour)
   */
  constructor(
    private readonly plans: PlanRepository,
    rules: WorkRules,
    preferences: PlanningPreferences,
    private readonly clock: Clock,
  ) {
    this.canceller = new PlanCanceller(rules, preferences);
  }

  /**
   * @returns Le plan enregistré sans récup, ou `null` s'il n'y a pas de récup à annuler
   * @throws {InvalidValueError} Si la récup est déjà passée
   */
  async execute(): Promise<DatedPlan | null> {
    const plan = await this.plans.loadCurrent();
    if (plan?.recovery === undefined) {
      return null;
    }
    const cancelled = this.canceller.cancelRecovery(plan, this.clock.today());
    await this.plans.saveCurrent(cancelled);
    return cancelled;
  }
}
