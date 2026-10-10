import type { Duration } from '../../time/duration';
import { fillFromOneSide } from './fill-from-one-side';
import type { PaceStrategy } from './pace-strategy';
import type { Workload, WorkloadBounds } from './workload';

/**
 * Rythme au plus juste : 7h tant que possible, les heures en plus repoussées sur les derniers jours.
 * Si l'objectif est sous 7h par jour, c'est le début de période qui est allégé.
 */
export class LatePace implements PaceStrategy {
  /** @inheritdoc */
  distribute<T extends WorkloadBounds>(
    target: Duration,
    items: readonly T[],
  ): readonly Workload<T>[] {
    return fillFromOneSide(target, items, 'end');
  }
}
