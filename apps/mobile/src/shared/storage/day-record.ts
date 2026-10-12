import {
  Duration,
  TimeOfDay,
  TimeSlot,
  WEEKDAYS,
  type DayPlan,
  type Plan,
  type Weekday,
} from '@alterno/engine';

const MINUTES_PER_HOUR = 60;

/**
 * Journée planifiée sous forme de données brutes, prête à être stockée (table SQLite ou JSON).
 * Les heures sont en minutes depuis minuit : un format simple, stable et indépendant de la langue.
 */
export interface DayRecord {
  readonly weekday: string;
  readonly arrival: number;
  readonly lunchStart: number;
  readonly lunchEnd: number;
  readonly departure: number;
  readonly worked: number;
}

/**
 * Convertit une journée planifiée en données brutes.
 *
 * @param day - Journée du plan
 * @returns Ses données à enregistrer
 */
export function toDayRecord(day: DayPlan): DayRecord {
  return {
    weekday: day.day,
    arrival: day.arrival.toMinutesSinceMidnight(),
    lunchStart: day.lunchBreak.start.toMinutesSinceMidnight(),
    lunchEnd: day.lunchBreak.end.toMinutesSinceMidnight(),
    departure: day.departure.toMinutesSinceMidnight(),
    worked: day.worked.toMinutes(),
  };
}

/**
 * Reconstruit un plan à partir des journées enregistrées, dans leur ordre.
 *
 * @param records - Journées enregistrées
 * @returns Le plan, avec son total recalculé
 * @throws {Error} Si une journée porte un jour inconnu (donnée corrompue)
 */
export function fromDayRecords(records: readonly DayRecord[]): Plan {
  const days: DayPlan[] = records.map((record) => ({
    day: toWeekday(record.weekday),
    arrival: timeAt(record.arrival),
    lunchBreak: TimeSlot.between(timeAt(record.lunchStart), timeAt(record.lunchEnd)),
    departure: timeAt(record.departure),
    worked: Duration.ofMinutes(record.worked),
  }));
  return {
    days,
    totalWorked: days.reduce((sum, day) => sum.plus(day.worked), Duration.zero()),
  };
}

/** Heure à partir de minutes depuis minuit. */
function timeAt(minutesSinceMidnight: number): TimeOfDay {
  return TimeOfDay.of(
    Math.floor(minutesSinceMidnight / MINUTES_PER_HOUR),
    minutesSinceMidnight % MINUTES_PER_HOUR,
  );
}

/** Vérifie qu'une valeur enregistrée est bien un jour de la semaine connu du moteur. */
function toWeekday(value: string): Weekday {
  const weekday = WEEKDAYS.find((day) => day === value);
  if (weekday === undefined) {
    throw new Error(`Donnée enregistrée invalide : jour « ${value} » inconnu.`);
  }
  return weekday;
}
