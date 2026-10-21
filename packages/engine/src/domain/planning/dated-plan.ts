import type { CalendarDate } from '../calendar/calendar-date';
import type { RecoveryKind } from '../counter/recovery-kind';
import type { Duration } from '../time/duration';
import type { TimeOfDay } from '../time/time-of-day';
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

/**
 * Où en est la demande de récup auprès de l'entreprise :
 * - `pending` : demande en cours (on demandera si elle a été acceptée) ;
 * - `approved` : acceptée ;
 * - `refused` : refusée.
 */
export type RecoveryApprovalStatus = 'pending' | 'approved' | 'refused';

/** Suivi de la demande de récup : son état, et quand elle a été faite (validation du plan). */
export interface RecoveryApproval {
  readonly status: RecoveryApprovalStatus;
  readonly requestedOn: CalendarDate;
  readonly requestedAt: TimeOfDay;
}

/** Moitié de journée prise en repos lors d'une demi-journée de récup. */
export type RecoveryPart = 'morning' | 'afternoon';

/** Récup posée à la fin d'un plan : sa date, son type et, pour une demi-journée, la moitié en repos. */
export interface PlannedRecovery {
  readonly date: CalendarDate;
  readonly kind: RecoveryKind;
  /** Moitié en repos (demi-journée seulement) ; absente : l'après-midi (plans validés avant ALT-56). */
  readonly part?: RecoveryPart;
  /** Suivi de la demande ; absent pour un plan validé avant ALT-55 (pas de suivi). */
  readonly approval?: RecoveryApproval;
}
