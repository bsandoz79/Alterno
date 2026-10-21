import type { RecoveryApproval } from '../domain/planning/dated-plan';
import type { PlanRepository } from '../domain/ports/plan-repository';

/** Réponse à « Ta récup a-t-elle été acceptée ? » : oui, non, ou pas encore de réponse de l'entreprise. */
export type RecoveryAnswer = 'approved' | 'refused' | 'not-yet';

/**
 * Cas d'usage « Répondre au suivi de la récup » : enregistre la réponse dans le plan.
 * Enregistrer le plan reprogramme les notifications : les relances s'arrêtent dès qu'on a répondu.
 * « Pas encore » ne change rien : la relance suivante est déjà programmée.
 */
export class AnswerRecoveryApproval {
  /**
   * @param plans - Dépôt du plan en cours
   */
  constructor(private readonly plans: PlanRepository) {}

  /**
   * @param answer - Réponse de l'utilisateur
   * @returns Le suivi de la récup après la réponse, ou `null` s'il n'y a pas de récup suivie
   */
  async execute(answer: RecoveryAnswer): Promise<RecoveryApproval | null> {
    const plan = await this.plans.loadCurrent();
    const recovery = plan?.recovery;
    const approval = recovery?.approval;
    if (plan === null || recovery === undefined || approval === undefined) {
      return null;
    }
    if (answer === 'not-yet') {
      return approval;
    }
    const answered: RecoveryApproval = { ...approval, status: answer };
    await this.plans.saveCurrent({ ...plan, recovery: { ...recovery, approval: answered } });
    return answered;
  }
}
