import { Duration } from '../time/duration';
import { ImpossiblePlanError } from './impossible-plan-error';

/** Bornes du temps travaillé d'une journée. */
export interface WorkloadBounds {
  /** Temps minimal (plages fixes seules). */
  readonly minimum: Duration;
  /** Temps maximal (amplitude complète moins la pause minimale). */
  readonly maximum: Duration;
}

/** Journée accompagnée du temps de travail qui lui est attribué. */
export interface Workload<T> {
  readonly item: T;
  readonly worked: Duration;
}

/**
 * Répartit un objectif aussi également que possible entre des journées bornées.
 *
 * Principe du « remplissage par niveau » : on cherche le niveau commun le plus haut tel que la somme
 * des journées (chacune ramenée dans ses bornes) ne dépasse pas l'objectif. Une journée plafonnée
 * (le vendredi à 9h15) reporte ainsi naturellement son reste sur les autres.
 * Les minutes restantes après ce niveau sont données une par une aux premières journées non plafonnées.
 *
 * @param target - Objectif total
 * @param items - Journées à remplir, avec leurs bornes (l'ordre est conservé)
 * @returns Le temps attribué à chaque journée ; la somme vaut exactement l'objectif
 * @throws {ImpossiblePlanError} Si l'objectif est hors de [somme des minimums, somme des maximums]
 */
export function distributeEvenly<T extends WorkloadBounds>(
  target: Duration,
  items: readonly T[],
): readonly Workload<T>[] {
  const goal = target.toMinutes();
  const total = (level: number): number => items.reduce((sum, item) => sum + clamp(level, item), 0);

  const minimum = items.reduce((sum, item) => sum + item.minimum.toMinutes(), 0);
  const maximum = items.reduce((sum, item) => sum + item.maximum.toMinutes(), 0);
  if (goal > maximum) {
    throw ImpossiblePlanError.aboveMaximum(target, Duration.ofMinutes(maximum));
  }
  if (goal < minimum) {
    throw ImpossiblePlanError.belowMinimum(target, Duration.ofMinutes(minimum));
  }

  // Recherche dichotomique du niveau : total() est croissant, et total(0) = minimum ≤ objectif.
  let level = 0;
  let upper = Math.max(...items.map((item) => item.maximum.toMinutes()));
  while (level < upper) {
    const middle = Math.ceil((level + upper) / 2);
    if (total(middle) <= goal) {
      level = middle;
    } else {
      upper = middle - 1;
    }
  }

  // Moins d'une minute par journée non plafonnée reste à placer : on la donne aux premières de la période.
  let remaining = goal - total(level);
  return items.map((item) => {
    const base = clamp(level, item);
    const canTakeMore = remaining > 0 && base === level && level < item.maximum.toMinutes();
    if (canTakeMore) {
      remaining -= 1;
    }
    return { item, worked: Duration.ofMinutes(canTakeMore ? base + 1 : base) };
  });
}

/** Ramène un niveau (en minutes) dans les bornes d'une journée. */
function clamp(level: number, bounds: WorkloadBounds): number {
  return Math.min(Math.max(level, bounds.minimum.toMinutes()), bounds.maximum.toMinutes());
}
