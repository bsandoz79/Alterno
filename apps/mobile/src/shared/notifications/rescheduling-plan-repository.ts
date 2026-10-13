import type { DatedPlan, PlanRepository } from '@alterno/engine';

/**
 * Décorateur du dépôt du plan : après chaque enregistrement (plan validé, jour modifié),
 * les rappels de départ sont reprogrammés. Les écrans n'ont rien à y penser.
 */
export class ReschedulingPlanRepository implements PlanRepository {
  /**
   * @param inner - Dépôt réel du plan
   * @param reschedule - Reprogrammation des rappels, appelée après chaque enregistrement
   */
  constructor(
    private readonly inner: PlanRepository,
    private readonly reschedule: () => Promise<unknown>,
  ) {}

  /** @inheritdoc */
  loadCurrent(): Promise<DatedPlan | null> {
    return this.inner.loadCurrent();
  }

  /** @inheritdoc */
  async saveCurrent(plan: DatedPlan): Promise<void> {
    await this.inner.saveCurrent(plan);
    await this.reschedule();
  }
}
