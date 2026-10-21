import type { DatedPlan } from '../domain/planning/dated-plan';
import type { Clock } from '../domain/ports/clock';
import type { PlanRepository } from '../domain/ports/plan-repository';

/**
 * Cas d'usage « Valider un scénario » : la simulation choisie devient le plan en cours,
 * celui que l'app affiche et suit. Un seul plan à la fois en V1 : il remplace le précédent.
 * Une récup nouvellement posée part en « demande en cours », datée de maintenant :
 * c'est le point de départ des questions « Ta récup a-t-elle été acceptée ? ».
 *
 * Le dépôt est injecté (port) : en production SQLite ou le navigateur, en test un dépôt en mémoire.
 */
export class ValidatePlan {
  /**
   * @param plans - Dépôt du plan en cours
   * @param clock - Horloge (moment de la demande de récup)
   */
  constructor(
    private readonly plans: PlanRepository,
    private readonly clock: Clock,
  ) {}

  /**
   * Enregistre le plan choisi comme plan en cours.
   *
   * @param plan - Simulation retenue par l'utilisateur
   */
  async execute(plan: DatedPlan): Promise<void> {
    const { recovery } = plan;
    // Réenregistrer le plan (écart déclaré) garde le suivi existant et la réponse déjà donnée.
    const requested =
      recovery === undefined || recovery.approval !== undefined
        ? plan
        : {
            ...plan,
            recovery: {
              ...recovery,
              approval: {
                status: 'pending' as const,
                requestedOn: this.clock.today(),
                requestedAt: this.clock.currentTime(),
              },
            },
          };
    await this.plans.saveCurrent(requested);
  }
}
