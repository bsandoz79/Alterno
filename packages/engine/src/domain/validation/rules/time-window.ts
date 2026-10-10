import type { TimeOfDay } from '../../time/time-of-day';
import type { TimeSlot } from '../../time/time-slot';

/**
 * Indique si une heure est dans une plage, bornes incluses.
 * Pour l'arrivée et le départ, les deux bornes sont autorisées (arriver à 9h00 pile est permis),
 * contrairement à `TimeSlot.contains` qui exclut la fin.
 *
 * @param time - Heure à tester
 * @param window - Plage autorisée
 * @returns `true` si `time` est entre le début et la fin, incluses
 */
export function isWithinInclusive(time: TimeOfDay, window: TimeSlot): boolean {
  return !time.isBefore(window.start) && !time.isAfter(window.end);
}
