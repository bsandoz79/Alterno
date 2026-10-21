import type { CalendarDate } from '../calendar/calendar-date';
import type { DatedDay, DatedPlan } from '../planning/dated-plan';
import { Duration } from '../time/duration';
import type { TimeOfDay } from '../time/time-of-day';
import { isUpcoming, type DepartureReminder, type Moment } from './departure-reminder-planner';
import type { ReminderSettings } from './reminder-settings';

/**
 * Délai entre le dernier départ de la semaine et la question : elle arrive une fois rentré,
 * et après la question « tu pars plus tard ? », pour ne pas sonner deux fois au même moment.
 */
const DELAY_AFTER_DEPARTURE = Duration.ofHours(1);
const MINUTES_PER_DAY = 24 * 60;

/**
 * Calcule la question de fin de semaine : « Ta semaine s'est passée comme prévu ? ».
 * Le plan est considéré comme suivi ; cette question rattrape les écarts oubliés.
 * Elle est posée au dernier jour planifié de chaque semaine (le vendredi, ou la veille
 * d'une récup), 1h après le départ prévu. Seules les questions encore à venir sont gardées.
 */
export class WeekCheckPlanner {
  /**
   * @param plan - Plan en cours
   * @param moment - Date et heure actuelles (fournies par l'horloge)
   * @param settings - Réglage des notifications (question activée ou non)
   * @returns Les questions à venir, une par semaine du plan, dans l'ordre
   */
  checksFor(
    plan: DatedPlan,
    moment: Moment,
    settings: ReminderSettings,
  ): readonly DepartureReminder[] {
    if (!settings.weekCheck) {
      return [];
    }
    return lastDayOfEachWeek(plan.days)
      .map(({ date, plan: day }) => checkOn(date, day.departure))
      .filter((check) => isUpcoming(check, moment));
  }
}

/**
 * Dernier jour planifié de chaque semaine (du lundi au dimanche), dans l'ordre du plan.
 * Les jours d'un plan sont rangés dans l'ordre du calendrier : le dernier lu d'une semaine est le bon.
 */
function lastDayOfEachWeek(days: readonly DatedDay[]): readonly DatedDay[] {
  const byWeek = new Map<string, DatedDay>();
  for (const day of days) {
    byWeek.set(day.date.startOfWeek().toIsoString(), day);
  }
  return [...byWeek.values()];
}

/** Question du jour : 1h après le départ, ou au départ si cela passerait minuit. */
function checkOn(date: CalendarDate, departure: TimeOfDay): DepartureReminder {
  const fitsInDay =
    departure.toMinutesSinceMidnight() + DELAY_AFTER_DEPARTURE.toMinutes() < MINUTES_PER_DAY;
  const at = fitsInDay ? departure.plus(DELAY_AFTER_DEPARTURE) : departure;
  return { kind: 'week-check', date, at, departure };
}
