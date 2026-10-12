import type { PlanningPreferences, PlanningPreferencesRepository } from '@alterno/engine';

import {
  fromPlanningPreferencesRecord,
  toPlanningPreferencesRecord,
  type PlanningPreferencesRecord,
} from '../planning-preferences-record';
import type { SqlDatabase } from './sql-database';

/** Préférences de planification stockées dans la table `planning_preferences` (une ligne, en JSON). */
export class SqlitePlanningPreferencesRepository implements PlanningPreferencesRepository {
  /**
   * @param db - Base SQLite migrée
   */
  constructor(private readonly db: SqlDatabase) {}

  /** @inheritdoc */
  async load(): Promise<PlanningPreferences> {
    const row = await this.db.getFirstAsync<{ data: string }>(
      'SELECT data FROM planning_preferences WHERE id = 1',
    );
    return row === null
      ? {}
      : fromPlanningPreferencesRecord(JSON.parse(row.data) as PlanningPreferencesRecord);
  }

  /** @inheritdoc */
  async save(preferences: PlanningPreferences): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO planning_preferences (id, data) VALUES (1, ?)
       ON CONFLICT (id) DO UPDATE SET data = excluded.data`,
      [JSON.stringify(toPlanningPreferencesRecord(preferences))],
    );
  }
}
