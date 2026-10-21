import type { CalendarDate } from '../calendar/calendar-date';
import type { DatedPlan } from '../planning/dated-plan';
import type { TimeOfDay } from '../time/time-of-day';
import type { ReminderSettings } from './reminder-settings';

/**
 * Type de notification :
 * - `before` : rappel un peu avant l'heure de départ ;
 * - `at-departure` : à l'heure de départ, pour signaler un départ plus tard si besoin ;
 * - `week-check` : après le dernier départ de la semaine, « ta semaine s'est passée comme prévu ? ».
 */
export type DepartureReminderKind = 'before' | 'at-departure' | 'week-check';

/** Rappel à programmer : son type, le jour, l'heure du rappel et l'heure de départ qu'il annonce. */
export interface DepartureReminder {
  readonly kind: DepartureReminderKind;
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
 * Calcule les notifications de départ du plan en cours : « bientôt l'heure de partir »,
 * puis, à l'heure prévue, « tu pars plus tard ? ». Seules celles encore à venir sont gardées.
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
    return plan.days.flatMap(({ date, plan: day }) => {
      const reminders: DepartureReminder[] = [];
      // Un départ trop matinal pour être précédé du délai (avant minuit) n'a pas de rappel avant.
      if (lead !== null && day.departure.toMinutesSinceMidnight() >= lead.toMinutes()) {
        reminders.push({
          kind: 'before',
          date,
          at: day.departure.plus(lead.negate()),
          departure: day.departure,
        });
      }
      if (settings.atDeparture) {
        reminders.push({ kind: 'at-departure', date, at: day.departure, departure: day.departure });
      }
      return reminders.filter((reminder) => isUpcoming(reminder, moment));
    });
  }
}

/**
 * Un rappel passé ne sert plus à rien : seuls ceux encore à venir sont programmés.
 *
 * @param reminder - Rappel calculé (son jour et son heure)
 * @param moment - Date et heure actuelles
 * @returns `true` si le rappel est encore à venir
 */
export function isUpcoming(
  reminder: Pick<DepartureReminder, 'date' | 'at'>,
  moment: Moment,
): boolean {
  return (
    moment.today.isBefore(reminder.date) ||
    (reminder.date.equals(moment.today) && reminder.at.isAfter(moment.now))
  );
}
