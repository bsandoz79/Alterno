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
    const row = await this.db.getFirstAsync<{ departure_lead_minutes: number | null }>(
      'SELECT departure_lead_minutes FROM reminder_settings WHERE id = 1',
    );
    return row === null
      ? ReminderSettings.defaults()
      : fromReminderSettingsRecord({ departureLeadMinutes: row.departure_lead_minutes });
  }

  /** @inheritdoc */
  async save(settings: ReminderSettings): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO reminder_settings (id, departure_lead_minutes) VALUES (1, ?)
       ON CONFLICT (id) DO UPDATE SET departure_lead_minutes = excluded.departure_lead_minutes`,
      [toReminderSettingsRecord(settings).departureLeadMinutes],
    );
  }
}
