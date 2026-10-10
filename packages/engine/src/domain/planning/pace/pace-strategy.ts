import type { Duration } from '../../time/duration';
import type { Workload, WorkloadBounds } from './workload';

/**
 * Rythme de travail : façon de répartir un objectif d'heures entre les journées d'une période.
 *
 * Pattern Strategy : le générateur de plan reçoit un rythme sans savoir lequel. Ajouter un rythme
 * revient à écrire une nouvelle implémentation, sans modifier le générateur (principe ouvert/fermé).
 */
export interface PaceStrategy {
  /**
   * Répartit l'objectif entre les journées.
   *
   * @param target - Objectif total
   * @param items - Journées à remplir, avec leurs bornes (l'ordre est celui de la période et est conservé)
   * @returns Le temps attribué à chaque journée ; la somme vaut exactement l'objectif
   * @throws {ImpossiblePlanError} Si l'objectif est hors d'atteinte
   */
  distribute<T extends WorkloadBounds>(
    target: Duration,
    items: readonly T[],
  ): readonly Workload<T>[];
}
