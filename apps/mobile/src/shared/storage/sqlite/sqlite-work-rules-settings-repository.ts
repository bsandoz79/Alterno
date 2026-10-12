import type { WorkRulesSettings, WorkRulesSettingsRepository } from '@alterno/engine';

import {
  fromWorkRulesSettingsRecord,
  toWorkRulesSettingsRecord,
  type WorkRulesSettingsRecord,
} from '../work-rules-settings-record';
import type { SqlDatabase } from './sql-database';

/** Réglages des règles horaires stockés dans la table `work_rules_settings` (une ligne, en JSON). */
export class SqliteWorkRulesSettingsRepository implements WorkRulesSettingsRepository {
  /**
   * @param db - Base SQLite migrée
   */
  constructor(private readonly db: SqlDatabase) {}

  /** @inheritdoc */
  async load(): Promise<WorkRulesSettings | null> {
    const row = await this.db.getFirstAsync<{ data: string }>(
      'SELECT data FROM work_rules_settings WHERE id = 1',
    );
    return row === null
      ? null
      : fromWorkRulesSettingsRecord(JSON.parse(row.data) as WorkRulesSettingsRecord);
  }

  /** @inheritdoc */
  async save(settings: WorkRulesSettings): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO work_rules_settings (id, data) VALUES (1, ?)
       ON CONFLICT (id) DO UPDATE SET data = excluded.data`,
      [JSON.stringify(toWorkRulesSettingsRecord(settings))],
    );
  }
}
