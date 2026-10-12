import type { DatedPlan } from '../planning/dated-plan';

/**
 * Port de persistance du plan en cours (celui que l'utilisateur a validé et suit), avec ses dates.
 * Un seul plan à la fois en V1 : enregistrer un nouveau plan remplace le précédent.
 */
export interface PlanRepository {
  /**
   * @returns Le plan en cours, ou `null` si aucun plan n'a encore été validé
   */
  loadCurrent(): Promise<DatedPlan | null>;

  /**
   * Remplace entièrement le plan en cours.
   *
   * @param plan - Plan à enregistrer
   */
  saveCurrent(plan: DatedPlan): Promise<void>;
}
