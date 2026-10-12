import type { DatedPlan } from '../domain/planning/dated-plan';
import type { PlanRepository } from '../domain/ports/plan-repository';

/**
 * Cas d'usage « Valider un scénario » : la simulation choisie devient le plan en cours,
 * celui que l'app affiche et suit. Un seul plan à la fois en V1 : il remplace le précédent.
 *
 * Le dépôt est injecté (port) : en production SQLite ou le navigateur, en test un dépôt en mémoire.
 */
export class ValidatePlan {
  /**
   * @param plans - Dépôt du plan en cours
   */
  constructor(private readonly plans: PlanRepository) {}

  /**
   * Enregistre le plan choisi comme plan en cours.
   *
   * @param plan - Simulation retenue par l'utilisateur
   */
  async execute(plan: DatedPlan): Promise<void> {
    await this.plans.saveCurrent(plan);
  }
}
