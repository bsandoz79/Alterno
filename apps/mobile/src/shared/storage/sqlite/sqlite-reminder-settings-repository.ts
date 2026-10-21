import { ReminderSettings, type ReminderSettingsRepository } from '@alterno/engine';

import { fromReminderSettingsRecord, toReminderSettingsRecord } from '../reminder-settings-record';
import type { SqlDatabase } from './sql-database';

/** Réglage des rappels stocké dans la table `reminder_settings` (une seule ligne). */
export class SqliteReminderSettingsRepository implements ReminderSettingsRepository {
  /**
   * @param db - Base SQLite migrée
   */
  constructor(private readonly db: SqlDatabase) {}

  /** @inheritdoc */
  async load(): Promise<ReminderSettings> {
    const row = await this.db.getFirstAsync<{
      departure_lead_minutes: number | null;
      at_departure: number | null;
      week_check: number | null;
      approval_check: number | null;
      approval_first_delay_days: number | null;
      approval_repeat_days: number | null;
    }>(
      `SELECT departure_lead_minutes, at_departure, week_check, approval_check,
              approval_first_delay_days, approval_repeat_days
       FROM reminder_settings WHERE id = 1`,
    );
    return row === null
      ? ReminderSettings.defaults()
      : fromReminderSettingsRecord({
          departureLeadMinutes: row.departure_lead_minutes,
          // SQLite n'a pas de booléen : 1 / 0, et NULL pour une colonne ajoutée après la ligne.
          atDeparture: toBoolean(row.at_departure),
          weekCheck: toBoolean(row.week_check),
          approvalCheck: toBoolean(row.approval_check),
          approvalFirstDelayDays: row.approval_first_delay_days,
          approvalRepeatDays: row.approval_repeat_days,
        });
  }

  /** @inheritdoc */
  async save(settings: ReminderSettings): Promise<void> {
    const record = toReminderSettingsRecord(settings);
    await this.db.runAsync(
      `INSERT INTO reminder_settings (id, departure_lead_minutes, at_departure, week_check,
                                     approval_check, approval_first_delay_days,
                                     approval_repeat_days)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET departure_lead_minutes = excluded.departure_lead_minutes,
                                      at_departure = excluded.at_departure,
                                      week_check = excluded.week_check,
                                      approval_check = excluded.approval_check,
                                      approval_first_delay_days = excluded.approval_first_delay_days,
                                      approval_repeat_days = excluded.approval_repeat_days`,
      [
        record.departureLeadMinutes,
        toInteger(record.atDeparture),
        toInteger(record.weekCheck),
        toInteger(record.approvalCheck),
        record.approvalFirstDelayDays ?? null,
        record.approvalRepeatDays ?? null,
      ],
    );
  }
}

/** Booléen SQLite (1 / 0) ; `null` si la colonne n'a pas encore de valeur. */
function toBoolean(value: number | null): boolean | null {
  return value === null ? null : value === 1;
}

/** Booléen enregistré en 1 / 0 ; une valeur absente vaut « activé », comme par défaut. */
function toInteger(value: boolean | null | undefined): number {
  return value === false ? 0 : 1;
}
