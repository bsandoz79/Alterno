import type { TimeOfDay } from '../../time/time-of-day';

/** Jour du plan où l'arrivée prévue est plus tardive que l'arrivée habituelle. */
export interface LateArrival {
  /** Position du jour dans le plan. */
  readonly index: number;
  /** Arrivée prévue par le recalcul (ex. 8h50). */
  readonly planned: TimeOfDay;
  /** Arrivée habituelle de ce jour (ex. 8h20). */
  readonly preferred: TimeOfDay;
}
