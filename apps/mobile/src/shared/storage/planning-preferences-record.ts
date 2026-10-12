import {
  TimeSlot,
  WEEKDAYS,
  type DayPreferences,
  type PlanningHabits,
  type PlanningPreferences,
  type Weekday,
} from '@alterno/engine';

import { timeAt } from './time-record';

/** Préférences d'un jour en données brutes (minutes depuis minuit). Un champ absent = habitude par défaut. */
interface DayPreferencesRecord {
  readonly arrival?: number;
  readonly lunchStart?: number;
  readonly lunchEnd?: number;
  readonly latestDeparture?: number;
  readonly exactlyExpected?: boolean;
}

/** Préférences de planification en données brutes, prêtes à être stockées en JSON. */
export interface PlanningPreferencesRecord {
  readonly defaults?: {
    readonly arrival: number;
    readonly lunchStart: number;
    readonly lunchEnd: number;
  };
  readonly days?: Readonly<Partial<Record<Weekday, DayPreferencesRecord>>>;
}

/**
 * Convertit des préférences en données brutes, en n'écrivant que ce qui est réglé.
 *
 * @param preferences - Préférences validées
 * @returns Leurs données à enregistrer
 */
export function toPlanningPreferencesRecord(
  preferences: PlanningPreferences,
): PlanningPreferencesRecord {
  const days: Partial<Record<Weekday, DayPreferencesRecord>> = {};
  for (const weekday of WEEKDAYS) {
    const day = preferences.days?.[weekday];
    if (day !== undefined) {
      days[weekday] = toDayRecord(day);
    }
  }
  const defaults = preferences.defaults;
  return {
    ...(defaults === undefined
      ? {}
      : {
          defaults: {
            arrival: defaults.arrival.toMinutesSinceMidnight(),
            lunchStart: defaults.lunchBreak.start.toMinutesSinceMidnight(),
            lunchEnd: defaults.lunchBreak.end.toMinutesSinceMidnight(),
          },
        }),
    ...(Object.keys(days).length === 0 ? {} : { days }),
  };
}

/**
 * Reconstruit des préférences à partir des données enregistrées.
 *
 * @param record - Données enregistrées
 * @returns Les préférences (champs absents = habitudes par défaut)
 */
export function fromPlanningPreferencesRecord(
  record: PlanningPreferencesRecord,
): PlanningPreferences {
  const days: Partial<Record<Weekday, DayPreferences>> = {};
  for (const weekday of WEEKDAYS) {
    const day = record.days?.[weekday];
    if (day !== undefined) {
      days[weekday] = fromDayRecord(day);
    }
  }
  const defaults: PlanningHabits | undefined =
    record.defaults === undefined
      ? undefined
      : {
          arrival: timeAt(record.defaults.arrival),
          lunchBreak: TimeSlot.between(
            timeAt(record.defaults.lunchStart),
            timeAt(record.defaults.lunchEnd),
          ),
        };
  return {
    ...(defaults === undefined ? {} : { defaults }),
    ...(Object.keys(days).length === 0 ? {} : { days }),
  };
}

function toDayRecord(day: DayPreferences): DayPreferencesRecord {
  return {
    ...(day.arrival === undefined ? {} : { arrival: day.arrival.toMinutesSinceMidnight() }),
    ...(day.lunchBreak === undefined
      ? {}
      : {
          lunchStart: day.lunchBreak.start.toMinutesSinceMidnight(),
          lunchEnd: day.lunchBreak.end.toMinutesSinceMidnight(),
        }),
    ...(day.latestDeparture === undefined
      ? {}
      : { latestDeparture: day.latestDeparture.toMinutesSinceMidnight() }),
    ...(day.exactlyExpected === true ? { exactlyExpected: true } : {}),
  };
}

function fromDayRecord(record: DayPreferencesRecord): DayPreferences {
  return {
    ...(record.arrival === undefined ? {} : { arrival: timeAt(record.arrival) }),
    ...(record.lunchStart === undefined || record.lunchEnd === undefined
      ? {}
      : { lunchBreak: TimeSlot.between(timeAt(record.lunchStart), timeAt(record.lunchEnd)) }),
    ...(record.latestDeparture === undefined
      ? {}
      : { latestDeparture: timeAt(record.latestDeparture) }),
    ...(record.exactlyExpected === true ? { exactlyExpected: true } : {}),
  };
}
