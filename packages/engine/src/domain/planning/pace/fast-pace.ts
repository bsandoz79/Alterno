import type { Duration } from '../../time/duration';
import { fillFromOneSide } from './fill-from-one-side';
import type { PaceStrategy } from './pace-strategy';
import type { Workload, WorkloadBounds } from './workload';

/**
 * Rythme rapide : les heures en plus le plus tôt possible (journées maximales en début de période),
 * pour être tranquille ensuite. Si l'objectif est sous 7h par jour, c'est la fin de période qui est allégée.
 */
export class FastPace implements PaceStrategy {
  /** @inheritdoc */
  distribute<T extends WorkloadBounds>(
    target: Duration,
    items: readonly T[],
  ): readonly Workload<T>[] {
    return fillFromOneSide(target, items, 'start');
  }
}
