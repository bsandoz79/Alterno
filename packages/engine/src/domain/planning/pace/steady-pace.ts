import { Duration } from '../../time/duration';
import type { PaceStrategy } from './pace-strategy';
import { clampToBounds, ensureReachable, type Workload, type WorkloadBounds } from './workload';

/**
 * Rythme régulier : le même effort chaque jour.
 *
 * Principe du « remplissage par niveau » : on cherche le niveau commun le plus haut tel que la somme
 * des journées (chacune ramenée dans ses bornes) ne dépasse pas l'objectif. Une journée plafonnée
 * (le vendredi à 9h15) reporte ainsi naturellement son reste sur les autres.
 * Les minutes restantes sont données une par une aux premières journées non plafonnées.
 */
export class SteadyPace implements PaceStrategy {
  /** @inheritdoc */
  distribute<T extends WorkloadBounds>(
    target: Duration,
    items: readonly T[],
  ): readonly Workload<T>[] {
    ensureReachable(target, items);
    const goal = target.toMinutes();
    const total = (level: number): number =>
      items.reduce((sum, item) => sum + clampToBounds(level, item), 0);

    // Recherche dichotomique du niveau : total() est croissant, et total(0) = somme des minimums ≤ objectif.
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
      const base = clampToBounds(level, item);
      const canTakeMore = remaining > 0 && base === level && level < item.maximum.toMinutes();
      if (canTakeMore) {
        remaining -= 1;
      }
      return { item, worked: Duration.ofMinutes(canTakeMore ? base + 1 : base) };
    });
  }
}
