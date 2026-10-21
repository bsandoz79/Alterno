import type { CalendarDate } from '../calendar/calendar-date';
import type { TimeOfDay } from '../time/time-of-day';
import type { DepartureReminder } from './departure-reminder-planner';

/** Question « Ta récup a-t-elle été acceptée ? » : le jour et l'heure où la poser, et la récup concernée. */
export interface RecoveryApprovalQuestion {
  readonly kind: 'recovery-approval';
  readonly date: CalendarDate;
  readonly at: TimeOfDay;
  readonly recoveryDate: CalendarDate;
}

/** Toute notification que l'app programme : rappels de départ, fin de semaine, suivi de la récup. */
export type ScheduledReminder = DepartureReminder | RecoveryApprovalQuestion;
