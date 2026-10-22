import { CalendarDate, type ContractStartRepository } from '@alterno/engine';

import type { SqlDatabase } from './sql-database';

/** Début du contrat stocké dans la table `contract` (une seule ligne). */
export class SqliteContractStartRepository implements ContractStartRepository {
  /**
   * @param db - Base SQLite migrée
   */
  constructor(private readonly db: SqlDatabase) {}

  /** @inheritdoc */
  async load(): Promise<CalendarDate | null> {
    const row = await this.db.getFirstAsync<{ start: string }>(
      'SELECT start FROM contract WHERE id = 1',
    );
    return row === null ? null : CalendarDate.fromIsoString(row.start);
  }

  /** @inheritdoc */
  async save(start: CalendarDate): Promise<void> {
    await this.db.runAsync('INSERT OR REPLACE INTO contract (id, start) VALUES (1, ?)', [
      start.toIsoString(),
    ]);
  }
}
