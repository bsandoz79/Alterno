import type { CalendarDate } from '../calendar/calendar-date';
import type { RecoveryKind } from '../counter/recovery-kind';
import type { Duration } from '../time/duration';
import type { DayPlan } from './plan';

/** Journée d'un plan rattachée à sa date du calendrier. */
export interface DatedDay {
  readonly date: CalendarDate;
  readonly plan: DayPlan;
}

/**
 * Plan daté : ce que l'utilisateur simule puis valide, et ce que l'app affiche jour par jour.
 * Le générateur raisonne en jours de la semaine ; les dates sont ajoutées par le cas d'usage.
 */
export interface DatedPlan {
  readonly days: readonly DatedDay[];
  readonly totalWorked: Duration;
  /** Récup que le plan prépare ; absente pour un objectif d'heures (ou un plan validé avant ALT-44). */
  readonly recovery?: PlannedRecovery;
  /**
   * `true` pour la semaine standard proposée faute de plan validé (ALT-51) :
   * elle n'est pas enregistrée tant qu'on ne la valide pas ou qu'on n'y déclare pas un écart.
   */
  readonly isDefault?: boolean;
}

/** Récup posée à la fin d'un plan : sa date et son type. */
export interface PlannedRecovery {
  readonly date: CalendarDate;
  readonly kind: RecoveryKind;
}
