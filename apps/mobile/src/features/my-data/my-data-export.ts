import type { CalendarDate } from '@alterno/engine';

import { toArchivedDayRecord, type ArchivedDayRecord } from '@/shared/storage/archived-day-record';
import { toDayRecord, type DayRecord } from '@/shared/storage/day-record';
import {
  toPlanRecoveryRecord,
  type PlanRecoveryRecord,
} from '@/shared/storage/plan-recovery-record';
import {
  toPlanningPreferencesRecord,
  type PlanningPreferencesRecord,
} from '@/shared/storage/planning-preferences-record';
import {
  toReminderSettingsRecord,
  type ReminderSettingsRecord,
} from '@/shared/storage/reminder-settings-record';
import type { Repositories } from '@/shared/storage/repositories';
import {
  toWorkRulesSettingsRecord,
  type WorkRulesSettingsRecord,
} from '@/shared/storage/work-rules-settings-record';

/** Dépôts lus pour l'export. */
export type ExportSources = Pick<
  Repositories,
  | 'plans'
  | 'counter'
  | 'workRules'
  | 'preferences'
  | 'schoolWeeks'
  | 'annualCalendar'
  | 'reminders'
  | 'archive'
  | 'contractStart'
>;

/**
 * Toutes les données enregistrées par Alterno, en JSON lisible (RGPD : droit d'accès et portabilité).
 * Les durées sont en minutes, les dates au format AAAA-MM-JJ, comme dans le stockage.
 */
export interface MyDataExport {
  readonly app: 'Alterno';
  readonly exportedOn: string;
  /** Plan validé ; `null` sans plan (la semaine standard n'est pas enregistrée). */
  readonly plan: {
    readonly days: readonly DayRecord[];
    readonly recovery: PlanRecoveryRecord | null;
  } | null;
  readonly counterMinutes: number;
  /** Règles horaires réglées ; `null` si celles par défaut sont gardées. */
  readonly workRules: WorkRulesSettingsRecord | null;
  readonly preferences: PlanningPreferencesRecord;
  readonly schoolWeeks: readonly string[];
  /** Informations du calendrier joint (le fichier lui-même reste sur l'appareil). */
  readonly annualCalendar: {
    readonly name: string;
    readonly mimeType: string;
    readonly size: number;
    readonly addedOn: string;
  } | null;
  readonly reminders: ReminderSettingsRecord;
  /** Début du contrat ; `null` s'il n'est pas renseigné. */
  readonly contractStart: string | null;
  /** Journées passées gardées pour l'historique. */
  readonly history: readonly ArchivedDayRecord[];
}

/**
 * Rassemble toutes les données enregistrées, au même format que le stockage.
 *
 * @param sources - Dépôts de l'app
 * @param exportedOn - Date de l'export
 * @returns Les données, prêtes à être converties en JSON
 */
export async function exportMyData(
  sources: ExportSources,
  exportedOn: CalendarDate,
): Promise<MyDataExport> {
  const [
    plan,
    counter,
    workRules,
    preferences,
    schoolWeeks,
    calendar,
    reminders,
    history,
    contractStart,
  ] = await Promise.all([
    sources.plans.loadCurrent(),
    sources.counter.load(),
    sources.workRules.load(),
    sources.preferences.load(),
    sources.schoolWeeks.load(),
    sources.annualCalendar.load(),
    sources.reminders.load(),
    sources.archive.loadAll(),
    sources.contractStart.load(),
  ]);
  return {
    app: 'Alterno',
    exportedOn: exportedOn.toIsoString(),
    // La semaine standard est calculée, pas enregistrée : elle n'a rien à faire dans l'export.
    plan:
      plan === null || plan.isDefault === true
        ? null
        : {
            days: plan.days.map(toDayRecord),
            recovery: plan.recovery === undefined ? null : toPlanRecoveryRecord(plan.recovery),
          },
    counterMinutes: counter.balance.toMinutes(),
    workRules: workRules === null ? null : toWorkRulesSettingsRecord(workRules),
    preferences: toPlanningPreferencesRecord(preferences),
    schoolWeeks: schoolWeeks.mondays().map((monday) => monday.toIsoString()),
    annualCalendar:
      calendar === null
        ? null
        : {
            name: calendar.name,
            mimeType: calendar.mimeType,
            size: calendar.size,
            addedOn: calendar.addedOn,
          },
    reminders: toReminderSettingsRecord(reminders),
    contractStart: contractStart?.toIsoString() ?? null,
    history: history.map(toArchivedDayRecord),
  };
}
