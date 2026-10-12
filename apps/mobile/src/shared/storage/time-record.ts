import { TimeOfDay } from '@alterno/engine';

const MINUTES_PER_HOUR = 60;

/**
 * Heure à partir de minutes depuis minuit : format de stockage commun à toutes les données enregistrées.
 *
 * @param minutesSinceMidnight - Minutes depuis minuit (ex. 480 pour 8h00)
 * @returns L'heure correspondante
 */
export function timeAt(minutesSinceMidnight: number): TimeOfDay {
  return TimeOfDay.of(
    Math.floor(minutesSinceMidnight / MINUTES_PER_HOUR),
    minutesSinceMidnight % MINUTES_PER_HOUR,
  );
}
