import type { DayProgress } from '@alterno/engine';

/** Texte du bandeau : une phrase courte en gras, et un détail. */
export interface TimeLeftText {
  readonly headline: string;
  readonly detail: string;
}

/**
 * Texte du bandeau « temps restant » de l'accueil, selon l'avancement de la journée.
 *
 * @param progress - Avancement calculé par le moteur
 * @returns La phrase principale et son détail
 */
export function timeLeftText(progress: DayProgress): TimeLeftText {
  switch (progress.kind) {
    case 'before-start':
      return {
        headline: `Tu commences à ${progress.arrival.format()}`,
        detail: `${progress.remaining.format()} à faire aujourd’hui`,
      };
    case 'working':
      return {
        headline: `Encore ${progress.remaining.format()}`,
        detail: `Départ prévu à ${progress.departure.format()}`,
      };
    case 'lunch':
      return {
        headline: `Pause jusqu’à ${progress.lunchEnd.format()}`,
        detail: `Encore ${progress.remaining.format()} ensuite · départ à ${progress.departure.format()}`,
      };
    case 'overtime':
      return {
        headline: progress.beyond.isZero()
          ? 'C’est l’heure de partir'
          : `+${progress.beyond.format()} au-delà du départ`,
        detail: `Départ prévu à ${progress.departure.format()}`,
      };
    case 'day-over':
      return {
        headline: 'Journée terminée',
        detail: `Départ prévu à ${progress.departure.format()}`,
      };
  }
}
