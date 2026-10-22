import type { CalendarDate } from '../calendar/calendar-date';
import type { Duration } from '../time/duration';
import type { WorkedDayInput } from '../worked-time/worked-time-calculator';

/**
 * Type d'un jour archivé :
 * - `work` : journée travaillée (plan suivi ou écart déclaré) ;
 * - `recovery` / `half-recovery` : journée ou demi-journée de récup ;
 * - `school` : jour d'école (ni travail ni attente d'heures).
 */
export type ArchivedDayKind = 'work' | 'recovery' | 'half-recovery' | 'school';

/** Journée passée, gardée pour l'historique même quand un nouveau plan remplace l'ancien. */
export interface ArchivedDay {
  readonly date: CalendarDate;
  readonly kind: ArchivedDayKind;
  /** Temps travaillé comptabilisé (0 pour une journée de récup ou d'école). */
  readonly worked: Duration;
  /** Temps attendu ce jour-là (7h travaillé ou en récup, 0 à l'école). */
  readonly expected: Duration;
  /** Horaires du jour, quand il a été travaillé (même en partie). */
  readonly times?: WorkedDayInput;
}
