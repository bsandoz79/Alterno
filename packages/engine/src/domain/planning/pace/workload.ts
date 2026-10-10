import { Duration } from '../../time/duration';
import { ImpossiblePlanError } from '../impossible-plan-error';

/** Bornes du temps travaillé d'une journée, et le temps visé quand rien n'oblige à s'en écarter. */
export interface WorkloadBounds {
  /** Temps minimal (plages fixes seules). */
  readonly minimum: Duration;
  /** Temps maximal (amplitude complète moins la pause minimale). */
  readonly maximum: Duration;
  /** Temps attendu par jour (7h) : point de départ des rythmes rapide et au plus juste. */
  readonly expected: Duration;
}

/** Journée accompagnée du temps de travail qui lui est attribué. */
export interface Workload<T> {
  readonly item: T;
  readonly worked: Duration;
}

/**
 * Vérifie qu'un objectif est atteignable : ni sous la somme des minimums, ni au-dessus de celle des maximums.
 * Contrôle commun à tous les rythmes, pour qu'ils refusent les mêmes objectifs avec les mêmes messages.
 *
 * @param target - Objectif total
 * @param items - Journées de la période
 * @throws {ImpossiblePlanError} Si l'objectif est hors d'atteinte
 */
export function ensureReachable(target: Duration, items: readonly WorkloadBounds[]): void {
  const minimum = items.reduce((sum, item) => sum.plus(item.minimum), Duration.zero());
  const maximum = items.reduce((sum, item) => sum.plus(item.maximum), Duration.zero());
  if (target.isGreaterThan(maximum)) {
    throw ImpossiblePlanError.aboveMaximum(target, maximum);
  }
  if (target.isLessThan(minimum)) {
    throw ImpossiblePlanError.belowMinimum(target, minimum);
  }
}

/**
 * Ramène un nombre de minutes dans les bornes d'une journée.
 *
 * @param minutes - Valeur à borner
 * @param bounds - Bornes de la journée
 * @returns La valeur comprise entre le minimum et le maximum
 */
export function clampToBounds(minutes: number, bounds: WorkloadBounds): number {
  return Math.min(Math.max(minutes, bounds.minimum.toMinutes()), bounds.maximum.toMinutes());
}
