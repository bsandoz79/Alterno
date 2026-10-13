import {
  Duration,
  laBrosseEtDupontSettings,
  type DayTimes,
  type WorkRulesSettings,
} from '@alterno/engine';

import { timeAt } from './time-record';

/** Six heures d'un groupe de jours, en minutes depuis minuit. */
interface DayTimesRecord {
  readonly earliestArrival: number;
  readonly coreStart: number;
  readonly lunchStart: number;
  readonly lunchEnd: number;
  readonly coreEnd: number;
  readonly latestDeparture: number;
}

/** Réglages des règles horaires sous forme de données brutes (minutes), prêtes à être stockées en JSON. */
export interface WorkRulesSettingsRecord {
  readonly mondayToThursday: DayTimesRecord;
  readonly friday: DayTimesRecord;
  readonly minimumLunchBreak: number;
  readonly expectedDailyWork: number;
  readonly fullDayRecovery: number;
  readonly halfDayRecovery: number;
  /** Absent des réglages enregistrés avant l'ajout du découvert (ALT-43). */
  readonly maximumDeficit?: number;
}

/**
 * Convertit des réglages en données brutes.
 *
 * @param settings - Réglages validés
 * @returns Leurs données à enregistrer
 */
export function toWorkRulesSettingsRecord(settings: WorkRulesSettings): WorkRulesSettingsRecord {
  return {
    mondayToThursday: toDayTimesRecord(settings.mondayToThursday),
    friday: toDayTimesRecord(settings.friday),
    minimumLunchBreak: settings.minimumLunchBreak.toMinutes(),
    expectedDailyWork: settings.expectedDailyWork.toMinutes(),
    fullDayRecovery: settings.fullDayRecovery.toMinutes(),
    halfDayRecovery: settings.halfDayRecovery.toMinutes(),
    maximumDeficit: settings.maximumDeficit.toMinutes(),
  };
}

/**
 * Reconstruit des réglages à partir des données enregistrées.
 *
 * @param record - Données enregistrées
 * @returns Les réglages
 */
export function fromWorkRulesSettingsRecord(record: WorkRulesSettingsRecord): WorkRulesSettings {
  return {
    mondayToThursday: fromDayTimesRecord(record.mondayToThursday),
    friday: fromDayTimesRecord(record.friday),
    minimumLunchBreak: Duration.ofMinutes(record.minimumLunchBreak),
    expectedDailyWork: Duration.ofMinutes(record.expectedDailyWork),
    fullDayRecovery: Duration.ofMinutes(record.fullDayRecovery),
    halfDayRecovery: Duration.ofMinutes(record.halfDayRecovery),
    // Réglages enregistrés avant l'existence du découvert : on reprend celui du preset
    // plutôt que zéro, pour que la règle de l'entreprise s'applique sans avoir à tout ressaisir.
    maximumDeficit:
      record.maximumDeficit === undefined
        ? laBrosseEtDupontSettings().maximumDeficit
        : Duration.ofMinutes(record.maximumDeficit),
  };
}

function toDayTimesRecord(times: DayTimes): DayTimesRecord {
  return {
    earliestArrival: times.earliestArrival.toMinutesSinceMidnight(),
    coreStart: times.coreStart.toMinutesSinceMidnight(),
    lunchStart: times.lunchStart.toMinutesSinceMidnight(),
    lunchEnd: times.lunchEnd.toMinutesSinceMidnight(),
    coreEnd: times.coreEnd.toMinutesSinceMidnight(),
    latestDeparture: times.latestDeparture.toMinutesSinceMidnight(),
  };
}

function fromDayTimesRecord(record: DayTimesRecord): DayTimes {
  return {
    earliestArrival: timeAt(record.earliestArrival),
    coreStart: timeAt(record.coreStart),
    lunchStart: timeAt(record.lunchStart),
    lunchEnd: timeAt(record.lunchEnd),
    coreEnd: timeAt(record.coreEnd),
    latestDeparture: timeAt(record.latestDeparture),
  };
}
