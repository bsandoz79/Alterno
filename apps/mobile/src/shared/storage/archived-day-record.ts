import {
  CalendarDate,
  Duration,
  TimeSlot,
  type ArchivedDay,
  type ArchivedDayKind,
} from '@alterno/engine';

import { timeAt } from './time-record';

/**
 * Journée archivée en données brutes (table SQLite ou JSON) : date « AAAA-MM-JJ », durées en minutes,
 * heures en minutes depuis minuit, horaires absents (`null`) pour une récup ou l'école.
 */
export interface ArchivedDayRecord {
  readonly date: string;
  readonly kind: ArchivedDayKind;
  readonly worked: number;
  readonly expected: number;
  readonly arrival: number | null;
  readonly lunchStart: number | null;
  readonly lunchEnd: number | null;
  readonly departure: number | null;
}

/**
 * @param day - Journée archivée
 * @returns Ses données à enregistrer
 */
export function toArchivedDayRecord(day: ArchivedDay): ArchivedDayRecord {
  const { times } = day;
  return {
    date: day.date.toIsoString(),
    kind: day.kind,
    worked: day.worked.toMinutes(),
    expected: day.expected.toMinutes(),
    arrival: times?.arrival.toMinutesSinceMidnight() ?? null,
    lunchStart: times?.lunchBreak.start.toMinutesSinceMidnight() ?? null,
    lunchEnd: times?.lunchBreak.end.toMinutesSinceMidnight() ?? null,
    departure: times?.departure.toMinutesSinceMidnight() ?? null,
  };
}

/**
 * @param record - Données enregistrées
 * @returns La journée archivée (horaires seulement s'ils sont tous présents)
 * @throws {InvalidValueError} Si une date enregistrée est invalide (donnée corrompue)
 */
export function fromArchivedDayRecord(record: ArchivedDayRecord): ArchivedDay {
  const { arrival, lunchStart, lunchEnd, departure } = record;
  const base = {
    date: CalendarDate.fromIsoString(record.date),
    kind: record.kind,
    worked: Duration.ofMinutes(record.worked),
    expected: Duration.ofMinutes(record.expected),
  };
  return arrival === null || lunchStart === null || lunchEnd === null || departure === null
    ? base
    : {
        ...base,
        times: {
          arrival: timeAt(arrival),
          lunchBreak: TimeSlot.between(timeAt(lunchStart), timeAt(lunchEnd)),
          departure: timeAt(departure),
        },
      };
}
