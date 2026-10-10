import { Duration } from '../../time/duration';
import { clampToBounds, ensureReachable, type Workload, type WorkloadBounds } from './workload';

/** Côté de la période qui reçoit les heures en plus. */
export type ExtraHoursSide = 'start' | 'end';

/**
 * Répartition « d'un côté » : chaque jour part du temps attendu (7h), puis l'écart à l'objectif
 * est absorbé jour après jour, en remplissant chaque journée jusqu'à sa borne avant de passer à la suivante.
 *
 * Les heures en plus vont du côté `extraSide` ; les heures en moins (objectif sous 7h par jour)
 * sont retirées du côté opposé. Ainsi le rythme rapide charge le début et allège la fin, et inversement.
 *
 * @param target - Objectif total
 * @param items - Journées de la période, dans l'ordre
 * @param extraSide - Côté qui reçoit les heures en plus
 * @returns Le temps attribué à chaque journée, dans l'ordre de la période
 * @throws {ImpossiblePlanError} Si l'objectif est hors d'atteinte
 */
export function fillFromOneSide<T extends WorkloadBounds>(
  target: Duration,
  items: readonly T[],
  extraSide: ExtraHoursSide,
): readonly Workload<T>[] {
  ensureReachable(target, items);
  const baseline = items.reduce(
    (sum, item) => sum + clampToBounds(item.expected.toMinutes(), item),
    0,
  );
  let remaining = target.toMinutes() - baseline;

  const addsHours = remaining >= 0;
  const fromEnd = addsHours === (extraSide === 'end');
  const ordered = fromEnd ? [...items].reverse() : [...items];

  const filled = ordered.map((item) => {
    const base = clampToBounds(item.expected.toMinutes(), item);
    // Marge de la journée dans le sens de l'écart : jusqu'au maximum si on ajoute, jusqu'au minimum si on retire.
    const step = addsHours
      ? Math.min(remaining, item.maximum.toMinutes() - base)
      : Math.max(remaining, item.minimum.toMinutes() - base);
    remaining -= step;
    return { item, worked: Duration.ofMinutes(base + step) };
  });
  return fromEnd ? filled.reverse() : filled;
}
