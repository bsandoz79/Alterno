import type { DayPlan, TimeOfDay } from '@alterno/engine';

/** Minutes dans une heure, pour passer des heures pleines de la grille aux minutes des horaires. */
export const MINUTES_PER_HOUR = 60;

/** Début et fin d'un moment de la journée (présence ou repos). */
export interface Span {
  readonly start: TimeOfDay;
  readonly end: TimeOfDay;
}

/** Heures pleines de début et de fin de la grille. */
export interface GridHours {
  readonly start: number;
  readonly end: number;
}

/**
 * Bloc dessiné dans une colonne : travail, pause ou repos compensatoire,
 * positionné en fraction de la hauteur de la grille.
 */
export interface DayBlock {
  readonly kind: 'work' | 'lunch' | 'rest';
  readonly label: string;
  readonly top: number;
  readonly height: number;
}

/**
 * Blocs d'une journée : travail du matin, pause, travail de l'après-midi ;
 * un seul bloc de travail si la pause n'a pas été prise (départ avant, arrivée après).
 *
 * @param day - Journée planifiée
 * @param hours - Plage d'heures de la grille
 * @returns Les blocs, positionnés en fraction de la hauteur de la grille
 */
export function dayBlocks(day: DayPlan, hours: GridHours): readonly DayBlock[] {
  const block = (kind: DayBlock['kind'], from: TimeOfDay, to: TimeOfDay): DayBlock =>
    placedBlock(kind, '', { start: from, end: to }, hours);
  // Même règle que le calcul du temps travaillé : la pause n'est prise que si l'on est là avant et après.
  const lunchTaken =
    day.arrival.isBefore(day.lunchBreak.start) && day.departure.isAfter(day.lunchBreak.end);
  if (!lunchTaken) {
    return [block('work', day.arrival, day.departure)];
  }
  return [
    block('work', day.arrival, day.lunchBreak.start),
    block('lunch', day.lunchBreak.start, day.lunchBreak.end),
    block('work', day.lunchBreak.end, day.departure),
  ];
}

/**
 * Bloc positionné dans la grille, avec ses horaires précédés d'un éventuel intitulé.
 *
 * @param kind - Type de bloc
 * @param title - Intitulé placé avant les horaires (vide pour le travail et la pause)
 * @param span - Début et fin
 * @param hours - Plage d'heures de la grille
 * @returns Le bloc, en fraction de la hauteur de la grille
 */
export function placedBlock(
  kind: DayBlock['kind'],
  title: string,
  span: Span,
  hours: GridHours,
): DayBlock {
  const gridStart = hours.start * MINUTES_PER_HOUR;
  const gridLength = (hours.end - hours.start) * MINUTES_PER_HOUR;
  return {
    kind,
    label: `${title}${span.start.format()} – ${span.end.format()}`,
    top: (span.start.toMinutesSinceMidnight() - gridStart) / gridLength,
    height: span.start.durationUntil(span.end).toMinutes() / gridLength,
  };
}
