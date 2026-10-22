import { CounterCalculator } from '../counter/counter-calculator';
import type { WorkRules } from '../rules/work-rules';
import { Duration } from '../time/duration';
import type { DatedPlan } from './dated-plan';

/**
 * Effet d'un plan sur le compteur d'heures, pour avertir avant de valider un plan qui le fait baisser.
 *
 * Seules les journées travaillées comptent : chacune ajoute son écart aux 7h attendues.
 * Une récup prévue n'est pas comptée : c'est un retrait choisi, affiché à part.
 */
export class PlanCounterEffect {
  private readonly counter: CounterCalculator;

  /**
   * @param rules - Règles horaires (temps attendu par jour)
   */
  constructor(private readonly rules: WorkRules) {
    this.counter = new CounterCalculator(rules);
  }

  /**
   * @param plan - Plan simulé ou validé
   * @returns L'écart signé que ses journées apportent au compteur (−1h05 pour 33h55 sur 5 jours)
   */
  of(plan: DatedPlan): Duration {
    return plan.days.reduce(
      (sum, day) => sum.plus(this.counter.dayBalance(day.plan.worked)),
      Duration.zero(),
    );
  }

  /**
   * Objectif qui laisse le compteur inchangé : le temps attendu chaque jour.
   *
   * @param dayCount - Nombre de jours travaillés de la période
   * @returns 7h par jour (35h sur 5 jours)
   */
  targetWithoutLoss(dayCount: number): Duration {
    return Duration.ofMinutes(this.rules.expectedDailyWork.toMinutes() * dayCount);
  }
}
