import type { DatedPlan } from '../domain/planning/dated-plan';
import type { PlanRepository } from '../domain/ports/plan-repository';
import type { ArchiveElapsedDays } from './archive-elapsed-days';

/**
 * Dépôt du plan qui archive les journées passées avant d'enregistrer un nouveau plan :
 * sans lui, valider une simulation effacerait les jours déjà faits de l'ancien plan.
 * Décorateur : les écrans qui enregistrent un plan n'ont rien à changer.
 */
export class ArchivingPlanRepository implements PlanRepository {
  /**
   * @param inner - Dépôt du plan décoré
   * @param archiveElapsedDays - Archivage à faire avant chaque enregistrement
   */
  constructor(
    private readonly inner: PlanRepository,
    private readonly archiveElapsedDays: ArchiveElapsedDays,
  ) {}

  /** @inheritdoc */
  loadCurrent(): Promise<DatedPlan | null> {
    return this.inner.loadCurrent();
  }

  /** @inheritdoc */
  async saveCurrent(plan: DatedPlan): Promise<void> {
    await this.archiveElapsedDays.execute();
    await this.inner.saveCurrent(plan);
  }
}
