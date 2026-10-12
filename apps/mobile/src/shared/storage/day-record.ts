import { CalendarDate, Duration, TimeSlot, type DatedDay, type DatedPlan } from '@alterno/engine';

import { timeAt } from './time-record';

/**
 * Journée planifiée sous forme de données brutes, prête à être stockée (table SQLite ou JSON).
 * La date est au format « AAAA-MM-JJ » ; les heures sont en minutes depuis minuit :
 * des formats simples, stables et indépendants de la langue.
 */
export interface DayRecord {
  readonly date: string;
  readonly arrival: number;
  readonly lunchStart: number;
  readonly lunchEnd: number;
  readonly departure: number;
  readonly worked: number;
}

/**
 * Convertit une journée datée en données brutes.
 *
 * @param day - Journée du plan, avec sa date
 * @returns Ses données à enregistrer
 */
export function toDayRecord({ date, plan }: DatedDay): DayRecord {
  return {
    date: date.toIsoString(),
    arrival: plan.arrival.toMinutesSinceMidnight(),
    lunchStart: plan.lunchBreak.start.toMinutesSinceMidnight(),
    lunchEnd: plan.lunchBreak.end.toMinutesSinceMidnight(),
    departure: plan.departure.toMinutesSinceMidnight(),
    worked: plan.worked.toMinutes(),
  };
}

/**
 * Reconstruit un plan daté à partir des journées enregistrées, dans leur ordre.
 * Le jour de la semaine est déduit de la date : il ne peut pas la contredire.
 *
 * @param records - Journées enregistrées
 * @returns Le plan, avec son total recalculé
 * @throws {InvalidValueError} Si une date enregistrée est invalide (donnée corrompue)
 */
export function fromDayRecords(records: readonly DayRecord[]): DatedPlan {
  const days: DatedDay[] = records.map((record) => {
    const date = CalendarDate.fromIsoString(record.date);
    return {
      date,
      plan: {
        day: date.weekday(),
        arrival: timeAt(record.arrival),
        lunchBreak: TimeSlot.between(timeAt(record.lunchStart), timeAt(record.lunchEnd)),
        departure: timeAt(record.departure),
        worked: Duration.ofMinutes(record.worked),
      },
    };
  });
  return {
    days,
    totalWorked: days.reduce((sum, day) => sum.plus(day.plan.worked), Duration.zero()),
  };
}
