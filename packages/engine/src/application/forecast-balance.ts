import { BalanceForecaster, type BalanceForecast } from '../domain/planning/balance-forecaster';
import type { Clock } from '../domain/ports/clock';
import type { CounterRepository } from '../domain/ports/counter-repository';
import type { PlanRepository } from '../domain/ports/plan-repository';
import type { WorkRules } from '../domain/rules/work-rules';

/**
 * Cas d'usage « Voir mon solde à venir » : charge le compteur et le plan en cours,
 * puis prévoit le solde une fois le plan suivi et la récup posée.
 *
 * Dépôts et horloge sont injectés (ports) : testable à n'importe quelle date, sans stockage réel.
 */
export class ForecastBalance {
  private readonly forecaster: BalanceForecaster;

  /**
   * @param rules - Règles horaires (temps attendu, valeur des récups)
   * @param counters - Dépôt du compteur
   * @param plans - Dépôt du plan en cours
   * @param clock - Horloge (date du jour)
   */
  constructor(
    rules: WorkRules,
    private readonly counters: CounterRepository,
    private readonly plans: PlanRepository,
    private readonly clock: Clock,
  ) {
    this.forecaster = new BalanceForecaster(rules);
  }

  /**
   * @returns Le solde prévu, ou `null` sans plan en cours ou si le plan est terminé
   */
  async execute(): Promise<BalanceForecast | null> {
    const [counter, plan] = await Promise.all([this.counters.load(), this.plans.loadCurrent()]);
    return plan === null ? null : this.forecaster.forecast(counter, plan, this.clock.today());
  }
}
