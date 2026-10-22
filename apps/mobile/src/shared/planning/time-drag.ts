import { Duration, type DayPlan, type TimeOfDay, type WorkRules } from '@alterno/engine';

/** Plage dans laquelle une heure peut être glissée. */
export interface TimeRange {
  readonly earliest: TimeOfDay;
  readonly latest: TimeOfDay;
}

/** Plages de l'arrivée et du départ quand on étire un bloc. */
export interface StretchRanges {
  readonly arrival: TimeRange;
  readonly departure: TimeRange;
}

/**
 * Heure atteinte en glissant une extrémité de bloc : le déplacement est converti en minutes,
 * arrondi à la minute la plus proche, puis ramené dans la plage autorisée.
 *
 * @param origin - Heure au début du glissement
 * @param offset - Déplacement vertical en points (positif vers le bas, donc plus tard)
 * @param pixelsPerMinute - Échelle de la grille
 * @param range - Plage autorisée
 * @returns L'heure à afficher et à retenir
 */
export function draggedTime(
  origin: TimeOfDay,
  offset: number,
  pixelsPerMinute: number,
  range: TimeRange,
): TimeOfDay {
  const moved = origin.plus(Duration.ofMinutes(Math.round(offset / pixelsPerMinute)));
  if (moved.isBefore(range.earliest)) {
    return range.earliest;
  }
  return moved.isAfter(range.latest) ? range.latest : moved;
}

/**
 * Jusqu'où étirer le bloc d'une journée. Ce sont les plages de l'entreprise (lues dans les règles,
 * jamais en dur) : arrivée dans la plage variable du matin, départ entre la fin de la plage fixe
 * de l'après-midi et le départ au plus tard. Le moteur revérifie les horaires au calcul.
 *
 * @param rules - Règles horaires
 * @param day - Journée étirée
 * @returns Les plages de l'arrivée et du départ
 */
export function stretchRanges(rules: WorkRules, day: DayPlan): StretchRanges {
  const schedule = rules.scheduleFor(day.day);
  return {
    arrival: { earliest: schedule.earliestArrival, latest: schedule.latestArrival },
    departure: { earliest: schedule.earliestDeparture, latest: schedule.latestDeparture },
  };
}
