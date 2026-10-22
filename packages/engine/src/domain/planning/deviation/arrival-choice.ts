import type { TimeOfDay } from '../../time/time-of-day';

/**
 * Arrivée à garder sur les jours où le recalcul fait arriver plus tard que d'habitude :
 * - `preferred` : l'arrivée habituelle du jour (ex. 8h20) ;
 * - `chosen` : une heure saisie par l'utilisateur (ex. 8h30).
 */
export type ArrivalChoice =
  { readonly kind: 'preferred' } | { readonly kind: 'chosen'; readonly arrival: TimeOfDay };
