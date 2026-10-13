import type { CalendarDate } from '../calendar/calendar-date';
import type { DatedPlan } from '../planning/dated-plan';
import type { TimeOfDay } from '../time/time-of-day';
import type { ReminderSettings } from './reminder-settings';

/** Rappel à programmer : le jour, l'heure du rappel et l'heure de départ qu'il annonce. */
export interface DepartureReminder {
  readonly date: CalendarDate;
  readonly at: TimeOfDay;
  readonly departure: TimeOfDay;
}

/** Instant présent, découpé comme le reste du moteur : la date et l'heure. */
export interface Moment {
  readonly today: CalendarDate;
  readonly now: TimeOfDay;
}

/**
 * Calcule les rappels « bientôt l'heure de partir » du plan en cours.
 * Seuls les rappels encore à venir sont gardés : un rappel passé ne sert plus à rien.
 */
export class DepartureReminderPlanner {
  /**
   * @param plan - Plan en cours
   * @param moment - Date et heure actuelles (fournies par l'horloge)
   * @param settings - Délai du rappel, ou rappel désactivé
   * @returns Les rappels à venir, dans l'ordre du plan
   */
  remindersFor(
    plan: DatedPlan,
    moment: Moment,
    settings: ReminderSettings,
  ): readonly DepartureReminder[] {
    const lead = settings.departureLead;
    if (lead === null) {
      return [];
    }
    return plan.days.flatMap(({ date, plan: day }) => {
      // Un départ trop matinal pour être précédé du délai (avant minuit) n'a pas de rappel.
      if (day.departure.toMinutesSinceMidnight() < lead.toMinutes()) {
        return [];
      }
      const at = day.departure.plus(lead.negate());
      const upcoming =
        moment.today.isBefore(date) || (date.equals(moment.today) && at.isAfter(moment.now));
      return upcoming ? [{ date, at, departure: day.departure }] : [];
    });
  }
}
